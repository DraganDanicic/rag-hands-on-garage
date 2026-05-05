# Task 4.2: Design -- Integrate SSEProgressReporter with IndexingWorkflow

## Integration Pattern

The key insight is that **no DI Container changes are needed**. The CLI already demonstrates the pattern of pulling individual services from the Container and passing them to the workflow constructor. The indexing route does the same thing, substituting `SSEProgressReporter` for the default `ConsoleProgressReporter`.

```
CLI (generate-embeddings.ts):
  Container -> getProgressReporter() -> ConsoleProgressReporter -> IndexingWorkflow

Web (indexing route):
  Container -> (ignore getProgressReporter()) -> SSEProgressReporter(res) -> IndexingWorkflow
```

## Route Handler Structure

File: `src/server/routes/indexing.ts` (created in task 4.1, modified here)

```typescript
import { Router, Request, Response } from 'express';
import { Container } from '../../di/Container.js';
import { IndexingWorkflow } from '../../workflows/IndexingWorkflow.js';
import { SSEProgressReporter } from '../utils/SSEProgressReporter.js';

const router = Router();

router.post('/api/collections/:name/index', async (req: Request, res: Response) => {
  const collectionName = req.params.name;

  // 1. Create and initialize the container for this collection
  let container: Container;
  try {
    container = new Container(collectionName);
    await container.initialize();
  } catch (error) {
    // Container init failed -- return standard HTTP error, not SSE
    res.status(500).json({
      error: 'Failed to initialize services',
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  // 2. Set up SSE headers and create the SSE progress reporter
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Disable request timeout for long-running indexing
  req.setTimeout(0);

  const progressReporter = new SSEProgressReporter(res);

  // 3. Track client disconnect
  let clientDisconnected = false;
  req.on('close', () => {
    clientDisconnected = true;
  });

  // 4. Build the IndexingWorkflow with SSE reporter injected
  const workflow = new IndexingWorkflow(
    container.getConfigService(),
    container.getDocumentReader(),
    container.getTextChunker(),
    container.getEmbeddingClient(),
    container.getEmbeddingStore(),
    progressReporter  // SSE reporter instead of console reporter
  );

  // 5. Execute and handle completion/error
  try {
    const embeddingCount = await workflow.execute();

    if (!clientDisconnected) {
      // Send final completion event
      progressReporter.success(
        `Indexing complete! ${embeddingCount} embeddings generated.`
      );
    }
  } catch (error) {
    if (!clientDisconnected) {
      progressReporter.error(
        `Indexing failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
});

export default router;
```

## Why Not Modify the Container?

Three reasons:

1. **The Container creates a `ConsoleProgressReporter` with no arguments.** The `SSEProgressReporter` requires an Express `Response` object, which the Container has no knowledge of. Adding HTTP concerns to the DI container would violate its purpose.

2. **The CLI must keep working unchanged.** Adding an optional `progressReporter` parameter to the Container constructor would work but adds complexity for a single use case. The simpler pattern -- pull services individually, swap one -- is already established by the CLI entry point.

3. **The workflow already accepts the reporter via constructor injection.** This is the designed extension point. Using it directly is the intended approach.

## Client Disconnect Handling

When the browser navigates away or closes the tab during indexing:

- `req.on('close')` fires and sets `clientDisconnected = true`
- The `IndexingWorkflow` continues running (embeddings are still generated and saved)
- The route handler skips the final SSE write if the client is gone
- The `SSEProgressReporter` should also check for closed connections before writing (this is part of task 2.4's implementation -- `res.writableEnded` or similar check)

This is acceptable behavior: indexing should complete even if the user disconnects, so data is not lost. The user can check the collection's embedding count later.

## SSE Response Lifecycle

```
Browser POSTs /api/collections/:name/index
  |
  v
Route handler: Container init
  |-- fails --> 500 JSON response (no SSE)
  |-- succeeds
  v
Set SSE headers, flushHeaders()
  |
  v
Create SSEProgressReporter(res)
Create IndexingWorkflow(... progressReporter)
  |
  v
workflow.execute()
  |
  |-- progressReporter.start("Starting...")    --> data: {"type":"start","message":"..."}
  |-- progressReporter.info("Found 3 docs")   --> data: {"type":"info","message":"..."}
  |-- progressReporter.progress(1, 100, "...") --> data: {"type":"progress","current":1,"total":100,...}
  |-- progressReporter.progress(2, 100, "...") --> data: {"type":"progress","current":2,"total":100,...}
  |-- ... (many progress events)
  |-- progressReporter.info("Checkpoint...")    --> data: {"type":"info","message":"..."}
  |-- ... (more progress events)
  |
  v
workflow.execute() resolves with embeddingCount
  |
  v
progressReporter.success("Indexing complete! N embeddings")
  --> data: {"type":"complete","message":"..."}
  --> res.end()
```

## Event Types Flowing Through

Based on the `IndexingWorkflow.execute()` method, these `IProgressReporter` calls will be converted to SSE events:

| Workflow call | SSE event type | When |
|---|---|---|
| `start("Starting document indexing...")` | `start` | Beginning of workflow |
| `info("Reading documents from: ...")` | `info` | Before document reading |
| `success("Found N document(s)")` | `success` | After document reading |
| `info("Chunking documents...")` | `info` | Before chunking |
| `success("Created N text chunks")` | `success` | After chunking |
| `info("Chunks saved to ...")` | `info` | After chunk file save |
| `info("Resume: Found N existing...")` | `info` | Resume detection |
| `info("Generating embeddings...")` | `info` | Before embedding loop |
| `progress(i, total, "Processing chunk...")` | `progress` | Each chunk processed |
| `info("Checkpoint: Saving N...")` | `info` | Every 50 chunks |
| `info("Saving final batch...")` | `info` | Final save |
| `success("Indexing complete! Total...")` | `complete` | Workflow done |
| `error("Indexing workflow failed...")` | `error` | On failure |

Note: The workflow itself calls `progressReporter.success()` at the end, which in `SSEProgressReporter` will send the complete event and call `res.end()`. The route handler's own `progressReporter.success()` call after `workflow.execute()` would be redundant. The implementation should check whether the stream is already ended before writing, or the route handler should rely on the workflow's own success/error calls rather than adding its own.

**Recommended approach:** Let the workflow's internal `progressReporter.success()` / `progressReporter.error()` handle the final event and stream close. The route handler's try/catch is a safety net for unexpected errors not caught by the workflow.

## Files Modified

| File | Change |
|---|---|
| `src/server/routes/indexing.ts` | Add SSEProgressReporter instantiation, IndexingWorkflow construction with injected reporter, execute call, disconnect handling |

## Files Not Modified

| File | Reason |
|---|---|
| `src/di/Container.ts` | No changes needed -- services pulled individually |
| `src/di/IContainer.ts` | No interface changes |
| `src/workflows/IndexingWorkflow.ts` | Already accepts IProgressReporter via constructor |
| `src/server/utils/SSEProgressReporter.ts` | Already implemented in task 2.4 |
