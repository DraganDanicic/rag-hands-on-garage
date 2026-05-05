# Task 3.1: Design -- Multer Middleware Configuration

## Approach

Create a single module `src/server/middleware/upload.ts` that exports a factory function. The factory accepts a collection name and returns a Multer middleware instance configured for that collection's upload directory. This deferred-binding pattern is necessary because Multer's `diskStorage` destination is fixed at configuration time, but the collection name is only known at request time from Express route params.

An alternative is to use Multer's `destination` callback (which receives the request object), allowing a single Multer instance to dynamically resolve the directory. This is simpler and avoids creating a new Multer instance per request. We will use this callback approach.

## Decisions

### D1: Single Multer instance with dynamic destination callback
**Choice:** Use Multer's `diskStorage` with a `destination(req, file, cb)` callback that reads `req.params.name` to determine the target directory.

**Why not a factory per collection:** A factory would create a new Multer instance for every request. The callback approach creates one instance at module load time and dynamically resolves the directory per request -- simpler, lower overhead, and idiomatic Multer usage.

### D2: Validate both MIME type and file extension
**Choice:** The `fileFilter` checks that `file.mimetype === 'application/pdf'` AND `path.extname(file.originalname).toLowerCase() === '.pdf'`.

**Rationale:** Checking only MIME type is spoofable (browsers set it from extension anyway). Checking only extension misses renamed files. Dual validation satisfies the spec scenarios for both invalid extension and invalid MIME type.

### D3: Timestamp prefix format
**Choice:** `{Date.now()}-{originalname}` (e.g., `1714838400000-report.pdf`).

**Alternatives considered:**
- UUID prefix: Loses human readability.
- Date string (ISO): Contains colons, problematic on Windows filesystems.

**Rationale:** `Date.now()` is monotonic, filesystem-safe, and keeps the original filename readable. Sufficient uniqueness for single-user local deployment.

### D4: Use `fs.mkdirSync` with `recursive: true` in destination callback
**Choice:** Synchronously create the directory in the `destination` callback before invoking the Multer callback.

**Rationale:** Multer's `destination` callback is synchronous-style (it takes a `cb`). Using `mkdirSync` with `{ recursive: true }` is the simplest correct approach -- it's a no-op if the directory already exists and creates parent directories as needed. The sync call is acceptable because it only runs once per unique directory and is fast (local filesystem metadata operation).

### D5: Reject via MulterError-compatible callback
**Choice:** In `fileFilter`, call `cb(null, false)` and attach an error via `cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only PDF files are allowed'))` pattern -- actually, Multer's `fileFilter` callback signature is `cb(error, acceptBoolean)`. We call `cb(new Error('Only PDF files are allowed'), false)` to reject. The error middleware (task 2.3) will catch this and format the 400 response.

**Rationale:** This is Multer's documented pattern. The error propagates to Express's error handler where it can be distinguished from size-limit errors (which are `MulterError` instances with code `LIMIT_FILE_SIZE`).

## Files

### New Files

| File | Purpose |
|------|---------|
| `src/server/middleware/upload.ts` | Multer configuration, file filter, storage setup; exports configured middleware |

### Modified Files

None. This task creates a standalone module consumed by task 3.2.

## Implementation Sketch

```typescript
// src/server/middleware/upload.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const UPLOAD_BASE_DIR = path.join('documents', 'temp-uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const storage = multer.diskStorage({
  destination(req: Request, _file, cb) {
    const collection = req.params.name || 'default';
    const uploadDir = path.join(UPLOAD_BASE_DIR, collection);
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename(_req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';

  if (isPdfMime && isPdfExt) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});
```

The upload route (task 3.2) would use this as:
```typescript
import { upload } from '../middleware/upload.js';
router.post('/api/collections/:name/upload', upload.array('files'), handler);
```

## Edge Cases

### 1. Collection name with path traversal characters
**Scenario:** A request with `req.params.name` set to `../../etc` could write files outside the intended directory.
**Mitigation:** Sanitize the collection name in the destination callback -- strip or reject names containing `/`, `\`, `..`, or other path-separator characters. Use `path.basename()` as a minimal safeguard to collapse traversal attempts. The route layer (task 3.2) should also validate collection names, but defense-in-depth here is important.

### 2. Destination directory creation fails (permissions)
**Scenario:** `fs.mkdirSync` throws because the process lacks write permission to `documents/`.
**Mitigation:** The error propagates through Multer to Express's error handler. No special handling needed beyond letting it bubble up -- the error middleware (task 2.3) will return a 500.

### 3. File with `.pdf` extension but wrong MIME type
**Scenario:** A user renames `image.png` to `image.pdf` and uploads it.
**Mitigation:** The dual check catches this -- `file.mimetype` will be `image/png` (set by the browser based on actual content sniffing or original extension). The file is rejected. Note: MIME type detection is browser-dependent and not fully reliable, but combined with extension check it covers the spec requirements.

### 4. Very long filenames
**Scenario:** Original filename is 200+ characters; with timestamp prefix it exceeds filesystem limits (255 bytes on most filesystems).
**Mitigation:** Truncate `file.originalname` to a safe length (e.g., 200 characters) before prepending the timestamp. This preserves the extension and enough of the name for identification.

### 5. Concurrent uploads to same collection
**Scenario:** Two simultaneous uploads write to the same directory.
**Mitigation:** `mkdirSync` with `recursive: true` is safe for concurrent calls (no error if directory already exists). Timestamp prefixes prevent filename collisions. No additional locking needed for single-user deployment.

### 6. Multer size limit error vs file filter error
**Scenario:** The error middleware needs to distinguish between "file too large" (413) and "wrong file type" (400).
**Mitigation:** Multer throws `MulterError` with `code === 'LIMIT_FILE_SIZE'` for size violations. The file filter throws a plain `Error`. The error middleware (task 2.3) can check `err instanceof multer.MulterError` and `err.code` to set the correct HTTP status.
