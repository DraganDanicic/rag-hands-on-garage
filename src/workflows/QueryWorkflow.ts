import { IEmbeddingClient } from '../services/embedding-client/IEmbeddingClient.js';
import { IEmbeddingStore } from '../services/embedding-store/IEmbeddingStore.js';
import { IVectorSearch } from '../services/vector-search/IVectorSearch.js';
import { IPromptBuilder } from '../services/prompt-builder/IPromptBuilder.js';
import { ILlmClient } from '../services/llm-client/ILlmClient.js';
import { IProgressReporter } from '../services/progress-reporter/IProgressReporter.js';
import { IQuerySettings } from '../services/query-settings/IQuerySettings.js';
import { ITemplateLoader } from '../services/template-loader/ITemplateLoader.js';
import { IConversationHistory } from '../services/conversation-history/IConversationHistory.js';
import { LlmRequest } from '../services/llm-client/models/LlmRequest.js';
import { SearchResult } from '../services/vector-search/models/SearchResult.js';
import { Message } from '../services/conversation-history/models/Message.js';
import { PromptTemplate } from '../services/prompt-builder/models/PromptTemplate.js';
import { estimateTokens, truncateToTokenLimit } from '../services/conversation-history/utils/tokenEstimator.js';
import chalk from 'chalk';

/**
 * QueryWorkflow orchestrates the RAG query process:
 * 1. Embedding the user's query
 * 2. Searching for similar chunks in the vector store
 * 3. Building a prompt with retrieved context
 * 4. Calling the LLM to generate a response
 * 5. Updating conversation history (if enabled)
 * 6. Returning the response to the user
 */
export class QueryWorkflow {
  constructor(
    private readonly querySettings: IQuerySettings,
    private readonly embeddingClient: IEmbeddingClient,
    private readonly embeddingStore: IEmbeddingStore,
    private readonly vectorSearch: IVectorSearch,
    private readonly promptBuilder: IPromptBuilder,
    private readonly llmClient: ILlmClient,
    private readonly progressReporter: IProgressReporter,
    private readonly templateLoader: ITemplateLoader,
    private readonly conversationHistory: IConversationHistory
  ) {}

