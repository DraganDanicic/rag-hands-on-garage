/**
 * Configuration service interface
 * Provides access to all application configuration values
 */
export interface IConfigService {
  /**
   * Get LLM Farm API key for both embedding generation and LLM queries
   */
  getLlmFarmApiKey(): string;

  /**
   * Get chunk size for text splitting (number of characters)
   */
  getChunkSize(): number;

  /**
   * Get chunk overlap for text splitting (number of characters)
   */
  getChunkOverlap(): number;

  /**
   * Get top K value for vector search results
   */
  getTopK(): number;

  /**
   * Get path to documents directory
   */
  getDocumentsPath(): string;

  /**
   * Get path to embeddings storage file
   */
  getEmbeddingsPath(): string;
}
