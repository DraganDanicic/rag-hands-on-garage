# Task 4.3: SSE Event Streaming -- Design

## File Location

```
src/server/utils/SSEProgressReporter.ts
```

## SSE Wire Format

Every event follows the SSE specification:

```
data: {"type":"progress","current":10,"total":100,"percentage":10,"message":"Processing chunk 10/100..."}\n\n
```

Key rules:
- Each event line starts with `data: ` (note the space after the colon)
- The payload is a single-line JSON string (no embedded newlines)
- Each event ends with two newline characters (`\n\n`) to signal event boundary
- No `event:` or `id:` fields are used -- the `type` field inside the JSON payload distinguishes event types

## Event Type Definitions

### Progress Event

Sent by `progress(current, total, message?)`.

```typescript
interface SSEProgressEvent {
  type: 'progress';
  current: number;       // e.g., 10
  total: number;         // e.g., 100
  percentage: number;    // Math.round((current / total) * 100)
  message: string;       // e.g., "Processing chunk 10/100..."
}
```

### Complete Event

Sent by `success(message)`. This is a terminal event -- `res.end()` is called after writing.

```typescript
interface SSECompleteEvent {
  type: 'complete';
  message: string;       // e.g., "Indexing complete! Total embeddings: 250 (0 existing, 250 new, 0 skipped)"
}
```

Note: The L1 spec shows an `embeddings` field. The `success()` method only receives a string message. Rather than parsing the number out of the message string (fragile), the `complete` event carries just the `message`. The indexing route (task 4.2) can enrich the event with `embeddings` count if needed, since it has access to the workflow return value.

### Error Event

Sent by `error(message)`. This is a terminal event -- `res.end()` is called after writing.

```typescript
interface SSEErrorEvent {
  type: 'error';
  message: string;       // e.g., "Failed to process chunk: API timeout"
}
```

### Info Event

Sent by `info(message)` and `start(message)`. Non-terminal, informational.

```typescript
interface SSEInfoEvent {
  type: 'info';
  message: string;       // e.g., "Reading documents from: ./documents"
}
```

## Class Implementation

```typescript
import { Response } from 'express';
import { IProgressReporter } from '../../services/progress-reporter/IProgressReporter.js';

export class SSEProgressReporter implements IProgressReporter {
  private closed = false;

  constructor(private readonly res: Response) {
    // Set SSE headers before any data is written
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Track client disconnect
    res.on('close', () => {
      this.closed = true;
    });
  }

  start(message: string): void {
    this.sendEvent({ type: 'info', message });
  }

  progress(current: number, total: number, message?: string): void {
    const percentage = Math.round((current / total) * 100);
    this.sendEvent({
      type: 'progress',
      current,
      total,
      percentage,
      message: message ?? `Processing ${current}/${total}...`,
    });
  }

  success(message: string): void {
    this.sendEvent({ type: 'complete', message });
    this.close();
  }

  error(message: string): void {
    this.sendEvent({ type: 'error', message });
    this.close();
  }

  info(message: string): void {
    this.sendEvent({ type: 'info', message });
  }

  // --- internal helpers ---

  private sendEvent(data: Record<string, unknown>): void {
    if (this.closed) return;
    this.res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  private close(): void {
    if (this.closed) return;
    this.closed = true;
    this.res.end();
  }
}
```

## Design Decisions

### 1. Headers set in constructor

The constructor calls `res.setHeader()` and `res.flushHeaders()`. This means SSE streaming begins the moment the reporter is created. The indexing route must create the reporter before starting the workflow and must not attempt to set status codes or headers afterward.

`flushHeaders()` is called explicitly so the browser receives the headers immediately and can start processing the event stream, rather than waiting for the first `res.write()`.

### 2. Closed-state guard

Both `sendEvent` and `close` check the `this.closed` flag. This handles two scenarios:
- **Client disconnects mid-stream:** The `res.on('close')` listener sets `closed = true`. Subsequent `progress()` calls from the still-running workflow are silently dropped.
- **Double-close prevention:** If `error()` is called after `success()` (or vice versa), the second terminal call is a no-op.

