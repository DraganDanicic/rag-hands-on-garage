# Task 5.2: Integrate QueryWorkflow with Request Parameters

## Problem

The query route (task 5.1) accepts HTTP requests with `question`, `topK`, and `temperature` fields. However, `QueryWorkflow.query(question)` only takes a question string. The `topK` and `temperature` values are read internally from `IQuerySettings`, which is initialized once at container creation time from persisted defaults.

The web UI needs per-request parameter overrides: a user may send `{"question": "What is RAG?", "topK": 5, "temperature": 0.3}` and expect those values to apply to that specific query without permanently changing the server's stored settings.

## Analysis

### How It Works Today (CLI)

1. `Container` constructor creates `QuerySettings` from `ConfigService` defaults
2. `container.initialize()` calls `querySettings.initialize()` which loads persisted JSON
3. CLI users change settings via `/set topK 5` command, which calls `querySettings.setTopK(5)` + `querySettings.save()`
4. `QueryWorkflow.query()` reads `querySettings.getTopK()` and `querySettings.getTemperature()` internally
5. Settings are mutable singletons scoped to the Container instance

### The Gap

- `QueryWorkflow` has no way to accept per-query overrides
- Calling `querySettings.setTopK()` before each query would mutate shared state (problematic if concurrent requests arrive)
- Calling `querySettings.save()` for per-request overrides would permanently change defaults (wrong semantics)
- Creating a new `Container` per request is expensive (loads embeddings, initializes all services)

### Existing Infrastructure

`IQuerySettings` already has:
- `setTopK(value)`, `setTemperature(value)`, `setMaxTokens(value)` with built-in validation (range checking via `QUERY_SETTINGS_CONSTRAINTS`)
- `getAllSettings()` that returns a snapshot copy
- Validation constraints: topK [1-10], temperature [0.0-2.0], maxTokens [100-8000]

## Proposed Approach

**Use QuerySettings setters as temporary per-request overrides (save/restore pattern).**

In the query route handler:
1. Snapshot current settings via `getAllSettings()`
2. Apply request overrides using existing validated setters (`setTopK`, `setTemperature`)
3. Call `workflow.query(question)`
4. Restore original settings from snapshot (in a `finally` block)
5. Do NOT call `save()` -- overrides are transient

This approach:
- Requires zero changes to `QueryWorkflow` or `IQuerySettings` interfaces
- Reuses existing validation logic in the setters
- Keeps the workflow interface clean (`query(question)` stays simple)
- Works correctly for single-user deployment (no concurrency concern per L1 constraints)
- Route handler owns the override lifecycle, not the workflow

### Why Not Modify QueryWorkflow.query() Signature?

Adding an optional params argument to `query()` would require:
- Changing the workflow interface (breaks architectural boundary)
- Duplicating validation logic already in QuerySettings
- Touching every caller (CLI chat loop uses the same workflow)

The save/restore pattern avoids all of this.

### Concurrency Note

The L1 design explicitly states single-user local deployment. If concurrent requests become a concern later, the solution is to create per-request Container instances or add request-scoped DI -- not to complicate the workflow interface now.

## Scope

**Files to create/modify:**
- `src/server/routes/query.ts` (created in 5.1, modified here to add parameter integration)

**Files NOT modified:**
- `src/workflows/QueryWorkflow.ts` -- no changes
- `src/services/query-settings/QuerySettings.ts` -- no changes
- `src/services/query-settings/IQuerySettings.ts` -- no changes
- `src/di/Container.ts` -- no changes

## Validation

- Request with `topK` and `temperature` uses those values for the query
- Request without those fields uses current QuerySettings defaults
- Invalid values (topK=0, temperature=5.0) return 400 with validation error message
- After a request with overrides, the next request without overrides uses original defaults (no state leak)
