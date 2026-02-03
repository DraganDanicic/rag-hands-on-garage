import { StoredEmbedding } from '../../embedding-store/models/StoredEmbedding.js';

export interface SearchResult {
  /**
   * The stored embedding that matched the query
   */
  embedding: StoredEmbedding;

  /**
   * Similarity score (cosine similarity: -1 to 1, higher is more similar)
   */
  score: number;

  /**
   * Rank in the result set (1-based, where 1 is the best match)
   */
  rank: number;
}
