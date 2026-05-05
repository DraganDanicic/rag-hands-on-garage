# Task 11.3: Design -- Progress Bar Updates from SSE Events

## Approach

Implement a single event handler function `handleIndexingEvent(data)` in the `<script>` section of `public/index.html` that receives a parsed SSE event object and performs DOM updates on the progress bar elements. The `EventSource.onmessage` callback (set up in task 11.2) calls `JSON.parse(event.data)` and passes the result to this handler.

The handler uses a type-based dispatch pattern (switch/if-else on `data.type`) to route each event type to the appropriate DOM manipulation. Only `progress`, `start`, and `info` types are handled in this task; `complete` and `error` are delegated to task 11.4.

## Decisions

### Decision 1: Standalone handler function decoupled from EventSource

The DOM update logic lives in `handleIndexingEvent(data)` rather than being inlined in the `onmessage` callback. The `onmessage` callback does only two things: parse JSON and call the handler.

```javascript
eventSource.onmessage = function(event) {
  try {
    const data = JSON.parse(event.data);
    handleIndexingEvent(data);
  } catch (e) {
    console.error('Failed to parse SSE event:', e);
  }
};
```

**Rationale:** Separating parsing from DOM manipulation allows task 11.2 (EventSource setup) and task 11.3 (progress rendering) to be implemented independently. It also makes the handler easier to reason about and test manually in the browser console.

### Decision 2: CSS width percentage for progress bar

Set `progressBar.style.width = data.percentage + '%'` directly. The progress bar element is a child `<div>` inside a fixed-width container, using percentage-based width to show fill level.

**Rationale:** This is the simplest, most widely-used approach for HTML progress bars. No external library needed. CSS `transition` on the bar element provides smooth animation between updates.

### Decision 3: Show percentage text inside the bar

Display `data.percentage + '%'` as `textContent` inside the progress bar element itself (e.g., "42%"). This gives users an at-a-glance numeric reading in addition to the visual fill.

**Rationale:** A visual-only bar without numbers can be hard to read at intermediate values. The text is cheap to render and disappears naturally when the bar is hidden.

### Decision 4: Progress message displayed below the bar

The `data.message` string (e.g., "Processing chunk 42/100...") is rendered in a separate `<span>` or `<p>` element below the progress bar container, not inside the bar itself.

**Rationale:** Message text can be long and variable-length. Placing it outside the bar avoids layout issues where text overflows or gets clipped inside a narrow bar.

### Decision 5: Try/catch guard in onmessage

The `JSON.parse()` call is wrapped in try/catch. On parse failure, the error is logged to console and the event is silently dropped.

**Rationale:** A malformed SSE event (e.g., partial write, encoding issue) should not crash the entire progress UI or leave it in a broken state. Silent drop with console logging is appropriate for a training project.

### Decision 6: Progress container visibility managed via CSS class

Show/hide the progress container by toggling a CSS class (e.g., `hidden` class with `display: none`) rather than inline `style.display`. The `start` event removes the `hidden` class; terminal events (task 11.4) add it back.

**Rationale:** Class-based toggling is cleaner than direct style manipulation and works well with CSS transitions. The `hidden` class pattern is conventional and easy for training participants to understand.

## Files

- `public/index.html` (modify) -- Add the `handleIndexingEvent(data)` function in the `<script>` section. Add the `onmessage` callback wiring (or extend it if task 11.2 has already set it up). Expected DOM elements referenced:
  - `#progress-container` -- outer container, toggled visible/hidden
  - `#progress-bar` -- inner fill element, width set to percentage
  - `#progress-message` -- text element below bar showing `data.message`

No new files are created. No server-side changes.

## DOM Element Assumptions

The following HTML structure is expected to exist (created in task 8.x):

```html
<div id="progress-container" class="hidden">
  <div id="progress-bar-wrapper">
    <div id="progress-bar">0%</div>
  </div>
  <p id="progress-message"></p>
</div>
```

With CSS:

```css
#progress-bar-wrapper {
  width: 100%;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

#progress-bar {
  width: 0%;
  background-color: #4caf50;
  color: white;
  text-align: center;
  padding: 4px 0;
  transition: width 0.3s ease;
  font-size: 0.85em;
}

.hidden {
  display: none;
}
```

If the actual element IDs or class names differ when task 8.x is implemented, the selectors in `handleIndexingEvent` will need to be updated accordingly.

## Implementation Sketch

```javascript
function handleIndexingEvent(data) {
  const container = document.getElementById('progress-container');
  const bar = document.getElementById('progress-bar');
  const message = document.getElementById('progress-message');

  switch (data.type) {
    case 'start':
      container.classList.remove('hidden');
      bar.style.width = '0%';
      bar.textContent = '0%';
      message.textContent = data.message || 'Starting...';
      break;

    case 'progress':
      container.classList.remove('hidden');
      bar.style.width = data.percentage + '%';
      bar.textContent = data.percentage + '%';
      message.textContent = data.message || ('Processing ' + data.current + '/' + data.total + '...');
      break;

    case 'info':
      message.textContent = data.message || '';
      break;

    case 'complete':
    case 'error':
      // Delegated to task 11.4
      break;
  }
}
```

## Edge Cases

1. **Percentage exceeds 100 or is negative**: Clamp the value with `Math.max(0, Math.min(100, data.percentage))` before applying to CSS width. Prevents visual overflow or negative bar width.

2. **Rapid successive events**: The CSS `transition: width 0.3s ease` on the bar element smooths rapid updates. No debouncing needed -- the browser coalesces DOM updates within the same animation frame.

3. **Missing fields in progress event**: If `data.percentage` is undefined, fall back to computing `Math.round((data.current / data.total) * 100)`. If both are missing, log a warning and skip the update.

4. **Malformed JSON in event.data**: Handled by the try/catch in `onmessage` (Decision 5). The handler never sees invalid data.

5. **Handler called before DOM is ready**: Not a concern since the script is at the bottom of the HTML body (or deferred), and the handler is only called in response to user-initiated indexing which happens well after page load.

6. **Multiple concurrent indexing operations**: Out of scope (single-user assumption per L1 design). The UI disables the index button during operation (task 11.1), preventing concurrent streams.
