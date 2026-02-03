# RAG Hands-On Garage - Project Specification

## Overview
A hands-on training project that teaches participants how to build a Retrieval-Augmented Generation (RAG) system from scratch using Node.js and TypeScript.

## Goals
- Provide practical experience with RAG implementation
- Minimize external dependencies for easy setup
- Enable participants to understand each component of the RAG pipeline
- Create a working system that can answer questions from PDF documents

## Technology Stack
- **Runtime**: Node.js
- **Language**: TypeScript
- **Embedding Service**: OpenAI text-embedding-3-small
- **LLM Service**: Google Gemini 2.0 Flash Lite
- **Storage**: Local file system (JSON)
- **Interface**: CLI/Terminal

## System Architecture

### Components

#### 1. PDF Ingestion
- Users copy PDF documents into a designated folder (e.g., `./documents`)
- System reads and extracts text from PDF files

#### 2. Configuration
- Configuration via JavaScript/TypeScript object
- Configurable parameters:
  - Chunk size (number of characters/tokens per embedding)
  - Chunk overlap (characters to overlap between chunks)
  - Number of chunks to retrieve (N) during query
  - API keys for external services
  - Template for LLM prompt construction

#### 3. Embedding Generation Script
- Script that processes PDFs and creates embeddings
- Features:
  - Reads PDF documents from input folder
  - Splits text into chunks based on configuration
  - Calls OpenAI text-embedding-3-small API for each chunk
  - Stores embeddings in local JSON file
  - Displays progress in console (e.g., "Processing chunk 45/120...")
  - Shows completion status and summary

#### 4. Embedding Storage
- Local file-based storage (e.g., `embeddings.json`)
- Structure should include:
  - Document source (filename)
  - Text chunk
  - Embedding vector
  - Metadata (chunk position, etc.)

#### 5. Chat Interface (CLI)
- Terminal-based interactive chat
- User flow:
  1. User enters a question/prompt
  2. System embeds the query using text-embedding-3-small
  3. System retrieves N most similar chunks via vector similarity
  4. System constructs prompt using template:
     - User question
     - Retrieved context chunks
     - Instructions/template wrapper
  5. System sends to Gemini 2.0 Flash Lite
  6. System displays LLM response
  7. Loop continues until user exits

## Architectural Standards

### Isolated Service Architecture

Each service is:
- **Self-contained**: Own models, interfaces, and implementations
- **Single Responsibility**: Handles ONE specific domain concern
- **Interface-driven**: Exposes clean public API via interface
- **Independent**: No direct coupling to other services
- **Testable**: Can be tested in complete isolation

### Service Communication Rules
1. Services NEVER import from other services directly
2. All communication through dependency injection of interfaces
3. Each service exports only its interface and factory function
4. Services own their data models (no shared entities)
5. Cross-service data transfer via simple DTOs

### Communication Pattern
```typescript
// Service exports (index.ts)
export { IServiceName } from './IServiceName';
export { createServiceName } from './factory';

// Dependency injection (constructor/factory)
export function createServiceName(dependencies: {
  dependency1: IDependency1;
  dependency2: IDependency2;
}): IServiceName {
  return new ServiceNameImpl(dependencies);
}

// Workflows orchestrate services
class EmbeddingWorkflow {
  constructor(
    private documentReader: IDocumentReader,
    private textChunker: ITextChunker,
    private embeddingClient: IEmbeddingClient
  ) {}
}
```

**Key Principles:**
- Workflows know about services (via interfaces), services don't know about workflows
- Services don't know about each other (only interfaces)
- Container.ts wires everything together at startup
- All dependencies are injected, never imported directly

## Dependency Diagrams

### Service Isolation (No Inter-Service Dependencies)
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ document-reader │     │  text-chunker   │     │ embedding-client│
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ↑                       ↑                        ↑
        │                       │                        │
        └───────────────────────┴────────────────────────┘
                                │
                         (Workflows inject
                       interfaces as needed)
```

### Embedding Generation Workflow Dependencies
```
┌─────────────────────────────────────────────────────┐
│         generate-embeddings.ts (CLI Entry)          │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│         EmbeddingGenerationWorkflow                 │
│  (Orchestrates the embedding generation process)    │
└─┬───────┬─────────┬──────────┬────────────────────┬─┘
  │       │         │          │                    │
  ↓       ↓         ↓          ↓                    ↓
┌────┐ ┌────┐ ┌─────────┐ ┌─────────┐ ┌──────────────────┐
│ DR │ │ TC │ │   EC    │ │   ES    │ │        PR        │
└────┘ └────┘ └─────────┘ └─────────┘ └──────────────────┘
  │      │         │          │                │
  │      │         │          │                │
