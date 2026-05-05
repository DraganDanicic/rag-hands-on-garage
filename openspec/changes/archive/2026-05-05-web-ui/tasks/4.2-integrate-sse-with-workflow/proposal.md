# Task 4.2: Integrate SSEProgressReporter with IndexingWorkflow in Indexing Route

## Summary

Wire the SSEProgressReporter (task 2.4) into the indexing route so that when a browser triggers document indexing via `POST /api/collections/:name/index`, all progress events from `IndexingWorkflow` flow through SSE to the browser in real time.

## Problem

The indexing route (task 4.1) establishes the HTTP endpoint and SSE response headers, but does not yet connect the SSEProgressReporter to the IndexingWorkflow. Without this integration, the browser receives no progress feedback during indexing.

The existing architecture already supports this: `IndexingWorkflow` accepts an `IProgressReporter` via constructor injection, and `SSEProgressReporter` implements `IProgressReporter`. The remaining work is to instantiate them together correctly in the route handler.

## Approach

**Do not modify the DI Container.** The CLI entry point (`generate-embeddings.ts`) already demonstrates the pattern: it pulls services from the Container individually and passes them to the `IndexingWorkflow` constructor. The indexing route will follow the same pattern, substituting `SSEProgressReporter` for the Container's default `ConsoleProgressReporter`.

The route handler will:
1. Set up SSE response headers
2. Create a `Container` for the requested collection and initialize it
3. Instantiate `SSEProgressReporter` with the Express `Response` object
4. Construct `IndexingWorkflow` with services from the Container but with the SSE reporter injected in place of the default
5. Call `workflow.execute()` -- progress events automatically flow to the browser
6. On completion, send a final `complete` event and end the response
7. On error, send an `error` event and end the response

## Dependencies

- **Task 2.4** (SSEProgressReporter): Must be implemented first -- provides the `SSEProgressReporter` class
- **Task 4.1** (Indexing route): The route file where this integration lives

## Scope

### In scope
- Instantiating SSEProgressReporter with the Express Response object in the indexing route handler
- Constructing IndexingWorkflow with the SSE reporter instead of the default console reporter
- Sending a final `complete` event with embedding count after `workflow.execute()` resolves
- Sending an `error` event if `workflow.execute()` rejects
- Handling client disconnect (request abort) gracefully

### Out of scope
- Modifying `Container` or `IContainer` (no changes needed)
- Modifying `IndexingWorkflow` (already accepts IProgressReporter)
- Modifying `SSEProgressReporter` (already implemented in task 2.4)
- Frontend EventSource handling (task 11.2)
- SSE event format details (defined in task 2.4 / 4.3)

## Risks

- **Long-running request timeout**: Express or reverse proxies may time out during large indexing jobs. Mitigate by setting `req.setTimeout(0)` to disable the Node.js socket timeout for this route.
- **Client disconnect mid-indexing**: If the browser closes the connection, the workflow continues but SSE writes will fail silently. The `res.on('close')` handler should set a flag so SSEProgressReporter can avoid writing to a closed stream.
- **Container initialization failure**: If `.env` is misconfigured, `container.initialize()` will throw before any SSE events are sent. The route should catch this and return a standard HTTP error (not SSE) since the SSE stream has not started yet.
