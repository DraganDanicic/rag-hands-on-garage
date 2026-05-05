# Task 9.4: Design -- Question Submission

## Overview

Wire the chat form's submit event to the query API using `fetch()`. On submit: validate input, append the user message to the DOM, show a loading indicator, call the API, then append the assistant response or error message. All logic is vanilla JS inside `public/index.html`.

## DOM Elements (Expected from Tasks 8.3 / 9.3)

The implementation depends on these elements existing in the HTML:

| Element | Selector | Purpose |
|---------|----------|---------|
| Chat form | `#chat-form` | Wraps input and button; listen for `submit` event |
| Question input | `#question-input` | Text input for the user's question |
| Send button | `#send-button` | Submit trigger (also submits via Enter in the input) |
| Message list | `#message-list` | Container where user/assistant/error messages are appended |

## State Dependency

The active collection name is read from a module-level variable managed by task 9.2:

```javascript
// Set by task 9.2's collection selection logic
let activeCollection = 'default';
```

This variable is updated when the user clicks a collection in the sidebar. If it is falsy, the submission handler defaults to `'default'`.

## Implementation Detail

### Form Submit Handler

```javascript
const chatForm = document.getElementById('chat-form');
const questionInput = document.getElementById('question-input');
const sendButton = document.getElementById('send-button');
const messageList = document.getElementById('message-list');

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const question = questionInput.value.trim();
  if (!question) return;

  // Append user message to chat
  appendMessage('user', question);

  // Clear input and disable form
  questionInput.value = '';
  setFormDisabled(true);

  // Show loading indicator
  const loadingEl = appendLoading();

  try {
    const collectionName = activeCollection || 'default';
    const response = await fetch(`/api/collections/${encodeURIComponent(collectionName)}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });

    // Remove loading indicator
    loadingEl.remove();

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Unknown error' }));
      appendMessage('error', data.error || `Error: ${response.status}`);
      return;
    }

    const data = await response.json();
    appendMessage('assistant', data.answer);
  } catch (err) {
    // Network error (fetch itself rejected)
    loadingEl.remove();
    appendMessage('error', 'Connection error. Please try again.');
  } finally {
    setFormDisabled(false);
    questionInput.focus();
  }
});
```

### Helper: appendMessage

This function is expected to be provided by task 9.3. If not yet available, implement a minimal version:

```javascript
function appendMessage(role, text) {
  const div = document.createElement('div');
  div.classList.add('message', `message-${role}`);
  div.textContent = text;
  messageList.appendChild(div);
}
```

- `role` is one of `'user'`, `'assistant'`, or `'error'`
- CSS classes: `message message-user`, `message message-assistant`, `message message-error`
- Uses `textContent` (not `innerHTML`) to avoid XSS from LLM responses
- Line break preservation is handled by CSS (`white-space: pre-wrap` on `.message`)

### Helper: appendLoading

```javascript
function appendLoading() {
  const div = document.createElement('div');
  div.classList.add('message', 'message-loading');
  div.textContent = 'Thinking...';
  messageList.appendChild(div);
  return div;
}
```

The loading element is appended to the message list so it appears inline in the conversation flow. It is removed (via `loadingEl.remove()`) once the response arrives or an error occurs.

### Helper: setFormDisabled

```javascript
function setFormDisabled(disabled) {
  questionInput.disabled = disabled;
  sendButton.disabled = disabled;
}
```

Disabling both the input and button prevents:
- Typing during a pending request
- Double-click or Enter-key submission of duplicate requests

## Fetch Request Details

```
POST /api/collections/{collectionName}/query
Content-Type: application/json

{
  "question": "What is RAG?"
}
```

The collection name is URL-encoded via `encodeURIComponent()` to handle names with special characters.

## Response Handling

### Success (200)

```json
{ "answer": "RAG stands for Retrieval-Augmented Generation..." }
```

Extract `data.answer` and pass to `appendMessage('assistant', data.answer)`.

### HTTP Error (400 / 500)

```json
{ "error": "No embeddings found for this collection. Please index documents first." }
```

Parse the response body as JSON. If parsing fails (e.g., non-JSON error page), fall back to a generic message. Display via `appendMessage('error', ...)`.

### Network Error

When `fetch()` itself throws (DNS failure, server unreachable, CORS block), the `catch` block displays `"Connection error. Please try again."` via `appendMessage('error', ...)`.

## Error Message Styling

Error messages use the `message-error` CSS class. Expected styling (from task 9.3 / 8.5):

```css
.message-error {
  color: #dc3545;
  font-style: italic;
  background-color: #fff5f5;
  border-left: 3px solid #dc3545;
}
```

If task 9.3 does not provide this class, add it inline as part of this task.

## Edge Cases

| Case | Behavior |
|------|----------|
| Empty or whitespace-only input | `trim()` check returns early; no request sent |
| Active collection is empty string | Defaults to `'default'` |
| API returns non-JSON error body | `response.json().catch()` provides fallback `{ error: 'Unknown error' }` |
| User presses Enter while form is disabled | `disabled` attribute on input prevents form submission |
| Very long response text | CSS `word-break: break-word` prevents horizontal overflow |

## File Changes

| File | Change |
|------|--------|
| `public/index.html` | Add submit handler, `appendLoading()`, `setFormDisabled()` in `<script>` section. Possibly add `appendMessage()` if not already provided by task 9.3. |

No new files are created. No server-side changes.

## Testing Considerations

Manual verification steps:
1. Type a question and press Enter -- user message appears, loading shows, assistant response appears
2. Click Send button -- same behavior as Enter
3. Submit empty input -- nothing happens, no request sent
4. Disconnect server and submit -- "Connection error. Please try again." appears
5. Query a collection with no embeddings -- error message from API is displayed
6. Rapidly click Send -- only one request fires (button is disabled)
7. After response, input is re-enabled and focused, ready for next question
