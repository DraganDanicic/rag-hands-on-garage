## Context

The RAG system currently provides a CLI-only interface through npm scripts (`npm run chat`, `npm run generate-embeddings`). The underlying architecture is already UI-agnostic:

- **Workflows** (IndexingWorkflow, QueryWorkflow) orchestrate services
- **DI Container** manages all dependencies through interfaces
- **Services** are isolated and testable
- **No inter-service dependencies** - everything communicates through interfaces

This design adds a web layer on top of existing workflows without modifying core logic. The CLI will continue to work unchanged.

**Current State:**
- 15+ isolated services (DocumentReader, EmbeddingClient, VectorSearch, etc.)
- Two main workflows (indexing and query)
- JSON-based persistence (data/collections/, data/chunks/)
- ES modules with TypeScript
- Proxy support for corporate networks (Bosch LLM Farm API)

**Constraints:**
- Must maintain backward compatibility with CLI
- No database dependencies (keep JSON storage)
- Minimal build complexity (educational project)
- Single-user local deployment (auth out of scope)

**Stakeholders:**
- Training participants (need to understand the code)
- Non-technical users (managers, product teams)
- Developers extending the project

## Goals / Non-Goals

**Goals:**
- Provide browser-based UI for uploading PDFs and querying documents
- Real-time progress feedback during indexing via Server-Sent Events
- Collection management (list, switch, delete)
- Runtime configuration UI (chunk size, topK, temperature, etc.)
- Maintain full CLI functionality alongside web UI
- Keep implementation simple and understandable (training project context)

**Non-Goals:**
- Multi-user authentication/authorization (single-user local deployment)
- Database migration (JSON storage is sufficient for current scale)
- Frontend framework adoption (avoid build complexity)
- Replacing or deprecating CLI tools
- Production-grade deployment (Docker, cloud hosting, monitoring)
- Markdown rendering, syntax highlighting, or rich text features

## Decisions

### Decision 1: Express.js for HTTP Server
**Choice:** Use Express.js as the web framework

**Alternatives Considered:**
- **Next.js**: Too heavy for this use case, requires React knowledge, build step complexity
- **Fastify**: Faster but less familiar, smaller ecosystem
- **Vanilla Node http**: Too low-level, would require reimplementing middleware patterns

**Rationale:**
- Industry-standard, well-documented
- Large middleware ecosystem (CORS, body parsing, file uploads)
- Familiar to most Node.js developers
- Simple enough for training context

### Decision 2: Vanilla JavaScript Frontend (No Framework)
**Choice:** Single HTML file with vanilla JS, CSS, and DOM manipulation

**Alternatives Considered:**
- **React/Vue/Svelte**: Adds build step, npm dependencies, complexity
- **Preact**: Lighter than React but still requires JSX build
- **Alpine.js**: Closer to vanilla but adds dependency

**Rationale:**
- No build step = simpler development workflow
- View source = understand everything (educational value)
- ~300 lines total (HTML + CSS + JS) - manageable in one file
- Can split into separate files later if needed
- Easier for students to understand and modify

### Decision 3: Server-Sent Events for Progress Streaming
**Choice:** Use SSE (EventSource API) for indexing progress updates

**Alternatives Considered:**
- **WebSockets**: Bidirectional, but we only need server-to-client streaming
- **Polling**: Simpler but inefficient, delayed updates
- **Long polling**: Complex, outdated pattern

**Rationale:**
- One-way streaming is sufficient (server → browser)
- Native browser support (EventSource API)
- Simpler than WebSockets (no upgrade handshake)
- HTTP-friendly (works through most proxies)
- Built-in reconnection logic

### Decision 4: Multer for File Uploads
**Choice:** Use Multer middleware for handling multipart/form-data uploads

**Alternatives Considered:**
- **Formidable**: Lower-level, more control but more boilerplate
- **Busboy**: Even lower-level, streaming focus
- **Native Express**: Doesn't handle multipart by default

**Rationale:**
- De facto standard for Express file uploads
- Built-in validation (file size, type filtering)
- Well-tested in production
- Simple API for our use case

### Decision 5: Temporary Upload Directory
**Choice:** Store uploaded PDFs in `documents/temp-uploads/{collection}/` before indexing

