# Task 10.1: Implement Drag-and-Drop File Upload Zone with Visual Feedback

## Context

The web UI change (L1 design, Decision 2) uses a vanilla JavaScript frontend served as a single HTML file. Task group 10 implements the file upload UI. This first subtask creates the drag-and-drop zone -- the primary interaction surface for getting PDF files into the system.

The backend upload route (task 3.2) and Multer middleware (task 3.1) already handle receiving multipart/form-data POST requests at `POST /api/collections/:name/upload`. This task focuses exclusively on the browser-side: capturing files from drag-and-drop events and providing clear visual feedback throughout the interaction.

**Upstream dependencies:** Task 8.1-8.2 (base HTML structure and sidebar layout exist), Task 3.2 (upload route exists to receive files -- though this task does not send files, task 10.4 does).

**Downstream consumers:** Task 10.2 (click-to-select reuses the same drop zone element and file handling logic), Task 10.3 (file list display reads from the files collected here), Task 10.4 (upload via fetch reads the accumulated FileList).

## What

Add a drag-and-drop upload zone to the sidebar area of `public/index.html` with the following behaviors:

1. **Drop zone element** -- a styled container in the sidebar that visually communicates "drop files here" with an icon or text prompt.
2. **Drag event listeners** -- attach `dragenter`, `dragover`, `dragleave`, and `drop` handlers to the drop zone element, with `preventDefault()` and `stopPropagation()` on all four to suppress the browser's default file-open behavior.
3. **Visual feedback on drag-over** -- when a user drags files over the zone, apply a CSS class (e.g., `drag-over`) that highlights the zone (border color change, background tint, scale/shadow). Remove the class on `dragleave` and `drop`.
4. **File extraction from drop** -- on the `drop` event, read `event.dataTransfer.files` to get the `FileList`, then filter to only `.pdf` files.
5. **PDF-only filtering with user feedback** -- if any non-PDF files are dropped, show an inline warning message (e.g., "Only PDF files are accepted") and keep only the valid PDFs. If all files are invalid, show the warning and do not proceed.
6. **Expose collected files** -- store the accepted files in a module-level variable (or DOM state) so that downstream tasks (10.3 file list display, 10.4 upload submission) can access them.

## Why

- **Discoverability**: A visible drop zone with clear affordance ("drag PDFs here") is the most intuitive upload pattern for document-heavy workflows. Users working with PDF reports expect drag-and-drop.
- **Error prevention**: Filtering non-PDF files immediately at drop time, with a visible warning, prevents confusion when the server would reject them anyway (Multer file filter from task 3.1). Early client-side feedback is faster and friendlier.
- **Engagement feedback**: The drag-over highlight is critical UX -- without it, users have no confirmation that the browser recognized their drag gesture and that dropping will do something. This is a well-established web pattern (Gmail, Dropbox, etc.).
- **Preventing default behavior**: Without `preventDefault()` on `dragover`, the browser navigates away to display the dropped file. This is a common pitfall that must be handled correctly on all four drag events.

## Scope

### In scope
- Drop zone HTML element with placeholder text/icon
- CSS styles for default state, drag-over state, and warning state
- JavaScript event listeners for dragenter, dragover, dragleave, drop
- preventDefault/stopPropagation on all drag events
- Extracting FileList from dataTransfer
- Client-side PDF extension filtering
- Inline warning message for rejected file types
- Storing accepted files in a variable accessible to other UI code
- Handling the dragenter/dragleave counter pattern to avoid flickering

### Out of scope
- Click-to-select file input (task 10.2)
- Displaying the list of selected files (task 10.3)
- Actually uploading files via fetch/FormData (task 10.4)
- Upload progress indicators (task 10.5)
- Server-side file validation (task 3.1, 3.4)
- Multiple sequential drops (whether they append or replace -- can be decided in task 10.3)
