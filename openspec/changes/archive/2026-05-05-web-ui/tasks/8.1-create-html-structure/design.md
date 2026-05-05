# Task 8.1: Design -- Base HTML Structure

## Approach

Create `public/index.html` as a complete HTML5 document with three-region layout using semantic elements. The document follows a grid-based layout pattern: a fixed-width sidebar on the left, a flexible main chat area in the center, and a collapsible settings panel on the right. All three regions are direct children of a `.app-container` wrapper div that will use CSS grid (applied by task 8.5).

The `<style>` and `<script>` blocks are included but left empty (or with only minimal structural comments) for subsequent tasks to populate. Each container element gets a descriptive `id` attribute so that later tasks can target them precisely with `document.getElementById()`.

## Decisions

### D1: Use a `.app-container` wrapper div with three child regions
**Choice:** A single `<div class="app-container">` wrapping `<aside>`, `<main>`, and `<section>` elements.

**Why not just use `<body>` as the grid container:** Adding a wrapper keeps the grid layout isolated from `<body>`, which may need its own styling (margin reset, font, background). It also makes it easier for task 8.5 to apply `display: grid; grid-template-columns: ...` to a single class without affecting global `<body>` styles.

### D2: Semantic HTML elements for each region
**Choice:**
- `<aside id="sidebar">` for collections list and file upload (complementary content)
- `<main id="chat-area">` for the primary chat interface
- `<section id="settings-panel">` for the collapsible settings form

**Rationale:** Semantic elements improve accessibility (screen readers identify landmarks automatically) and make the DOM self-documenting. `<aside>` is appropriate for the sidebar since it contains supporting functionality (collection management, upload). `<main>` marks the primary interactive area. `<section>` is appropriate for the settings grouping.

### D3: Sub-container IDs follow a naming convention
**Choice:** All container IDs use kebab-case and are descriptive of their purpose:
- `#sidebar` -- outer sidebar region
- `#collections-list` -- where collection items will be rendered
- `#upload-zone` -- where the drag-and-drop upload area will be rendered
- `#chat-area` -- outer main region
- `#chat-header` -- collection name display and clear button
- `#message-list` -- scrollable message container
- `#chat-input-area` -- input form container
- `#settings-panel` -- outer settings region
- `#settings-toggle` -- button to expand/collapse settings
- `#settings-form` -- the form containing settings inputs
- `#indexing-progress` -- progress bar container (sits above chat or in sidebar)

**Rationale:** Consistent naming makes it easy for all subsequent frontend tasks to reference elements without ambiguity. Kebab-case matches HTML convention (vs camelCase which is JS convention).

### D4: Settings panel is initially hidden via a CSS class
**Choice:** The settings panel `<section>` gets a `hidden` class by default. Task 8.5 will define this class as `display: none`. Task 12.1 will toggle it via JavaScript.

**Why not use the HTML `hidden` attribute:** The `hidden` attribute is binary and harder to override with CSS transitions or animations. A CSS class gives task 8.5 full control over the show/hide behavior (e.g., sliding animation, opacity transition).

### D5: Progress bar container lives inside the sidebar, below the upload zone
**Choice:** Place `#indexing-progress` as a child of `#sidebar`, positioned after `#upload-zone`.

**Rationale:** The progress bar is contextually related to the upload/indexing workflow, which lives in the sidebar. Placing it there keeps the main chat area clean and avoids confusion about what the progress relates to.

### D6: Script block at end of body, style block in head
**Choice:** `<style>` in `<head>` (standard), `<script>` just before `</body>`.

**Rationale:** CSS in `<head>` prevents FOUC (flash of unstyled content). Script at end of body ensures DOM is fully parsed before JS runs, avoiding the need for `DOMContentLoaded` listeners. This is the conventional vanilla JS pattern.

### D7: Include a `<noscript>` message
**Choice:** Add `<noscript>This application requires JavaScript to be enabled.</noscript>` inside the body.

**Rationale:** Since the entire UI is JavaScript-driven, users with JS disabled get a clear explanation rather than a blank page.

## Files

### New Files

| File | Purpose |
|------|---------|
| `public/index.html` | Single-page HTML document with layout structure for sidebar, chat, and settings regions |

### Modified Files

None. This is the first frontend file.

## Implementation Sketch

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="RAG System - Ask questions about your documents">
  <title>RAG System</title>
  <style>
    /* Task 8.5 will add all CSS rules here */
  </style>
</head>
<body>
  <noscript>This application requires JavaScript to be enabled.</noscript>

  <div class="app-container">
    <!-- Sidebar: collections + upload + progress -->
    <aside id="sidebar">
      <div id="sidebar-header">
        <h1>RAG System</h1>
      </div>

      <div id="collections-section">
        <h2>Collections</h2>
        <div id="collections-list">
          <!-- Task 8.2: collection items rendered here -->
        </div>
      </div>

      <div id="upload-section">
        <h2>Upload Documents</h2>
        <div id="upload-zone">
          <!-- Task 8.2: drag-and-drop upload zone rendered here -->
        </div>
      </div>

      <div id="indexing-progress" class="hidden">
        <!-- Task 8.3/11.x: progress bar rendered here -->
      </div>
    </aside>

    <!-- Main: chat interface -->
    <main id="chat-area">
      <div id="chat-header">
        <!-- Task 8.3: collection name, clear button -->
      </div>

      <div id="message-list">
        <!-- Task 8.3: chat messages rendered here -->
      </div>

      <div id="chat-input-area">
        <!-- Task 8.3: input form rendered here -->
      </div>
    </main>

    <!-- Settings: collapsible panel -->
    <section id="settings-panel" class="hidden">
      <div id="settings-header">
        <h2>Settings</h2>
        <button id="settings-close" type="button" aria-label="Close settings">
          <!-- Task 8.4: close icon -->
        </button>
      </div>

      <form id="settings-form">
        <!-- Task 8.4: settings inputs rendered here -->
      </form>
    </section>
  </div>

  <!-- Settings toggle button (fixed position, outside panels) -->
  <button id="settings-toggle" type="button" aria-label="Toggle settings panel">
    <!-- Task 8.4/12.1: gear icon or text -->
  </button>

  <script>
    // Tasks 9.x - 13.x will add all JavaScript here
  </script>
</body>
</html>
```

## Edge Cases

### 1. Settings toggle button placement
**Scenario:** The settings toggle button needs to be accessible regardless of whether the settings panel is visible or hidden.
**Mitigation:** Place it outside the `.app-container` grid, using fixed or absolute positioning (to be styled by task 8.5). This ensures it remains clickable even when the settings panel has `display: none`.

### 2. Empty containers on first load
**Scenario:** Before any JavaScript runs, all dynamic containers (`#collections-list`, `#message-list`, etc.) are empty, resulting in a blank page.
**Mitigation:** The `<noscript>` message handles JS-disabled users. For JS-enabled users, the empty state is momentary (milliseconds before scripts execute). Task 9.1 will add initial loading states. No static placeholder text is needed in the HTML itself since that would need to be removed by JS.

### 3. ID conflicts with future additions
**Scenario:** A later task introduces an element whose ID collides with one defined here.
**Mitigation:** The naming convention (D3) is documented and all IDs are listed in this design. Later tasks must use the existing IDs rather than creating conflicting ones.

### 4. Viewport meta tag for mobile
**Scenario:** Without `width=device-width, initial-scale=1.0`, mobile browsers render the page at desktop width and zoom out.
**Mitigation:** The viewport meta tag is included in the `<head>`. Actual responsive CSS breakpoints are task 8.5's concern, but the meta tag must be present from the start.
