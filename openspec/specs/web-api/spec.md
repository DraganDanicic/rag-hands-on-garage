## ADDED Requirements

### Requirement: Server initialization
The system SHALL provide an Express-based HTTP server that listens on a configurable port and serves both API endpoints and static frontend assets.

#### Scenario: Server starts successfully
- **WHEN** the server is started with `npm run server`
- **THEN** the server SHALL listen on the configured port (default: 3000)
- **AND** serve the frontend at the root path `/`
- **AND** log "Server running on http://localhost:3000"

#### Scenario: Port already in use
- **WHEN** the configured port is already occupied
- **THEN** the server SHALL fail to start with a clear error message indicating the port conflict

### Requirement: Upload documents endpoint
The system SHALL provide a POST endpoint at `/api/collections/:name/upload` that accepts multipart PDF file uploads.

#### Scenario: Successful upload
- **WHEN** user POSTs valid PDF files to `/api/collections/default/upload`
- **THEN** the server SHALL accept the files
- **AND** return a 200 status with JSON containing uploaded file names and count

#### Scenario: Invalid file type
- **WHEN** user uploads a non-PDF file
- **THEN** the server SHALL reject the upload with a 400 status
- **AND** return an error message indicating only PDFs are accepted

### Requirement: Index documents endpoint
The system SHALL provide a POST endpoint at `/api/collections/:name/index` that triggers document indexing and returns progress via Server-Sent Events.

#### Scenario: Indexing with progress updates
- **WHEN** user POSTs to `/api/collections/default/index`
- **THEN** the server SHALL execute the IndexingWorkflow
- **AND** stream progress events via SSE
- **AND** send a completion event when indexing finishes

#### Scenario: No documents to index
- **WHEN** collection has no uploaded documents
- **THEN** the server SHALL return a 400 status with error message

### Requirement: Query endpoint
The system SHALL provide a POST endpoint at `/api/collections/:name/query` that accepts questions and returns LLM responses.

#### Scenario: Successful query
- **WHEN** user POSTs `{"question": "What is RAG?"}` to `/api/collections/default/query`
- **THEN** the server SHALL execute the QueryWorkflow
- **AND** return a 200 status with JSON containing the answer text

#### Scenario: Query with custom parameters
- **WHEN** user includes `topK` and `temperature` in the request
- **THEN** the server SHALL apply those parameters to the query
- **AND** return results using the specified configuration

#### Scenario: Empty embeddings store
- **WHEN** collection has no indexed embeddings
- **THEN** the server SHALL return a 400 status with error message prompting user to index documents first

### Requirement: List collections endpoint
The system SHALL provide a GET endpoint at `/api/collections` that returns all available collections with metadata.

#### Scenario: Retrieve collections list
- **WHEN** user sends GET to `/api/collections`
- **THEN** the server SHALL return a 200 status with JSON array of collections
- **AND** each collection SHALL include name, embedding count, chunk count, and file size

### Requirement: Delete collection endpoint
The system SHALL provide a DELETE endpoint at `/api/collections/:name` that removes a collection and its associated data.

#### Scenario: Delete existing collection
- **WHEN** user sends DELETE to `/api/collections/project-a`
- **THEN** the server SHALL delete the embeddings and chunks files for that collection
- **AND** return a 200 status with confirmation message

#### Scenario: Delete non-existent collection
- **WHEN** user attempts to delete a collection that doesn't exist
- **THEN** the server SHALL return a 404 status with error message

### Requirement: CORS support
The system SHALL enable CORS headers to allow frontend requests from different origins during development.

#### Scenario: Browser makes cross-origin request
- **WHEN** frontend at different origin makes an API request
- **THEN** the server SHALL include appropriate CORS headers in the response
- **AND** allow the request to succeed

### Requirement: Error handling
The system SHALL provide consistent error responses across all endpoints.

#### Scenario: Internal server error
- **WHEN** an unexpected error occurs during request processing
- **THEN** the server SHALL return a 500 status
- **AND** return JSON with error message and stack trace (in development mode)

#### Scenario: Validation error
- **WHEN** request contains invalid parameters
- **THEN** the server SHALL return a 400 status with descriptive validation error message
