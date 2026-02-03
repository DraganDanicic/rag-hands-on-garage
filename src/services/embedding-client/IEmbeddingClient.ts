export interface IEmbeddingClient {
  /**
   * Generate embedding for a single text
   * @param text - Text to generate embedding for
   * @returns Embedding vector (1536 dimensions for text-embedding-3-small)
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Generate embeddings for multiple texts in a batch
   * @param texts - Array of texts to generate embeddings for
   * @returns Array of embedding vectors
   */
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}