Legend:  │         │          │                │
DR = IDocumentReader          │                │
TC = ITextChunker             │                │
EC = IEmbeddingClient         │                │
ES = IEmbeddingStore                           │
PR = IProgressReporter

Flow:
1. Read PDF documents (IDocumentReader)
2. Split into chunks (ITextChunker)
3. Generate embeddings (IEmbeddingClient → OpenAI API)
4. Store embeddings (IEmbeddingStore → JSON file)
5. Report progress (IProgressReporter → Console)
```

### Query Workflow Dependencies
```
┌─────────────────────────────────────────────────────┐
│              chat.ts (CLI Entry)                    │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│              QueryWorkflow                          │
│     (Orchestrates the RAG query process)            │
└─┬──────────┬─────────┬──────────┬────────────────┬──┘
  │          │         │          │                │
  ↓          ↓         ↓          ↓                ↓
┌────┐   ┌────┐   ┌────┐   ┌─────────┐   ┌──────────┐
│ EC │   │ ES │   │ VS │   │   PB    │   │    LC    │
└────┘   └────┘   └────┘   └─────────┘   └──────────┘
  │        │        │           │              │
  │        │        │           │              │
Legend:    │        │           │              │
EC = IEmbeddingClient           │              │
ES = IEmbeddingStore            │              │
VS = IVectorSearch                             │
PB = IPromptBuilder                            │
LC = ILlmClient

Flow:
1. Embed user query (IEmbeddingClient → OpenAI API)
2. Load stored embeddings (IEmbeddingStore → JSON file)
3. Find similar chunks (IVectorSearch → Cosine similarity)
4. Build prompt with context (IPromptBuilder)
5. Get LLM response (ILlmClient → Gemini API)
```

### External Dependencies (API Calls)
```
┌──────────────────────┐           ┌──────────────────────┐
│  embedding-client    │──HTTP────>│   OpenAI API         │
│ (text-embedding-3)   │           │ (text-embedding-3-   │
│                      │           │       small)         │
└──────────────────────┘           └──────────────────────┘

