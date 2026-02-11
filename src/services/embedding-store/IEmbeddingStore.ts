import { StoredEmbedding } from './models/StoredEmbedding.js';
import type { ImportSettingsData } from '../import-settings/models/ImportSettingsData.js';

export interface IEmbeddingStore {
  /**
   * Save embeddings to storage with optional settings metadata
   * @param embeddings - Array of embeddings to save
   * @param settings - Optional settings metadata (for new collections)
   */
  save(embeddings: StoredEmbedding[], settings?: ImportSettingsData): Promise<void>;

  /**
   * Save embeddings incrementally by merging with existing ones
   * Existing embeddings with the same chunkId will be overwritten
   * Settings are preserved from existing file
   * @param embeddings - Array of embeddings to add/update
   */
  saveIncremental(embeddings: StoredEmbedding[]): Promise<void>;

  /**
   * Load all embeddings from storage
   * @returns Object with embeddings array and optional settings metadata
   */
  load(): Promise<{ embeddings: StoredEmbedding[]; settings?: ImportSettingsData }>;

  /**
   * Load embeddings only (for backward compatibility)
   * @returns Array of stored embeddings
   */
  loadEmbeddings(): Promise<StoredEmbedding[]>;

  /**
   * Clear all embeddings from storage
   */
  clear(): Promise<void>;
}
