import { IEmbeddingClient } from '../services/embedding-client/IEmbeddingClient.js';
import { IEmbeddingStore } from '../services/embedding-store/IEmbeddingStore.js';
import { IVectorSearch } from '../services/vector-search/IVectorSearch.js';
import { IPromptBuilder } from '../services/prompt-builder/IPromptBuilder.js';
import { ILlmClient } from '../services/llm-client/ILlmClient.js';
import { IProgressReporter } from '../services/progress-reporter/IProgressReporter.js';
import { IQuerySettings } from '../services/query-settings/IQuerySettings.js';
import { ITemplateLoader } from '../services/template-loader/ITemplateLoader.js';
import { LlmRequest } from '../services/llm-client/models/LlmRequest.js';
import { SearchResult } from '../services/vector-search/models/SearchResult.js';
import chalk from 'chalk';

/**
 * QueryWorkflow orchestrates the RAG query process:
 * 1. Embedding the user's query
 * 2. Searching for similar chunks in the vector store
 * 3. Building a prompt with retrieved context
 * 4. Calling the LLM to generate a response
 * 5. Returning the response to the user
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
    private readonly templateLoader: ITemplateLoader
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

      // Step 4: Build prompt with context
      const contexts = searchResults.map(result => result.embedding.text);

      // Check if user has set a custom template
      const templateName = this.querySettings.getPromptTemplate();
      let prompt: string;

      if (templateName !== 'default') {
        // Load and use custom template
        try {
          const customTemplate = await this.templateLoader.loadTemplate(templateName);
          prompt = this.promptBuilder.buildPromptWithTemplate(question, contexts, customTemplate);
        } catch (error) {
          this.progressReporter.error(
            `Failed to load template '${templateName}': ${error instanceof Error ? error.message : String(error)}`
          );
          this.progressReporter.info('Falling back to default template');
          prompt = this.promptBuilder.buildPrompt(question, contexts);
        }
      } else {
        // Use default template
        prompt = this.promptBuilder.buildPrompt(question, contexts);
      }

      // Display prompt if enabled
      if (this.querySettings.getShowPrompt()) {
        this.displayPromptDetails(prompt, searchResults);
      }

      // Step 5: Query the LLM
      this.progressReporter.info('Querying LLM...');

      const llmRequest: LlmRequest = {
        prompt,
        temperature: this.querySettings.getTemperature(),
        maxTokens: this.querySettings.getMaxTokens(),
      };

      const llmResponse = await this.llmClient.generateResponse(llmRequest);

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
   * Display prompt details when show-prompt is enabled
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
}