**Alternatives Considered:**
- **Direct to documents/**: Pollutes main documents folder
- **In-memory**: Not viable for large PDFs (>10MB)
- **Stream directly to indexing**: Requires refactoring DocumentReader

**Rationale:**
- Keeps main documents/ folder clean
- Allows inspection/validation before indexing
- Can be cleaned up automatically or kept for re-indexing
- Organized by collection name for multi-collection support

### Decision 6: Reuse Existing Workflows Directly
**Choice:** Express routes instantiate Container and call workflows

**Alternatives Considered:**
- **Spawn CLI processes**: Janky, hard to stream progress, session management nightmare
- **New service layer**: Duplication of workflow logic
- **Microservices**: Overkill, added deployment complexity

**Rationale:**
- Workflows already encapsulate all business logic
- Container handles dependency injection
- No code duplication
- Same services used by CLI and web = consistent behavior
- Easier to test and maintain

### Decision 7: Custom SSE ProgressReporter Adapter
**Choice:** Create `SSEProgressReporter` implementing `IProgressReporter` interface

**Rationale:**
- Workflows already call `progressReporter.progress()`, `.success()`, `.error()`
- Adapter pattern converts these calls to SSE events
- No changes to workflows or services
- Can inject different reporters (console for CLI, SSE for web)

### Decision 8: Keep JSON File Storage
**Choice:** Continue using JSON files for embeddings and chunks

**Alternatives Considered:**
- **SQLite**: Better for larger datasets, ACID guarantees
- **PostgreSQL**: Overkill, external dependency
- **Vector databases (Pinecone, Weaviate)**: Cloud dependency, cost

**Rationale:**
- Current JSON approach works for ~10k embeddings per collection
- Simpler for training/education (no database setup)
- Filesystem is portable and inspectable
- Can migrate later if needed (when actual limits are hit)

### Decision 9: No Authentication (Initial Version)
**Choice:** Single-user local deployment, no auth layer

**Alternatives Considered:**
- **JWT tokens**: Adds complexity, requires user management
- **Basic auth**: Minimal security, annoying for local use
- **OAuth**: Overkill for local tool

**Rationale:**
- Training project context (not production software)
- Runs locally (localhost:3000)
- Can add JWT/OAuth later if multi-user deployment is needed
- Keeps initial implementation simple

## Architecture

### Directory Structure
```
src/
├── server/                 # New Express server layer
│   ├── server.ts          # Express app setup, starts listener
│   ├── routes/
│   │   ├── collections.ts # GET/DELETE /api/collections/:name
│   │   ├── upload.ts      # POST /api/collections/:name/upload
│   │   ├── indexing.ts    # POST /api/collections/:name/index (SSE)
│   │   ├── query.ts       # POST /api/collections/:name/query
│   │   └── settings.ts    # GET/PUT /api/settings
│   ├── middleware/
│   │   ├── upload.ts      # Multer configuration
│   │   ├── error.ts       # Error handling middleware
│   │   └── cors.ts        # CORS configuration
│   └── utils/
│       └── SSEProgressReporter.ts  # ProgressReporter → SSE adapter
│
├── workflows/             # Unchanged
├── services/              # Unchanged
├── di/                    # Unchanged
└── config/                # Unchanged

public/                    # New frontend static assets
└── index.html            # Single-page UI (HTML + CSS + JS)

documents/
└── temp-uploads/         # New temporary upload storage
    ├── default/
    ├── project-a/
    └── project-b/
```

### Request Flow (Indexing)
```
Browser                Express Server           Workflows              Services
   │                         │                       │                    │
   │ POST /api/collections/  │                       │                    │
   │ default/upload (PDFs)   │                       │                    │
   ├────────────────────────>│                       │                    │
   │                         │ Save to temp-uploads/ │                    │
   │<────────────────────────┤                       │                    │
   │ {files: [...]}          │                       │                    │
   │                         │                       │                    │
   │ POST /api/collections/  │                       │                    │
   │ default/index           │                       │                    │
   ├────────────────────────>│ Create Container      │                    │
   │ (EventSource SSE)       │ with SSEProgressReporter                   │
   │                         ├──────────────────────>│                    │
   │                         │                       │ DocumentReader     │
   │                         │                       ├───────────────────>│
   │<························│<······················│<···················┤
   │ data: {type:"progress", │                       │                    │
   │   current:10, total:100}│                       │                    │
   │                         │                       │ EmbeddingClient    │
   │                         │                       ├───────────────────>│
   │<························│<······················│<···················┤
   │ data: {type:"progress", │                       │                    │
   │   current:50, total:100}│                       │                    │
   │                         │                       │                    │
   │<························│<······················┤                    │
   │ data: {type:"complete", │                       │                    │
   │   embeddings: 250}      │                       │                    │
```

### Request Flow (Query)
```
Browser                Express Server           Workflows              Services
   │                         │                       │                    │
   │ POST /api/collections/  │                       │                    │
   │ default/query           │                       │                    │
   │ {question: "What..."}   │                       │                    │
   ├────────────────────────>│ Create Container      │                    │
   │                         ├──────────────────────>│                    │
   │                         │                       │ VectorSearch       │
   │                         │                       ├───────────────────>│
   │                         │                       │ LlmClient          │
   │                         │                       ├───────────────────>│
   │<────────────────────────│<──────────────────────┤                    │
   │ {answer: "RAG is..."}   │                       │                    │
```

### SSE Progress Adapter Implementation
```typescript
class SSEProgressReporter implements IProgressReporter {
  constructor(private res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
  }

  progress(current: number, total: number, message: string): void {
    const event = {
      type: 'progress',
      current,
      total,
      percentage: Math.round((current / total) * 100),
      message
    };
    this.res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  success(message: string): void {
    const event = { type: 'complete', message };
    this.res.write(`data: ${JSON.stringify(event)}\n\n`);
    this.res.end();
  }

  error(message: string): void {
    const event = { type: 'error', message };
    this.res.write(`data: ${JSON.stringify(event)}\n\n`);
    this.res.end();
  }

  // ... other IProgressReporter methods
}
```

## Risks / Trade-offs

### Risk: Large PDF uploads timing out
**Mitigation:**
- Set generous timeout (5 minutes) in Express
- Implement chunked uploads later if needed (not in MVP)
- Document recommended file size limits (<50MB)

### Risk: Concurrent indexing causing race conditions
**Mitigation:**
- UI locks during indexing (disable upload/index buttons)
- Server-side: no locking needed (single-user assumption)
- Future: Add job queue (Bull/BullMQ) if multi-user support needed

### Risk: Memory exhaustion with large embeddings files
**Mitigation:**
- Current JSON approach works up to ~10k embeddings (~20MB files)
- Monitor memory usage, document limits
- Migration path: Switch to SQLite with streaming when limits hit
- Not a concern for MVP/training context

### Risk: Proxy configuration issues in browser
**Mitigation:**
- Proxy config stays server-side only (already working in CLI)
- Browser talks to localhost:3000 (no proxy needed)
- Server makes API calls to LLM Farm with proxy
- Same proxy logic used by existing EmbeddingClient/LlmClient

### Risk: Conversation history growing unbounded
**Mitigation:**
- Already handled by ConversationHistory service (token-based trimming)
- Sessions are in-memory (cleared on server restart)
- Future: Add Redis or session store if persistence needed

### Risk: CORS issues during development
**Mitigation:**
- Enable CORS middleware with permissive settings in development
- Restrict origins in production deployment
- Serve frontend from same origin (localhost:3000) to avoid CORS entirely

### Risk: No validation of malicious PDFs
**Mitigation:**
- File type validation (MIME type + extension)
- File size limits (50MB)
- pdf-parse library already handles malformed PDFs gracefully
- Future: Add virus scanning if needed for production

## Migration Plan

Not applicable - this is an additive change. No migration needed.

**Deployment steps:**
1. Install new dependencies (`npm install`)
2. Build server TypeScript (`npm run build-server`)
3. Start server (`npm run server`)
4. Open browser to `http://localhost:3000`

**Rollback:**
- Simply continue using CLI commands
- No data format changes, no backward compatibility issues

## Open Questions

1. **Collection-specific vs global settings?**
   - Option A: Settings apply globally to all collections
   - Option B: Each collection can have its own chunk size, topK, etc.
   - **Decision needed during implementation** - lean toward Option A for simplicity

2. **Cleanup temp-uploads after indexing?**
   - Option A: Automatically delete temp files after successful indexing
   - Option B: Keep files, let user manually manage
   - **Lean toward Option B** - allows re-indexing without re-upload

3. **Show retrieved chunks in chat UI?**
   - Option A: Always show (transparent, educational)
   - Option B: Hide by default, toggle to show (cleaner UX)
   - **Lean toward Option B** with toggle - matches CLI's `--show-prompt` behavior
