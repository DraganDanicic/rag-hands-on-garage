# Text Chunker Service

## Responsibility
Splits document text into overlapping chunks based on configurable size and overlap parameters.

## Public Interface
```typescript
interface ITextChunker {
  chunk(text: string, config: ChunkingConfig): TextChunk[];
}
```

## Models
- **TextChunk**: Contains chunk text, position index, start/end character positions
- **ChunkingConfig**: Immutable configuration with chunkSize and chunkOverlap properties

## Dependencies (Injected)
- None (pure business logic with no external dependencies)

## Usage Example
```typescript
import { createTextChunker } from './services/text-chunker';

const chunker = createTextChunker();
const config = { chunkSize: 500, chunkOverlap: 50 };
const chunks = chunker.chunk(document.content, config);

chunks.forEach((chunk, i) => {
  console.log(`Chunk ${i}: ${chunk.text.substring(0, 50)}...`);
});
```

## Implementation Notes
- Character-based chunking (not token-based)
- Overlap creates sliding window effect for better context preservation
- Maintains chunk order with position index
- Last chunk may be smaller than chunkSize
- Does not attempt to break on word/sentence boundaries (simple implementation)

## Testing Considerations
- Test with various chunk sizes and overlap values
- Verify overlap calculation is correct
- Test edge cases: empty text, text smaller than chunk size
- Validate chunk positions and indices
