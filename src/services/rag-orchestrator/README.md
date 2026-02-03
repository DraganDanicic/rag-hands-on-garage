# RAG Orchestrator Service

## Responsibility
Coordinates the complete RAG query flow: embed query → search → build prompt → generate response.

## Public Interface
```typescript
interface IRagOrchestrator {
  query(question: string): Promise<string>;
}
```

## Models
- None (uses models from injected services)

## Dependencies (Injected)
- **IEmbeddingClient**: To embed the user's question
- **IEmbeddingStore**: To load stored embeddings
- **IVectorSearch**: To find relevant chunks
- **IPromptBuilder**: To construct the RAG prompt
- **ILlmClient**: To generate the final response

## Usage Example
```typescript
import { createRagOrchestrator } from './services/rag-orchestrator';

const orchestrator = createRagOrchestrator({
  embeddingClient,
  embeddingStore,
  vectorSearch,
  promptBuilder,
  llmClient,
  topK: 3
});

const answer = await orchestrator.query("What is the main topic of the document?");
console.log(answer);
```

## Implementation Notes
- Encapsulates the entire RAG pipeline
- topK is configurable (how many chunks to retrieve)
- Handles errors at each stage gracefully
- Could log intermediate steps for debugging
- Single entry point for RAG queries

## Testing Considerations
- Mock all injected dependencies
- Test each stage of the pipeline
- Verify error propagation
- Test with various topK values
- Validate end-to-end flow
