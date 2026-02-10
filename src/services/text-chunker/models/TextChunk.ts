export interface TextChunk {
  /**
   * The text content of this chunk
   */
  text: string;

  /**
   * Starting position of this chunk in the original text
   */
  startPosition: number;

  /**
   * Ending position of this chunk in the original text
   */
  endPosition: number;

  /**
   * Index of this chunk in the sequence
   */
  chunkIndex: number;

  /**
   * Unique identifier for this chunk, generated from content hash
   */
  chunkId?: string;

  /**
   * Additional metadata
   */
  metadata?: {
    sourceDocument?: string;
    totalChunks?: number;
  };
}
