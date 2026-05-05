# Task 5.2: Design -- Integrate QueryWorkflow with Request Parameters

## Request Schema

The query route handler (from task 5.1) receives a JSON body:

```typescript
interface QueryRequestBody {
  question: string;           // Required
  topK?: number;              // Optional, default: current QuerySettings value
  temperature?: number;       // Optional, default: current QuerySettings value
}
```

Both `topK` and `temperature` are optional. When omitted, the current `QuerySettings` defaults apply unchanged.

## Implementation Detail

### Parameter Application in Route Handler

The core logic lives in the route handler in `src/server/routes/query.ts`. The pattern is save-override-restore:

```typescript
// Inside the POST /api/collections/:name/query handler:

const { question, topK, temperature } = req.body;

// 1. Validate question exists
if (!question || typeof question !== 'string' || question.trim().length === 0) {
  return res.status(400).json({ error: 'Question is required and must be a non-empty string' });
}

// 2. Snapshot current settings
const querySettings = container.getQuerySettings();
const originalSettings = querySettings.getAllSettings();

try {
  // 3. Apply per-request overrides (setters validate ranges)
  if (topK !== undefined) {
    querySettings.setTopK(topK);
  }
  if (temperature !== undefined) {
    querySettings.setTemperature(temperature);
  }

  // 4. Execute query (reads topK/temperature from querySettings internally)
  const answer = await workflow.query(question.trim());

  // 5. Return response
  res.json({ answer });

} catch (error) {
  // Distinguish validation errors from workflow errors
  if (error instanceof Error && (
    error.message.includes('must be between')
  )) {
    return res.status(400).json({ error: error.message });
  }
  throw error; // Let error middleware handle workflow/API failures

} finally {
  // 6. Restore original settings (always, even on error)
  querySettings.setTopK(originalSettings.topK);
  querySettings.setTemperature(originalSettings.temperature);
}
```

### Validation Flow

Validation is handled by the existing `QuerySettings` setters, which throw descriptive errors:

| Parameter   | Constraint          | Error Message                           |
|-------------|---------------------|-----------------------------------------|
| `topK`      | Integer, 1-10       | "Top-K must be between 1 and 10"        |
| `temperature`| Float, 0.0-2.0     | "Temperature must be between 0 and 2"   |

The route catches these validation errors and returns them as 400 responses. No new validation code is needed.

### Type Checking

Request body fields arrive as JSON, so `topK` will be a number (not string) if the client sends valid JSON. The route should check types before passing to setters:

```typescript
if (topK !== undefined) {
  if (typeof topK !== 'number') {
    return res.status(400).json({ error: 'topK must be a number' });
  }
  querySettings.setTopK(topK);
}

if (temperature !== undefined) {
  if (typeof temperature !== 'number') {
    return res.status(400).json({ error: 'temperature must be a number' });
  }
  querySettings.setTemperature(temperature);
}
```

## Container and Workflow Lifecycle

The query route assumes a Container instance exists for the given collection. Task 5.1 handles container creation. This task only adds the parameter-override logic around the `workflow.query()` call.

The Container and QueryWorkflow are reused across requests for the same collection (avoiding expensive re-initialization). The save/restore pattern ensures overrides do not leak between requests.

## Error Categories and HTTP Status Codes

| Error Condition                     | Status | Response Body                                     |
|-------------------------------------|--------|----------------------------------------------------|
| Missing/empty question              | 400    | `{ error: "Question is required..." }`             |
| Invalid topK type                   | 400    | `{ error: "topK must be a number" }`               |
| Invalid topK range                  | 400    | `{ error: "Top-K must be between 1 and 10" }`      |
| Invalid temperature type            | 400    | `{ error: "temperature must be a number" }`        |
| Invalid temperature range           | 400    | `{ error: "Temperature must be between 0 and 2" }` |
| No embeddings in collection         | 400    | `{ error: "No embeddings found..." }`              |
| LLM API failure                     | 500    | `{ error: "Query workflow failed: ..." }`          |

## Dependencies

- **Depends on:** Task 5.1 (query route skeleton must exist)
- **No dependency from:** Other tasks; this is self-contained parameter wiring

## Files Modified

| File | Change |
|------|--------|
| `src/server/routes/query.ts` | Add parameter extraction, save/restore pattern, type+range validation error handling |

No other files are modified. The approach deliberately avoids touching QueryWorkflow, QuerySettings, or Container.
