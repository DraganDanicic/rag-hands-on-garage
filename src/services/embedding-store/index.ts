import { JsonEmbeddingStore } from './JsonEmbeddingStore.js';
import { IEmbeddingStore } from './IEmbeddingStore.js';

export { IEmbeddingStore } from './IEmbeddingStore.js';
export { StoredEmbedding } from './models/StoredEmbedding.js';

/**
 * Factory function to create a JsonEmbeddingStore instance
 * @param filePath - Path to the JSON file for storing embeddings
 */
export function createEmbeddingStore(filePath: string): IEmbeddingStore {
  return new JsonEmbeddingStore(filePath);
}
