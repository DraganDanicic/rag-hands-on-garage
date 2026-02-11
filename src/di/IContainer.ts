import { IConfigService } from '../config/IConfigService.js';
import { IDocumentReader } from '../services/document-reader/IDocumentReader.js';
import { ITextChunker } from '../services/text-chunker/ITextChunker.js';
import { IEmbeddingClient } from '../services/embedding-client/IEmbeddingClient.js';
import { ILlmClient } from '../services/llm-client/ILlmClient.js';
import { IProgressReporter } from '../services/progress-reporter/IProgressReporter.js';
import { IEmbeddingStore } from '../services/embedding-store/IEmbeddingStore.js';
import { IVectorSearch } from '../services/vector-search/IVectorSearch.js';
import { IPromptBuilder } from '../services/prompt-builder/IPromptBuilder.js';
import { ICollectionManager } from '../services/collection-manager/ICollectionManager.js';
import { IErrorHandler } from '../services/error-handler/IErrorHandler.js';
import { IImportSettings } from '../services/import-settings/IImportSettings.js';
import { IQuerySettings } from '../services/query-settings/IQuerySettings.js';
import { ITemplateLoader } from '../services/template-loader/ITemplateLoader.js';

/**
 * Dependency Injection Container interface
 * Provides access to all configured services
 */
export interface IContainer {
  /**
   * Initialize async services (must be called before using services)
   */
  initialize(): Promise<void>;

  /**
   * Get the configuration service instance
   */
  getConfigService(): IConfigService;

  /**
   * Get the document reader service instance
   */
  getDocumentReader(): IDocumentReader;

  /**
   * Get the text chunker service instance
   */
  getTextChunker(): ITextChunker;

  /**
   * Get the embedding client service instance
   */
  getEmbeddingClient(): IEmbeddingClient;

  /**
   * Get the LLM client service instance
   */
  getLlmClient(): ILlmClient;

  /**
   * Get the progress reporter service instance
   */
  getProgressReporter(): IProgressReporter;

  /**
   * Get the embedding store service instance
   */
  getEmbeddingStore(): IEmbeddingStore;

  /**
   * Get the vector search service instance
   */
  getVectorSearch(): IVectorSearch;

  /**
   * Get the prompt builder service instance
   */
  getPromptBuilder(): IPromptBuilder;

  /**
   * Get the collection manager service instance
   */
  getCollectionManager(): ICollectionManager;

  /**
   * Get the error handler service instance
   */
  getErrorHandler(): IErrorHandler;

  /**
   * Get the import settings service instance
   */
  getImportSettings(): IImportSettings;

  /**
   * Get the query settings service instance
   */
  getQuerySettings(): IQuerySettings;

  /**
   * Get the template loader service instance
   */
  getTemplateLoader(): ITemplateLoader;
}
