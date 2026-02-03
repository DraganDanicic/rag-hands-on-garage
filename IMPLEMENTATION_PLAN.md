# RAG Hands-On Garage - Implementation Roadmap

**Last Updated:** 2026-02-03
**Status:** Planning Complete → Implementation Not Started
**Code Coverage:** 0% (documentation only)

---

## Repository Assessment

### What Exists ✓
- [x] Comprehensive SPEC.md with architecture and service boundaries
- [x] Service-level READMEs for all 9 services with interface contracts
- [x] Clear dependency injection patterns documented
- [x] Agent configuration files (.claude/agents/)
- [x] Git repository initialized with .gitignore

### What's Missing ✗
- [ ] Package.json and npm dependencies
- [ ] TypeScript configuration (tsconfig.json)
- [ ] Root README.md with setup instructions
- [ ] All service implementations (0 .ts files)
- [ ] CLI entry points
- [ ] Configuration code
- [ ] Workflow orchestration code
- [ ] Dependency injection container
- [ ] Test infrastructure
- [ ] Project directories (documents/, data/)
- [ ] Environment configuration

---

## Implementation Roadmap

### Priority 1: Project Foundation 🔴 CRITICAL

#### Task 1.1: Initialize Node.js/TypeScript Project
- [ ] Create package.json with dependencies
  - [ ] Core: pdf-parse, axios, dotenv, chalk
  - [ ] Dev: typescript, ts-node, @types/node, @types/pdf-parse
- [ ] Create tsconfig.json with strict mode enabled
- [ ] Set up npm scripts
  - [ ] `build` - Compile TypeScript
  - [ ] `dev` - Development mode
  - [ ] `generate-embeddings` - Run embedding generation
  - [ ] `chat` - Run chat interface

#### Task 1.2: Create Project README
- [ ] Setup instructions (npm install, API keys)
- [ ] Usage workflow (embedding generation → chat)
- [ ] Configuration guide
- [ ] Learning objectives

#### Task 1.3: Project Infrastructure
- [ ] Create documents/ directory with .gitkeep
- [ ] Create data/ directory with .gitkeep
- [ ] Create .env.example with API key placeholders
- [ ] Add example PDF for testing

---

### Priority 2: Core Services Implementation 🟡

#### Task 2.1: Implement Leaf Services (No Dependencies)

**Service 1: document-reader**
- [ ] Create IDocumentReader.ts (interface)
- [ ] Create DocumentReader.ts (implementation)
- [ ] Create models/Document.ts
- [ ] Create index.ts (factory export)
- [ ] Integrate pdf-parse library

**Service 2: text-chunker**
- [ ] Create ITextChunker.ts (interface)
- [ ] Create TextChunker.ts (implementation)
- [ ] Create models/TextChunk.ts
- [ ] Create models/ChunkingConfig.ts
- [ ] Create index.ts (factory export)
- [ ] Implement string splitting with overlap logic

**Service 3: progress-reporter**
- [ ] Create IProgressReporter.ts (interface)
- [ ] Create ConsoleProgressReporter.ts (implementation)
- [ ] Create index.ts (factory export)
- [ ] Integrate chalk for colorized output

**Service 4: embedding-client**
- [ ] Create IEmbeddingClient.ts (interface)
- [ ] Create OpenAIEmbeddingClient.ts (implementation)
- [ ] Create models/EmbeddingRequest.ts
- [ ] Create models/EmbeddingResponse.ts
- [ ] Create index.ts (factory export)
- [ ] Implement HTTP client for OpenAI API
- [ ] Add retry logic for transient failures

**Service 5: llm-client**
- [ ] Create ILlmClient.ts (interface)
- [ ] Create GeminiLlmClient.ts (implementation)
- [ ] Create models/LlmRequest.ts
- [ ] Create models/LlmResponse.ts
- [ ] Create index.ts (factory export)
- [ ] Implement HTTP client for Gemini API

#### Task 2.2: Implement Data Services

**Service 6: embedding-store**
- [ ] Create IEmbeddingStore.ts (interface)
- [ ] Create JsonEmbeddingStore.ts (implementation)
- [ ] Create models/StoredEmbedding.ts
- [ ] Create index.ts (factory export)
- [ ] Implement JSON file read/write operations

**Service 7: vector-search**
- [ ] Create IVectorSearch.ts (interface)
- [ ] Create VectorSearch.ts (implementation)
- [ ] Create models/SearchResult.ts
- [ ] Create index.ts (factory export)
- [ ] Implement cosine similarity algorithm

**Service 8: prompt-builder**
- [ ] Create IPromptBuilder.ts (interface)
- [ ] Create PromptBuilder.ts (implementation)
- [ ] Create models/PromptTemplate.ts
- [ ] Create index.ts (factory export)
- [ ] Implement template string replacement logic

