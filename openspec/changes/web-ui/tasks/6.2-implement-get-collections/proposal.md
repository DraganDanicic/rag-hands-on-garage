# Task 6.2: Implement GET /api/collections endpoint

## Summary

Add a route handler for `GET /api/collections` that returns a JSON array of all available collections with metadata (name, embedding count, chunk count, file size). This endpoint delegates to the existing `CollectionManager.listCollections()` method, which already reads the filesystem and parses collection files.

## Context

- **Parent task group:** 6 -- Collection Management API
- **Dependency:** Task 6.1 (collections route file must exist at `src/server/routes/collections.ts`)
- **L1 spec reference:** `specs/web-api/spec.md` -- "List collections endpoint" requirement
- **L1 design reference:** `design.md` -- routes/collections.ts handles GET/DELETE /api/collections/:name

## What Already Exists

The `CollectionManager` service (`src/services/collection-manager/CollectionManager.ts`) already provides:

1. `listCollections(): Promise<CollectionInfo[]>` -- scans `data/collections/` for `*.embeddings.json` files, extracts collection names, and returns metadata for each.
2. `getCollectionInfo(name): Promise<CollectionInfo>` -- reads both the embeddings file and checks for a corresponding chunks file, returning:
   - `name` -- collection name (derived from filename)
   - `embeddingCount` -- number of embeddings (supports both legacy array and new `{settings, embeddings}` format)
   - `fileSizeBytes` -- file size from `fs.stat`
   - `lastModified` -- modification date from `fs.stat`
   - `chunksExists` -- whether a chunks file exists
   - `settings` -- optional chunk/embedding settings

The DI `Container` exposes `getCollectionManager()` which returns an `ICollectionManager` instance wired with the correct paths.

## What Needs to Be Built

A single Express route handler that:

1. Gets the `ICollectionManager` from the container
2. Calls `listCollections()`
3. Maps the `CollectionInfo[]` to the API response format (adding chunk count, which is not currently in `CollectionInfo`)
4. Returns the JSON response

## Gap: Chunk Count

The current `CollectionInfo` model has `chunksExists: boolean` but not a chunk count. The API spec requires `chunks` (count). Two options:

- **Option A (Preferred):** Read the chunks file in the route handler and count entries (`JSON.parse` the chunks array and take `.length`). This keeps the route self-contained without modifying the service.
- **Option B:** Add `chunkCount` to `CollectionInfo` and update `CollectionManager.getCollectionInfo()`. Cleaner but touches more files and the service interface.

Recommendation: Start with Option A for simplicity. If chunk count is needed elsewhere later, refactor into the service.

## Response Format

```json
[
  {
    "name": "project-a",
    "embeddings": 250,
    "chunks": 310,
    "size": 2048576,
    "lastModified": "2026-05-01T10:30:00.000Z"
  }
]
```

- `name`: string -- collection name
- `embeddings`: number -- count of embedding vectors
- `chunks`: number -- count of text chunks (0 if no chunks file)
- `size`: number -- embeddings file size in bytes
- `lastModified`: string -- ISO 8601 timestamp of last modification

## Scope

- One route handler function (GET /api/collections)
- No new services or models
- No changes to existing services
- Error handling: return `[]` when collections directory does not exist (CollectionManager already handles this), return 500 on unexpected errors

## Out of Scope

- DELETE endpoint (task 6.3)
- Collection detail endpoint (GET /api/collections/:name)
- Pagination or filtering
- Caching of collection metadata
