# Task 4.3: Implement SSE Event Streaming

## Summary

Implement the `SSEProgressReporter` class that adapts the existing `IProgressReporter` interface to Server-Sent Events. This class writes SSE-formatted JSON events to an Express `Response` object, enabling real-time indexing progress updates in the browser.

## Problem

The existing `IndexingWorkflow` communicates progress through `IProgressReporter`, which only has a console implementation (`ConsoleProgressReporter`). The web UI needs to receive these same progress updates over an HTTP connection. SSE is the chosen transport (L1 Decision 3), but the actual event formatting, serialization, and connection lifecycle logic does not yet exist.

## Scope

### In Scope

- `SSEProgressReporter` class implementing `IProgressReporter`
- SSE response header setup (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`)
- Three event types: `progress`, `complete`, `error`
- JSON serialization with `data:` prefix and double-newline terminator
- Connection lifecycle: headers on construction, `res.write()` for events, `res.end()` on terminal events
- Mapping all five `IProgressReporter` methods (`start`, `progress`, `success`, `error`, `info`) to SSE events
- Client disconnect detection via `res.on('close')`

### Out of Scope

- The indexing route handler (task 4.1 / 4.2)
- Client-side `EventSource` handling (task 11.x)
- Throttling / rate-limiting of events (handled at workflow level)
- Retry / reconnection logic (handled by browser `EventSource` natively)

## Approach

Create a single file `src/server/utils/SSEProgressReporter.ts` that:

1. Accepts an Express `Response` object in the constructor
2. Sets SSE headers immediately in the constructor
3. Implements each `IProgressReporter` method by writing a JSON event to the response
4. Calls `res.end()` after `success()` or `error()` to close the connection
5. Tracks connection state to avoid writing to a closed response
6. Exports the class and re-exports it from an `index.ts` barrel

## Success Criteria

- All five `IProgressReporter` methods are implemented
- Each event is a valid SSE message: `data: <JSON>\n\n`
- `progress` events include `type`, `current`, `total`, `percentage`, and `message` fields
- `complete` events include `type`, `embeddings` (from message parsing or separate param), and `message` fields
- `error` events include `type` and `message` fields
- Connection is closed exactly once after a terminal event
- Writing to a closed/disconnected response does not throw
- Unit tests verify event format, field presence, and lifecycle

## Dependencies

- **Upstream (must exist first):** `IProgressReporter` interface (already exists at `src/services/progress-reporter/IProgressReporter.ts`)
- **Downstream (depends on this):** Task 4.2 (integrate SSEProgressReporter with IndexingWorkflow in indexing route), Task 4.4 (error event handling)
- **No changes to existing code required** -- this is a new file implementing an existing interface
