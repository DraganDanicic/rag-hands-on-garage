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
- `OPENAI_API_KEY` - For text-embedding-3-small (required)
- `GEMINI_API_KEY` - For Gemini 2.0 Flash Lite (required)

### Running the Application
```bash
# Generate embeddings from PDFs in documents/ folder
npm run generate-embeddings

# Start interactive chat interface
npm run chat

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
2. Chunk text with configurable size and overlap
3. Generate embeddings via OpenAI API
4. Store embeddings in `data/embeddings.json`
5. Report progress to console

Entry point: `src/cli/generate-embeddings.ts`

#### 2. QueryWorkflow (RAG Query)
Orchestrates: `EmbeddingClient → EmbeddingStore → VectorSearch → PromptBuilder → LlmClient`

Flow:
1. Embed user query via OpenAI API
2. Load stored embeddings from JSON
3. Find top-K similar chunks (cosine similarity)
4. Build prompt with retrieved context
5. Query Gemini API for response
6. Return answer to user

Entry point: `src/cli/chat.ts`

### Core Services

- **DocumentReader**: Extracts text from PDF files using `pdf-parse`
- **TextChunker**: Splits text into overlapping chunks based on configuration
- **EmbeddingClient**: Calls OpenAI text-embedding-3-small API
- **EmbeddingStore**: Persists/loads embeddings to/from JSON files
- **VectorSearch**: Performs cosine similarity search on embeddings
- **PromptBuilder**: Constructs RAG prompts with context and question
- **LlmClient**: Communicates with Google Gemini 2.0 Flash Lite API
- **ProgressReporter**: Displays colored console progress output
- **ConfigService**: Centralized configuration from environment variables

### Dependency Injection Container

Located in `src/di/Container.ts`:
- Instantiates all services with proper dependencies
- Manages singleton instances
- Injects configuration values from `ConfigService` into services
- Acts as the single source of truth for service wiring

CLI entry points call `createContainer()` to get fully-wired services.

### Configuration

Managed by `ConfigService` (`src/config/`):

**Required (from `.env`):**
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

**Optional with defaults:**
- `CHUNK_SIZE` (default: 500)
- `CHUNK_OVERLAP` (default: 50)
- `TOP_K` (default: 3)
- `DOCUMENTS_PATH` (default: `./documents`)
- `EMBEDDINGS_PATH` (default: `./data/embeddings.json`)

### Technology Stack

- **Runtime**: Node.js v18+
- **Language**: TypeScript with ES modules (`"type": "module"`)
- **Testing**: Jest with ts-jest (ESM mode)
- **External APIs**: OpenAI (embeddings), Google Gemini (LLM)
- **Storage**: Local JSON files (no database)
- **Interface**: CLI only

### Important Implementation Notes

1. **ES Modules**: Project uses ES modules. All imports must include `.js` extensions even in TypeScript files (e.g., `import { foo } from './bar.js'`)

2. **Jest Configuration**: Tests require `--experimental-vm-modules` flag due to ESM usage

3. **Service Exports**: Each service's `index.ts` exports only the interface and factory function, never the implementation class

4. **No Shared Models**: Services own their data models. Cross-service data transfer uses simple DTOs

5. **Workflow Pattern**: Workflows are NOT services - they orchestrate services and are instantiated in CLI entry points

6. **Error Handling**: Services throw descriptive errors. Workflows catch and report via `ProgressReporter`

### User Workflow

1. Copy PDF documents to `documents/` folder
2. Run `npm run generate-embeddings` to process and index documents
3. Run `npm run chat` to ask questions about the documents
4. Type `exit` or `quit` to end chat session

### Testing Strategy

- Unit tests per service in `tests/services/`
- Integration tests for the DI container in `tests/di/`
- Tests verify service isolation and proper dependency injection
- Mock interfaces for testing, not implementations
