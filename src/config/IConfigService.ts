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

  /**
   * Get path to chunks storage file
   */
  getChunksPath(): string;

  // LLM Configuration
  /**
   * Get LLM model name
   */
  getLlmModel(): string;

  /**
   * Get LLM temperature (0.0 to 2.0)
   */
  getLlmTemperature(): number;

  /**
   * Get LLM max tokens
   */
  getLlmMaxTokens(): number;

  // Embedding Configuration
  /**
   * Get embedding model name
   */
  getEmbeddingModel(): string;

  // Prompt Template Configuration
  /**
   * Get path to custom prompt template file (if specified)
   */
  getPromptTemplatePath(): string | undefined;

  /**
   * Get built-in prompt template name (if specified)
   */
  getPromptTemplate(): string | undefined;

  /**
   * Get path to prompts directory
   */
  getPromptsPath(): string;

  // Performance & Reliability Configuration
  /**
   * Get checkpoint interval (number of chunks between saves)
   */
  getCheckpointInterval(): number;

  /**
   * Get max number of retries for API calls
   */
  getMaxRetries(): number;

  /**
   * Get retry delay in milliseconds
   */
  getRetryDelayMs(): number;

  /**
   * Get embedding API timeout in milliseconds
   */
  getEmbeddingApiTimeoutMs(): number;

  /**
   * Get LLM API timeout in milliseconds
   */
  getLlmApiTimeoutMs(): number;

  // Proxy Configuration
  /**
   * Check if proxy is enabled
   */
  isProxyEnabled(): boolean;

  /**
   * Get proxy host
   */
  getProxyHost(): string;

  /**
   * Get proxy port
   */
  getProxyPort(): number;
}
