import { VectorSearch } from './VectorSearch.js';
import { IVectorSearch } from './IVectorSearch.js';

export { IVectorSearch } from './IVectorSearch.js';
export { SearchResult } from './models/SearchResult.js';

/**
 * Factory function to create a VectorSearch instance
 */
export function createVectorSearch(): IVectorSearch {
  return new VectorSearch();
}
