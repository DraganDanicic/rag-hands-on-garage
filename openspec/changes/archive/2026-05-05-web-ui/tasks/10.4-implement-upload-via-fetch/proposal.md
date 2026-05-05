## Context
Part of change: web-ui
Parent task: "10.4 Implement upload via fetch API with FormData to /api/collections/:name/upload"

## What
Implement the client-side JavaScript function that takes files (collected by drag-and-drop in task 10.1 or file input in task 10.2), constructs a `FormData` object, and sends them to the server via `fetch()` to `POST /api/collections/:name/upload`. The function reads the active collection name from the UI state, appends all selected files to the `FormData` under the `files` field, and handles the JSON response (success or error) to update the UI accordingly.

This is the bridge between the file selection UI (tasks 10.1-10.3) and the server-side upload route (task 3.2). It does not render the file list or progress indicators -- those are handled by tasks 10.3 and 10.5 respectively.

## Why
Without this function, selected files remain in the browser with no way to reach the server. The upload function is the core data-transfer mechanism that connects the frontend file selection experience to the backend Multer-based upload route. It must correctly construct FormData without manually setting `Content-Type` (the browser must set the multipart boundary), use the active collection name in the URL path, and translate the server's JSON response into UI state that downstream tasks (10.5) can display.

## Scope
- In scope:
  - `uploadFiles(files)` function that accepts a `FileList` or `File[]`
  - FormData construction with all files appended under the `files` field name
  - `fetch()` call to `POST /api/collections/{activeCollection}/upload` with no manually set `Content-Type` header
  - Reading the active collection name from the UI state (e.g., a global variable, DOM element, or state object)
  - Parsing the JSON response body (`{files, count, message}` on success, `{error}` on failure)
  - Returning a result object or calling callback functions so task 10.5 can display status
  - Disabling the upload button during the request to prevent duplicate submissions
  - Re-enabling the upload button after the request completes (success or failure)
  - Basic error handling for network failures (fetch rejection) and non-OK HTTP status codes

- Out of scope:
  - Drag-and-drop zone implementation (task 10.1)
  - File input element and click handler (task 10.2)
  - Rendering the selected file list before upload (task 10.3)
  - Progress bar or upload progress display (task 10.5)
  - Server-side upload handling (task 3.2)
  - Multer middleware configuration (task 3.1)
  - File type validation in the browser (task 10.2 handles pre-filtering; server enforces)
  - Triggering indexing after upload (task 11.1)
