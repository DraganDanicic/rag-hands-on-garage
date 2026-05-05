# Task 7.4: Add Settings Validation

## Summary

Create a `validateSettings` utility function and integrate it into the PUT `/api/settings` route handler so that invalid configuration values are rejected with 400 responses and descriptive error messages before any persistence occurs.

## Motivation

The settings API (tasks 7.2/7.3) allows users to modify runtime configuration such as chunk size, overlap, topK, and temperature. Without server-side validation, invalid values could corrupt the configuration state, cause indexing failures (e.g., overlap larger than chunk size producing empty chunks), or produce nonsensical LLM behavior (e.g., negative temperature). The spec explicitly requires validation with specific ranges (chunk size 100-2000, overlap < chunk size, temperature 0.0-1.0, topK > 0), and the design mandates returning 400 with descriptive errors.

## Scope

### In Scope

- A pure validation function that accepts a partial settings object and returns structured validation results
- Validation rules for all user-configurable settings: chunkSize, chunkOverlap, topK, temperature, maxTokens
- Cross-field validation (overlap must be less than chunk size)
- Descriptive per-field error messages suitable for display in the frontend
- Integration into the PUT `/api/settings` route handler (early return on failure)
- A validation constraints constant object for DRY rule definitions

### Out of Scope

- Frontend-side validation (task 12.4 handles real-time client validation)
- Validation of read-only settings (API key, proxy config, model names)
- Validation of file paths (documentsPath, collectionsPath)
- Schema validation of the request body shape (missing fields are simply ignored in a partial update)

## Constraints

- Must use ES module imports with `.js` extensions per project convention
- Validation function must be a pure function (no side effects, no service dependencies) so it is easily testable
- Error messages must be human-readable strings (displayed in the frontend settings panel)
- Must not modify the existing `ConfigService` class -- validation lives in the server layer
- The validation function must handle partial updates: only validate fields that are present in the request body

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cross-field validation with partial updates (overlap sent without chunkSize) | Medium -- cannot validate overlap < chunkSize if chunkSize is not in the request | Use current/default chunkSize as reference when only overlap is provided |
| Validation rules drift from frontend rules | Low -- two separate validation implementations | Define constraints in a shared constant; frontend can duplicate or fetch from API |
| Overly strict validation blocks valid edge cases | Low -- training project with known value ranges | Use generous ranges from spec; document constraints clearly |

## Dependencies

- Task 7.3 (PUT /api/settings route) -- the route handler that calls the validation function
- Task 7.2 (GET /api/settings route) -- provides current settings needed for cross-field validation reference values
