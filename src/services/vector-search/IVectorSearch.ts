import { StoredEmbedding } from '../embedding-store/models/StoredEmbedding.js';
import { SearchResult } from './models/SearchResult.js';

export interface IVectorSearch {
  /**
   * Searches for the most similar embeddings to the query vector
   * @param queryVector - The query embedding vector
   * @param embeddings - Array of stored embeddings to search through
   * @param topK - Maximum number of results to return
   * @returns Array of search results sorted by similarity score (descending)
   */
  search(
    queryVector: number[],
    embeddings: StoredEmbedding[],
    topK: number
  ): SearchResult[];
}
