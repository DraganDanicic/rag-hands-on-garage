import { StoredEmbedding } from './models/StoredEmbedding.js';

export interface IEmbeddingStore {
  /**
   * Save embeddings to storage
   * @param embeddings - Array of embeddings to save
   */
  save(embeddings: StoredEmbedding[]): Promise<void>;

  /**
   * Load all embeddings from storage
   * @returns Array of stored embeddings
   */
  load(): Promise<StoredEmbedding[]>;

  /**
   * Clear all embeddings from storage
   */
  clear(): Promise<void>;
}
