# Task 7.4: Design -- Settings Validation

## Overview

A validation utility module at `src/server/utils/settingsValidation.ts` that exports a pure `validateSettings` function and a `SETTINGS_CONSTRAINTS` constant. The PUT `/api/settings` route handler calls `validateSettings()` before persisting any changes, returning 400 with collected errors on failure.

## File Structure

```
src/server/utils/settingsValidation.ts   # New file -- validation logic and constraints
src/server/routes/settings.ts            # Modified -- add validation call in PUT handler
```

## Validation Constraints Constant

A single source of truth for all validation rules, exported for potential reuse by the frontend or tests:

```typescript
// src/server/utils/settingsValidation.ts

export const SETTINGS_CONSTRAINTS = {
  chunkSize: {
    min: 100,
    max: 2000,
    type: 'integer' as const,
    label: 'Chunk size',
  },
  chunkOverlap: {
    min: 0,
    max: null,  // Dynamic: must be < chunkSize
    type: 'integer' as const,
    label: 'Chunk overlap',
  },
  topK: {
    min: 1,
    max: 20,
    type: 'integer' as const,
    label: 'Top K',
  },
  temperature: {
    min: 0.0,
    max: 1.0,
    type: 'float' as const,
    label: 'Temperature',
  },
  maxTokens: {
    min: 100,
    max: 8192,
    type: 'integer' as const,
    label: 'Max tokens',
  },
} as const;
```

## Validation Result Structure

```typescript
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value: unknown;
}
```

When `valid` is `true`, `errors` is an empty array. When `valid` is `false`, `errors` contains one entry per invalid field. All fields are validated before returning (no early exit on first error), so the user sees all problems at once.

## Validation Function Signature

```typescript
export function validateSettings(
  updates: Record<string, unknown>,
  currentSettings: { chunkSize: number }
): ValidationResult
```

Parameters:
- `updates` -- the partial settings object from the request body (only fields being changed)
- `currentSettings` -- current configuration values needed for cross-field validation. Only `chunkSize` is required, used as reference when validating `chunkOverlap` without a simultaneous `chunkSize` update.

## Validation Rules

Each field is validated only if it is present in `updates`. The function iterates over known setting keys and applies rules:

### Per-Field Rules

| Field | Type Check | Range Check | Error Message Example |
|-------|-----------|-------------|----------------------|
| `chunkSize` | Must be integer | 100 - 2000 | "Chunk size must be an integer between 100 and 2000" |
| `chunkOverlap` | Must be integer | 0 - (chunkSize - 1) | "Chunk overlap must be less than chunk size (currently 500)" |
| `topK` | Must be integer | 1 - 20 | "Top K must be an integer between 1 and 20" |
| `temperature` | Must be number | 0.0 - 1.0 | "Temperature must be a number between 0.0 and 1.0" |
| `maxTokens` | Must be integer | 100 - 8192 | "Max tokens must be an integer between 100 and 8192" |

### Cross-Field Validation: chunkOverlap < chunkSize

When both `chunkSize` and `chunkOverlap` are in the update, use the new `chunkSize` as the reference. When only `chunkOverlap` is provided, use `currentSettings.chunkSize`. This ensures the constraint is always checked against the effective chunk size.

```typescript
const effectiveChunkSize = typeof updates.chunkSize === 'number'
  ? updates.chunkSize
  : currentSettings.chunkSize;

if (typeof updates.chunkOverlap === 'number' && updates.chunkOverlap >= effectiveChunkSize) {
  errors.push({
    field: 'chunkOverlap',
    message: `Chunk overlap must be less than chunk size (${effectiveChunkSize})`,
    value: updates.chunkOverlap,
  });
}
```

### Type Validation Logic

For integer fields, check `Number.isInteger(value)`. For float fields, check `typeof value === 'number' && !isNaN(value)`. Unknown fields in `updates` that are not in `SETTINGS_CONSTRAINTS` are silently ignored (the PUT handler already filters to known keys).

## Integration into PUT Handler

The validation call is added at the top of the PUT handler, before any persistence logic:

```typescript
// src/server/routes/settings.ts -- PUT handler

router.put('/', async (req: Request, res: Response) => {
  const updates = req.body;

  // 1. Validate before persisting
  const currentSettings = { chunkSize: configService.getChunkSize() };
  const validation = validateSettings(updates, currentSettings);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.errors,
    });
  }

  // 2. Persist settings (existing logic from task 7.3)
  // ...
});
```

### Error Response Format (400)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "chunkSize",
      "message": "Chunk size must be an integer between 100 and 2000",
      "value": 50000
    },
    {
      "field": "chunkOverlap",
      "message": "Chunk overlap must be less than chunk size (500)",
      "value": 600
    }
  ]
}
```

The `error` field is a summary string. The `details` array provides per-field information that the frontend can map to inline error messages next to each input field.

## Implementation Detail

### validateSettings Function Body

```typescript
export function validateSettings(
  updates: Record<string, unknown>,
  currentSettings: { chunkSize: number }
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate each known field if present
  for (const [field, constraint] of Object.entries(SETTINGS_CONSTRAINTS)) {
    if (!(field in updates)) continue;

    const value = updates[field];

    // Type check
    if (typeof value !== 'number' || isNaN(value as number)) {
      errors.push({
        field,
        message: `${constraint.label} must be a valid number`,
        value,
      });
      continue;  // Skip range check if type is wrong
    }

    // Integer check for integer fields
    if (constraint.type === 'integer' && !Number.isInteger(value)) {
      errors.push({
        field,
        message: `${constraint.label} must be an integer`,
        value,
      });
      continue;
    }

    // Range check (min)
    if (constraint.min !== null && (value as number) < constraint.min) {
      errors.push({
        field,
        message: `${constraint.label} must be at least ${constraint.min}`,
        value,
      });
      continue;
    }

    // Range check (max) -- skip if max is null (dynamic constraint)
    if (constraint.max !== null && (value as number) > constraint.max) {
      errors.push({
        field,
        message: `${constraint.label} must be at most ${constraint.max}`,
        value,
      });
    }
  }

  // Cross-field: chunkOverlap < chunkSize
  if ('chunkOverlap' in updates && typeof updates.chunkOverlap === 'number') {
    const effectiveChunkSize = typeof updates.chunkSize === 'number'
      ? updates.chunkSize
      : currentSettings.chunkSize;

    // Only check if chunkOverlap passed basic validation above
    const hasOverlapError = errors.some(e => e.field === 'chunkOverlap');
    if (!hasOverlapError && updates.chunkOverlap >= effectiveChunkSize) {
      errors.push({
        field: 'chunkOverlap',
        message: `Chunk overlap must be less than chunk size (${effectiveChunkSize})`,
        value: updates.chunkOverlap,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

## Testing Considerations

Unit tests for `validateSettings` should cover:
- Each field individually: valid value, below min, above max, wrong type, float for integer field
- Cross-field: overlap < chunkSize with both fields present, overlap only (uses currentSettings), chunkSize reduction making existing overlap invalid
- Partial updates: only one field in updates, missing fields are not validated
- Empty updates object: returns valid
- Unknown fields: silently ignored, returns valid
- Multiple errors: all collected and returned together

Tests belong in `tests/server/utils/settingsValidation.test.ts`.
