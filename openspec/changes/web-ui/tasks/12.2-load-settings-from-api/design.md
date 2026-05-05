# Task 12.2: Design -- Load settings from GET /api/settings

## Approach

Add a `loadSettings()` async function to the frontend JavaScript in `public/index.html`. This function is called each time the settings panel is opened (not just on first open), ensuring the displayed values always reflect the server's current state. The function fetches from `GET /api/settings`, parses the JSON response, and assigns each value to the corresponding input element.

## Decisions

### Decision 1: Fetch on every panel open, not just the first

Each time the user opens the settings panel, `loadSettings()` fires a fresh `GET /api/settings` request. This avoids showing stale data if settings were changed by another means (e.g., direct `.env` edit and server restart, or a previous save that the UI forgot about).

**Rationale:** The fetch is lightweight (small JSON, local server), so the cost of an extra request is negligible. Caching settings client-side introduces staleness bugs that are harder to debug in a training project.

### Decision 2: Hook into the panel toggle handler from task 12.1

Rather than adding a separate event listener, `loadSettings()` is called from within the existing toggle function that task 12.1 creates. Specifically, it is called only when the panel transitions from hidden to visible (not on close).

**Rationale:** Keeps event handling centralized. Avoids duplicate listeners or race conditions from multiple handlers on the same toggle button.

### Decision 3: Populate inputs by setting `.value` directly

Use `document.getElementById('settings-chunk-size').value = data.chunkSize` (or equivalent selector). No two-way data binding, no state object -- just direct DOM assignment after fetch completes.

**Rationale:** Vanilla JS approach consistent with the project's "no framework" decision. Simple, readable, and sufficient for 5 input fields.

### Decision 4: Show inline error on fetch failure

If the fetch fails (network error, non-200 status), display an error message inside the settings panel (e.g., a `<div class="settings-error">` element) rather than using `alert()` or silently failing. The inputs retain whatever values they had (empty if first open, previous values if re-open).

**Rationale:** Inline errors are better UX than `alert()`. Silently failing would leave the user with empty or stale inputs and no indication of a problem.

### Decision 5: No loading spinner for this fetch

The settings endpoint returns ~100 bytes of JSON from localhost. The response time is under 50ms in normal conditions. A loading spinner would flash and disappear too quickly to be useful, adding visual noise.

**Rationale:** Loading indicators are useful for operations that take >300ms. This fetch is effectively instant for a localhost server. If the server is slow or down, the error message handles that case.

## File to Modify

`public/index.html` -- add JavaScript within the existing `<script>` block

## Implementation Detail

### The loadSettings() function

```javascript
async function loadSettings() {
  // Clear any previous error message
  const errorEl = document.getElementById('settings-error');
  if (errorEl) errorEl.textContent = '';

  try {
    const response = await fetch('/api/settings');

    if (!response.ok) {
      throw new Error(`Failed to load settings (${response.status})`);
    }

    const data = await response.json();

    // Populate each input field
    // Exact IDs depend on task 12.1/12.3 -- these are representative
    document.getElementById('settings-chunk-size').value = data.chunkSize;
    document.getElementById('settings-chunk-overlap').value = data.chunkOverlap;
    document.getElementById('settings-top-k').value = data.topK;
    document.getElementById('settings-temperature').value = data.temperature;
    document.getElementById('settings-max-tokens').value = data.maxTokens;
  } catch (error) {
    console.error('Failed to load settings:', error);
    if (errorEl) {
      errorEl.textContent = 'Could not load settings. Check that the server is running.';
    }
  }
}
```

### Integration with Panel Toggle

The existing toggle handler from task 12.1 should be modified to call `loadSettings()` when the panel becomes visible:

```javascript
// Inside the existing toggle handler (established by task 12.1)
function toggleSettingsPanel() {
  const panel = document.getElementById('settings-panel');
  const isHidden = panel.classList.contains('hidden');
  // or: const isHidden = panel.style.display === 'none';

  if (isHidden) {
    panel.classList.remove('hidden');
    loadSettings();  // <-- This is the addition from task 12.2
  } else {
    panel.classList.add('hidden');
  }
}
```

The exact toggle mechanism (CSS class, display property, aria attributes) depends on task 12.1's implementation. The key integration point is: call `loadSettings()` in the branch where the panel transitions to visible.

### Error Display Element

If not already present from task 12.1, a small error container should exist inside the settings panel:

```html
<div id="settings-error" class="settings-error"></div>
```

Styled with red text, hidden when empty:

```css
.settings-error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  min-height: 1.25rem;
}
.settings-error:empty {
  display: none;
}
```

## Edge Cases

1. **Server not running**: Fetch throws a network error (TypeError). Caught by the try/catch, error message displayed in panel.

2. **Server returns non-JSON**: `response.json()` throws SyntaxError. Caught by the try/catch, error message displayed.

3. **Server returns 500**: `response.ok` is false, throws with status code. User sees "Failed to load settings (500)".

4. **Missing fields in response**: If the server omits a field (e.g., `temperature` not in response), the corresponding input gets set to `undefined`, which renders as empty. This is acceptable -- task 12.4 validation will catch invalid/empty values before save.

5. **Panel opened rapidly (double-click)**: Two fetches fire. Both will populate the same inputs with the same data. No race condition since the final write wins and both return the same values. No special handling needed.

6. **Panel opened while previous fetch is in-flight**: Same as double-click case. Both fetches are independent, both write the same data. If we wanted to prevent this, we could add an `isLoading` flag, but the added complexity is not worth it for a training project.

## Testing Approach

Manual testing (no automated frontend tests in this project):

1. **Happy path**: Open settings panel, verify all 5 fields show current server values
2. **Server down**: Stop server, open settings panel, verify error message appears
3. **Re-open panel**: Change a setting via another means (restart server with different env vars), re-open panel, verify new values appear
4. **Rapid toggle**: Open/close/open panel quickly, verify no JS errors in console
