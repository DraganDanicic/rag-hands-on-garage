import { IVectorSearch } from './IVectorSearch.js';
import { StoredEmbedding } from '../embedding-store/models/StoredEmbedding.js';
import { SearchResult } from './models/SearchResult.js';

export class VectorSearch implements IVectorSearch {
  /**
   * Calculates the cosine similarity between two vectors
   * Formula: (A · B) / (||A|| × ||B||)
   * @param vectorA - First vector
   * @param vectorB - Second vector
   * @returns Cosine similarity score (-1 to 1)
   */
  private calculateCosineSimilarity(
    vectorA: number[],
    vectorB: number[]
  ): number {
    // Validate inputs
    if (!vectorA || !vectorB || vectorA.length === 0 || vectorB.length === 0) {
      throw new Error('Vectors cannot be null, undefined, or empty');
    }

    if (vectorA.length !== vectorB.length) {
      throw new Error(
        `Vector dimensions must match. Got ${vectorA.length} and ${vectorB.length}`
      );
    }

    // Calculate dot product (A · B)
    let dotProduct = 0;
    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += (vectorA[i] ?? 0) * (vectorB[i] ?? 0);
    }

    // Calculate magnitudes (||A|| and ||B||)
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < vectorA.length; i++) {
      magnitudeA += (vectorA[i] ?? 0) * (vectorA[i] ?? 0);
      magnitudeB += (vectorB[i] ?? 0) * (vectorB[i] ?? 0);
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    // Handle zero magnitude vectors
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    // Return cosine similarity
    return dotProduct / (magnitudeA * magnitudeB);
  }

  search(
    queryVector: number[],
    embeddings: StoredEmbedding[],
    topK: number
  ): SearchResult[] {
    // Validate inputs
    if (!queryVector || queryVector.length === 0) {
      throw new Error('Query vector cannot be null, undefined, or empty');
    }

    if (!embeddings) {
      throw new Error('Embeddings array cannot be null or undefined');
    }

    if (topK <= 0) {
      throw new Error('topK must be greater than 0');
    }

    // Handle empty embeddings array
    if (embeddings.length === 0) {
      return [];
    }

    // Calculate similarity scores for all embeddings
    const scoredEmbeddings: Array<{
      embedding: StoredEmbedding;
      score: number;
    }> = [];

    for (const embedding of embeddings) {
      // Skip embeddings with invalid vectors
      if (!embedding.vector || embedding.vector.length === 0) {
        continue;
      }

      try {
        const score = this.calculateCosineSimilarity(
          queryVector,
          embedding.vector
        );
        scoredEmbeddings.push({ embedding, score });
      } catch (error) {
        // Skip embeddings with incompatible dimensions
        continue;
      }
    }

    // Sort by score in descending order (highest similarity first)
    scoredEmbeddings.sort((a, b) => b.score - a.score);

    // Take top K results
    const topResults = scoredEmbeddings.slice(0, topK);

    // Convert to SearchResult format with rank
    const results: SearchResult[] = topResults.map((item, index) => ({
      embedding: item.embedding,
      score: item.score,
      rank: index + 1, // 1-based rank
    }));

    return results;
  }
}
