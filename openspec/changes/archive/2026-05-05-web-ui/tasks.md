## 1. Project Setup

- [x] 1.1 Add Express dependencies to package.json (express, multer, cors, @types)
- [x] 1.2 Create directory structure (src/server/, public/, documents/temp-uploads/)
- [x] 1.3 Add npm scripts for building and running server
- [x] 1.4 Configure TypeScript build for server code

## 2. Server Infrastructure

- [x] 2.1 Create Express app setup in src/server/server.ts with basic configuration
- [x] 2.2 Implement CORS middleware in src/server/middleware/cors.ts
- [x] 2.3 Implement error handling middleware in src/server/middleware/error.ts
- [x] 2.4 Create SSEProgressReporter adapter in src/server/utils/SSEProgressReporter.ts implementing IProgressReporter

## 3. File Upload Capability

- [x] 3.1 Configure Multer middleware in src/server/middleware/upload.ts with file type and size validation
- [x] 3.2 Create upload route in src/server/routes/upload.ts for POST /api/collections/:name/upload
- [x] 3.3 Implement temporary upload directory creation per collection
- [x] 3.4 Add file validation logic (PDF type, 50MB limit) and error responses

## 4. Indexing with Server-Sent Events

- [x] 4.1 Create indexing route in src/server/routes/indexing.ts for POST /api/collections/:name/index
- [x] 4.2 Integrate SSEProgressReporter with IndexingWorkflow in indexing route
- [x] 4.3 Implement SSE event streaming (progress, complete, error events)
- [x] 4.4 Handle indexing errors and send error events via SSE
- [x] 4.5 Test SSE connection lifecycle (connect, stream, close)

## 5. Query API

- [x] 5.1 Create query route in src/server/routes/query.ts for POST /api/collections/:name/query
- [x] 5.2 Integrate QueryWorkflow with request parameters (question, topK, temperature)
- [x] 5.3 Return JSON response with answer text and optional metadata
- [x] 5.4 Handle query errors (empty embeddings, API failures) and return appropriate status codes

## 6. Collection Management API

- [x] 6.1 Create collections route in src/server/routes/collections.ts
- [x] 6.2 Implement GET /api/collections endpoint to list all collections with metadata
- [x] 6.3 Implement DELETE /api/collections/:name endpoint to remove collection data
- [x] 6.4 Add collection metadata extraction (embedding count, chunk count, file size)

## 7. Settings API

- [x] 7.1 Create settings route in src/server/routes/settings.ts
- [x] 7.2 Implement GET /api/settings endpoint to retrieve current configuration
- [x] 7.3 Implement PUT /api/settings endpoint to update configuration
- [x] 7.4 Add settings validation (chunk size range, overlap < chunk size, etc.)
- [x] 7.5 Persist settings changes to ConfigService or settings file

## 8. Frontend UI - HTML Structure

- [x] 8.1 Create public/index.html with base HTML structure
- [x] 8.2 Add sidebar layout for collection picker and upload zone
- [x] 8.3 Add main chat interface area with message list and input form
- [x] 8.4 Add collapsible settings panel with configuration inputs
- [x] 8.5 Add CSS styling for layout, colors, and responsive design

## 9. Frontend UI - Chat Interface

- [x] 9.1 Implement JavaScript for fetching and displaying collections list
- [x] 9.2 Implement collection selection and localStorage persistence
- [x] 9.3 Implement chat message display with user/assistant styling
- [x] 9.4 Implement question submission via fetch API to /api/collections/:name/query
- [x] 9.5 Add loading states and error message display
- [x] 9.6 Implement auto-scroll to latest message
- [x] 9.7 Add clear conversation button functionality

## 10. Frontend UI - File Upload

- [x] 10.1 Implement drag-and-drop file upload zone with visual feedback
- [x] 10.2 Implement file selection via click with multiple file support
- [x] 10.3 Display selected files list before upload
- [x] 10.4 Implement upload via fetch API with FormData to /api/collections/:name/upload
- [x] 10.5 Show upload progress and success/error messages

## 11. Frontend UI - Indexing Progress

- [x] 11.1 Implement "Index Documents" button that triggers POST to /api/collections/:name/index
- [x] 11.2 Create EventSource connection for SSE progress streaming
- [x] 11.3 Implement progress bar updates from SSE progress events
- [x] 11.4 Handle SSE complete and error events
- [x] 11.5 Close EventSource connection properly on completion or error
- [x] 11.6 Refresh collections list after successful indexing

## 12. Frontend UI - Settings Panel

- [x] 12.1 Implement settings panel toggle (show/hide)
- [x] 12.2 Load current settings from GET /api/settings on panel open
- [x] 12.3 Implement input fields for chunk size, chunk overlap, topK, temperature, max tokens
- [x] 12.4 Add real-time validation feedback for settings inputs
- [x] 12.5 Implement save settings via PUT /api/settings
- [x] 12.6 Add reset to defaults button functionality

## 13. Frontend UI - Collection Management

- [x] 13.1 Implement delete collection button with confirmation dialog
- [x] 13.2 Handle delete via DELETE /api/collections/:name and update UI
- [x] 13.3 Prevent deleting active collection
- [x] 13.4 Add refresh collections button
- [x] 13.5 Display collection metadata (embedding count, chunk count, size)

## 14. Integration Testing

- [x] 14.1 Test full workflow: upload PDFs → index → query
- [x] 14.2 Test collection switching and management
- [x] 14.3 Test settings modification and persistence
- [x] 14.4 Test error scenarios (invalid files, empty collection, API failures)
- [x] 14.5 Test SSE progress streaming with multiple concurrent clients
- [x] 14.6 Verify CLI commands still work unchanged

## 15. Documentation

- [x] 15.1 Update README.md with web UI usage instructions
- [x] 15.2 Add npm script documentation for starting server
- [x] 15.3 Document API endpoints in README or separate API.md file
- [x] 15.4 Add troubleshooting section for common issues
- [x] 15.5 Update CLAUDE.md with web UI architecture information
