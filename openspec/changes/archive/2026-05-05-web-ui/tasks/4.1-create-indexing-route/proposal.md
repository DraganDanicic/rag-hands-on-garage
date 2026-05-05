# Task 4.1: Create Indexing Route

## Summary

Create the Express route handler at `src/server/routes/indexing.ts` that handles `POST /api/collections/:name/index`. This route triggers the `IndexingWorkflow` and streams real-time progress back to the browser via Server-Sent Events (SSE).

## Problem

The web UI needs a way to trigger document indexing for a collection and receive live progress updates. The existing CLI entry point (`src/cli/generate-embeddings.ts`) instantiates a `Container`, wires up `IndexingWorkflow`, and uses `ConsoleProgressReporter` for terminal output. The web route must follow the same pattern but replace the console reporter with an SSE-based reporter that writes events to the HTTP response stream.

## Approach

### 1. Route Registration

Export an Express `Router` from `src/server/routes/indexing.ts`. The router registers a single handler:

```
POST /api/collections/:name/index
```

The parent `server.ts` mounts this router (e.g., `app.use('/api', indexingRouter)`).

### 2. SSE Response Setup

Before executing the workflow, the handler configures the response for SSE streaming:

- Set `Content-Type: text/event-stream`
- Set `Cache-Control: no-cache`
- Set `Connection: keep-alive`
- Call `res.flushHeaders()` to send headers immediately
- Disable response buffering (Express compression, if any)

### 3. Container Instantiation

Create a new `Container` instance using the `:name` route parameter as the collection name, then call `container.initialize()`. This gives access to all services wired for that specific collection.

**Key difference from CLI:** Instead of using `container.getProgressReporter()` (which returns `ConsoleProgressReporter`), the route creates an `SSEProgressReporter` instance wrapping the `res` object. This reporter is injected into `IndexingWorkflow` in place of the console one.

### 4. Workflow Execution

Instantiate `IndexingWorkflow` with services from the container, substituting the SSE reporter for the progress reporter. Call `workflow.execute()` and await completion.

### 5. Connection Lifecycle Management

- **Client disconnect:** Listen for `req.on('close', ...)` to detect when the browser closes the EventSource connection (e.g., user navigates away). When detected, the handler should clean up gracefully -- the workflow will continue to completion but events will silently fail to write.
- **Completion:** After `workflow.execute()` resolves, send a final `complete` event and call `res.end()`.
- **Error:** If the workflow throws, send an `error` event and call `res.end()`.

## Dependencies

- **Task 2.4** (SSEProgressReporter): The SSE adapter must exist before this route can use it. If not yet implemented, this route can define a minimal inline version or import from `src/server/utils/SSEProgressReporter.ts`.
- **Task 2.1** (Express server setup): The server must exist to mount this router.

## Scope Boundaries

**In scope:**
- Route handler structure and registration
- SSE response header setup
- Container creation with collection name from URL param
- Workflow instantiation with SSE reporter substitution
- Connection close handling
- Basic error handling (workflow failure -> SSE error event)

**Out of scope (handled by other tasks):**
- SSEProgressReporter implementation details (task 2.4)
- SSE event format specifics (task 4.3)
- Detailed error event handling (task 4.4)
- SSE lifecycle testing (task 4.5)
- Frontend EventSource consumption (tasks 11.x)

## Validation Criteria

- POST to `/api/collections/:name/index` returns SSE headers immediately
- IndexingWorkflow executes using the collection name from the URL
- Progress events stream to the client during workflow execution
- A final complete or error event is sent when the workflow finishes
- The response ends after the final event
- Client disconnect does not crash the server
