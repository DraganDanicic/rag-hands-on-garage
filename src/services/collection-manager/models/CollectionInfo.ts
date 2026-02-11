/**
 * Information about a collection
 */
export interface CollectionInfo {
  name: string;
  embeddingCount: number;
  fileSizeBytes: number;
  lastModified: Date;
  embeddingsPath: string;
  chunksPath: string;
  chunksExists: boolean;
  /** Settings used when collection was created (locked) */
  settings?: {
    chunkSize: number;
    chunkOverlap: number;
    checkpointInterval: number;
    embeddingModel: string;
  };
}
