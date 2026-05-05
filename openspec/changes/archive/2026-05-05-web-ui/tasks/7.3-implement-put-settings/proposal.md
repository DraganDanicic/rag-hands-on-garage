# Task 7.3: Implement PUT /api/settings Endpoint

## Context
Part of change: web-ui
Parent task: "7.3 Implement PUT /api/settings endpoint to update configuration"

## What
Add a PUT handler in `src/server/routes/settings.ts` that accepts a JSON body with optional settings fields, applies them to the existing `IImportSettings` and `IQuerySettings` services, persists the changes to their respective JSON files, and returns the updated settings.

The endpoint accepts a flat JSON object with two logical groups of settings:
- **Import settings** (affect document processing): `chunkSize`, `chunkOverlap`
- **Query settings** (affect RAG queries): `topK`, `temperature`, `maxTokens`

All fields are optional -- the endpoint applies only the fields present in the request body, leaving others unchanged (partial update / PATCH-like semantics on a PUT).

## Why
The web UI settings panel (task 12.5) needs a backend endpoint to persist user-modified configuration. The spec requires PUT `/api/settings` to accept these five fields, validate them, and persist changes so they take effect on subsequent indexing and query operations. The existing `IImportSettings` and `IQuerySettings` services already provide setters, validation, and JSON file persistence -- this endpoint wires the HTTP layer to those services.

## Scope

### In Scope
- PUT route handler in the settings router (created by task 7.1)
- Parse JSON request body for `chunkSize`, `chunkOverlap`, `topK`, `temperature`, `maxTokens`
- Route each field to the correct settings service (`IImportSettings` for chunk*, `IQuerySettings` for topK/temperature/maxTokens)
- Call `.save()` on each service that had settings modified
- Return 200 with the merged current state of all settings on success
- Return 400 with descriptive error message when service-layer validation rejects a value
- Return 400 when request body is empty or contains no recognized fields
- Return 500 for unexpected persistence errors

### Out of Scope
- Detailed validation logic (already in `ImportSettings` and `QuerySettings` services; further validation is task 7.4)
- Creating the settings route file (task 7.1)
- GET endpoint (task 7.2)
- Reset-to-defaults endpoint (can be added separately or as a dedicated route)
- Frontend settings panel (tasks 12.x)
- Collection-specific settings (design.md leans toward global settings for simplicity)

## Dependencies
- **Task 7.1** (Create settings route file): The router must exist before adding the PUT handler
- **Task 7.2** (GET /api/settings): Should be implemented first so the response format is consistent; PUT returns the same shape
- **IImportSettings service**: Already provides `setChunkSize()`, `setChunkOverlap()`, `save()` with validation
- **IQuerySettings service**: Already provides `setTopK()`, `setTemperature()`, `setMaxTokens()`, `save()` with validation

## Approach

1. In the settings route file, add a PUT handler on `/`
2. Extract known fields from `req.body` (Express JSON body parsing assumed configured)
3. Check that at least one recognized field is present; return 400 if body is empty or has no known keys
4. Apply import settings fields (`chunkSize`, `chunkOverlap`) via `importSettings.setChunkSize()` etc.
5. Apply query settings fields (`topK`, `temperature`, `maxTokens`) via `querySettings.setTopK()` etc.
6. If any setter throws a validation error, catch it immediately and return 400 with the error message -- do NOT persist partial changes (apply all or nothing)
7. Call `importSettings.save()` and/or `querySettings.save()` for whichever service had changes
8. Return 200 with the combined current settings (same format as GET response from task 7.2)

## Estimated Effort

Small -- single route handler, ~50-60 lines of code. All validation and persistence logic is delegated to existing services.
