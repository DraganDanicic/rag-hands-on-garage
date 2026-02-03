export interface EmbeddingRequest {
  /**
   * Text to generate embedding for
   */
  input: string | string[];

  /**
   * Model to use for embedding generation
   */
  model: string;
}
