/**
 * Import settings data structure
 * These settings determine how documents are processed during embedding generation
 */
export interface ImportSettingsData {
  /** Size of text chunks in characters */
  chunkSize: number;
  /** Overlap between chunks in characters */
  chunkOverlap: number;
  /** Frequency of incremental saves (chunks) */
  checkpointInterval: number;
  /** Embedding model to use */
  embeddingModel: string;
}

/**
 * Default import settings constants
 */
export const DEFAULT_IMPORT_SETTINGS: ImportSettingsData = {
  chunkSize: 500,
  chunkOverlap: 50,
  checkpointInterval: 50,
  embeddingModel: 'askbosch-prod-farm-openai-text-embedding-3-small',
};
