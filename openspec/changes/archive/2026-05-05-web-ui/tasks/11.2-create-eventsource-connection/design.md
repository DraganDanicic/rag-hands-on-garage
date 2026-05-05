# Task 11.2: EventSource Connection -- Design

## File Location

```
public/index.html
```

This code lives inside the `<script>` block of the single-page frontend. It is a standalone function (or small set of functions) that can be called by the "Index Documents" button handler (task 11.1).

## Why fetch() Instead of EventSource

The native `EventSource` API only supports GET requests. The indexing endpoint is `POST /api/collections/:name/index`, which is semantically correct -- indexing triggers a state change (generating and persisting embeddings). Changing the endpoint to GET would violate HTTP semantics and could cause issues with proxies caching or replaying the request.

The `fetch()` API with `response.body.getReader()` provides a streaming interface that works with any HTTP method. The tradeoff is that we must manually parse the SSE wire format, but the format is simple (`data: <json>\n\n`).

## SSE Stream Parser

The server sends events in this format (per task 4.3 design):

```
data: {"type":"info","message":"Starting..."}\n\n
data: {"type":"progress","current":1,"total":100,"percentage":1,"message":"Processing chunk 1/100..."}\n\n
data: {"type":"complete","message":"Indexing complete!"}\n\n
```

Key parsing rules:
- Each event is a line starting with `data: ` (note the space)
- Each event is terminated by two consecutive newlines (`\n\n`)
- The payload after `data: ` is a single-line JSON string
- There are no `event:`, `id:`, or `retry:` fields (per task 4.3 design decision)
- Data may arrive in arbitrary chunks from the network -- a single `read()` call may contain zero, one, or multiple complete events, and may split an event mid-character

## Public API

```javascript
/**
 * Connect to the indexing SSE endpoint and stream progress events.
 *
 * @param {string} collectionName - Collection to index
 * @param {object} callbacks - Event handlers
 * @param {function} callbacks.onProgress - Called with {type, current, total, percentage, message}
 * @param {function} callbacks.onComplete - Called with {type, message}
 * @param {function} callbacks.onError - Called with {type, message}
 * @param {function} [callbacks.onInfo] - Called with {type, message}
 * @returns {AbortController} - Call .abort() to cancel the connection
 */
function startIndexing(collectionName, callbacks) {
  // ...
}
```

The function returns an `AbortController` so the caller can cancel the request (e.g., if the user navigates away or clicks a cancel button).

## Implementation

```javascript
function startIndexing(collectionName, callbacks) {
  const controller = new AbortController();

  _streamIndexing(collectionName, callbacks, controller.signal);

  return controller;
}

async function _streamIndexing(collectionName, callbacks, signal) {
  let response;
  try {
    response = await fetch(`/api/collections/${encodeURIComponent(collectionName)}/index`, {
      method: 'POST',
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') return;
    callbacks.onError({ type: 'error', message: `Connection failed: ${err.message}` });
    return;
  }

  if (!response.ok) {
    // Server returned a non-SSE error (e.g., 400 or 500 JSON error)
    let errorMessage = `Server error: ${response.status}`;
    try {
      const body = await response.json();
      if (body.error) errorMessage = body.error;
    } catch {
      // Response body was not JSON -- use status text
      errorMessage = `Server error: ${response.status} ${response.statusText}`;
    }
    callbacks.onError({ type: 'error', message: errorMessage });
    return;
  }

  // Stream the response body
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process all complete events in the buffer
      const events = _parseSSEBuffer(buffer);
      buffer = events.remaining;

      for (const event of events.parsed) {
        _dispatchEvent(event, callbacks);
      }
    }

    // Process any remaining data in the buffer after stream ends
    if (buffer.trim()) {
      const events = _parseSSEBuffer(buffer + '\n\n');
      for (const event of events.parsed) {
        _dispatchEvent(event, callbacks);
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    callbacks.onError({ type: 'error', message: `Stream read error: ${err.message}` });
  }
}
```