---

### Priority 3: Configuration System 🟡

#### Task 3.1: Configuration Implementation
- [ ] Create config/AppConfig.ts (interface definition)
- [ ] Create config/default-config.ts (default values)
- [ ] Create config/config.ts (loader with dotenv)
- [ ] Add environment variable validation
- [ ] Document all configuration options

---

### Priority 4: Orchestration Layer 🟢

#### Task 4.1: Workflows
- [ ] Create workflows/EmbeddingGenerationWorkflow.ts
  - [ ] Orchestrate: read → chunk → embed → store → report
- [ ] Create workflows/QueryWorkflow.ts
  - [ ] Orchestrate: embed → search → build prompt → query LLM

#### Task 4.2: High-Level Orchestrator
- [ ] Create rag-orchestrator/IRagOrchestrator.ts (interface)
- [ ] Create rag-orchestrator/RagOrchestrator.ts (implementation)
- [ ] Create rag-orchestrator/index.ts (factory export)

#### Task 4.3: Dependency Injection
- [ ] Create container.ts
- [ ] Wire all services together
- [ ] Set up dependency injection for workflows
- [ ] Set up dependency injection for CLI entry points

---

### Priority 5: CLI Entry Points 🟢

#### Task 5.1: CLI Commands
- [ ] Create cli/generate-embeddings.ts
  - [ ] Parse command line arguments
  - [ ] Initialize container
  - [ ] Run EmbeddingGenerationWorkflow
  - [ ] Display results and errors
- [ ] Create cli/chat.ts
  - [ ] Set up readline interface
  - [ ] Initialize container
  - [ ] Run QueryWorkflow for each question
  - [ ] Handle exit commands

---

### Priority 6: Testing & Quality 🟢

#### Task 6.1: Unit Tests
- [ ] Create tests/ directory structure
- [ ] Write tests for document-reader
- [ ] Write tests for text-chunker
- [ ] Write tests for embedding-client (mocked)
- [ ] Write tests for llm-client (mocked)
- [ ] Write tests for embedding-store
- [ ] Write tests for vector-search
- [ ] Write tests for prompt-builder
- [ ] Write tests for progress-reporter
- [ ] Write tests for rag-orchestrator

#### Task 6.2: Integration Testing
- [ ] End-to-end test with sample PDF
- [ ] Workflow integration tests
- [ ] Error handling scenarios

---

### Priority 7: Documentation & Examples 🔵

#### Task 7.1: Developer Documentation
- [ ] Architecture decision records
- [ ] API documentation for each service
- [ ] Troubleshooting guide
- [ ] Contributing guidelines

#### Task 7.2: Example Content
- [ ] Add sample PDF documents (2-3 examples)
- [ ] Create example queries and expected outputs
- [ ] Document configuration examples for different use cases
- [ ] Add workshop/training guide

---

## Sprint Breakdown

**Sprint 1 (Foundation) - Week 1**
- Tasks 1.1, 1.2, 1.3
- **Goal:** Runnable TypeScript project with proper setup

**Sprint 2 (Core Services) - Weeks 2-3**
- Tasks 2.1, 2.2
- **Goal:** All 9 services implemented and tested independently

**Sprint 3 (Integration) - Week 4**
- Tasks 3.1, 4.1, 4.2, 4.3
- **Goal:** Services wired together, workflows operational

**Sprint 4 (User Interface) - Week 5**
- Task 5.1
- **Goal:** Working CLI commands for embedding generation and chat

**Sprint 5 (Quality) - Week 6**
- Tasks 6.1, 6.2
- **Goal:** Comprehensive test coverage and validation

**Sprint 6 (Polish) - Week 7**
- Tasks 7.1, 7.2
- **Goal:** Production-ready with documentation and examples

---

## Critical Path

```
Foundation → Leaf Services → Data Services → Config → Workflows → Orchestrator → Container → CLI → Testing
```

**Recommended Starting Point:**
Begin with **Priority 1, Task 1.1** (package.json + tsconfig.json)

**Dependencies:**
- Services can be implemented in parallel after foundation is complete
- Workflows require all services to be implemented
- CLI requires workflows and container
- Testing can run in parallel with development

---

## Progress Tracking

**Completed:** 0 / 90 tasks
**In Progress:** 0 tasks
**Blocked:** 0 tasks

---

## Notes & Decisions

*Add notes here as implementation progresses...*

---

## References

- Main specification: [SPEC.md](./SPEC.md)
- Service documentation: [src/services/*/README.md](./src/services/)
- Git history: `git log --oneline`
