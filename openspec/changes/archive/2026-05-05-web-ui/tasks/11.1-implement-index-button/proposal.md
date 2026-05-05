## Context
Part of change: web-ui
Parent task: "11.1 Implement 'Index Documents' button that triggers POST to /api/collections/:name/index"

## What
Add an "Index Documents" button to the frontend UI that initiates document indexing for the currently active collection. When clicked, the button opens an SSE connection to `POST /api/collections/:name/index` and transitions to a disabled/loading state until the indexing operation completes or fails.

The key technical challenge is that the endpoint uses POST semantics (it triggers a mutation -- indexing) but responds with an SSE stream (`Content-Type: text/event-stream`). The native `EventSource` API only supports GET requests. This task must bridge that gap using `fetch()` with manual SSE parsing, or by issuing the POST and then connecting an EventSource to a status endpoint. The chosen approach (see design) is `fetch()` with `ReadableStream` parsing, since the server already returns SSE from the POST endpoint directly.

## Why
Without this button, users would need to use the CLI (`npm run generate-embeddings`) to index uploaded documents. The button is the bridge between the file upload step (task 10) and the progress streaming display (tasks 11.2-11.5). It ties the indexing workflow to the browser experience, making the system usable without a terminal.

## Scope
- In scope:
  - "Index Documents" button element in `public/index.html`
  - Click handler that reads the active collection name and initiates a POST request to `/api/collections/:name/index`
  - Button state management: enabled (idle), disabled with spinner text (indexing in progress)
  - Using `fetch()` with streaming response body to read SSE events from the POST endpoint
  - Dispatching parsed SSE events to the progress UI (tasks 11.2-11.4 will consume these)
  - Re-enabling the button on completion or error
  - Preventing double-clicks / multiple concurrent indexing requests
  - Disabling the upload zone while indexing is in progress (prevent conflicting file changes)

- Out of scope:
  - Progress bar rendering (task 11.3)
  - SSE event parsing and EventSource lifecycle management (task 11.2)
  - Handling complete/error events with UI feedback (task 11.4)
  - Closing the stream connection (task 11.5)
  - Refreshing the collections list after indexing (task 11.6)
  - Server-side indexing route implementation (task 4.1, already designed)
  - SSEProgressReporter adapter (task 2.4, already designed)