## SSE Buffer Parser

```javascript
/**
 * Parse complete SSE events from a text buffer.
 * Returns parsed events and the remaining unparsed text.
 *
 * @param {string} buffer - Accumulated text from the stream
 * @returns {{ parsed: object[], remaining: string }}
 */
function _parseSSEBuffer(buffer) {
  const parsed = [];
  let remaining = buffer;

  // Split on double-newline (SSE event boundary)
  let boundaryIndex;
  while ((boundaryIndex = remaining.indexOf('\n\n')) !== -1) {
    const rawEvent = remaining.substring(0, boundaryIndex);
    remaining = remaining.substring(boundaryIndex + 2);

    // Extract data from "data: ..." lines
    const lines = rawEvent.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.substring(6); // Remove "data: " prefix
        try {
          const data = JSON.parse(jsonStr);
          parsed.push(data);
        } catch {
          // Malformed JSON -- skip this event
          console.warn('Failed to parse SSE event data:', jsonStr);
        }
      }
      // Ignore lines that don't start with "data: " (e.g., comments, empty lines)
    }
  }

  return { parsed, remaining };
}
```

## Event Dispatcher

```javascript
/**
 * Route a parsed SSE event to the appropriate callback.
 *
 * @param {object} event - Parsed event object with a `type` field
 * @param {object} callbacks - Callback handlers
 */
function _dispatchEvent(event, callbacks) {
  switch (event.type) {
    case 'progress':
      if (callbacks.onProgress) callbacks.onProgress(event);
      break;
    case 'complete':
      if (callbacks.onComplete) callbacks.onComplete(event);
      break;
    case 'error':
      if (callbacks.onError) callbacks.onError(event);
      break;
    case 'info':
    case 'start':
      if (callbacks.onInfo) callbacks.onInfo(event);
      break;
    default:
      console.warn('Unknown SSE event type:', event.type);
  }
}
```

## Design Decisions

### Decision 1: fetch() with ReadableStream instead of EventSource

The `EventSource` constructor only supports GET requests. The indexing endpoint is POST. Rather than changing the server endpoint (which would violate HTTP semantics for a state-changing operation), the client uses `fetch()` with `response.body.getReader()`.

**Tradeoff:** We lose `EventSource`'s automatic reconnection. This is acceptable because indexing is a one-shot operation -- reconnecting mid-way would not resume the workflow, and the server-side workflow continues regardless of client connection state.

### Decision 2: Return AbortController from startIndexing()

The caller receives an `AbortController` to cancel the fetch. This is used when:
- The user clicks a "Cancel" button (future enhancement)
- The user starts a new indexing operation before the previous one finishes
- The page is about to unload

The `AbortError` is caught and silently ignored in both the fetch and stream-reading catch blocks.

### Decision 3: Buffer-based SSE parsing with `\n\n` splitting

Network data arrives in arbitrary chunks. A single `reader.read()` call might return:
- Multiple complete events
- Half an event (split mid-JSON)
- An event boundary split across two reads

The parser accumulates text in a `buffer` string. On each read, it scans for `\n\n` boundaries and processes all complete events, leaving any incomplete trailing text in the buffer for the next read.

### Decision 4: Graceful handling of non-200 responses

If the server returns a non-200 status (e.g., 400 for invalid collection name, 500 for initialization failure), the response body is JSON (not SSE). The client detects this via `response.ok`, attempts to parse the JSON error body, and calls `onError` with the server's error message.

### Decision 5: `encodeURIComponent` for collection name

The collection name is URL-encoded in the fetch URL to handle any special characters safely. While collection names are validated server-side to be alphanumeric with hyphens/underscores, defensive encoding prevents URL injection.

### Decision 6: Separate async function for streaming

The `startIndexing()` function is synchronous and returns the `AbortController` immediately. The actual streaming happens in the `_streamIndexing()` async function which runs in the background. This ensures the caller gets the abort handle before the fetch even starts, avoiding a race condition where the caller cannot abort a request that has already been sent.

