# Task 11.1: Design -- Index Documents Button

## Approach

Add an "Index Documents" button to the sidebar (below the upload zone) in `public/index.html`. The click handler reads the active collection from application state, issues a `fetch()` POST to `/api/collections/${activeCollection}/index`, and processes the streaming SSE response using the Fetch API's `ReadableStream` reader. The button is disabled for the duration of the indexing operation and re-enabled when the stream ends (via complete event, error event, or network failure).

## Key Technical Decision: fetch() with ReadableStream, Not EventSource

The `EventSource` API only supports GET requests. The indexing endpoint is `POST /api/collections/:name/index` because it triggers a mutation. Three options exist:

1. **EventSource with GET**: Change the server endpoint to GET. Rejected -- GET should not trigger side effects (indexing mutates state).
2. **POST then EventSource to a status endpoint**: Add a second endpoint for polling/streaming status. Rejected -- adds server complexity and a second round-trip.
3. **fetch() with ReadableStream parsing**: Issue a POST via `fetch()`, read the response body as a stream, and parse SSE `data:` lines manually. Chosen -- works with the existing POST endpoint, no server changes, straightforward parsing since the SSE format is simple (`data: {json}\n\n`).

The manual parsing is minimal because the server sends only `data:` lines with no event names or IDs. Each chunk from the stream is split on `\n\n`, and each `data: ` prefix is stripped before JSON parsing.

## HTML Element

Add in the sidebar section, after the upload zone and before any collection metadata:

```html
<button id="index-btn" class="btn btn-primary" title="Index uploaded documents for the active collection">
  Index Documents
</button>
```

The button gets a distinct ID for easy reference. Styling uses existing `.btn` and `.btn-primary` classes (or inline styles if the project has no class system yet).

## Button State Machine

The button has two states:

| State    | Label              | Disabled | Trigger             |
|----------|--------------------|----------|---------------------|
| idle     | "Index Documents"  | false    | Default / on complete or error |
| indexing | "Indexing..."      | true     | On click            |

Transitions:
- **idle -> indexing**: User clicks the button. Handler sets `disabled = true`, changes text to "Indexing...", and starts the fetch.
- **indexing -> idle**: Stream ends (complete event, error event, or fetch error). Handler sets `disabled = false`, restores text to "Index Documents".

## Click Handler Implementation

```javascript
const indexBtn = document.getElementById('index-btn');

indexBtn.addEventListener('click', async () => {
  const collection = getActiveCollection();
  if (!collection) {
    showError('No collection selected.');
    return;
  }

  setIndexingState(true);

  try {
    const response = await fetch(`/api/collections/${encodeURIComponent(collection)}/index`, {
      method: 'POST',
    });

    if (!response.ok) {
      // Server returned non-200 before starting SSE (e.g., 400 invalid collection name)
      const errorBody = await response.json().catch(() => ({ error: 'Indexing request failed' }));
      showError(errorBody.error || 'Indexing request failed');
      setIndexingState(false);
      return;
    }

    // Stream the SSE response
    await readSSEStream(response);
  } catch (err) {
    // Network error or fetch failure
    showError(`Connection error: ${err.message}`);
  } finally {
    setIndexingState(false);
  }
});
```

## State Management Helpers

```javascript
function setIndexingState(isIndexing) {
  indexBtn.disabled = isIndexing;
  indexBtn.textContent = isIndexing ? 'Indexing...' : 'Index Documents';

  // Also disable the upload zone to prevent file changes during indexing
  const uploadZone = document.getElementById('upload-zone');
  if (uploadZone) {
    uploadZone.classList.toggle('disabled', isIndexing);
  }

  // Disable the file input
  const fileInput = document.getElementById('file-input');
  if (fileInput) {
    fileInput.disabled = isIndexing;
  }
}
```

## SSE Stream Reader (Minimal -- Expanded in Task 11.2)

This task provides the basic stream reading loop. Task 11.2 will expand it into a full event dispatcher with reconnection and timeout handling.

```javascript
async function readSSEStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Split on double-newline (SSE event boundary)
    const events = buffer.split('\n\n');
    // Keep the last (possibly incomplete) chunk in the buffer
    buffer = events.pop();

    for (const event of events) {
      const dataLine = event.trim();
      if (!dataLine.startsWith('data: ')) continue;

      const json = dataLine.slice(6); // Remove 'data: ' prefix
      try {
        const parsed = JSON.parse(json);
        handleSSEEvent(parsed);
      } catch (e) {
        console.warn('Failed to parse SSE event:', json);
      }
    }
  }
}
```

## Event Handler Stub (Expanded in Tasks 11.3-11.4)

This task provides the dispatch point. Tasks 11.3 and 11.4 fill in the progress bar and completion/error handling respectively.

```javascript
function handleSSEEvent(event) {
  switch (event.type) {
    case 'start':
    case 'info':
      // Show status message (task 11.3 will add progress bar)
      showStatus(event.message);
      break;
    case 'progress':
      // Update progress display (task 11.3)
      showStatus(event.message);
      break;
    case 'complete':
      showSuccess(event.message);
      break;
    case 'error':
      showError(event.message);
      break;
    default:
      console.warn('Unknown SSE event type:', event.type);
  }
}
```

## Active Collection Resolution

The button must know which collection to index. It reads from the same state used by the collection picker (task 9.1-9.2):

```javascript
function getActiveCollection() {
  // Reads from the collection picker's selected value or from localStorage
  const picker = document.getElementById('collection-select');
  return picker ? picker.value : localStorage.getItem('activeCollection') || 'default';
}
```

If no collection is selected and no localStorage value exists, the function falls back to `'default'`, matching the CLI's default behavior.

## Files
- `public/index.html` (modify) -- Add the "Index Documents" button element, click handler, `setIndexingState()`, `readSSEStream()`, `handleSSEEvent()` stub, and `getActiveCollection()` helper to the existing `<script>` block.

## Edge Cases

1. **No collection selected**: `getActiveCollection()` falls back to `'default'`. If even that is invalid, the server returns 400 and the handler shows the error message.

2. **Double-click prevention**: The button is immediately disabled on click. The `finally` block re-enables it, so even if the fetch throws synchronously, the button recovers.

3. **Server returns non-SSE error**: If the server returns a JSON error (headers not yet sent for SSE), the handler parses it as JSON and displays the error. This covers cases like invalid collection name (400) or initialization failure (500).

4. **Network failure mid-stream**: `reader.read()` throws when the connection drops. The `catch` block in the click handler shows a connection error. The `finally` block re-enables the button. The server-side indexing continues to completion independently (per design decision in task 4.1).

5. **Collection changes during indexing**: The upload zone and file input are disabled during indexing to prevent conflicting file changes. The collection picker should also be disabled (if task 9.2 has been implemented, add `picker.disabled = isIndexing` to `setIndexingState()`).

6. **Browser tab closed during indexing**: The fetch is aborted by the browser. Server-side indexing continues. On next page load, the button is in idle state. Any embeddings saved incrementally are preserved.
