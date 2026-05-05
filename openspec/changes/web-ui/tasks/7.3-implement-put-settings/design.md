# Task 7.3: Design -- PUT /api/settings

## Route Handler

**File:** `src/server/routes/settings.ts`
**Method:** PUT
**Path:** `/` (within the `/api/settings` router)

## Request / Response Contract

### Request

```
PUT /api/settings
Content-Type: application/json
```

**Body (all fields optional):**
```json
{
  "chunkSize": 800,
  "chunkOverlap": 100,
  "topK": 5,
  "temperature": 0.5,
  "maxTokens": 4096
}
```

| Field | Type | Range | Service | Setter |
|---|---|---|---|---|
| `chunkSize` | integer | > 0, > chunkOverlap | IImportSettings | `setChunkSize(n)` |
| `chunkOverlap` | integer | >= 0, < chunkSize | IImportSettings | `setChunkOverlap(n)` |
| `topK` | integer | 1-10 | IQuerySettings | `setTopK(n)` |
| `temperature` | float | 0.0-2.0 | IQuerySettings | `setTemperature(n)` |
| `maxTokens` | integer | 100-8000 | IQuerySettings | `setMaxTokens(n)` |

At least one recognized field must be present.

### Responses

**200 OK** -- Settings updated successfully
```json
{
  "chunkSize": 800,
  "chunkOverlap": 100,
  "topK": 5,
  "temperature": 0.5,
  "maxTokens": 4096
}
```

This returns the full current settings state (same shape as GET /api/settings), not just the fields that were modified. This allows the frontend to refresh its entire form from the response.

**400 Bad Request** -- Validation error
```json
{
  "error": "Chunk overlap must be less than chunk size"
}
```

**400 Bad Request** -- No recognized fields
```json
{
  "error": "No valid settings fields provided. Accepted fields: chunkSize, chunkOverlap, topK, temperature, maxTokens"
}
```

**500 Internal Server Error** -- Persistence failure
```json
{
  "error": "Failed to save settings: <error message>"
}
```

## Implementation Detail

### Handler Pseudocode

```typescript
router.put('/', async (req: Request, res: Response) => {
  const { chunkSize, chunkOverlap, topK, temperature, maxTokens } = req.body;

  // 1. Check that at least one recognized field is present
  const recognized = { chunkSize, chunkOverlap, topK, temperature, maxTokens };
  const provided = Object.entries(recognized).filter(([_, v]) => v !== undefined);

  if (provided.length === 0) {
    return res.status(400).json({
      error: 'No valid settings fields provided. Accepted fields: chunkSize, chunkOverlap, topK, temperature, maxTokens'
    });
  }

  try {
    // 2. Apply import settings (chunkSize, chunkOverlap)
    let importChanged = false;
    if (chunkSize !== undefined) {
      importSettings.setChunkSize(chunkSize);
      importChanged = true;
    }
    if (chunkOverlap !== undefined) {
      importSettings.setChunkOverlap(chunkOverlap);
      importChanged = true;
    }

    // 3. Apply query settings (topK, temperature, maxTokens)
    let queryChanged = false;
    if (topK !== undefined) {
      querySettings.setTopK(topK);
      queryChanged = true;
    }
    if (temperature !== undefined) {
      querySettings.setTemperature(temperature);
      queryChanged = true;
    }
    if (maxTokens !== undefined) {
      querySettings.setMaxTokens(maxTokens);
      queryChanged = true;
    }

    // 4. Persist only the services that changed
    if (importChanged) {
      await importSettings.save();
    }
    if (queryChanged) {
      await querySettings.save();
    }

    // 5. Return merged current state
    const importData = importSettings.getAllSettings();
    const queryData = querySettings.getAllSettings();

    return res.status(200).json({
      chunkSize: importData.chunkSize,
      chunkOverlap: importData.chunkOverlap,
      topK: queryData.topK,
      temperature: queryData.temperature,
      maxTokens: queryData.maxTokens,
    });

  } catch (error) {
    // Validation errors from setters are caught here
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({
      error: `Failed to save settings: ${String(error)}`
    });
  }
});
```

### Atomicity Considerations

