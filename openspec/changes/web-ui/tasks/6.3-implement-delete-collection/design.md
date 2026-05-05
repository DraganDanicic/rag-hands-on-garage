# Task 6.3: Design -- DELETE /api/collections/:name

## Route Handler

**File:** `src/server/routes/collections.ts`
**Method:** DELETE
**Path:** `/:name` (within the `/api/collections` router)

## Request / Response Contract

### Request

```
DELETE /api/collections/:name
```

No request body required.

**URL Parameter:**
- `name` (string, required) -- Collection name. Must match pattern `^[a-zA-Z0-9][a-zA-Z0-9._-]*$` (starts with alphanumeric, followed by alphanumeric, dots, underscores, or hyphens).

### Responses

**200 OK** -- Collection deleted successfully
```json
{
  "message": "Collection 'project-a' deleted"
}
```

**400 Bad Request** -- Invalid collection name
```json
{
  "error": "Invalid collection name. Use only letters, numbers, hyphens, underscores, and dots."
}
```

**404 Not Found** -- Collection does not exist
```json
{
  "error": "Collection 'nonexistent' not found"
}
```

**500 Internal Server Error** -- Unexpected filesystem error
```json
{
  "error": "Failed to delete collection: <error message>"
}
```

## Implementation Detail

### Handler Pseudocode

```typescript
router.delete('/:name', async (req: Request, res: Response) => {
  const { name } = req.params;

  // 1. Validate collection name format
  if (!isValidCollectionName(name)) {
    return res.status(400).json({
      error: 'Invalid collection name. Use only letters, numbers, hyphens, underscores, and dots.'
    });
  }

  try {
    // 2. Delegate to CollectionManager (handles existence check + file deletion)
    await collectionManager.deleteCollection(name);

    // 3. Return success
    return res.status(200).json({
      message: `Collection '${name}' deleted`
    });
  } catch (error) {
    // 4. Map "not found" errors to 404
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    // 5. Everything else is a 500
    return res.status(500).json({
      error: `Failed to delete collection: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});
```

### Name Validation Helper

```typescript
function isValidCollectionName(name: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name);
}
```

This prevents path traversal attacks (e.g., `../../etc/passwd`) and ensures the name maps cleanly to a filename.

## How CollectionManager.deleteCollection Works

The existing service (no changes needed) does the following:

1. Checks existence via `fs.access` on `{collectionsPath}/{name}.embeddings.json`
2. Throws `Error("Collection '{name}' not found")` if the file does not exist
3. Deletes `{collectionsPath}/{name}.embeddings.json` via `fs.unlink`
4. Attempts to delete `{chunksPath}/{name}.chunks.json` via `fs.unlink`, silently ignoring ENOENT (chunks file is optional)

**Files affected by deletion:**
- `data/collections/{name}.embeddings.json` (required, must exist)
- `data/chunks/{name}.chunks.json` (optional, deleted if present)

## Obtaining the CollectionManager Instance

The route handler needs access to `ICollectionManager`. Following the pattern established in task 6.1, the collections router module will receive the collection manager as a dependency, either:

- Via a factory function: `createCollectionsRouter(collectionManager: ICollectionManager): Router`
- Or by obtaining it from the DI Container: `container.getCollectionManager()`

The exact wiring depends on task 6.1's implementation. Either way, the DELETE handler calls `collectionManager.deleteCollection(name)` -- it does not interact with the filesystem directly.

## Security Considerations

- **Path traversal**: The name validation regex rejects `/`, `..`, and other dangerous characters
- **No authorization**: Per design.md, auth is out of scope (single-user local deployment)
- **Idempotency**: DELETE is not idempotent here -- calling it twice returns 404 on the second call. This is acceptable per HTTP semantics (the resource is gone)

## Testing Notes

Key scenarios to verify:

1. DELETE an existing collection returns 200 and both files are removed
2. DELETE a non-existent collection returns 404
3. DELETE a collection where only the embeddings file exists (no chunks file) returns 200
4. DELETE with an invalid name (e.g., `../etc`) returns 400
5. DELETE with an empty name returns 400 or is not matched by the route
