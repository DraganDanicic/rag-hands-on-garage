/**
 * RAG Hands-On Garage
 * Main entry point and exports
 */

// Export dependency injection container
export { Container } from './di/Container.js';
export { IContainer } from './di/IContainer.js';

// Export workflows
export { IndexingWorkflow } from './workflows/IndexingWorkflow.js';
export { QueryWorkflow } from './workflows/QueryWorkflow.js';

// Export service interfaces
export { IConfigService } from './config/IConfigService.js';
export { IDocumentReader } from './services/document-reader/IDocumentReader.js';
export { ITextChunker } from './services/text-chunker/ITextChunker.js';
export { IEmbeddingClient } from './services/embedding-client/IEmbeddingClient.js';
export { IEmbeddingStore } from './services/embedding-store/IEmbeddingStore.js';
export { IVectorSearch } from './services/vector-search/IVectorSearch.js';
export { IPromptBuilder } from './services/prompt-builder/IPromptBuilder.js';
export { ILlmClient } from './services/llm-client/ILlmClient.js';
export { IProgressReporter } from './services/progress-reporter/IProgressReporter.js';

// Export common models
export { Document } from './services/document-reader/models/Document.js';
export { TextChunk } from './services/text-chunker/models/TextChunk.js';
export { ChunkingConfig } from './services/text-chunker/models/ChunkingConfig.js';
export { StoredEmbedding } from './services/embedding-store/models/StoredEmbedding.js';
export { SearchResult } from './services/vector-search/models/SearchResult.js';
export { LlmRequest } from './services/llm-client/models/LlmRequest.js';
export { LlmResponse } from './services/llm-client/models/LlmResponse.js';
export { PromptTemplate } from './services/prompt-builder/models/PromptTemplate.js';
