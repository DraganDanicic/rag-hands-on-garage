import { OpenAIEmbeddingClient } from './OpenAIEmbeddingClient.js';
import { IEmbeddingClient } from './IEmbeddingClient.js';

export { IEmbeddingClient } from './IEmbeddingClient.js';
export { EmbeddingRequest } from './models/EmbeddingRequest.js';
export { EmbeddingResponse } from './models/EmbeddingResponse.js';

/**
 * Factory function to create an OpenAI Embedding Client instance
 * @param apiKey - OpenAI API key
 */
export function createEmbeddingClient(apiKey: string): IEmbeddingClient {
  return new OpenAIEmbeddingClient(apiKey);
}
