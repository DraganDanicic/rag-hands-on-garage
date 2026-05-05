# Task 3.2: Create Upload Route

## Summary

Create the Express route handler at `src/server/routes/upload.ts` that implements `POST /api/collections/:name/upload`. This route accepts multipart PDF file uploads via the Multer middleware configured in task 3.1, stores files in `documents/temp-uploads/{collection}/`, and returns a structured JSON response with the list of uploaded files.

## Dependencies

- **Task 3.1** (Multer middleware configuration) -- this route imports and uses the Multer middleware from `src/server/middleware/upload.ts`
- **Task 1.2** (directory structure) -- `src/server/routes/` directory must exist

## What Changes

### New File: `src/server/routes/upload.ts`

An Express Router module that:

1. **Extracts the collection name** from the `:name` route parameter
2. **Applies the Multer middleware** from task 3.1 to handle multipart form parsing
3. **Ensures the destination directory** `documents/temp-uploads/{collection}/` exists (creates it if missing using `fs.mkdirSync` with `recursive: true`)
4. **Returns a 200 JSON response** on success with the format:
   ```json
   {
     "files": ["report.pdf", "guide.pdf"],
     "count": 2,
     "message": "Successfully uploaded 2 file(s) to collection 'default'"
   }
   ```
5. **Returns a 400 JSON response** when no files are uploaded:
   ```json
   {
     "error": "No files uploaded"
   }
   ```
6. **Handles Multer errors** (file type rejection, size limit exceeded) and returns appropriate 400/413 responses with descriptive error messages

### Integration Point

The router is exported as a default or named export and mounted by `server.ts` at the path `/api/collections/:name/upload`.

## Scope Boundaries

**In scope:**
- Route handler logic (parameter extraction, response formatting, error handling)
- Directory creation for the collection's temp-uploads folder
- Multer error interception and user-friendly error responses
- Exporting the router for mounting in server.ts

**Out of scope:**
- Multer configuration itself (task 3.1)
- Server.ts setup and route mounting (task 2.1)
- File validation logic beyond what Multer provides (task 3.4)
- Cleanup of temp-uploads directory (task 3.3)

## Acceptance Criteria

1. `POST /api/collections/default/upload` with valid PDF files returns 200 with `{files, count, message}`
2. `POST /api/collections/project-a/upload` stores files under `documents/temp-uploads/project-a/`
3. Request with no files returns 400 with `{error: "No files uploaded"}`
4. Non-PDF file rejection (from Multer filter) returns 400 with descriptive error
5. File exceeding 50MB limit returns 413 with size limit error
6. Collection directory is created automatically if it does not exist
7. The route module exports an Express Router that can be mounted at any path