The current approach applies settings one-by-one via setters. If a later setter throws (e.g., `setChunkOverlap` rejects because overlap >= chunkSize), earlier setters have already mutated the in-memory state.

**Mitigation strategy (validate-first):**

The setter methods on `IImportSettings` and `IQuerySettings` perform validation immediately on set. If validation fails, the setter throws before modifying state. However, if `chunkSize` is set successfully but `chunkOverlap` then fails, `chunkSize` is already changed in memory (but NOT persisted to disk, since `.save()` is called after all setters succeed).

To handle this properly:
1. Snapshot current values before applying changes
2. Apply all setters inside the try block
3. On validation error, restore the snapshot before returning 400
4. Only call `.save()` after all setters succeed

```typescript
// Snapshot for rollback
const importSnapshot = importSettings.getAllSettings();
const querySnapshot = querySettings.getAllSettings();

try {
  // Apply all setters...
  // Persist...
} catch (error) {
  // Rollback in-memory state
  if (importChanged) {
    importSettings.setChunkSize(importSnapshot.chunkSize);
    importSettings.setChunkOverlap(importSnapshot.chunkOverlap);
  }
  if (queryChanged) {
    querySettings.setTopK(querySnapshot.topK);
    querySettings.setTemperature(querySnapshot.temperature);
    querySettings.setMaxTokens(querySnapshot.maxTokens);
  }
  return res.status(400).json({ error: error.message });
}
```

### Field Ordering for chunkSize/chunkOverlap

When both `chunkSize` and `chunkOverlap` are provided together, their application order matters because the overlap setter validates that overlap < chunkSize:

- If `chunkSize` is being increased: apply `chunkSize` first, then `chunkOverlap`
- If `chunkSize` is being decreased: apply `chunkOverlap` first, then `chunkSize`
- Safe default: always apply `chunkSize` first when increasing, `chunkOverlap` first when decreasing

**Simpler approach:** Always set `chunkSize` first. If the user sends both and the combination is valid, it will work. If it is invalid, the setter will reject it and the error message is descriptive.

## Obtaining Service Instances

The settings route needs both `IImportSettings` and `IQuerySettings`. Following the pattern from task 7.1, the settings router will receive these as dependencies:

```typescript
export function createSettingsRouter(
  importSettings: IImportSettings,
  querySettings: IQuerySettings
): Router {
  const router = Router();
  // ... GET handler (task 7.2)
  // ... PUT handler (this task)
  return router;
}
```

Both services are available from the DI Container via `container.getImportSettings()` and `container.getQuerySettings()`.

## Persistence Location

Settings are persisted to JSON files by the existing services:
- **Import settings**: `data/import-settings.json` (managed by `ImportSettings.save()`)
- **Query settings**: `data/query-settings.json` (managed by `QuerySettings.save()`)

The PUT endpoint does NOT write files directly -- it delegates entirely to the service `.save()` methods. This maintains the service isolation principle.

## Why JSON Files (Not .env)

The `.env` file is read-only at startup and is not suitable for runtime updates because:
1. `dotenv.config()` loads `.env` once at process start
2. Writing to `.env` would require parsing, modifying, and serializing a dotenv format
3. `.env` is a developer/ops concern, not a runtime configuration store
4. The existing `IImportSettings` and `IQuerySettings` services already persist to JSON

The JSON approach matches the codebase's existing storage pattern (embeddings, chunks, settings all use JSON files in `data/`).

## Testing Notes

Key scenarios to verify:

1. PUT with valid `chunkSize` only -- updates import settings, returns full state
2. PUT with valid `topK` and `temperature` -- updates query settings, returns full state
3. PUT with all five fields -- updates both services, returns full state
4. PUT with invalid `chunkOverlap` (>= chunkSize) -- returns 400, no persistence
5. PUT with `temperature` out of range -- returns 400
6. PUT with empty body -- returns 400 "No valid settings fields"
7. PUT with unrecognized fields only (e.g., `{"foo": 42}`) -- returns 400
8. PUT with mix of valid and unrecognized fields -- applies valid fields, ignores unrecognized
9. Verify `.save()` is called only on services that had changes
10. Verify in-memory state is rolled back on validation failure
