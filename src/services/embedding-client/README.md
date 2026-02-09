# Embedding Client Service

## Responsibility
Generates vector embeddings by calling the Bosch LLM Farm API (text-embedding-3-small model).

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
- Uses Bosch LLM Farm endpoint for text-embedding-3-small (1536 dimensions)
- Supports batch processing for efficiency
- Includes retry logic for transient API failures (3 retries with exponential backoff)
- Validates API key on instantiation
- Handles 401/403 (invalid key), 429 (rate limit), 400 (bad request) errors
- Custom header: `genaiplatform-farm-subscription-key`
- Timeout: 30 seconds

## Testing Considerations
- Mock HTTP calls to LLM Farm API
- Test error handling for 401, 403, 429, 400, 500 status codes
- Verify correct request format with custom headers
- Test batch processing logic
- Validate embedding vector dimensions (1536)
- Test retry logic for 5xx errors
