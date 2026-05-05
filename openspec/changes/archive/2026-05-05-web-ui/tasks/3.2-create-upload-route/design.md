# Task 3.2: Upload Route -- Design

## File Location

`src/server/routes/upload.ts`

## Module Structure

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { createUploadMiddleware } from '../middleware/upload.js';

const router = Router();

// POST /api/collections/:name/upload
router.post('/:name/upload', /* multer middleware */, handler, errorHandler);

export default router;
```

The router is mounted by `server.ts` at `/api/collections`, so the full path resolves to `/api/collections/:name/upload`.

## Route Handler Flow

### Step 1: Multer Middleware (applied as route-level middleware)

The Multer middleware from task 3.1 is applied to this specific route. It:
- Parses multipart/form-data from the request
- Filters non-PDF files (calls the fileFilter callback)
- Enforces the 50MB size limit
- Populates `req.files` with an array of uploaded file objects

The middleware is invoked via a wrapper function that dynamically sets the destination directory based on the `:name` parameter. Two approaches are viable:

**Approach A (Preferred): Dynamic destination via Multer's `storage` option.**
The Multer middleware from task 3.1 uses `diskStorage` with a `destination` function that reads the collection name from the request. This means the middleware can be applied directly.

**Approach B: Pre-handler creates directory, Multer uses fixed temp path, post-handler moves files.**
More complex, less clean. Avoid.

### Step 2: Ensure destination directory exists

Before Multer writes files (handled inside the `destination` callback in task 3.1's middleware), or as a safety check in the route handler itself:

```typescript
const collectionName = req.params.name;
const uploadDir = path.join('documents', 'temp-uploads', collectionName);
fs.mkdirSync(uploadDir, { recursive: true });
```

This is idempotent -- calling it when the directory already exists is a no-op.

### Step 3: Build success response

```typescript
const files = (req.files as Express.Multer.File[]);

if (!files || files.length === 0) {
  res.status(400).json({ error: 'No files uploaded' });
  return;
}

const fileNames = files.map(f => f.originalname);

res.status(200).json({
  files: fileNames,
  count: files.length,
  message: `Successfully uploaded ${files.length} file(s) to collection '${collectionName}'`
});
```

### Step 4: Multer error handling

Multer errors must be caught in a route-level error handler (Express error middleware with 4 parameters). This handler is placed after the main handler:

```typescript
function uploadErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        error: 'File too large. Maximum size is 50MB per file.'
      });
      return;
    }
    // Other Multer errors (LIMIT_UNEXPECTED_FILE, etc.)
    res.status(400).json({ error: err.message });
    return;
  }

  // Custom errors from fileFilter (e.g., "Only PDF files are allowed")
  if (err.message === 'Only PDF files are allowed') {
    res.status(400).json({ error: err.message });
    return;
  }

  // Unknown errors -- pass to global error handler
  next(err);
}
```

## Collection Name Validation

The `:name` parameter should be validated to prevent directory traversal or invalid filesystem names:

```typescript
const COLLECTION_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

if (!COLLECTION_NAME_PATTERN.test(collectionName)) {
  res.status(400).json({
    error: 'Invalid collection name. Use only letters, digits, hyphens, and underscores.'
  });
  return;
}
```

This check runs before the Multer middleware processes files, preventing uploads to arbitrary paths.

## Multer Field Name

The middleware expects files under a specific field name. Based on the frontend design (task 10.4 uses `FormData.append('files', file)`), the field name is `files`:

```typescript
const upload = createUploadMiddleware();
router.post('/:name/upload', upload.array('files', 20), handler, uploadErrorHandler);
```

The `20` limit caps the number of files per request at a reasonable maximum.

## Exports

```typescript
export default router;
```

Mounted in `server.ts` as:

```typescript
import uploadRouter from './routes/upload.js';
app.use('/api/collections', uploadRouter);
```

## Error Response Consistency

All error responses follow the same shape for frontend consistency:

```json
{ "error": "Descriptive error message" }
```

Success responses follow:

```json
{
  "files": ["name1.pdf", "name2.pdf"],
  "count": 2,
  "message": "Human-readable success message"
}
```

## Edge Cases

| Case | Behavior |
|------|----------|
| No files in request | 400 `{error: "No files uploaded"}` |
| Mix of valid and invalid files | Multer rejects on first invalid file (entire request fails) |
| Collection name with path traversal (`../etc`) | 400 validation error from regex check |
| Collection name is empty string | Route won't match (`:name` requires at least one character) |
| Duplicate filenames in same upload | Multer's `diskStorage` can add timestamp prefix to avoid collisions |
| Very long collection name | Regex allows it; filesystem will reject if too long (OS-level error caught by global handler) |
| Concurrent uploads to same collection | Safe -- each file gets a unique name; `mkdirSync` with `recursive` is idempotent |

## Testing Considerations

Unit tests for this route should:

1. Mock Multer middleware to simulate `req.files` being populated
2. Verify 200 response shape with correct file names and count
3. Verify 400 when `req.files` is empty or undefined
4. Verify collection name validation rejects invalid names
5. Verify Multer error handler returns correct status codes (413 for size, 400 for type)
6. Verify directory creation is called with the correct path

Integration tests (task 14) will cover the full upload flow with real Multer middleware and filesystem operations.
