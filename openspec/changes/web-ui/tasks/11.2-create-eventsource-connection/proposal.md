# Task 11.2: Create EventSource Connection for SSE Progress Streaming

## Summary

Implement the client-side JavaScript that connects to the server's SSE indexing endpoint and processes incoming progress events. This is the browser counterpart to the server-side `SSEProgressReporter` (task 2.4 / 4.3) -- it receives the streamed events and makes them available for the UI to render.

## Problem

The server-side indexing endpoint (`POST /api/collections/:name/index`) streams progress events via SSE using the `SSEProgressReporter`. However, the browser has no code to receive these events. Without an SSE client, clicking "Index Documents" (task 11.1) would get no feedback about indexing progress.

There is a critical API mismatch: the server endpoint uses `POST`, but the browser's native `EventSource` API only supports `GET` requests. This must be resolved either by changing the server endpoint to accept GET, or by using `fetch()` with a `ReadableStream` to consume the SSE stream from a POST request.

## Approach

Use `fetch()` with response body streaming instead of the native `EventSource` API. The `EventSource` constructor only supports GET requests and cannot send POST requests. Since the indexing endpoint is POST (which is semantically correct -- indexing is a state-changing operation), the client will use `fetch()` with `response.body.getReader()` to consume the SSE stream.

The implementation will:

1. Send a `fetch()` POST request to `/api/collections/:name/index`
2. Read the response body as a stream using `response.body.getReader()`
3. Decode incoming chunks with `TextDecoder`
4. Parse SSE `data:` lines from the text stream, handling partial chunks and buffering
5. Parse the JSON payload from each `data:` line
6. Dispatch parsed events to callback handlers (onProgress, onComplete, onError, onInfo)
7. Handle connection errors and stream termination

This approach avoids modifying the server endpoint's HTTP method while correctly handling the SSE wire format.

## Scope

### In Scope

- `fetch()`-based SSE client that connects to `POST /api/collections/:name/index`
- SSE text stream parsing: buffering partial lines, splitting on `\n\n` boundaries, extracting `data:` payloads
- JSON deserialization of event payloads
- Callback-based event dispatching for four event types: `progress`, `complete`, `error`, `info`
- Connection lifecycle management: start reading, detect completion, handle stream end
- Error handling: network failures, non-200 responses, JSON parse errors, stream read errors
- Abort capability via `AbortController` so the UI can cancel an in-progress connection

### Out of Scope

- Progress bar rendering and DOM updates (task 11.3)
- Complete/error event UI handling (task 11.4)
- EventSource cleanup on completion (task 11.5 -- though the fetch stream naturally ends)
- The "Index Documents" button click handler (task 11.1)
- Server-side SSE implementation (task 2.4 / 4.3)
- Modifying the server endpoint from POST to GET

## Dependencies

- **Upstream:** Task 4.1 (indexing route exists), Task 4.3 / 2.4 (SSEProgressReporter sends events in the expected format)
- **Downstream:** Task 11.3 (progress bar updates consume the callbacks), Task 11.4 (complete/error handling), Task 11.5 (connection cleanup)

## Risks

- **Partial chunk buffering:** SSE data may arrive in arbitrary TCP chunks that split mid-line. The parser must buffer incomplete lines and only process complete `data:` lines terminated by `\n\n`. This is the most complex part of the implementation.
- **Browser compatibility:** `fetch()` with streaming (`response.body.getReader()`) is supported in all modern browsers but not in IE11. This is acceptable for a local development tool.
- **No automatic reconnection:** Unlike `EventSource`, `fetch()` streams do not auto-reconnect on failure. This is acceptable because indexing is a one-shot operation -- if the connection drops, the user should be notified rather than silently reconnecting (the server-side workflow continues regardless).
- **AbortController cleanup:** If the user navigates away or starts a new indexing operation, the previous fetch must be aborted to avoid orphaned readers. The implementation must expose an abort mechanism.

## Success Criteria

- POST request is sent to the correct collection-specific URL
- SSE `data:` lines are correctly parsed from the streamed response, including when data arrives in partial chunks
- JSON payloads are deserialized and dispatched to the correct callback based on `type` field
- `onProgress` receives `{type, current, total, percentage, message}`
- `onComplete` receives `{type, message}`
- `onError` receives `{type, message}`
- `onInfo` receives `{type, message}`
- Network errors (fetch rejection, non-200 status) invoke the onError callback with a descriptive message
- The connection can be aborted via an AbortController signal
- No unhandled promise rejections or uncaught errors
