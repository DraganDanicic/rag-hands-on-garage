export interface EmbeddingResponse {
  /**
   * Generated embedding vectors
   */
  embeddings: number[][];

  /**
   * Usage metadata from the API
   */
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
}
