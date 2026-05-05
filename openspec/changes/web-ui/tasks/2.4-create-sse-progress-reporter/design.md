## Approach
Implement a straightforward adapter class that wraps an Express `Response` object. The constructor sets SSE headers and flushes them immediately. Each `IProgressReporter` method serializes a typed JSON payload and writes it as an SSE `data:` line followed by a double newline. Terminal methods (`success`, `error`) call `res.end()` after writing.

A `closed` flag tracks whether the response has been ended, preventing writes after `success()` or `error()` have been called (or after the client disconnects). The class listens for the response `close` event to detect client-initiated disconnections.

## Decisions

### Decision 1: Constructor sets SSE headers
The constructor (not a separate `init()` method) sets `Content-Type`, `Cache-Control`, and `Connection` headers and calls `res.flushHeaders()`. This ensures the SSE connection is established the moment the adapter is created, before any workflow code runs.

**Rationale:** The adapter is always created in the context of an SSE route handler, so headers must be sent immediately. No lazy initialization needed.

### Decision 2: Guard with a `closed` flag
A private `closed` boolean prevents `res.write()` or `res.end()` calls after the stream has ended. This avoids "write after end" errors if the workflow continues calling progress methods after completion or if the client disconnects mid-stream.

**Rationale:** The workflow does not know about SSE lifecycle. It may call `info()` or `progress()` after `success()` during cleanup. The adapter must silently absorb these calls.

### Decision 3: Listen for `res.on('close')` to detect client disconnect
When the browser closes the EventSource (e.g., user navigates away), Express emits a `close` event on the response. The adapter sets `closed = true` on this event so subsequent writes are no-ops.

**Rationale:** Without this, `res.write()` would throw on a destroyed socket. The workflow keeps running regardless (it is processing embeddings), but the adapter stops trying to send events.

### Decision 4: success() extracts embedding count from message
The `success()` method attempts to parse an embedding count from the message string (e.g., "Generated 250 embeddings") and includes it as an `embeddings` field in the completion event payload. If parsing fails, the field is omitted.

**Rationale:** The spec requires `{type: "complete", embeddings: 250, message}` but the `IProgressReporter.success()` signature only accepts a string. Parsing the number from the message avoids changing the interface.

### Decision 5: No export from progress-reporter service index
The SSEProgressReporter lives in `src/server/utils/`, not in `src/services/progress-reporter/`. It imports the interface but is not part of the service module. This keeps server-specific code out of the core service layer.

**Rationale:** The adapter depends on Express `Response` type, which is a server concern. Core services should remain framework-agnostic.

## Files
- `src/server/utils/SSEProgressReporter.ts` (new) -- SSEProgressReporter class implementing IProgressReporter, factory function `createSSEProgressReporter(res: Response): IProgressReporter`
- `tests/server/utils/SSEProgressReporter.test.ts` (new) -- Unit tests using a mock Response object to verify SSE event output for all 5 methods, closed-state guards, and client disconnect handling

## Edge Cases

1. **Write after end**: Workflow calls `progress()` or `info()` after `success()` or `error()` has already closed the stream. The `closed` flag ensures these are silently ignored.

2. **Client disconnects mid-stream**: Browser closes EventSource while indexing is still running. The `close` event handler sets `closed = true`, preventing socket write errors. The workflow continues to completion (embeddings are still saved).

3. **success() called with no numeric content**: Message like "Indexing complete!" with no parseable number. The `embeddings` field is omitted from the event payload rather than sending `NaN` or `0`.

4. **Double end()**: Both `success()` and `error()` call `res.end()`. If both are called (e.g., error during cleanup after success), the `closed` flag prevents the second `res.end()` call.

5. **Empty or undefined message in progress()**: The `message` parameter is optional on `IProgressReporter.progress()`. The adapter falls back to a generated string like `"Processing {current}/{total}..."` when message is undefined.
