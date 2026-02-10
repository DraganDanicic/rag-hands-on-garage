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
}
