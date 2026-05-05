# Task 10.1: Design -- Drag-and-Drop File Upload Zone

## Approach

Add a drop zone element to the sidebar section of `public/index.html` with vanilla JavaScript event handling. All code lives in the single HTML file (per L1 Decision 2). The drop zone uses four DOM event listeners (`dragenter`, `dragover`, `dragleave`, `drop`) with a CSS class toggle for visual feedback and a drag-enter counter to handle the flickering problem caused by child elements.

## Decisions

### D1: Use a drag-enter counter instead of relying on dragleave alone
**Choice:** Maintain an integer counter that increments on `dragenter` and decrements on `dragleave`. Apply the highlight class when counter > 0; remove it when counter reaches 0.

**Why not just toggle on dragenter/dragleave:** When the drop zone contains child elements (text, icons), the browser fires `dragleave` on the parent when the cursor moves over a child, then immediately fires `dragenter` on the child. This causes the highlight to flicker on and off rapidly. The counter pattern is the standard solution to this problem.

**Reset:** On `drop`, reset the counter to 0 and remove the highlight class unconditionally.

### D2: Filter files by extension on the client side
**Choice:** Iterate over `event.dataTransfer.files` and keep only files whose `name` ends with `.pdf` (case-insensitive). Do not check MIME type on the client.

**Rationale:** The `File.type` property from the browser is unreliable across platforms (some browsers leave it empty for drag-and-drop). Extension checking is sufficient for client-side filtering -- the server-side Multer filter (task 3.1) performs the authoritative dual check (MIME + extension). Client-side filtering is a UX convenience, not a security boundary.

### D3: Store files in a module-scoped array variable
**Choice:** Declare `let selectedFiles = []` in the script section. On drop, replace its contents with the filtered PDF files. Other tasks (10.3, 10.4) read from this variable.

**Why not use a hidden `<input type="file">`:** A hidden file input could hold the FileList, but FileList is read-only and cannot be programmatically modified (filtering requires creating a new DataTransfer). Storing in a plain array is simpler, allows filtering, and avoids browser-compatibility issues with the DataTransfer constructor.

**Append vs replace:** On subsequent drops, replace the array contents. Task 10.2 (click-to-select) and task 10.3 (file list display) will finalize whether append behavior is needed.

### D4: Inline warning message for rejected files
**Choice:** Show a small text element below the drop zone (e.g., `<p class="upload-warning">`) when non-PDF files are dropped. Auto-hide after 4 seconds using `setTimeout`. If all files in a drop are invalid, show the warning and do not update `selectedFiles`.

**Rationale:** A transient inline warning is less disruptive than an alert dialog and more noticeable than a console message. The 4-second auto-dismiss prevents stale warnings from cluttering the UI.

### D5: CSS-class-based visual feedback
**Choice:** Define three visual states via CSS classes on the drop zone element:

| State | Class | Visual Treatment |
|-------|-------|------------------|
| Default | (none) | Dashed border, muted background, prompt text |
| Drag-over | `drag-over` | Solid/highlighted border, tinted background, subtle scale or shadow |
| Warning | `upload-warning-active` | Brief red/orange tint on the warning text element |

**Rationale:** Class-based styling keeps JS logic clean (just `classList.add`/`remove`) and makes the visual treatment easy to customize via CSS.

## Files

### Modified Files

| File | Changes |
|------|---------|
| `public/index.html` | Add drop zone HTML element in sidebar; add CSS for drop zone states; add JavaScript for drag event listeners, file filtering, and warning display |

### New Files

None. All code goes into the existing `public/index.html` per the single-file frontend decision.

## Implementation Sketch

### HTML (in sidebar section)

```html
<div id="upload-zone" class="upload-zone">
  <p class="upload-zone-text">Drag PDF files here</p>
  <p class="upload-zone-hint">or click to select files</p>
</div>
<p id="upload-warning" class="upload-warning" hidden>Only PDF files are accepted</p>
```

### CSS

```css
.upload-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s, box-shadow 0.2s;
  background-color: #fafafa;
}

.upload-zone.drag-over {
  border-color: #4a90d9;
  background-color: #e8f0fe;
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.2);
}

.upload-zone-text {
  font-size: 14px;
  color: #555;
  margin: 0 0 4px 0;
}

.upload-zone-hint {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.upload-warning {
  color: #c0392b;
  font-size: 12px;
  margin: 8px 0 0 0;
  text-align: center;
}
```

