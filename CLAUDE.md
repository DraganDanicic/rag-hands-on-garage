# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A hands-on training project that teaches how to build a Retrieval-Augmented Generation (RAG) system from scratch using Node.js and TypeScript. The system processes PDF documents, generates embeddings, and provides a chat interface to answer questions about the documents.

## Common Commands

### Setup
```bash
npm install
```

Create `.env` file from `.env.example` and add:
- `LLM_FARM_API_KEY` - For Bosch LLM Farm API (embeddings + LLM) (required)

### Running the Application
```bash
# Generate embeddings from PDFs (default collection)
npm run generate-embeddings

# Generate embeddings for specific collection
npm run generate-embeddings -- --collection project-a

# Start interactive chat (default collection)
npm run chat

# Chat with specific collection
npm run chat -- --collection project-a

# Development mode with hot reload
npm run dev
```

### Build and Test
```bash
# Build TypeScript to JavaScript
npm run build

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run a specific test file
node --experimental-vm-modules node_modules/jest/bin/jest.js tests/path/to/file.test.ts

# Run tests matching a pattern
node --experimental-vm-modules node_modules/jest/bin/jest.js -t "test name pattern"
```

## Architecture Overview

### Isolated Service Architecture

This codebase follows strict **service isolation** principles where:
- Each service is self-contained with a single responsibility
- Services communicate **only through dependency injection of interfaces**
- Services **NEVER import from other services directly**
- All dependencies are injected via constructors/factories
- Each service exports only its interface and factory function from `index.ts`

### Key Architectural Rules

1. **No Inter-Service Dependencies**: Services don't know about each other, only interfaces
2. **Dependency Injection**: All wiring happens in the DI container (`src/di/Container.ts`)
3. **Workflows Orchestrate Services**: High-level coordination happens in workflow classes
4. **Interface-Driven**: Services expose clean public APIs via TypeScript interfaces

### Directory Structure Pattern

Each service follows this structure:
```
services/service-name/
├── IServiceName.ts        # Public interface
├── ServiceNameImpl.ts     # Implementation (not exported)
├── models/               # Service-specific data models
│   └── ModelName.ts
├── index.ts              # Exports ONLY interface + factory
└── README.md             # Service documentation
```

### The Two Main Workflows

#### 1. IndexingWorkflow (Embedding Generation)
Orchestrates: `DocumentReader → TextChunker → EmbeddingClient → EmbeddingStore`

Flow:
1. Read PDFs from `documents/` folder
2. Chunk text with configurable size and overlap (each chunk gets unique SHA-256 hash ID)
3. Save chunks to `data/chunks/{collection}.chunks.json` for inspection
4. Load existing embeddings for resume capability
5. Skip already-processed chunks (by chunk ID)
6. Generate embeddings via LLM Farm API
7. Save incrementally (every 50 chunks) to `data/collections/{collection}.embeddings.json`
8. Report progress to console

Entry point: `src/cli/generate-embeddings.ts`

Key Features:
- **Resume capability**: Interrupted processes can resume without re-processing
- **Incremental saves**: Every 50 chunks to prevent data loss
- **Collection support**: Organize embeddings by project/context
- **Chunk inspection**: Human-readable chunks.json for debugging

#### 2. QueryWorkflow (RAG Query)
Orchestrates: `EmbeddingClient → EmbeddingStore → VectorSearch → PromptBuilder → LlmClient`

Flow:
1. Embed user query via LLM Farm API
2. Load stored embeddings from collection-specific JSON
3. Find top-K similar chunks (cosine similarity)
4. Build prompt with retrieved context
5. Query LLM Farm API for response
6. Return answer to user

Entry point: `src/cli/chat.ts`

Key Features:
- **Collection-aware**: Query specific document collections
- **Efficient caching**: Loads embeddings once per session

### Core Services

- **DocumentReader**: Extracts text from PDF files using `pdf-parse`
- **TextChunker**: Splits text into overlapping chunks with SHA-256 hash IDs
- **EmbeddingClient**: Calls LLM Farm text-embedding-3-small API
- **EmbeddingStore**: Persists/loads embeddings with incremental save and merge capability
- **VectorSearch**: Performs cosine similarity search on embeddings
- **PromptBuilder**: Constructs RAG prompts with context and question
- **LlmClient**: Communicates with LLM Farm gemini-2.0-flash-lite API
- **ProgressReporter**: Displays colored console progress output
- **ConfigService**: Centralized configuration with collection support

### Dependency Injection Container

Located in `src/di/Container.ts`:
- Instantiates all services with proper dependencies
- Manages singleton instances
- Injects configuration values from `ConfigService` into services
- Acts as the single source of truth for service wiring
- Supports collection-specific configuration via constructor parameter

