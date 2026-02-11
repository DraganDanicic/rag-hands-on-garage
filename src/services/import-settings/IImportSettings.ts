import type { ImportSettingsData } from './models/ImportSettingsData.js';

/**
 * Import settings service interface
 * Manages global import settings for new collections
 */
export interface IImportSettings {
  /**
   * Initialize the service (load settings from file)
   */
  initialize(): Promise<void>;

  /**
   * Get chunk size setting
   * @returns Chunk size in characters
   */
  getChunkSize(): number;

  /**
   * Get chunk overlap setting
   * @returns Chunk overlap in characters
   */
  getChunkOverlap(): number;

  /**
   * Get checkpoint interval setting
   * @returns Checkpoint interval in chunks
   */
  getCheckpointInterval(): number;

  /**
   * Get embedding model setting
   * @returns Embedding model name
   */
  getEmbeddingModel(): string;

  /**
   * Set chunk size
   * @param size - Chunk size in characters
   * @throws Error if size is invalid
   */
  setChunkSize(size: number): void;

  /**
   * Set chunk overlap
   * @param overlap - Chunk overlap in characters
   * @throws Error if overlap is invalid
   */
  setChunkOverlap(overlap: number): void;

  /**
   * Set checkpoint interval
   * @param interval - Checkpoint interval in chunks
   * @throws Error if interval is invalid
   */
  setCheckpointInterval(interval: number): void;

  /**
   * Set embedding model
   * @param model - Embedding model name
   * @throws Error if model is invalid
   */
  setEmbeddingModel(model: string): void;

  /**
   * Reset all settings to defaults
   */
  resetToDefaults(): void;

  /**
   * Get all settings as a data object
   * @returns Settings data
   */
  getAllSettings(): ImportSettingsData;

  /**
   * Save settings to persistent storage
   */
  save(): Promise<void>;

  /**
   * Load settings from persistent storage
   */
  load(): Promise<void>;
}
