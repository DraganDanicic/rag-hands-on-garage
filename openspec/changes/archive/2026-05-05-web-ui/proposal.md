## Why

The RAG system currently provides only a CLI interface, limiting accessibility to users comfortable with terminal commands. Non-technical stakeholders (managers, product owners, sales teams) cannot easily interact with the system or understand its capabilities through demos. A web-based interface democratizes access, makes the project portfolio-worthy, and enables broader adoption as an internal tool.

## What Changes

- Add Express-based REST API server wrapping existing workflows and services
- Create vanilla JavaScript frontend (single HTML page, no build step required)
- Implement multipart file upload for PDF documents
- Build real-time chat interface for querying documents with conversation history
- Add collection management UI (list, switch, delete collections)
- Create settings panel for runtime configuration (chunk size, topK, temperature, etc.)
- Implement Server-Sent Events (SSE) for streaming indexing progress to browser
- Keep CLI interface fully functional alongside web UI

## Capabilities

### New Capabilities
- `web-api`: REST API endpoints for uploading documents, triggering indexing, querying, and managing collections
- `file-upload`: Multipart PDF upload handling with temporary storage and validation
- `chat-interface`: Browser-based chat UI for asking questions and viewing responses with conversation history
- `collection-web-management`: Web UI for listing, switching, and deleting document collections
- `settings-web-ui`: Interface for viewing and modifying configuration (chunk size, overlap, topK, temperature, max tokens)
- `progress-streaming`: Server-Sent Events implementation for real-time indexing progress updates

### Modified Capabilities
<!-- None - this is additive, no existing requirements change -->

## Impact

**New Dependencies:**
- `express` (^4.18.0) - Web server framework
- `multer` (^1.4.5) - Multipart file upload middleware
- `cors` (^2.8.5) - Cross-origin resource sharing
- TypeScript types for above

**New Code:**
- `src/server/` - Express server, routes, middleware, SSE utilities
- `public/` - Static HTML/CSS/JS for frontend UI
- New npm scripts: `npm run server`, `npm run build-server`

**Unchanged:**
- All existing workflows, services, and DI container remain unchanged
- CLI commands continue to work identically
- Existing data storage format (JSON files) preserved
- No changes to core RAG logic or algorithms