CLI entry points call `createContainer(collectionName)` to get fully-wired services.

### Configuration

Managed by `ConfigService` (`src/config/`):

**Required (from `.env`):**
- `LLM_FARM_API_KEY` - Bosch LLM Farm API key (embeddings + LLM)

**Optional with defaults:**
- `CHUNK_SIZE` (default: 500)
- `CHUNK_OVERLAP` (default: 50)
- `TOP_K` (default: 3)
- `DOCUMENTS_PATH` (default: `./documents`)
- `COLLECTIONS_PATH` (default: `./data/collections`)
- `CHUNKS_PATH` (default: `./data/chunks`)

**Collection-Specific Paths (auto-generated):**
- Embeddings: `{COLLECTIONS_PATH}/{collectionName}.embeddings.json`
- Chunks: `{CHUNKS_PATH}/{collectionName}.chunks.json`

### Technology Stack

- **Runtime**: Node.js v18+
- **Language**: TypeScript with ES modules (`"type": "module"`)
- **Testing**: Jest with ts-jest (ESM mode)
- **External APIs**: Bosch LLM Farm (embeddings + LLM)
- **Storage**: Local JSON files (no database)
- **Interface**: CLI only

### Data Structure

```
data/
├── collections/           # Embeddings organized by collection
│   ├── default.embeddings.json
│   ├── project-a.embeddings.json
│   └── project-b.embeddings.json
└── chunks/               # Human-readable chunks for inspection
    ├── default.chunks.json
    ├── project-a.chunks.json
    └── project-b.chunks.json
```

**Embeddings File Format:**
- Each embedding has `chunkId` (SHA-256 hash) in metadata
- Supports incremental merge via `saveIncremental()`
- Atomic writes prevent corruption

**Chunks File Format:**
- Contains all text chunks with positions and metadata
- Includes `chunkId`, `text`, `startPosition`, `endPosition`, `chunkIndex`
- Useful for debugging chunking strategy

### Important Implementation Notes

1. **Chunk ID Strategy**: Each chunk gets a unique SHA-256 hash based on its text content. Identical text produces identical ID, enabling automatic deduplication and efficient resume capability.

2. **Incremental Saving**: Embeddings save every 50 chunks (configurable via `CHECKPOINT_INTERVAL` constant). This prevents data loss on crashes and enables resume functionality.

3. **Resume Capability**: On restart, the workflow loads existing embeddings and skips chunks with matching IDs. This allows interrupted processes to continue without re-processing.

4. **Collection Isolation**: Each collection has separate embeddings and chunks files. This allows organizing unrelated document sets (e.g., different projects) without mixing contexts.

5. **Proxy Configuration**: When running within the Bosch corporate network, the application requires a local HTTP proxy (localhost:3128) to access the LLM Farm API. The codebase uses the `tunnel` package instead of Axios's native proxy support to avoid redirect loop issues. See [PROXY_SETUP.md](./PROXY_SETUP.md) for details.

6. **ES Modules**: Project uses ES modules. All imports must include `.js` extensions even in TypeScript files (e.g., `import { foo } from './bar.js'`)

7. **Jest Configuration**: Tests require `--experimental-vm-modules` flag due to ESM usage

8. **Service Exports**: Each service's `index.ts` exports only the interface and factory function, never the implementation class

9. **No Shared Models**: Services own their data models. Cross-service data transfer uses simple DTOs

10. **Workflow Pattern**: Workflows are NOT services - they orchestrate services and are instantiated in CLI entry points

11. **Error Handling**: Services throw descriptive errors. Workflows catch and report via `ProgressReporter`

### User Workflow

**Basic (Single Collection):**
1. Copy PDF documents to `documents/` folder
2. Run `npm run generate-embeddings` to process and index documents
3. Run `npm run chat` to ask questions about the documents
4. Type `exit` or `quit` to end chat session

**Multi-Collection (Separate Document Sets):**
1. Copy PDFs for Project A to `documents/` folder
2. Run `npm run generate-embeddings -- --collection project-a`
3. Copy PDFs for Project B (replace or add to `documents/`)
4. Run `npm run generate-embeddings -- --collection project-b`
5. Chat with specific collection: `npm run chat -- --collection project-a`

**Resume After Interruption:**
- Re-run the same command - already-processed chunks are skipped
- Example: `npm run generate-embeddings -- --collection project-a`
- Reports: "Resume: Found X existing embeddings, Y remaining"

### Testing Strategy

- Unit tests per service in `tests/services/`
- Integration tests for the DI container in `tests/di/`
- Tests verify service isolation and proper dependency injection
- Mock interfaces for testing, not implementations
