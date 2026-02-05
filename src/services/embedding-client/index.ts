import { LlmFarmEmbeddingClient } from './LlmFarmEmbeddingClient.js';
import { IEmbeddingClient } from './IEmbeddingClient.js';

export { IEmbeddingClient } from './IEmbeddingClient.js';
export { EmbeddingRequest } from './models/EmbeddingRequest.js';
export { EmbeddingResponse } from './models/EmbeddingResponse.js';

/**
 * Factory function to create an LLM Farm Embedding Client instance
 * @param apiKey - LLM Farm API key
 */
export function createEmbeddingClient(apiKey: string): IEmbeddingClient {
  return new LlmFarmEmbeddingClient(apiKey);
}