┌──────────────────────┐           ┌──────────────────────┐
│    llm-client        │──HTTP────>│   Google Gemini API  │
│                      │           │ (Gemini 2.0 Flash    │
│                      │           │       Lite)          │
└──────────────────────┘           └──────────────────────┘
```

### Module Standards
- One service per directory
- Each service has: interface, implementation, models, types
- Index file exports only public API (interface + factory)
- All internal implementation details are private
- TypeScript strict mode enabled

## Project Structure

```
rag-hands-on-garage/
├── src/
│   ├── services/
│   │   │
│   │   ├── document-reader/              # Service: PDF document reading
│   │   │   ├── IDocumentReader.ts        # Public interface
│   │   │   ├── DocumentReader.ts         # Implementation
│   │   │   ├── models/
│   │   │   │   └── Document.ts           # Document model
│   │   │   └── index.ts                  # Exports interface + factory only
│   │   │
│   │   ├── text-chunker/                 # Service: Text chunking
│   │   │   ├── ITextChunker.ts           # Public interface
│   │   │   ├── TextChunker.ts            # Implementation
│   │   │   ├── models/
│   │   │   │   ├── TextChunk.ts          # Chunk model
│   │   │   │   └── ChunkingConfig.ts     # Config model
│   │   │   └── index.ts
│   │   │
│   │   ├── embedding-client/             # Service: Embedding API client
│   │   │   ├── IEmbeddingClient.ts       # Public interface
│   │   │   ├── OpenAIEmbeddingClient.ts  # OpenAI implementation
│   │   │   ├── models/
│   │   │   │   ├── EmbeddingRequest.ts   # Request model
│   │   │   │   └── EmbeddingResponse.ts  # Response model
│   │   │   └── index.ts
│   │   │
│   │   ├── embedding-store/              # Service: Store/retrieve embeddings
│   │   │   ├── IEmbeddingStore.ts        # Public interface
│   │   │   ├── JsonEmbeddingStore.ts     # JSON file implementation
│   │   │   ├── models/
│   │   │   │   └── StoredEmbedding.ts    # Storage model
│   │   │   └── index.ts
│   │   │
│   │   ├── vector-search/                # Service: Similarity search
│   │   │   ├── IVectorSearch.ts          # Public interface
│   │   │   ├── VectorSearch.ts           # Cosine similarity implementation
│   │   │   ├── models/
│   │   │   │   └── SearchResult.ts       # Result model
│   │   │   └── index.ts
│   │   │
│   │   ├── llm-client/                   # Service: LLM communication
│   │   │   ├── ILlmClient.ts             # Public interface
│   │   │   ├── GeminiLlmClient.ts        # Gemini implementation
│   │   │   ├── models/
│   │   │   │   ├── LlmRequest.ts         # Request model
│   │   │   │   └── LlmResponse.ts        # Response model
│   │   │   └── index.ts
│   │   │
│   │   ├── prompt-builder/               # Service: Construct RAG prompts
│   │   │   ├── IPromptBuilder.ts         # Public interface
│   │   │   ├── PromptBuilder.ts          # Implementation
│   │   │   ├── models/
│   │   │   │   └── PromptTemplate.ts     # Template model
│   │   │   └── index.ts
│   │   │
│   │   ├── progress-reporter/            # Service: Console progress output
│   │   │   ├── IProgressReporter.ts      # Public interface
│   │   │   ├── ConsoleProgressReporter.ts  # Implementation
│   │   │   └── index.ts
│   │   │
│   │   └── rag-orchestrator/             # Service: Coordinates RAG flow
│   │       ├── IRagOrchestrator.ts       # Public interface
│   │       ├── RagOrchestrator.ts        # Implementation
│   │       └── index.ts
│   │
│   ├── workflows/                        # High-level workflow coordination
│   │   ├── EmbeddingGenerationWorkflow.ts  # Orchestrates embedding generation
│   │   └── QueryWorkflow.ts              # Orchestrates query handling
│   │
│   ├── config/
│   │   ├── AppConfig.ts                  # Configuration interface
│   │   ├── config.ts                     # Configuration loader
│   │   └── default-config.ts             # Default values
│   │
│   ├── cli/                              # CLI interface layer
│   │   ├── generate-embeddings.ts        # Entry point: embedding generation
│   │   └── chat.ts                       # Entry point: chat interface
│   │
│   └── container.ts                      # Dependency injection setup
│
├── documents/                            # Input folder for PDFs
├── data/
│   └── embeddings.json                   # Generated embeddings storage
├── tests/
│   └── services/                         # Unit tests per service
│       ├── document-reader/
│       ├── text-chunker/
│       └── ...
├── package.json
├── tsconfig.json
└── README.md
```

## User Workflow

### Setup
1. Clone repository
2. Run `npm install`
3. Configure API keys in `src/config/settings.ts`
4. Adjust chunking parameters if desired

### Embedding Generation
1. Copy PDF document(s) to `./documents` folder
2. Configure chunking settings in `src/config/settings.ts`
3. Run: `npm run generate-embeddings`
4. Monitor progress in console
5. Embeddings saved to `data/embeddings.json`

### Query Interface
1. Run: `npm run chat`
2. Enter questions in terminal
3. Receive RAG-enhanced answers
4. Type 'exit' or 'quit' to end session

## Configuration Schema

```typescript
interface RagConfig {
  // Chunking settings
  chunkSize: number;           // Characters per chunk (e.g., 500)
  chunkOverlap: number;        // Overlap between chunks (e.g., 50)

  // Retrieval settings
  topK: number;                // Number of chunks to retrieve (e.g., 3)

  // API settings
  openaiApiKey: string;        // OpenAI API key for embeddings
  geminiApiKey: string;        // Google Gemini API key

  // Prompt template
  promptTemplate: string;      // Template with placeholders for {context} and {question}
}
```

## External Dependencies

### API Services (Only 2)
1. **OpenAI API** - text-embedding-3-small (embeddings)
2. **Google Gemini API** - 2.0 Flash Lite (LLM)

### NPM Dependencies
**Core:**
- `pdf-parse` - PDF text extraction
- `axios` - HTTP client for API calls
- `dotenv` - Environment variable management
- `chalk` - Colorized console output

**Development:**
- `typescript` - TypeScript compiler
- `ts-node` - Run TypeScript directly
- `@types/node` - Node.js type definitions
- `@types/pdf-parse` - PDF parse type definitions

## Learning Outcomes
Participants will learn:
- How RAG systems work end-to-end
- PDF text extraction and processing
- Text chunking strategies
- Vector embeddings and similarity search
- Prompt engineering for context injection
- Integration with modern LLM APIs
- Building practical AI applications

## Implementation Notes
- Keep code simple and readable for learning purposes
- Add comments explaining key concepts
- Use descriptive variable names
- Include error handling with clear messages
- Provide example PDFs for testing
- Include sample configuration with reasonable defaults
