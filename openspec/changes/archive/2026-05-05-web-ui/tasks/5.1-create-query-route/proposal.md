# Task 5.1: Create Query Route

## Summary

Create `src/server/routes/query.ts` implementing `POST /api/collections/:name/query`. This route accepts a user question (with optional `topK` and `temperature` overrides), instantiates a DI Container for the specified collection, runs the QueryWorkflow, and returns the LLM answer as JSON.

## Motivation

The query endpoint is the core interaction point of the web UI -- it connects the browser chat interface to the existing RAG pipeline. The route must reuse the existing `QueryWorkflow` and `Container` without duplicating any business logic, following the design principle of "Express routes instantiate Container and call workflows" (Decision 6 in design.md).

## Scope

### In Scope

- Express Router module exporting a single POST route at `/:name/query`
- Request body validation (require `question`, optional `topK` and `temperature`)
- Collection name extraction from URL parameter `:name`
- Container instantiation and async initialization per request
- QuerySettings override from request body before workflow execution
- QueryWorkflow construction and invocation
- JSON response with `answer` field (and optional `chunks` metadata)
- Error handling: 400 for missing question or empty embeddings, 500 for API/internal failures
- Consistent error response shape `{ error: string }`

### Out of Scope

- Authentication/authorization (single-user local deployment)
- Request rate limiting
- Response streaming/SSE (query is a synchronous request-response)
- Conversation history across requests (each request is stateless; history is a future enhancement)
- Collection existence validation (the workflow itself throws descriptive errors)

## Constraints

- Must use ES module imports with `.js` extensions per project convention
- Must follow the existing service isolation architecture (no direct service imports, only through Container)
- Route file exports an Express Router, mounted by the server at `/api/collections`
- Container is created per-request with the collection name to ensure correct embeddings path
- Must call `container.initialize()` before using any services (async init for PromptBuilder, QuerySettings)

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Container creation per request adds latency | Medium -- each request re-reads settings files and template | Acceptable for single-user; future optimization: cache containers by collection name |
| Large embedding files slow down load on every query | Medium -- JSON parse of 20MB+ files | EmbeddingStore already handles this; future: add in-memory cache at server level |
| Concurrent requests to same collection could conflict | Low -- single-user assumption | No mitigation needed for MVP |
| LLM Farm API timeout causes hanging request | Medium -- default Express timeout may be too short | Set explicit request timeout; wrap workflow call in try/catch |

## Dependencies

- Task 2.1 (Express app setup in server.ts) -- provides the Express app that mounts this router
- Task 2.3 (Error handling middleware) -- provides fallback error handling for unhandled exceptions
- Existing `Container` class (`src/di/Container.ts`)
- Existing `QueryWorkflow` class (`src/workflows/QueryWorkflow.ts`)
- Existing `IQuerySettings` interface for parameter overrides
