## ADDED Requirements

### Requirement: Server-Sent Events implementation
The system SHALL implement SSE to stream real-time progress updates from the server to the browser during indexing operations.

#### Scenario: Establish SSE connection
- **WHEN** user initiates indexing via POST to `/api/collections/:name/index`
- **THEN** the server SHALL respond with `Content-Type: text/event-stream`
- **AND** keep the connection open for streaming events

#### Scenario: Close connection on completion
- **WHEN** indexing completes or encounters an error
- **THEN** the server SHALL send a final completion or error event
- **AND** close the SSE connection

### Requirement: Progress event format
The system SHALL send progress events in a structured JSON format.

#### Scenario: Send progress update
- **WHEN** indexing processes a chunk
- **THEN** the server SHALL send an SSE event with data:
  ```json
  {
    "type": "progress",
    "current": 10,
    "total": 100,
    "message": "Processing chunk 10/100...",
    "percentage": 10
  }
  ```

#### Scenario: Send completion event
- **WHEN** indexing completes successfully
- **THEN** the server SHALL send an event with data:
  ```json
  {
    "type": "complete",
    "embeddings": 250,
    "message": "Indexing complete! 250 embeddings generated."
  }
  ```

#### Scenario: Send error event
- **WHEN** indexing encounters an error
- **THEN** the server SHALL send an event with data:
  ```json
  {
    "type": "error",
    "message": "Failed to process chunk: <error details>"
  }
  ```

### Requirement: ProgressReporter adapter
The system SHALL provide an SSE-compatible adapter for the existing ProgressReporter service.

#### Scenario: Capture progress calls
- **WHEN** IndexingWorkflow calls `progressReporter.progress(current, total, message)`
- **THEN** the SSE adapter SHALL convert it to an SSE event
- **AND** send it to the connected browser client

#### Scenario: Capture success messages
- **WHEN** workflow calls `progressReporter.success(message)`
- **THEN** the adapter SHALL send a completion event

#### Scenario: Capture error messages
- **WHEN** workflow calls `progressReporter.error(message)`
- **THEN** the adapter SHALL send an error event

### Requirement: Client-side EventSource handling
The browser SHALL use the EventSource API to receive and process SSE events.

#### Scenario: Connect to event stream
- **WHEN** user clicks "Index Documents" button
- **THEN** the browser SHALL create an EventSource connected to `/api/collections/:name/index`
- **AND** listen for incoming events

#### Scenario: Update progress bar
- **WHEN** browser receives a progress event
- **THEN** the UI SHALL update the progress bar to reflect current/total percentage
- **AND** display the progress message

#### Scenario: Show completion
- **WHEN** browser receives a completion event
- **THEN** the UI SHALL hide the progress bar
- **AND** display a success message with embedding count
- **AND** close the EventSource connection

#### Scenario: Handle errors
- **WHEN** browser receives an error event
- **THEN** the UI SHALL display the error message
- **AND** hide the progress bar
- **AND** close the EventSource connection

### Requirement: Connection error handling
The system SHALL handle SSE connection failures gracefully.

#### Scenario: Connection lost during indexing
- **WHEN** SSE connection drops mid-operation
- **THEN** the browser SHALL detect the disconnection
- **AND** display "Connection lost. Refreshing..." message
- **AND** attempt to reconnect or poll for status

#### Scenario: Server timeout
- **WHEN** no events are received for 60 seconds
- **THEN** the browser SHALL show a warning "Indexing may be taking longer than expected..."
- **AND** keep the connection open

### Requirement: Incremental checkpoint events
The system SHALL send progress events at meaningful checkpoints during indexing.

#### Scenario: Report every N chunks
- **WHEN** indexing processes every 10 chunks
- **THEN** the server SHALL send a progress event
- **AND** avoid flooding the connection with excessive events

#### Scenario: Report incremental saves
- **WHEN** embeddings are saved incrementally (every 50 chunks)
- **THEN** the server SHALL send a checkpoint event indicating data has been persisted
