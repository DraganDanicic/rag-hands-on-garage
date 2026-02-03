# Embedding Client Service

## Responsibility
Generates vector embeddings by calling the OpenAI text-embedding-3-small API.

## Public Interface
```typescript
interface IEmbeddingClient {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}
```

## Models
- **EmbeddingRequest**: Contains text input and model parameters
- **EmbeddingResponse**: Contains embedding vector and usage metadata

## Dependencies (Injected)
- None (HTTP client is internal implementation detail)

## Usage Example
```typescript
import { createEmbeddingClient } from './services/embedding-client';

const embeddingClient = createEmbeddingClient(apiKey);
const embedding = await embeddingClient.generateEmbedding("Hello world");
console.log(`Embedding dimension: ${embedding.length}`);

// Batch processing
const embeddings = await embeddingClient.generateEmbeddings([
  "First text",
  "Second text"
]);
```

## Implementation Notes
- Uses OpenAI text-embedding-3-small model (1536 dimensions)
- Supports batch processing for efficiency
- Includes retry logic for transient API failures
- Validates API key on instantiation
- Rate limiting should be handled externally

## Testing Considerations
- Mock HTTP calls to OpenAI API
- Test error handling for API failures
- Verify correct request format
- Test batch processing logic
- Validate embedding vector dimensions