### JavaScript

```javascript
let selectedFiles = [];
let dragEnterCounter = 0;

const uploadZone = document.getElementById('upload-zone');
const uploadWarning = document.getElementById('upload-warning');
let warningTimeout = null;

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  uploadZone.addEventListener(eventName, preventDefaults);
});

uploadZone.addEventListener('dragenter', () => {
  dragEnterCounter++;
  uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => {
  dragEnterCounter--;
  if (dragEnterCounter <= 0) {
    dragEnterCounter = 0;
    uploadZone.classList.remove('drag-over');
  }
});

uploadZone.addEventListener('drop', (e) => {
  dragEnterCounter = 0;
  uploadZone.classList.remove('drag-over');

  const files = Array.from(e.dataTransfer.files);
  const pdfFiles = files.filter(f =>
    f.name.toLowerCase().endsWith('.pdf')
  );

  if (pdfFiles.length === 0 && files.length > 0) {
    showUploadWarning('Only PDF files are accepted');
    return;
  }

  if (pdfFiles.length < files.length) {
    showUploadWarning(
      `${files.length - pdfFiles.length} non-PDF file(s) were ignored`
    );
  }

  selectedFiles = pdfFiles;
  // Task 10.3 will add: updateFileListDisplay(selectedFiles);
});

function showUploadWarning(message) {
  uploadWarning.textContent = message;
  uploadWarning.hidden = false;
  if (warningTimeout) clearTimeout(warningTimeout);
  warningTimeout = setTimeout(() => {
    uploadWarning.hidden = true;
  }, 4000);
}
```

## Edge Cases

### 1. Dragging over child elements causes flickering
**Scenario:** The drop zone contains `<p>` text elements. Moving the cursor from the parent `<div>` onto a child `<p>` fires `dragleave` on the div and `dragenter` on the child.
**Mitigation:** The drag-enter counter (D1) absorbs these intermediate events. The highlight only removes when the counter reaches zero (cursor fully exits the zone).

### 2. Dropping a mix of PDF and non-PDF files
**Scenario:** User drops 3 PDFs and 2 PNGs in a single gesture.
**Mitigation:** Filter to keep only the 3 PDFs, store them in `selectedFiles`, and show a warning "2 non-PDF file(s) were ignored". The valid files are not discarded.

### 3. Dropping zero files (text or URL drag)
**Scenario:** User drags text, a URL, or an image from another browser tab onto the drop zone. `dataTransfer.files` is empty.
**Mitigation:** The `files.length` is 0, so `pdfFiles.length === 0 && files.length > 0` is false. Nothing happens -- no warning, no state change. This is the correct passive behavior.

### 4. Dropping a folder
**Scenario:** User drops a directory onto the zone. Some browsers represent this as a single entry in `dataTransfer.files` with size 0 and no extension.
**Mitigation:** The PDF extension filter rejects folder entries (they have no `.pdf` extension). If the folder is the only item, the warning appears. This is acceptable behavior -- recursive folder reading (via `webkitGetAsEntry`) is out of scope.

### 5. Rapid sequential drops
**Scenario:** User drops files, then immediately drops more files before interacting further.
**Mitigation:** Each drop replaces `selectedFiles` with the new set. The latest drop wins. Task 10.3 (file list display) will re-render the list on each drop. If append behavior is desired, task 10.3 can change the assignment to `selectedFiles = [...selectedFiles, ...pdfFiles]`.

### 6. Browser does not support drag-and-drop
**Scenario:** Very old browser or mobile browser without drag-and-drop support.
**Mitigation:** The drop zone still renders as a static element. Task 10.2 adds click-to-select as a fallback, which works on all browsers. No feature detection is needed -- the event listeners simply never fire.

### 7. Warning timeout overlapping with new warning
**Scenario:** A warning is visible, then the user drops more invalid files before the 4-second timeout.
**Mitigation:** `showUploadWarning` clears the previous timeout via `clearTimeout(warningTimeout)` before setting a new one. The message updates immediately and the new 4-second countdown starts fresh.
