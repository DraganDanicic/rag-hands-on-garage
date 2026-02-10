# Release History

All notable changes documented following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
<!-- Future changes go here -->

## [1.3.0] - 2026-02-11

### Added
- **In-Chat Slash Commands**: Interactive command system within chat sessions
  - `/help` - Display all available commands with descriptions
  - `/exit`, `/quit` - Exit the chat session
  - `/collection <name>` - Switch to a different collection mid-session
  - `/collections` - List all available collections with statistics
  - `/settings` - Show current LLM configuration
  - `/status` - Display collection statistics
  - `/config` - Show full system configuration
  - Command Pattern architecture with CommandParser and CommandRegistry
  - Collection switching with automatic container re-initialization
  - Full backward compatibility (plain `exit`/`quit` still works)
- **Selective Document Processing**: Granular control over document indexing
  - `rag-garage documents list` - List available PDF documents with metadata
  - `--documents "file1.pdf,file2.pdf"` - Select specific files to process
  - `--interactive` - Interactive document selection UI
  - `--dry-run` - Preview what would be processed without generating embeddings
  - Support for incremental document addition to existing collections
  - DocumentMetadata model for file information
  - Extended IDocumentReader with listDocuments() and readSelectedDocuments()
- **Automatic Proxy Detection**: Smart proxy configuration for Bosch network
  - Auto-detects proxy settings from `https_proxy` environment variable
  - Parses proxy URL to extract host and port automatically
  - Priority: `https_proxy` > `PROXY_HOST`/`PROXY_PORT` > defaults
  - Works out-of-the-box on any Bosch computer with standard proxy setup
  - No manual configuration needed for corporate networks
- **Comprehensive Documentation**:
  - FEATURES_IMPLEMENTATION.md - Implementation summary
  - VERIFICATION.md - Complete manual testing guide
  - DEMO.md - Quick demo and usage examples
  - src/services/command-handler/README.md - Command handler service documentation

### Changed
- Chat interface now parses slash commands before processing queries
- ConfigService now prioritizes `https_proxy` over individual proxy settings
- LlmClient and EmbeddingClient use ConfigService proxy settings consistently
- IndexingWorkflow accepts optional pre-loaded documents parameter
- Updated .env.example with enhanced proxy documentation

### Fixed
- **LLM Deployment Name Format**: Corrected model name URL encoding
  - Converts dots to dashes in deployment names (e.g., `gemini-2.0-flash-lite` → `google-gemini-2-0-flash-lite`)
  - Fixes 404 errors when querying LLM Farm API
- **Proxy Configuration**: Fixed proxy auto-detection for Bosch network
  - LlmFarmLlmClient and LlmFarmEmbeddingClient now properly use parsed proxy settings
  - Ensures consistent proxy behavior across all API clients
- **Test Suite**: Updated mocks to match new IDocumentReader interface methods

### Migration Guide

No breaking changes. All new features are opt-in:

**To use slash commands:**
```bash
npm run chat
# Then type: /help
```

**To use document selection:**
```bash
# List documents first
rag-garage documents list

# Select specific files
rag-garage generate --documents "file1.pdf,file2.pdf"

# Interactive mode
rag-garage generate --interactive

# Preview mode
rag-garage generate --dry-run
```

**Proxy configuration:**
- If you have `https_proxy` set (standard on Bosch computers), proxy will auto-detect
- No changes needed to existing `.env` files
- System works automatically on corporate networks

**Commit:** [View changes](../../compare/v1.2.0...v1.3.0)

## [1.2.0] - 2026-02-10

### Added
- **Professional CLI Framework**: Complete CLI rewrite using commander.js with 5 major commands
  - `rag-garage generate` - Generate embeddings with collection support
  - `rag-garage chat` - Interactive chat with collection support
  - `rag-garage collections` - Collection management (list, info, delete)
  - `rag-garage config` - Configuration management (show, validate)
  - `rag-garage status` - System health and API connectivity checks
- **Enhanced Configuration System**: 20+ new ConfigService methods for full environment control
  - LLM configuration (model, temperature, max tokens)
  - Embedding configuration (model name)
  - Prompt template system (built-in or custom)
  - Performance & reliability (checkpoint interval, retries, timeouts)
  - Proxy configuration (enable/disable, host, port)
- **Prompt Template System**: Four built-in templates (default, concise, detailed, technical)
  - TemplateLoader service for built-in and custom templates
  - Async PromptBuilder initialization
  - Template validation for required placeholders
- **CollectionManager Service**: Programmatic collection management
  - List collections with metadata (count, size, dates)
  - Get detailed collection information
  - Delete collections
  - Check collection existence
- **ErrorHandler Service**: Context-aware error handling with 15+ error patterns
  - Pattern matching for common errors (API key, network, rate limit, etc.)
  - Specific troubleshooting tips and suggested commands
  - Integration across all CLI commands
- **Comprehensive Documentation**:
  - Complete .env.example with 120+ lines
  - UX_ENHANCEMENTS_SUMMARY.md
  - CLI_IMPLEMENTATION_SUMMARY.md
  - ERROR_HANDLER_SUMMARY.md
  - CUSTOMIZE_PROMPT.md
  - RELEASE_PROCESS.md

### Changed
- CLI entry point moved from npm scripts to `rag-garage` command
- All hardcoded values now configurable via .env
- LlmFarmLlmClient and LlmFarmEmbeddingClient accept full configuration objects
- Container initialization now async to support service setup
- PromptBuilder requires async initialize() call before use
- Error messages now context-specific instead of generic

### Fixed
- Removed hardcoded temperature (0.7) in QueryWorkflow
- Removed hardcoded checkpoint interval (50) in IndexingWorkflow
- Improved error messages for missing API keys
- Better validation for numeric configuration values

