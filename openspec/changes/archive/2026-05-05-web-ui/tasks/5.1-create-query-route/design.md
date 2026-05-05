# Task 5.1: Design -- Query Route

## Overview

A single Express Router module at `src/server/routes/query.ts` that handles `POST /:name/query`. The server mounts this router under `/api/collections`, yielding the full path `POST /api/collections/:name/query`.

## Route Handler Flow

```
POST /api/collections/:name/query
  Body: { question: string, topK?: number, temperature?: number }

1. Extract `name` from req.params
2. Validate request body -- return 400 if `question` is missing or empty
3. Create Container(name) and call container.initialize()
4. If topK or temperature provided, override via querySettings setters
5. Construct QueryWorkflow from container services
6. Call workflow.query(question)
7. Return 200 { answer: string }
8. On error:
   - "No embeddings found" -> 400 { error: "..." }
   - All other errors -> 500 { error: "..." }
```

## File Structure

```
src/server/routes/query.ts    # New file -- the query route handler
```

No other files are created or modified by this task.

## Implementation Detail

### Router Export

```typescript
// src/server/routes/query.ts
import { Router, Request, Response } from 'express';
import { Container } from '../../di/Container.js';
import { QueryWorkflow } from '../../workflows/QueryWorkflow.js';

const router = Router();

router.post('/:name/query', async (req: Request, res: Response) => {
  // ... handler implementation
});

export default router;
```

### Request Validation

The handler validates:
- `req.body.question` exists and is a non-empty string after trimming
- `req.body.topK`, if present, is a positive integer between 1 and 10
- `req.body.temperature`, if present, is a number between 0.0 and 2.0

Validation uses the constants from `IQuerySettings.ts` (`QUERY_SETTINGS_CONSTRAINTS`) for range checks, keeping validation rules DRY.

On validation failure, return immediately with:
```json
{ "error": "Question is required" }
```
Status: 400.

### Container and Workflow Setup

```typescript
const collectionName = req.params.name;

const container = new Container(collectionName);
await container.initialize();

const querySettings = container.getQuerySettings();

// Apply optional overrides
if (typeof topK === 'number') {
  querySettings.setTopK(topK);
}
if (typeof temperature === 'number') {
  querySettings.setTemperature(temperature);
}

const workflow = new QueryWorkflow(
  querySettings,
  container.getEmbeddingClient(),
  container.getEmbeddingStore(),
  container.getVectorSearch(),
  container.getPromptBuilder(),
  container.getLlmClient(),
  container.getProgressReporter(),
  container.getTemplateLoader(),
  container.getConversationHistory()
);
```

This mirrors the pattern used in `src/cli/chat.ts` (lines 72-99).

### Response Format

Success (200):
```json
{
  "answer": "RAG stands for Retrieval-Augmented Generation..."
}
```

The response intentionally keeps a minimal shape. The `chunks` field mentioned in the spec is deferred -- the current `QueryWorkflow.query()` returns only the answer string. Adding chunk metadata would require modifying the workflow's return type, which is out of scope for this task.

### Error Handling

Errors are caught in a try/catch wrapping the entire handler body:

```typescript
try {
  // ... validation, container setup, workflow execution
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  // Distinguish "no embeddings" (user error) from internal failures
  if (message.includes('No embeddings found')) {
    return res.status(400).json({
      error: 'No embeddings found for this collection. Please index documents first.'
    });
  }

  // All other errors are internal
  return res.status(500).json({ error: message });
}
```

The error middleware (task 2.3) serves as a fallback for truly unhandled exceptions, but this route handles its own errors explicitly for better user-facing messages.

### ProgressReporter Behavior

The Container creates a console-based `ProgressReporter` by default. In the server context, these messages go to the server's stdout (useful for debugging). No SSE adapter is needed here since the query endpoint is synchronous request-response, not a streaming endpoint.

## Interface Contracts

### Request

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `question` | `string` | Yes | -- | Non-empty after trim |
| `topK` | `number` | No | From QuerySettings (3) | 1-10, integer |
| `temperature` | `number` | No | From QuerySettings (0.7) | 0.0-2.0 |

### Response (200)

| Field | Type | Description |
|-------|------|-------------|
| `answer` | `string` | The LLM-generated response |

### Error Response (400 / 500)

| Field | Type | Description |
|-------|------|-------------|
| `error` | `string` | Human-readable error message |

## Testing Considerations

Unit tests for this route should:
- Mock `Container` and `QueryWorkflow` to avoid real API calls
- Verify 400 response when `question` is missing or empty
- Verify 400 response when embeddings are empty (workflow throws)
- Verify 200 response with correct `answer` on success
- Verify `topK` and `temperature` overrides are applied to querySettings
- Verify invalid `topK`/`temperature` values return 400

These tests belong in `tests/server/routes/query.test.ts` and would be created as part of task 5.4 or a dedicated testing task.