  /**
   * Execute a RAG query
   * @param question - The user's question
   * @returns The LLM's response
   */
  async query(question: string): Promise<string> {
    try {
      // Step 1: Generate embedding for the query
      this.progressReporter.info('Embedding query...');
      const queryVector = await this.embeddingClient.generateEmbedding(question);

      // Step 2: Load stored embeddings
      this.progressReporter.info('Loading embeddings...');
      const { embeddings: storedEmbeddings } = await this.embeddingStore.load();

      if (storedEmbeddings.length === 0) {
        throw new Error(
          'No embeddings found in storage. Please run the generate-embeddings command first.'
        );
      }

      // Step 3: Search for similar chunks
      const topK = this.querySettings.getTopK();
      this.progressReporter.info(`Searching for top ${topK} similar chunks...`);

      const searchResults = this.vectorSearch.search(
        queryVector,
        storedEmbeddings,
        topK
      );

      if (searchResults.length === 0) {
        throw new Error('No relevant context found for the query');
      }

      this.progressReporter.info(`Found ${searchResults.length} relevant chunks`);

      // Step 3b: Apply context budget management if history is enabled
      const useHistory = this.querySettings.getUseHistory();
      let contexts = searchResults.map(result => result.embedding.text);

      if (useHistory) {
        const maxContextTokens = this.querySettings.getMaxContextTokens();
        const maxHistoryTokens = this.querySettings.getHistoryMaxTokens();
        const historyMessages = this.conversationHistory.getMessagesForContext(maxHistoryTokens);

        // Estimate tokens used by history
        const historyTokens = historyMessages.reduce(
          (sum, msg) => sum + estimateTokens(msg.content),
          0
        );

        // Calculate remaining budget for RAG chunks
        const systemPromptTokens = 200; // Estimated overhead
        const questionTokens = estimateTokens(question);
        const remainingTokens = maxContextTokens - historyTokens - systemPromptTokens - questionTokens;

        // Trim contexts to fit budget (keep at least 1 chunk)
        contexts = this.trimContextsToFitBudget(contexts, remainingTokens);

        const contextTokens = contexts.reduce((sum, ctx) => sum + estimateTokens(ctx), 0);
        this.progressReporter.info(
          `Context budget: ${historyTokens} history + ${contextTokens} RAG = ${historyTokens + contextTokens}/${maxContextTokens} tokens`
        );
      }

      // Step 4: Build prompt with context
      // Check if user has set a custom template
      const templateName = this.querySettings.getPromptTemplate();
      let llmRequest: LlmRequest;

      // Load custom template if specified
      let customTemplate: PromptTemplate | undefined;
      if (templateName !== 'default') {
        try {
          customTemplate = await this.templateLoader.loadTemplate(templateName);
        } catch (error) {
          this.progressReporter.error(
            `Failed to load template '${templateName}': ${error instanceof Error ? error.message : String(error)}`
          );
          this.progressReporter.info('Falling back to default template');
        }
      }

      if (useHistory) {
        // Build prompt with conversation history
        const maxHistoryTokens = this.querySettings.getHistoryMaxTokens();
        const historyMessages = this.conversationHistory.getMessagesForContext(maxHistoryTokens);

        const messages = this.promptBuilder.buildPromptWithHistory(
          question,
          contexts,
          historyMessages,
          customTemplate
        );

        llmRequest = {
          messages,
          temperature: this.querySettings.getTemperature(),
          maxTokens: this.querySettings.getMaxTokens(),
        };

        // Display prompt if enabled
        if (this.querySettings.getShowPrompt()) {
          this.displayPromptDetailsWithHistory(messages, searchResults);
        }
      } else {
        // Legacy single-turn mode
        let prompt: string;
        if (customTemplate) {
          prompt = this.promptBuilder.buildPromptWithTemplate(question, contexts, customTemplate);
        } else {
          prompt = this.promptBuilder.buildPrompt(question, contexts);
        }

        llmRequest = {
          prompt,
          temperature: this.querySettings.getTemperature(),
          maxTokens: this.querySettings.getMaxTokens(),
        };

        // Display prompt if enabled
        if (this.querySettings.getShowPrompt()) {
          this.displayPromptDetails(prompt, searchResults);
        }
      }

      // Step 5: Query the LLM
      this.progressReporter.info('Querying LLM...');
      const llmResponse = await this.llmClient.generateResponse(llmRequest);

      // Step 6: Update conversation history
      if (useHistory) {
        this.conversationHistory.addUserMessage(question);
        this.conversationHistory.addAssistantMessage(llmResponse.text);
      }

      this.progressReporter.success('Query completed successfully');

      return llmResponse.text;
    } catch (error) {
      this.progressReporter.error(
        `Query workflow failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory.clear();
    this.progressReporter.info('Conversation history cleared');
  }

  /**
   * Trim contexts to fit within token budget
   * Keeps as many chunks as possible, prioritizing most relevant (first in array)
   */
  private trimContextsToFitBudget(contexts: string[], maxTokens: number): string[] {
    let currentTokens = 0;
    const result: string[] = [];

    for (const context of contexts) {
      const contextTokens = estimateTokens(context);
      if (currentTokens + contextTokens <= maxTokens) {
        result.push(context);
        currentTokens += contextTokens;
      } else if (result.length === 0) {
        // Always include at least 1 chunk (truncated if needed)
        const truncated = truncateToTokenLimit(context, maxTokens);
        result.push(truncated);
        break;
      } else {
        break;
      }
    }

    // Guarantee at least 1 chunk
    return result.length > 0 ? result : (contexts.length > 0 ? [contexts[0]!] : []);
  }

  /**
   * Display prompt details when show-prompt is enabled (legacy single-turn)
   */
  private displayPromptDetails(
    prompt: string,
    searchResults: SearchResult[]
  ): void {
    console.log(chalk.blue('\n' + '='.repeat(70)));
    console.log(chalk.blue.bold('📋 Prompt Details'));
    console.log(chalk.blue('='.repeat(70)));

    // Show retrieved chunks with scores
    console.log(chalk.yellow('\nRetrieved Chunks:'));
    searchResults.forEach((result, i) => {
      const score = (result.score * 100).toFixed(1);
      console.log(chalk.cyan(`\n[${i + 1}] Score: ${score}%`));
      console.log(chalk.gray('─'.repeat(50)));
      const preview = result.embedding.text.length > 200
        ? result.embedding.text.substring(0, 200) + '...'
        : result.embedding.text;
      console.log(chalk.white(preview));
    });

    // Show final prompt
    console.log(chalk.yellow('\n\nFinal Prompt Sent to LLM:'));
    console.log(chalk.gray('─'.repeat(70)));
    console.log(chalk.white(prompt));
    console.log(chalk.blue('='.repeat(70) + '\n'));
  }

  /**
   * Display prompt details with conversation history
   */
  private displayPromptDetailsWithHistory(
    messages: Message[],
    searchResults: SearchResult[]
  ): void {
    console.log(chalk.blue('\n' + '='.repeat(70)));
    console.log(chalk.blue.bold('📋 Prompt Details (with History)'));
    console.log(chalk.blue('='.repeat(70)));

    // Show retrieved chunks with scores
    console.log(chalk.yellow('\nRetrieved Chunks:'));
    searchResults.forEach((result, i) => {
      const score = (result.score * 100).toFixed(1);
      console.log(chalk.cyan(`\n[${i + 1}] Score: ${score}%`));
      console.log(chalk.gray('─'.repeat(50)));
      const preview = result.embedding.text.length > 200
        ? result.embedding.text.substring(0, 200) + '...'
        : result.embedding.text;
      console.log(chalk.white(preview));
    });

    // Show messages
    console.log(chalk.yellow('\n\nMessages Sent to LLM:'));
    console.log(chalk.gray('─'.repeat(70)));
    messages.forEach((msg, i) => {
      const roleColor = msg.role === 'system' ? chalk.magenta : msg.role === 'user' ? chalk.cyan : chalk.green;
      console.log(roleColor(`\n[${i + 1}] ${msg.role.toUpperCase()}:`));
      const preview = msg.content.length > 300
        ? msg.content.substring(0, 300) + '...'
        : msg.content;
      console.log(chalk.white(preview));
    });
    console.log(chalk.blue('\n' + '='.repeat(70) + '\n'));
  }
}
