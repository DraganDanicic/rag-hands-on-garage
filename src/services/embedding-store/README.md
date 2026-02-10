# Embedding Store Service

## Responsibility
Persists and retrieves embeddings from local JSON file storage.

## Public Interface
```typescript
interface IEmbeddingStore {
  save(embeddings: StoredEmbedding[]): Promise<void>;
  saveIncremental(embeddings: StoredEmbedding[]): Promise<void>;
  load(): Promise<StoredEmbedding[]>;
  clear(): Promise<void>;
}
```

## Models
- **StoredEmbedding**: Contains document source, text chunk, embedding vector, and metadata (chunkId, chunk index, positions)

## Dependencies (Injected)
- None (file system operations are internal)

## Usage Example
```typescript
import { createEmbeddingStore } from './services/embedding-store';

const store = createEmbeddingStore('./data/collections/default.embeddings.json');

// Full save (replace entire file)
await store.save(embeddingsArray);

// Incremental save (merge with existing by chunkId)
await store.saveIncremental(newEmbeddings);

// Load embeddings
const loaded = await store.load();
console.log(`Loaded ${loaded.length} embeddings`);

// Clear storage
await store.clear();
```

## Implementation Notes
- Uses JSON file format for human readability
- File path is configurable (injected in factory)
- Atomic writes to prevent corruption (writes to .tmp file, then renames)
- Creates directory structure if it doesn't exist
- Returns empty array if file doesn't exist on load()
- **Incremental Save**: `saveIncremental()` method merges new embeddings with existing ones
  - Loads existing embeddings into Map<chunkId, embedding>
  - Adds/overwrites with new embeddings
  - Writes merged result atomically
  - Handles embeddings without chunkId (backward compatibility)
  - Enables resume capability and checkpoint saves

## Testing Considerations
- Mock file system operations
- Test file corruption scenarios
- Verify atomic write behavior
- Test with large embedding datasets
- Validate JSON serialization/deserialization
