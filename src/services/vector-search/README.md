# Vector Search Service

## Responsibility
Finds the most similar embeddings to a query vector using cosine similarity.

## Public Interface
```typescript
interface IVectorSearch {
  search(queryVector: number[], embeddings: StoredEmbedding[], topK: number): SearchResult[];
}
```

## Models
- **SearchResult**: Contains the stored embedding, similarity score, and rank

## Dependencies (Injected)
- None (pure mathematical operations)

## Usage Example
```typescript
import { createVectorSearch } from './services/vector-search';

const vectorSearch = createVectorSearch();
const queryEmbedding = [0.1, 0.2, 0.3, ...]; // 1536 dimensions

const results = vectorSearch.search(queryEmbedding, allEmbeddings, 5);
results.forEach(result => {
  console.log(`Score: ${result.score}, Text: ${result.embedding.text}`);
});
```

## Implementation Notes
- Uses cosine similarity as distance metric
- Returns results sorted by similarity (highest first)
- topK parameter limits number of results
- Similarity score range: -1 to 1 (higher is more similar)
- Linear search implementation (fine for thousands of embeddings)

## Testing Considerations
- Test cosine similarity calculation accuracy
- Verify sorting is correct (descending by score)
- Test with identical vectors (score should be 1.0)
- Test with orthogonal vectors (score should be ~0)
- Validate topK limiting works correctly