### 3. No SSE `event:` field

The spec uses a `type` field inside the JSON payload rather than the SSE `event:` field. This simplifies client-side handling -- the browser uses a single `onmessage` handler and switches on `parsed.type`, rather than registering separate `addEventListener('progress', ...)` handlers.

### 4. `start()` and `info()` map to the same event type

Both `start()` and `info()` produce `{ type: 'info', ... }` events. The `start` method is semantically "begin a phase" in the CLI, but for SSE streaming it is just another informational message. The client can display these in a log area or ignore them.

### 5. `success()` does not include `embeddings` count

The `IProgressReporter.success(message)` signature only provides a string. Extracting a number from the message via regex would be fragile. Instead, the indexing route handler (task 4.2) can send a custom enriched event after the workflow returns, using the workflow's return value. Alternatively, the route can wrap this reporter to intercept `success()` and add the count. This keeps `SSEProgressReporter` generic and reusable.

## Connection Lifecycle

```
1. Route handler creates SSEProgressReporter(res)
   -> Headers sent: Content-Type: text/event-stream
   -> Connection: keep-alive

2. Workflow calls reporter.start("Starting...")
   -> data: {"type":"info","message":"Starting..."}\n\n

3. Workflow calls reporter.info("Reading documents...")
   -> data: {"type":"info","message":"Reading documents..."}\n\n

4. Workflow calls reporter.progress(1, 100, "Processing chunk 1/100...")
   -> data: {"type":"progress","current":1,"total":100,"percentage":1,"message":"Processing chunk 1/100..."}\n\n
   ... repeats for each chunk ...

5a. Workflow calls reporter.success("Indexing complete! ...")
   -> data: {"type":"complete","message":"Indexing complete! ..."}\n\n
   -> res.end()  // connection closed

5b. OR workflow calls reporter.error("Failed to process chunk: ...")
   -> data: {"type":"error","message":"Failed to process chunk: ..."}\n\n
   -> res.end()  // connection closed
```

## Testing Strategy

Unit tests in `tests/server/utils/SSEProgressReporter.test.ts` using a mock Express `Response` object.

### Mock Response

```typescript
function createMockResponse() {
  const written: string[] = [];
  const headers: Record<string, string> = {};
  let ended = false;
  const closeHandlers: Array<() => void> = [];

  return {
    setHeader(key: string, value: string) { headers[key] = value; },
    flushHeaders() {},
    write(data: string) { written.push(data); return true; },
    end() { ended = true; },
    on(event: string, handler: () => void) {
      if (event === 'close') closeHandlers.push(handler);
    },
    // Test helpers
    _written: written,
    _headers: headers,
    _ended: () => ended,
    _simulateClose() { closeHandlers.forEach(h => h()); },
  };
}
```

### Test Cases

1. **Constructor sets correct headers** -- verify `Content-Type`, `Cache-Control`, `Connection`
2. **progress() writes valid SSE format** -- verify `data: ` prefix, JSON content, `\n\n` suffix
3. **progress() includes all required fields** -- `type`, `current`, `total`, `percentage`, `message`
4. **progress() calculates percentage correctly** -- e.g., 33/100 = 33, 1/3 = 33, 0/10 = 0
5. **progress() uses default message when none provided** -- "Processing X/Y..."
6. **success() writes complete event and closes connection** -- verify `res.end()` called
7. **error() writes error event and closes connection** -- verify `res.end()` called
8. **start() writes info event** -- verify `type: 'info'`
9. **info() writes info event** -- verify `type: 'info'`
10. **No write after client disconnect** -- simulate `close` event, verify subsequent calls are no-ops
11. **No double close** -- call `success()` then `error()`, verify `res.end()` called once
12. **JSON is single-line** -- verify no newlines inside the `data:` line
