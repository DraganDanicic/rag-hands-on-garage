import { LlmFarmEmbeddingClient, EmbeddingClientConfig } from './LlmFarmEmbeddingClient.js';
import { IEmbeddingClient } from './IEmbeddingClient.js';

export { IEmbeddingClient } from './IEmbeddingClient.js';
export { EmbeddingRequest } from './models/EmbeddingRequest.js';
export { EmbeddingResponse } from './models/EmbeddingResponse.js';
export { EmbeddingClientConfig } from './LlmFarmEmbeddingClient.js';

/**
 * Factory function to create an LLM Farm Embedding Client instance
 * @param apiKey - LLM Farm API key
 * @param config - Optional client configuration
 */
export function createEmbeddingClient(
  apiKey: string,
  config?: EmbeddingClientConfig
): IEmbeddingClient {
  return new LlmFarmEmbeddingClient(apiKey, config);
}
