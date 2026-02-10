import { IContainer } from './IContainer.js';
import { IConfigService, createConfigService } from '../config/index.js';
import { IDocumentReader, createDocumentReader } from '../services/document-reader/index.js';
import { ITextChunker, createTextChunker } from '../services/text-chunker/index.js';
import { IEmbeddingClient, createEmbeddingClient } from '../services/embedding-client/index.js';
import { ILlmClient, createLlmClient } from '../services/llm-client/index.js';
import { IProgressReporter, createProgressReporter } from '../services/progress-reporter/index.js';
import { IEmbeddingStore, createEmbeddingStore } from '../services/embedding-store/index.js';
import { IVectorSearch, createVectorSearch } from '../services/vector-search/index.js';
import { IPromptBuilder, createPromptBuilder } from '../services/prompt-builder/index.js';
import { ChunkingConfig } from '../services/text-chunker/models/ChunkingConfig.js';

/**
 * Dependency Injection Container implementation
 * Instantiates and manages all application services
 */
export class Container implements IContainer {
  private readonly configService: IConfigService;
  private readonly documentReader: IDocumentReader;
  private readonly textChunker: ITextChunker;
  private readonly embeddingClient: IEmbeddingClient;
  private readonly llmClient: ILlmClient;
  private readonly progressReporter: IProgressReporter;
  private readonly embeddingStore: IEmbeddingStore;
  private readonly vectorSearch: IVectorSearch;
  private readonly promptBuilder: IPromptBuilder;

  constructor(collectionName: string = 'default') {
    // Initialize configuration service first with collection name
    this.configService = createConfigService(collectionName);

    // Initialize services that don't need configuration
    this.documentReader = createDocumentReader();
    this.progressReporter = createProgressReporter();
    this.vectorSearch = createVectorSearch();
    this.promptBuilder = createPromptBuilder();

    // Initialize text chunker with configuration
    const chunkingConfig: ChunkingConfig = {
      chunkSize: this.configService.getChunkSize(),
      chunkOverlap: this.configService.getChunkOverlap(),
    };
    this.textChunker = createTextChunker(chunkingConfig);

    // Initialize API clients with configuration
    this.embeddingClient = createEmbeddingClient(this.configService.getLlmFarmApiKey());
    this.llmClient = createLlmClient(this.configService.getLlmFarmApiKey());

    // Initialize embedding store with configured path
    this.embeddingStore = createEmbeddingStore(this.configService.getEmbeddingsPath());
  }

  getConfigService(): IConfigService {
    return this.configService;
  }

  getDocumentReader(): IDocumentReader {
    return this.documentReader;
  }

  getTextChunker(): ITextChunker {
    return this.textChunker;
  }

  getEmbeddingClient(): IEmbeddingClient {
    return this.embeddingClient;
  }

  getLlmClient(): ILlmClient {
    return this.llmClient;
  }

  getProgressReporter(): IProgressReporter {
    return this.progressReporter;
  }

  getEmbeddingStore(): IEmbeddingStore {
    return this.embeddingStore;
  }

  getVectorSearch(): IVectorSearch {
    return this.vectorSearch;
  }

  getPromptBuilder(): IPromptBuilder {
    return this.promptBuilder;
  }
}
