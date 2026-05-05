# Task 4.1: Design -- Indexing Route

## File

`src/server/routes/indexing.ts`

## Module Structure

```typescript
import { Router, Request, Response } from 'express';
import { Container } from '../../di/Container.js';
import { IndexingWorkflow } from '../../workflows/IndexingWorkflow.js';
import { SSEProgressReporter } from '../utils/SSEProgressReporter.js';

const router = Router();

router.post('/collections/:name/index', async (req: Request, res: Response) => {
  // ... handler body
});

export default router;
```

## Handler Flow

### Step 1: Extract Collection Name and Validate

```typescript
const collectionName = req.params.name;
if (!collectionName || !/^[a-zA-Z0-9_-]+$/.test(collectionName)) {
  res.status(400).json({ error: 'Invalid collection name' });
  return;
}
```

Collection names must be alphanumeric with hyphens/underscores only (matches existing file naming in `data/collections/{name}.embeddings.json`).

### Step 2: Set SSE Headers

```typescript
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
res.setHeader('X-Accel-Buffering', 'no');  // Disable nginx buffering if proxied
res.flushHeaders();
```

`flushHeaders()` ensures the client receives headers immediately and can start processing events. `X-Accel-Buffering: no` prevents reverse proxies from buffering the stream.

### Step 3: Track Connection State

```typescript
let clientConnected = true;

req.on('close', () => {
  clientConnected = false;
});
```

This flag is not used to abort the workflow (which would leave embeddings in an inconsistent state) but can be checked before writing events to avoid unnecessary error logging from writes to a closed stream.

### Step 4: Create Container and Initialize

```typescript
const container = new Container(collectionName);
await container.initialize();
```

This follows the exact same pattern as `src/cli/generate-embeddings.ts` line 35-36. The container wires all services for the given collection, including collection-specific paths for embeddings and chunks storage.

### Step 5: Create SSEProgressReporter

```typescript
const sseReporter = new SSEProgressReporter(res);
```

The `SSEProgressReporter` implements `IProgressReporter` and translates each method call into an SSE `data:` line written to the response. It wraps the Express `Response` object.

### Step 6: Instantiate and Execute Workflow

```typescript
const workflow = new IndexingWorkflow(
  container.getConfigService(),
  container.getDocumentReader(),
  container.getTextChunker(),
  container.getEmbeddingClient(),
  container.getEmbeddingStore(),
  sseReporter  // <-- SSE reporter instead of container.getProgressReporter()
);

try {
  const embeddingCount = await workflow.execute();

  // Send final complete event (if SSEProgressReporter.success() hasn't already ended the response)
  if (clientConnected && !res.writableEnded) {
    res.end();
  }
} catch (error) {
  if (!res.writableEnded) {
    const message = error instanceof Error ? error.message : String(error);
    sseReporter.error(`Indexing failed: ${message}`);
  }
}
```

**Important note on double-ending:** The `IndexingWorkflow.execute()` calls `progressReporter.success(...)` on completion and `progressReporter.error(...)` on failure. The `SSEProgressReporter` may call `res.end()` inside those methods (per the L1 design). The route handler checks `res.writableEnded` before attempting to end the response again to avoid errors.

### Step 7: Error Handling for Container/Init Failures

Errors that occur before the SSE stream is established (e.g., invalid API key in config, initialization failure) need special handling since SSE headers may already be sent:

```typescript
try {
  const container = new Container(collectionName);
  await container.initialize();
  // ... workflow execution
} catch (error) {
  if (!res.headersSent) {
    // Headers not sent yet -- return standard JSON error
    res.status(500).json({ error: 'Failed to initialize indexing' });
  } else if (!res.writableEnded) {
    // SSE headers already sent -- send error as SSE event
    const message = error instanceof Error ? error.message : String(error);
    const event = { type: 'error', message };
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    res.end();
  }
}
```

## Key Design Decisions

### Why Not Modify Container to Accept Custom ProgressReporter

The `Container` constructor hardcodes `createProgressReporter()` which returns `ConsoleProgressReporter`. Rather than modifying the Container (which would change the shared DI infrastructure), the route simply pulls all other services from the container and passes the SSE reporter directly to the `IndexingWorkflow` constructor. This is the same pattern the CLI uses -- the workflow receives its dependencies explicitly, not from the container.

### Why Not Abort Workflow on Client Disconnect

When the browser disconnects mid-indexing, the workflow should continue to completion. Aborting mid-way would leave partial data. The workflow already has incremental save capability (every 50 chunks), so even if the server crashes, data is preserved. The SSEProgressReporter should silently swallow write errors when the client has disconnected.

### Why async Handler Without next()

This route is terminal -- it always sends a response (either JSON error or SSE stream). It does not call `next()` to pass to error middleware, because SSE responses cannot be converted to JSON error responses after headers are sent. All error handling is inline.

## Integration Point

In `src/server/server.ts`, the router is mounted:

```typescript
import indexingRouter from './routes/indexing.js';

app.use('/api', indexingRouter);
```

This makes the full path `POST /api/collections/:name/index`.

## Request/Response Examples

### Successful Indexing

**Request:**
```
POST /api/collections/project-a/index HTTP/1.1
```

**Response headers:**
```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Response body (streamed):**
```
data: {"type":"start","message":"Starting document indexing workflow..."}

data: {"type":"info","message":"Reading documents from: ./documents"}

data: {"type":"progress","current":1,"total":50,"percentage":2,"message":"Processing chunk 1/50..."}

data: {"type":"progress","current":25,"total":50,"percentage":50,"message":"Processing chunk 25/50..."}

data: {"type":"complete","message":"Indexing complete! Total embeddings: 50 (0 existing, 50 new, 0 skipped)"}
```

### Initialization Error (Before SSE Headers)

**Response:**
```
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{"error": "Failed to initialize indexing"}
```

### Workflow Error (After SSE Headers Sent)

**Response body (streamed):**
```
data: {"type":"start","message":"Starting document indexing workflow..."}

data: {"type":"error","message":"Indexing failed: No documents found in the documents directory"}
```
