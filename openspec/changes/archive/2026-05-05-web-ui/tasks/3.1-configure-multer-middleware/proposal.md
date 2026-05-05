# Task 3.1: Configure Multer Middleware

## Context

The web UI change adds an Express server layer on top of the existing RAG workflows. Users will upload PDF documents through the browser, and those files need to be received, validated, and stored on disk before the indexing workflow processes them.

Multer is the chosen middleware for handling multipart/form-data uploads (Decision 4 in the L1 design). This task creates the Multer configuration module that other routes (specifically the upload route in task 3.2) will import and use.

**Upstream dependencies:** Task 1.1 (Express + Multer packages installed), Task 1.2 (directory structure exists).

**Downstream consumers:** Task 3.2 (upload route imports this middleware), Task 3.4 (validation logic defined here is exercised by the route's error handling).

## What

Create `src/server/middleware/upload.ts` that exports a configured Multer instance with:

1. **Disk storage** targeting `documents/temp-uploads/{collection}/` -- the collection name comes from the route parameter at call time, so the destination function must be dynamic.
2. **File filter** that validates both MIME type (`application/pdf`) and file extension (`.pdf`), rejecting anything else.
3. **Size limit** of 50 MB per file, enforced via Multer's `limits` option.
4. **Timestamp-prefixed filenames** to prevent collisions when the same filename is uploaded twice (spec requirement: "preserve original filenames with timestamp prefix").
5. **Directory auto-creation** -- if the per-collection temp directory does not exist yet, create it before writing.

The module exports a factory function (not a singleton instance) because the upload destination depends on the collection name extracted from the request's route params at runtime.

## Why

- **Security**: Rejecting non-PDF files at the middleware layer prevents unnecessary disk writes and avoids processing potentially harmful files further downstream.
- **Stability**: The 50 MB cap prevents a single upload from exhausting disk space or memory on the training laptop.
- **Correctness**: Timestamp prefixes guarantee unique filenames, which matters because multiple users (or the same user) may upload files with identical names to the same collection.
- **Separation of concerns**: Encapsulating all Multer config in one module keeps the upload route (task 3.2) clean -- it just calls the middleware and handles the response.

## Scope

### In scope
- Multer storage configuration (disk, dynamic destination, filename strategy)
- File filter function (MIME + extension check)
- Size limit configuration
- Auto-creation of the destination directory
- Exporting the configured middleware for use by routes
- TypeScript types for the exported function

### Out of scope
- The Express route handler itself (task 3.2)
- HTTP error response formatting for rejected files (task 3.4 / error middleware in 2.3)
- Cleanup or deletion of temp files after indexing (separate concern)
- Virus scanning or deep content inspection of uploaded PDFs
- Multi-file upload orchestration (handled by the route, not the middleware config)
