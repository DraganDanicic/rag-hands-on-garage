# Task 11.3: Implement Progress Bar Updates from SSE Progress Events

## Summary

Implement the client-side JavaScript logic that receives SSE events from the indexing endpoint and updates the progress bar UI in real time. This includes parsing incoming event JSON, updating the progress bar width via CSS percentage, displaying the progress message text, and showing/hiding the progress container at the appropriate lifecycle points.

## Problem

Task 11.2 establishes the `EventSource` connection to the indexing SSE endpoint, but does not handle the incoming event data. Without an `onmessage` handler that parses events and manipulates the DOM, the progress bar remains static at 0% and the user has no visibility into indexing progress. This task bridges the SSE data stream to the visual progress UI.

## Scope

### In Scope

- `EventSource.onmessage` handler that parses `event.data` as JSON
- Routing events by `type` field (`progress`, `complete`, `error`, `start`, `info`)
- For `progress` events: updating the progress bar element width to `percentage`%, updating the message text element, and optionally showing the numeric percentage inside the bar
- For `start` events: showing the progress container, resetting the bar to 0%, displaying the start message
- For `info` events: updating the message text (bar width unchanged)
- Showing the progress container when indexing begins (triggered by the first event or by the calling code in task 11.1/11.2)
- Hiding the progress container on terminal events (`complete`, `error`) -- coordinated with task 11.4

### Out of Scope

- Creating the `EventSource` connection (task 11.2)
- Handling `complete` and `error` terminal events in full (task 11.4 owns success/error messaging and cleanup)
- Closing the `EventSource` connection (task 11.5)
- Refreshing the collections list after indexing (task 11.6)
- The HTML/CSS structure for the progress bar (task 8.x)
- Server-side SSE event generation (tasks 2.4, 4.3)

## Approach

Add an `onmessage` callback to the `EventSource` instance created in task 11.2. The callback:

1. Parses `event.data` with `JSON.parse()`
2. Switches on `data.type` to determine the update action
3. For `progress` type: sets `progressBar.style.width = data.percentage + '%'`, updates `progressMessage.textContent = data.message`, and optionally sets `progressBar.textContent = data.percentage + '%'`
4. For `start` type: makes the progress container visible, resets bar to 0%
5. For `info` type: updates the message text only

The function will be written as a standalone handler (e.g., `handleIndexingEvent(data)`) that the `onmessage` callback delegates to after parsing. This separation makes the DOM update logic testable independently of the EventSource API.

## Success Criteria

- When a `progress` event arrives with `{percentage: 42, message: "Processing chunk 42/100..."}`, the progress bar visually fills to 42% width and the message text reads "Processing chunk 42/100..."
- When a `start` event arrives, the progress container becomes visible and the bar resets to 0%
- When an `info` event arrives, only the message text updates (bar width unchanged)
- The progress bar updates smoothly across a sequence of events (e.g., 0% to 10% to 20% ... to 100%)
- Invalid or malformed event data does not crash the handler (wrapped in try/catch)
- The handler function is decoupled from EventSource creation so task 11.2 and 11.3 code can be developed in parallel

## Dependencies

- **Upstream (must exist first):**
  - Task 8.x: HTML structure with progress bar container, bar element, and message element (DOM IDs/classes to target)
  - Task 11.2: `EventSource` connection creation (provides the `EventSource` instance to attach `onmessage` to)
  - Task 2.4 / 4.3: Server-side SSE event format (defines the JSON shape this handler parses)

- **Downstream (depends on this):**
  - Task 11.4: Handles `complete` and `error` events (extends the same `onmessage` handler or calls into this handler)

- **No changes to existing server or service code required** -- this is purely client-side JavaScript in `public/index.html`
