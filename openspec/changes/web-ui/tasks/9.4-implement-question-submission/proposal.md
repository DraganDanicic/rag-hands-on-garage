# Task 9.4: Implement Question Submission via Fetch API

## Summary

Add JavaScript logic to `public/index.html` that captures the user's question from the chat input form, sends it as a POST request to `/api/collections/:name/query`, and renders both the user message and assistant response (or error) in the chat message list.

## Motivation

This is the core interaction loop of the web UI -- the user types a question, the system queries the RAG pipeline, and the answer appears in the chat. Without this task, the chat interface is a static shell with no backend connectivity. The fetch-based submission bridges the frontend (tasks 9.1-9.3) to the query API (task 5.1), completing the end-to-end query flow in the browser.

## Scope

### In Scope

- Event listener on the chat form's `submit` event (covers both Send button click and Enter key press)
- Prevention of empty question submissions (trim and check before sending)
- Reading the active collection name from frontend state (set by task 9.2)
- Constructing and sending `fetch('POST /api/collections/${collectionName}/query', { body: { question } })`
- Immediately appending the user's question as a user-styled message in the chat list
- Showing a loading/thinking indicator while the request is in flight
- Disabling the input field and send button during the request to prevent duplicate submissions
- On success: appending the `answer` from the JSON response as an assistant-styled message
- On HTTP error (4xx/5xx): extracting the `error` field from the response JSON and displaying it as an error-styled message
- On network failure (fetch rejects): displaying "Connection error. Please try again." as an error-styled message
- Clearing the input field after successful submission
- Re-enabling the input field and re-focusing it after response or error
- Removing the loading indicator after response or error

### Out of Scope

- Auto-scroll to the latest message (task 9.6)
- Clear conversation button (task 9.7)
- Loading state CSS animations or skeleton loaders (task 9.5 covers loading state styling)
- Markdown rendering of responses (explicitly out of scope per design.md non-goals)
- Conversation history persistence across page reloads
- Retry button on errors (user can simply re-type or re-submit)
- topK/temperature overrides from the settings panel (task 12.x handles settings integration)

## Constraints

- All code lives in the `<script>` section of `public/index.html` (vanilla JS, no build step)
- Must use the DOM elements and CSS classes established by tasks 9.3 (message display) and 8.3 (chat input form)
- The active collection name must come from the state variable set by task 9.2's collection selection logic; default to `'default'` if not yet set
- The fetch call must set `Content-Type: application/json` and send the body as `JSON.stringify({ question })`
- Error messages from the API follow the shape `{ error: string }` (established in task 5.1)
- Must preserve line breaks in the assistant response text (`whiteSpace: pre-wrap` or equivalent via CSS class)

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Query takes a long time (LLM Farm latency) | User sees no feedback for 5-30 seconds | Loading indicator ("Thinking...") is shown immediately; input is disabled to signal activity |
| Collection name is undefined if user hasn't selected one | Fetch URL is malformed, returns 404 | Default to `'default'` collection; guard with early return if somehow still empty |
| Large response text causes layout issues | Chat area overflows or wraps poorly | CSS `word-break: break-word` and `white-space: pre-wrap` on message elements |
| Rapid double-click submits duplicate questions | Two identical requests fire | Disable submit button immediately on submit; re-enable only after response |

## Dependencies

- **Task 8.3** (chat input form HTML) -- provides the `<form>`, `<input>`, and Send `<button>` elements
- **Task 9.2** (collection selection) -- provides the active collection name in JS state
- **Task 9.3** (chat message display) -- provides the `appendMessage()` or equivalent function and CSS classes for user/assistant/error messages
- **Task 5.1** (query route) -- provides the backend `POST /api/collections/:name/query` endpoint
