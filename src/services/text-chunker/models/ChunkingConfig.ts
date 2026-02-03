export interface ChunkingConfig {
  /**
   * Number of characters per chunk
   */
  chunkSize: number;

  /**
   * Number of characters to overlap between consecutive chunks
   */
  chunkOverlap: number;
}
