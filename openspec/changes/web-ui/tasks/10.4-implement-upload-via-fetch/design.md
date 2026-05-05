## Approach
Add an `uploadFiles(files)` function to the frontend JavaScript in `public/index.html`. The function constructs a `FormData`, appends each file, sends a `fetch()` POST to the collection-specific upload endpoint, and processes the response. The function is called by the upload button's click handler (wired in task 10.3) after the user has selected files via drag-and-drop (task 10.1) or file input (task 10.2).

## Decisions

### Decision 1: Do not set Content-Type header manually
The `fetch()` call must omit the `Content-Type` header entirely. When a `FormData` body is provided, the browser automatically sets `Content-Type: multipart/form-data; boundary=...` with the correct boundary string. Manually setting it would break the multipart parsing on the server.

**Rationale:** This is a common mistake that causes Multer to fail silently or throw parsing errors. Explicitly omitting it prevents this class of bugs.

### Decision 2: Use the `files` field name for FormData entries
All files are appended with the key `files` to match the Multer configuration in task 3.1/3.2 (`upload.array('files', 20)`). Each file is appended individually in a loop, not as an array.

**Rationale:** Multer expects repeated field names for multi-file uploads. Using `formData.append('files', file)` in a loop produces the correct `multipart/form-data` structure with one part per file, all sharing the `files` field name.

### Decision 3: Read active collection from shared UI state
The active collection name is read from whatever state management the collection picker (task 9.2) establishes. This will likely be a module-level variable like `activeCollection` or a DOM element's dataset. The upload function reads this value at call time (not at initialization) so it always uses the currently selected collection.

**Rationale:** The collection can change between file selection and upload submission. Reading at call time ensures the upload targets the correct collection.

### Decision 4: Return a structured result for downstream consumers
The function returns a Promise that resolves to `{success: true, files, count, message}` on success or `{success: false, error}` on failure. This allows task 10.5 to display appropriate feedback without coupling to the fetch response format.

**Rationale:** Isolating the fetch/response-parsing logic from the UI rendering logic keeps both tasks focused and testable independently.

### Decision 5: Disable upload button during request
The upload button is disabled at the start of the function and re-enabled in a `finally` block. This prevents users from clicking upload multiple times and creating duplicate requests.

**Rationale:** Duplicate uploads waste server resources and confuse users with doubled file lists. A simple disable/enable pattern handles this without introducing request deduplication logic.

## Files
- `public/index.html` (modify) -- Add the `uploadFiles()` function to the `<script>` section. Wire it to the upload button's click handler.

## Implementation Detail

### FormData Construction and Fetch Call

```javascript
async function uploadFiles(files) {
  const uploadBtn = document.getElementById('upload-btn');
  uploadBtn.disabled = true;

  try {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    const response = await fetch(`/api/collections/${activeCollection}/upload`, {
      method: 'POST',
      body: formData
      // Do NOT set Content-Type header -- browser sets it with boundary
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || `Upload failed (${response.status})` };
    }

    return {
      success: true,
      files: data.files,
      count: data.count,
      message: data.message
    };
  } catch (err) {
    return { success: false, error: `Network error: ${err.message}` };
  } finally {
    uploadBtn.disabled = false;
  }
}
```

### Integration with File Selection

The upload button click handler (wired by task 10.3) calls `uploadFiles()` with the collected files and passes the result to the status display function (task 10.5):

```javascript
document.getElementById('upload-btn').addEventListener('click', async () => {
  if (selectedFiles.length === 0) return;

  const result = await uploadFiles(selectedFiles);

  if (result.success) {
    showUploadSuccess(result.message);  // task 10.5
    clearSelectedFiles();               // task 10.3
  } else {
    showUploadError(result.error);      // task 10.5
  }
});
```

### Active Collection Resolution

The `activeCollection` variable is expected to be set by the collection picker (task 9.2). It defaults to `'default'` and is updated whenever the user selects a different collection. The upload function reads it directly:

```javascript
let activeCollection = 'default';  // Set by task 9.2's collection picker
```

### Response Handling

The server returns one of two response shapes:

**Success (200):**
```json
{
  "files": ["report.pdf", "guide.pdf"],
  "count": 2,
  "message": "Successfully uploaded 2 file(s) to collection 'default'"
}
```

**Error (400/413):**
```json
{
  "error": "Only PDF files are allowed"
}
```

The function normalizes both into the `{success, ...}` return shape so downstream code does not need to inspect HTTP status codes.

### Network Error Handling

If `fetch()` itself rejects (network down, DNS failure, server unreachable), the catch block wraps the error in the same `{success: false, error}` shape. The error message is prefixed with "Network error:" to distinguish it from server-reported validation errors.

## Edge Cases

1. **Empty file list**: The function should be guarded at the call site (task 10.3's click handler checks `selectedFiles.length === 0`). If called with an empty list anyway, the server returns 400 `{error: "No files uploaded"}` which is handled normally.

2. **Collection name with special characters**: The `activeCollection` value comes from the server's collection list (task 9.1), so it should already be valid. No client-side sanitization needed -- the server validates the `:name` parameter (task 3.2).

3. **Large files**: The browser sends the full file in the request body. For files exceeding the 50MB server limit, the server returns 413 which the function handles as a normal error response.

4. **Server unreachable**: `fetch()` rejects with a `TypeError`. The catch block converts this to a user-friendly error message.

5. **JSON parse failure**: If the server returns non-JSON (e.g., HTML error page from a proxy), `response.json()` throws. This is caught by the outer catch block and reported as a network-level error.

6. **Concurrent uploads**: The disabled button prevents user-initiated duplicates. If programmatic callers invoke `uploadFiles()` concurrently, each call operates independently -- the server handles concurrent uploads safely (task 3.2 design).

7. **Collection changed between file selection and upload**: Because `activeCollection` is read at call time (not captured at file selection time), files are uploaded to whatever collection is currently selected. This is the expected behavior -- the user sees the active collection in the UI when they click upload.
