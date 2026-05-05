## Context
Part of change: web-ui
Parent task: "2.4 Create SSEProgressReporter adapter in src/server/utils/SSEProgressReporter.ts implementing IProgressReporter"

## What
Implement `SSEProgressReporter`, a class that implements the existing `IProgressReporter` interface (`src/services/progress-reporter/IProgressReporter.ts`) and adapts its method calls into Server-Sent Events written to an Express `Response` object. This is the adapter that bridges the existing workflow progress reporting (designed for console output) to the browser via SSE.

The class maps each `IProgressReporter` method to a structured SSE event:
- `start(message)` sends a `{type: "start", message}` event
- `progress(current, total, message?)` sends a `{type: "progress", current, total, percentage, message}` event
- `success(message)` sends a `{type: "complete", message}` event and ends the response
- `error(message)` sends a `{type: "error", message}` event and ends the response
- `info(message)` sends a `{type: "info", message}` event

## Why
The IndexingWorkflow already calls `progressReporter.progress()`, `.success()`, `.error()`, etc. during embedding generation. By providing an SSE-compatible implementation of the same interface, the web server can inject this adapter into the workflow instead of the console reporter -- streaming real-time progress to the browser without modifying any workflow or service code.

This task is a prerequisite for task 4.2 (integrating SSEProgressReporter with the IndexingWorkflow in the indexing route) and task 11 (frontend progress bar rendering from SSE events).

## Scope
- In scope:
  - `SSEProgressReporter` class implementing all 5 methods of `IProgressReporter`
  - Setting SSE response headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`)
  - JSON-serialized SSE event format matching the spec (`data: {...}\n\n`)
  - Ending the response on `success()` or `error()` (terminal events)
  - Guard against writing to an already-closed response
  - Factory function export following the project's service export pattern
  - Unit tests for all 5 interface methods and edge cases

- Out of scope:
  - Express route setup (task 4.1)
  - Wiring SSEProgressReporter into the DI container or workflow (task 4.2)
  - Client-side EventSource handling (task 11.2)
  - SSE reconnection or keep-alive heartbeat logic (can be added later)
  - Throttling/debouncing of progress events (task 4.3 concern)