The `_streamIndexing` promise is intentionally not returned or awaited by `startIndexing`. Errors are routed through the `onError` callback, not through promise rejection. This prevents unhandled rejection warnings if the caller does not `.catch()` the returned value.

### Decision 7: Handle trailing buffer after stream ends

When the server calls `res.end()`, the reader's `done` flag becomes true. If there is remaining data in the buffer (e.g., the final event was received without a trailing `\n\n` from the server), the parser appends `\n\n` and processes it. This guards against edge cases where the server closes the connection immediately after writing the last event.

## Connection Lifecycle

```
1. User clicks "Index Documents" (task 11.1)
   -> startIndexing('project-a', { onProgress, onComplete, onError, onInfo })
   -> Returns AbortController

2. fetch() sends POST /api/collections/project-a/index
   -> Server responds with 200, Content-Type: text/event-stream

3. reader.read() loop begins
   -> Chunk: 'data: {"type":"info","message":"Starting..."}\n\n'
   -> _parseSSEBuffer extracts event
   -> _dispatchEvent calls callbacks.onInfo(event)

4. More chunks arrive
   -> Chunk: 'data: {"type":"progress","current":1,"to'
   -> No \n\n found, stays in buffer
   -> Next chunk: 'tal":50,"percentage":2,"message":"Processing 1/50..."}\n\n'
   -> Buffer now has complete event, parsed and dispatched

5a. Stream ends normally (server sent complete event and called res.end())
   -> reader.read() returns { done: true }
   -> Loop exits
   -> Any trailing buffer is processed

5b. OR network error occurs
   -> reader.read() throws
   -> callbacks.onError called with error message

5c. OR user aborts
   -> controller.abort() called
   -> reader.read() throws AbortError
   -> Silently ignored
```

## Integration Point

Task 11.1 (the "Index Documents" button handler) will call `startIndexing()` and pass callbacks that update the progress bar (task 11.3) and handle completion/errors (task 11.4):

```javascript
// In the button click handler (task 11.1):
const controller = startIndexing(selectedCollection, {
  onProgress: (event) => {
    // Task 11.3: Update progress bar
    updateProgressBar(event.current, event.total, event.percentage, event.message);
  },
  onComplete: (event) => {
    // Task 11.4: Show success, hide progress bar
    showSuccess(event.message);
  },
  onError: (event) => {
    // Task 11.4: Show error, hide progress bar
    showError(event.message);
  },
  onInfo: (event) => {
    // Optional: Show info messages in a log area
    showInfoMessage(event.message);
  },
});

// Store controller so cancel button or page unload can call controller.abort()
```

## Edge Cases

1. **Chunk splits mid-JSON:** The buffer accumulates text until `\n\n` is found. JSON parsing only happens on text between `data: ` and `\n\n`, so partial JSON is never parsed.

2. **Multiple events in one chunk:** The `while` loop in `_parseSSEBuffer` processes all `\n\n`-delimited events in a single buffer scan.

3. **Empty lines between events:** The SSE spec allows empty lines (they are event separators). The parser splits on `\n\n` which handles this correctly. Lines that do not start with `data: ` are ignored.

4. **Server returns non-SSE response:** If the endpoint returns JSON (e.g., 400 error), `response.ok` is false. The client reads the body as JSON and extracts the error message.

5. **AbortController.abort() called before fetch resolves:** The fetch promise rejects with `AbortError`, caught in the try/catch and silently ignored.

6. **AbortController.abort() called during stream reading:** The `reader.read()` promise rejects with `AbortError`, caught in the stream-reading try/catch and silently ignored.

7. **Server closes connection without sending `\n\n` after last event:** The trailing buffer handler appends `\n\n` and processes any remaining data.

8. **Malformed JSON in data line:** `JSON.parse` failure is caught, a warning is logged, and the event is skipped. Other events continue to be processed.