### Performance
- Configurable API timeouts prevent hanging on slow networks
- Configurable retry settings optimize resilience vs speed
- Configurable checkpoint interval balances save frequency vs performance

### Migration Guide
```bash
# Update .env file with new optional settings
# Copy values from .env.example for full configuration control

# Optional: Add prompt template configuration
PROMPT_TEMPLATE=concise  # or detailed, technical, custom file path

# Optional: Customize LLM behavior
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2048

# Optional: Adjust performance settings
CHECKPOINT_INTERVAL=50
MAX_RETRIES=3
RETRY_DELAY_MS=1000

# CLI commands now use rag-garage instead of npm scripts
# Old: npm run generate-embeddings
# New: rag-garage generate

# Old: npm run chat
# New: rag-garage chat

# New commands available:
rag-garage collections list
rag-garage config show
rag-garage config validate
rag-garage status
```

**Commit:** [View changes](../../commit/HEAD)

## [1.1.0] - 2026-02-09

### Added
- Incremental saving (every 50 chunks) prevents data loss on interruption
- Resume capability via SHA-256 hash-based chunk IDs
- Document collections support (`--collection` flag) for organizing separate datasets
- Chunk inspection files (`data/chunks/*.chunks.json`) for debugging
- SHA-256 hash-based chunk IDs for deduplication
- New CLI options for collection management
- `saveIncremental()` method in EmbeddingStore for checkpoint saves
- Collection-aware ConfigService with dynamic path generation
- Utility functions for chunk ID generation in `src/services/text-chunker/utils/`

### Changed
- Data structure reorganized: `collections/` and `chunks/` directories
- CLI enhanced with collection support for both commands
- `TextChunk` model includes `chunkId` field
- DI Container accepts `collectionName` parameter for collection-specific wiring
- API key consolidated to single `LLM_FARM_API_KEY` environment variable
- EmbeddingStore now supports loading and merging existing embeddings

### Deprecated
- `EMBEDDINGS_PATH` environment variable (use `COLLECTIONS_PATH` instead)

### Performance
- Reduced memory usage for large document sets via incremental processing
- Cost savings by skipping already-processed chunks
- Startup time increased by +100-500ms (one-time load of existing embeddings)

### Migration Guide
```bash
# Create new directory structure
mkdir -p data/collections data/chunks

# Move existing embeddings to default collection
mv data/embeddings.json data/collections/default.embeddings.json

# Update .env file
# Remove EMBEDDINGS_PATH (optional)
# Add COLLECTIONS_PATH=./data/collections (optional, has default)
# Add CHUNKS_PATH=./data/chunks (optional, has default)
```

**Commit:** [View changes](../../commit/HEAD)

---

## [1.0.0] - 2026-02-09

### Initial Release
First working version of RAG Hands-On Garage - a complete end-to-end RAG system built from scratch.

### Features

#### IndexingWorkflow (Embedding Generation)
- PDF document reading via `pdf-parse`
- Text chunking with configurable size and overlap
- OpenAI text-embedding-3-small via Bosch LLM Farm API
- Persistent storage in JSON format

#### QueryWorkflow (RAG Chat)
- Natural language query processing
- Vector similarity search (cosine similarity)
- Context-aware prompt building
- Gemini 2.0 Flash Lite LLM via Bosch LLM Farm API
- Interactive CLI chat interface

#### Architecture
- 9 isolated services with dependency injection
- Interface-driven design (no inter-service dependencies)
- Two high-level workflows orchestrating services
- Comprehensive DI container for service wiring

### Core Services
- **DocumentReader**: PDF text extraction
- **TextChunker**: Configurable text chunking with overlap
- **EmbeddingClient**: OpenAI embedding generation
- **EmbeddingStore**: JSON-based embedding persistence
- **VectorSearch**: Cosine similarity search
- **PromptBuilder**: RAG prompt construction
- **LlmClient**: Gemini LLM integration
- **ProgressReporter**: Colored console output
- **ConfigService**: Centralized configuration management

### Commands
```bash
# Generate embeddings from PDFs
npm run generate-embeddings

# Start interactive chat
npm run chat
```

### Configuration
**Required:**
- `LLM_FARM_API_KEY` - Bosch LLM Farm API key (embeddings + LLM)

**Optional (with defaults):**
- `CHUNK_SIZE=500` - Text chunk size in characters
- `CHUNK_OVERLAP=50` - Overlap between chunks
- `TOP_K=3` - Number of similar chunks to retrieve
- `DOCUMENTS_PATH=./documents` - PDF source directory
- `EMBEDDINGS_PATH=./data/embeddings.json` - Embedding storage path

### Technology Stack
- Node.js v18+
- TypeScript with ES modules
- Jest testing framework (ESM mode)
- Bosch LLM Farm API (text-embedding-3-small + gemini-2.0-flash-lite)
- Local JSON storage (no database)

### Proxy Support
- Corporate network proxy support via `tunnel` package
- Configuration for localhost:3128 proxy
- Resolves redirect loop issues with LLM Farm API

**Commit:** [5d61ec5](../../commit/5d61ec5)

---

## Version Comparison

### v1.0.0 → v1.1.0
**Type:** Minor version (new features, backward compatible)

**Key Improvements:**
1. **Reliability**: Incremental saves prevent data loss
2. **Efficiency**: Resume capability reduces API costs
3. **Organization**: Collections enable multi-project workflows
4. **Debugging**: Chunk inspection files for troubleshooting

**Breaking Changes:** None (fully backward compatible)

**Upgrade Recommendation:** All users should upgrade to benefit from resume capability and incremental saves
