# Task 12.2: Load current settings from GET /api/settings on panel open

## Summary

When the user opens the settings panel in the web UI, fetch the current configuration values from `GET /api/settings` and populate the input fields with the response data. This ensures the settings panel always reflects the server's actual configuration rather than stale defaults or empty inputs.

## Context

- **Parent task group:** 12 -- Frontend UI - Settings Panel
- **Dependency:** Task 12.1 (settings panel toggle must exist with a show/hide mechanism and the panel DOM structure)
- **Dependency:** Task 7.2 (GET /api/settings endpoint must be implemented on the server)
- **L1 spec reference:** `specs/settings-web-ui/spec.md` -- "Load settings on page open" requirement
- **L1 design reference:** `design.md` -- vanilla JS frontend, single HTML file, no framework

## What Already Exists

### Server Side (Task 7.2)

The `GET /api/settings` endpoint returns the current configuration from `ConfigService`. Based on the spec and `IConfigService`, the response includes at minimum:

```json
{
  "chunkSize": 500,
  "chunkOverlap": 50,
  "topK": 3,
  "temperature": 0.7,
  "maxTokens": 2048
}
```

These map to `ConfigService` methods: `getChunkSize()`, `getChunkOverlap()`, `getTopK()`, `getLlmTemperature()`, `getLlmMaxTokens()`.

### Frontend Side (Task 12.1)

Task 12.1 creates the settings panel with a toggle mechanism (show/hide). The panel contains input fields for the five settings. The exact input element IDs and the toggle trigger (button click, panel expand event) are established by task 12.1.

## What Needs to Be Built

A JavaScript function in `public/index.html` that:

1. **Triggers on panel open** -- hooks into whatever show/hide mechanism task 12.1 establishes (e.g., button click handler, panel visibility toggle)
2. **Fetches settings** -- calls `GET /api/settings` using the Fetch API
3. **Populates inputs** -- sets the `.value` property of each input field with the corresponding response field
4. **Handles errors** -- shows a user-visible error message if the fetch fails (network error, server down, non-200 response)
5. **Handles loading state** -- optionally shows a brief loading indicator while the fetch is in flight

## Settings Field Mapping

| API Response Field | Input Element (expected ID/name) | Input Type | Notes |
|---|---|---|---|
| `chunkSize` | `settings-chunk-size` (or similar) | number | Integer, range 100-2000 |
| `chunkOverlap` | `settings-chunk-overlap` | number | Integer, must be < chunkSize |
| `topK` | `settings-top-k` | number | Integer, typically 1-20 |
| `temperature` | `settings-temperature` | range or number | Float 0.0-1.0 |
| `maxTokens` | `settings-max-tokens` | number | Integer, typically 256-8192 |

The exact input element IDs depend on what task 12.1 establishes. The implementation must use whatever IDs/selectors task 12.1 defines.

## Scope

- One async function (`loadSettings()` or similar) added to the frontend JavaScript in `public/index.html`
- Integration with the panel open trigger from task 12.1
- Fetch call to `GET /api/settings`
- Populating input field values from the response
- Error handling with user-visible feedback
- No new HTML elements (those come from task 12.1 and 12.3)
- No validation logic (task 12.4)
- No save functionality (task 12.5)

## Out of Scope

- Creating the settings panel HTML structure or toggle (task 12.1)
- Creating input fields and labels (task 12.3)
- Validation feedback (task 12.4)
- Saving settings via PUT (task 12.5)
- Reset to defaults (task 12.6)
- Server-side GET /api/settings implementation (task 7.2)
