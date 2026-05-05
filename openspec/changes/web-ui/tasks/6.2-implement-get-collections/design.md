# Task 6.2: Design -- GET /api/collections

## Implementation Plan

### File to Modify

`src/server/routes/collections.ts` (created by task 6.1)

### Route Registration

```typescript
router.get('/', async (req, res, next) => { ... });
```

The route is mounted at `/api/collections` by the server setup (task 6.1), so the handler path is `/`.

### Step-by-Step Logic

1. **Get CollectionManager from container**
   - The route file receives the DI container (or the `ICollectionManager` directly) via module-level injection or a factory pattern established in task 6.1.
   - Call `collectionManager.listCollections()`.

2. **For each CollectionInfo, resolve chunk count**
   - `CollectionInfo` provides `chunksExists: boolean` and `chunksPath: string`.
   - If `chunksExists` is true, read and parse the chunks JSON file to get the array length.
   - If `chunksExists` is false, chunk count is 0.
   - Use `fs.promises.readFile` + `JSON.parse` + `.length`.
   - Wrap in try/catch -- if the file cannot be read (race condition, corruption), default chunk count to 0.

3. **Map to response format**
   ```typescript
   const response = collections.map(c => ({
     name: c.name,
     embeddings: c.embeddingCount,
     chunks: chunkCounts[c.name] ?? 0,
     size: c.fileSizeBytes,
     lastModified: c.lastModified.toISOString(),
   }));
   ```

4. **Return response**
   ```typescript
   res.json(response);
   ```

5. **Error handling**
   - `listCollections()` already returns `[]` when the collections directory does not exist.
   - Any unexpected error propagates to the Express error middleware (task 2.3).

### Chunk Count Helper

Extract a small helper function to keep the route handler clean:

```typescript
async function getChunkCount(chunksPath: string, exists: boolean): Promise<number> {
  if (!exists) return 0;
  try {
    const content = await fs.readFile(chunksPath, 'utf-8');
    const chunks = JSON.parse(content);
    return Array.isArray(chunks) ? chunks.length : 0;
  } catch {
    return 0;
  }
}
```

### Performance Consideration

Reading and parsing every chunks JSON file on each request could be slow for many/large collections. For the current scope (single-user, few collections, training project) this is acceptable. If it becomes a bottleneck:
- Cache chunk counts in memory with a TTL
- Or add `chunkCount` to the embeddings file metadata
- Or add `chunkCount` to `CollectionInfo` in the service layer

### Container Access Pattern

The route needs access to the `ICollectionManager`. Two approaches depending on what task 6.1 establishes:

**Approach A -- Container passed to route factory:**
```typescript
// collections.ts
export function createCollectionsRouter(container: IContainer): Router {
  const router = Router();
  const collectionManager = container.getCollectionManager();
  // ... routes use collectionManager
  return router;
}
```

**Approach B -- Standalone CollectionManager injection:**
```typescript
export function createCollectionsRouter(collectionManager: ICollectionManager): Router {
  const router = Router();
  // ... routes use collectionManager
  return router;
}
```

Either works. Approach A is more flexible (route can access other services later). Approach B follows stricter dependency injection. Follow whichever pattern task 6.1 establishes.

### Error Scenarios

| Scenario | Behavior |
|---|---|
| No collections directory | Returns `[]` (handled by CollectionManager) |
| Corrupted embeddings file | Collection skipped (CollectionManager logs warning) |
| Chunks file missing despite `chunksExists: true` | Chunk count defaults to 0 |
| Unexpected error | 500 via error middleware |

### Testing Approach

Unit test the route handler with a mocked `ICollectionManager`:

1. **Empty collections** -- mock returns `[]`, verify response is `[]`
2. **Multiple collections** -- mock returns 2+ CollectionInfo objects, verify mapping
3. **Chunk count resolution** -- mock filesystem reads for chunk files
4. **Error handling** -- mock throws, verify 500 response

Test file: `tests/server/routes/collections.test.ts`
