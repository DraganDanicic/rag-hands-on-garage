export interface StoredEmbedding {
  /**
   * The original text that was embedded
   */
  text: string;

  /**
   * The embedding vector (array of numbers)
   */
  vector: number[];

  /**
   * Source document or identifier
   */
  source?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}
