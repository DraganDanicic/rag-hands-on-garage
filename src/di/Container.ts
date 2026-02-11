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
import { ITemplateLoader, createTemplateLoader } from '../services/template-loader/index.js';
import { ICollectionManager, createCollectionManager } from '../services/collection-manager/index.js';
import { IErrorHandler, createErrorHandler } from '../services/error-handler/index.js';
import { IImportSettings, createImportSettings } from '../services/import-settings/index.js';
import { IQuerySettings, createQuerySettings } from '../services/query-settings/index.js';
import { ChunkingConfig } from '../services/text-chunker/models/ChunkingConfig.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

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
  private readonly templateLoader: ITemplateLoader;
  private readonly promptBuilder: IPromptBuilder;
  private readonly collectionManager: ICollectionManager;
  private readonly errorHandler: IErrorHandler;
  private readonly importSettings: IImportSettings;
  private readonly querySettings: IQuerySettings;
  private initialized: boolean = false;

  constructor(collectionName: string = 'default') {
    // Get project root for collection manager
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectRoot = path.resolve(__dirname, '../..');

    // Initialize configuration service first with collection name
    this.configService = createConfigService(collectionName);

    // Initialize services that don't need configuration
    this.documentReader = createDocumentReader();
    this.progressReporter = createProgressReporter();
    this.vectorSearch = createVectorSearch();

    // Initialize template loader
    this.templateLoader = createTemplateLoader(this.configService.getPromptsPath());

    // Initialize prompt builder (requires async initialization)
    this.promptBuilder = createPromptBuilder(this.templateLoader, this.configService);

    // Initialize text chunker with configuration
    const chunkingConfig: ChunkingConfig = {
      chunkSize: this.configService.getChunkSize(),
      chunkOverlap: this.configService.getChunkOverlap(),
    };
    this.textChunker = createTextChunker(chunkingConfig);

    // Initialize API clients with configuration
    this.embeddingClient = createEmbeddingClient(
      this.configService.getLlmFarmApiKey(),
      {
        model: this.configService.getEmbeddingModel(),
        maxRetries: this.configService.getMaxRetries(),
        retryDelayMs: this.configService.getRetryDelayMs(),
        timeoutMs: this.configService.getEmbeddingApiTimeoutMs(),
        proxyEnabled: this.configService.isProxyEnabled(),
        proxyHost: this.configService.getProxyHost(),
        proxyPort: this.configService.getProxyPort(),
      }
    );

    this.llmClient = createLlmClient(
      this.configService.getLlmFarmApiKey(),
      {
        model: this.configService.getLlmModel(),
        maxRetries: this.configService.getMaxRetries(),
        retryDelayMs: this.configService.getRetryDelayMs(),
        timeoutMs: this.configService.getLlmApiTimeoutMs(),
        proxyEnabled: this.configService.isProxyEnabled(),
        proxyHost: this.configService.getProxyHost(),
        proxyPort: this.configService.getProxyPort(),
      }
    );

    // Initialize embedding store with configured path
    this.embeddingStore = createEmbeddingStore(this.configService.getEmbeddingsPath());

    // Initialize collection manager
    const collectionsDir = process.env['COLLECTIONS_PATH'] ?? path.join(projectRoot, 'data', 'collections');
    const chunksDir = process.env['CHUNKS_PATH'] ?? path.join(projectRoot, 'data', 'chunks');
    this.collectionManager = createCollectionManager(collectionsDir, chunksDir);

    // Initialize error handler
    this.errorHandler = createErrorHandler();

    // Initialize import settings
    this.importSettings = createImportSettings(this.configService);

    // Initialize query settings
    this.querySettings = createQuerySettings(this.configService);
  }

  /**
   * Initialize async services (must be called before using the container)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize prompt builder (loads template)
    await this.promptBuilder.initialize();

    // Initialize import settings (loads from file if exists)
    await this.importSettings.initialize();

    // Initialize query settings (loads from file if exists)
    await this.querySettings.initialize();

    this.initialized = true;
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

  getCollectionManager(): ICollectionManager {
    return this.collectionManager;
  }

  getErrorHandler(): IErrorHandler {
    return this.errorHandler;
  }

  getImportSettings(): IImportSettings {
    return this.importSettings;
  }

  getQuerySettings(): IQuerySettings {
    return this.querySettings;
  }

  getTemplateLoader(): ITemplateLoader {
    return this.templateLoader;
  }
}
