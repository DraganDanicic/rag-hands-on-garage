import { IEmbeddingClient } from '../services/embedding-client/IEmbeddingClient.js';
import { IEmbeddingStore } from '../services/embedding-store/IEmbeddingStore.js';
import { IVectorSearch } from '../services/vector-search/IVectorSearch.js';
import { IPromptBuilder } from '../services/prompt-builder/IPromptBuilder.js';
import { ILlmClient } from '../services/llm-client/ILlmClient.js';
import { IConfigService } from '../config/IConfigService.js';
import { IProgressReporter } from '../services/progress-reporter/IProgressReporter.js';
import { LlmRequest } from '../services/llm-client/models/LlmRequest.js';

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
    private readonly configService: IConfigService,
    private readonly embeddingClient: IEmbeddingClient,
    private readonly embeddingStore: IEmbeddingStore,
    private readonly vectorSearch: IVectorSearch,
    private readonly promptBuilder: IPromptBuilder,
    private readonly llmClient: ILlmClient,
    private readonly progressReporter: IProgressReporter
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
      const storedEmbeddings = await this.embeddingStore.load();

      if (storedEmbeddings.length === 0) {
        throw new Error(
          'No embeddings found in storage. Please run the generate-embeddings command first.'
        );
      }

      // Step 3: Search for similar chunks
      const topK = this.configService.getTopK();
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
      const prompt = this.promptBuilder.buildPrompt(question, contexts);

      // Step 5: Query the LLM
      this.progressReporter.info('Querying LLM...');

      const llmRequest: LlmRequest = {
        prompt,
        temperature: 0.7,
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
}
