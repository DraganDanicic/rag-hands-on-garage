# Task 6.3: Implement DELETE /api/collections/:name Endpoint

## Summary

Add a DELETE endpoint to the collections route that removes a collection's embeddings and chunks files from the filesystem, returning appropriate HTTP status codes for success and not-found cases.

## Motivation

The web UI needs to let users remove collections they no longer need. The spec requires a DELETE endpoint at `/api/collections/:name` that deletes both the embeddings JSON file and the chunks JSON file for the named collection, returning 200 on success or 404 if the collection does not exist.

## Scope

### In Scope

- Add a DELETE route handler in `src/server/routes/collections.ts`
- Extract collection name from the `:name` URL parameter
- Delegate to `ICollectionManager.deleteCollection()` for file removal
- Return 200 with a JSON confirmation message on success
- Return 404 with a JSON error message when the collection does not exist
- Return 500 with a JSON error message for unexpected filesystem errors
- Validate the collection name parameter (reject empty or obviously invalid names)

### Out of Scope

- Client-side confirmation dialog (handled by frontend in task 13.1)
- Preventing deletion of the active collection (handled by frontend in task 13.3)
- Authentication or authorization checks (out of scope per design.md)
- Cascading cleanup of temp-uploads or other derived data

## Dependencies

- **Task 6.1** (Create collections route file): The route file must exist before adding the DELETE handler
- **CollectionManager service**: Already implements `deleteCollection(name)` and `collectionExists(name)` -- no changes needed to the service layer

## Approach

1. In the collections route file (created by task 6.1), add a DELETE handler for `/:name`
2. Extract the `name` parameter from `req.params`
3. Validate that the name is non-empty and contains only safe characters (alphanumeric, hyphens, underscores, dots)
4. Call `collectionManager.deleteCollection(name)` which handles both embeddings and chunks file deletion
5. Catch the "not found" error thrown by `deleteCollection` and map it to a 404 response
6. Catch unexpected errors and map them to a 500 response
7. On success, return `{ message: "Collection 'name' deleted" }` with status 200

## Estimated Effort

Small -- single route handler, ~30 lines of code. The heavy lifting (file deletion, existence checks) is already implemented in CollectionManager.
