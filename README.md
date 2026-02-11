# RAG Hands-On Garage

A hands-on training project that teaches you how to build a Retrieval-Augmented Generation (RAG) system from scratch using Node.js and TypeScript.

## Overview

This project provides practical experience with RAG implementation by building a working system that can answer questions from PDF documents. You'll understand each component of the RAG pipeline and minimize external dependencies for easy setup.

## Goals

- Provide practical experience with RAG implementation
- Minimize external dependencies for easy setup
- Enable participants to understand each component of the RAG pipeline
- Create a working system that can answer questions from PDF documents

## Technology Stack

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Embedding Service**: Bosch LLM Farm (text-embedding-3-small)
- **LLM Service**: Bosch LLM Farm (gemini-2.0-flash-lite)
- **Storage**: Local file system (JSON)
- **Interface**: CLI/Terminal

## How to Use the Platform

### Quick Start (3 Steps)

1. **Setup**: Install dependencies and configure API key (see [Setup Instructions](#setup-instructions))
2. **Add Documents**: Copy PDFs to documents/ folder
3. **Chat**: Run interactive chat and start asking questions

### Interactive Chat

Start the chat interface:
```bash
npm run chat
```

Available in-chat commands:
- `/help` - See all commands with descriptions
- `/import` - Add documents and generate embeddings interactively
- `/collections` - View all collections with statistics
- `/collection <name>` - Switch to different collection
- `/settings` - View/modify all settings (unified settings management)
- `/show-prompt` - Toggle prompt visibility (for learning how RAG works)
- `/status` - See collection statistics
- `/config` - Show full system configuration
- `/delete <name>` - Delete a collection (with confirmation)
- `/rename <old> <new>` - Rename a collection
- `/exit` or `/quit` - Exit chat

### Managing Settings

The `/settings` command controls all aspects of system behavior:

**View all settings:**
```bash
/settings
```

**Query Settings** (runtime, affects current session):
- `top-k` - How many chunks to retrieve (1-10, default: 3)
- `temperature` - LLM creativity (0.0-2.0, default: 0.7)
- `max-tokens` - Response length limit (100-8000, default: 2048)
- `template` - Prompt style (default, concise, detailed, technical)
- `show-prompt` - Display prompt details (true/false)

**Import Settings** (for NEW collections only):
- `chunk-size` - Characters per chunk (100-5000, default: 500)
- `chunk-overlap` - Overlapping characters (0-500, default: 50)
- `checkpoint-interval` - Save frequency (1-1000, default: 50)
- `embedding-model` - Model to use (default: text-embedding-3-small)

**Change a setting:**
```bash
/settings set top-k 5
/settings set temperature 0.9
/settings set chunk-size 1000
```

**Reset to defaults:**
```bash
/settings reset
```

**Note:** Key names are flexible - use spaces, hyphens, or underscores:
- `/settings set "top k" 5` (with spaces)
- `/settings set top-k 5` (with hyphens)
- `/settings set top_k 5` (with underscores)

### Working with Multiple Collections

Organize different document sets with collections:

**List collections:**
```bash
/collections
```

**Switch collection:**
```bash
/collection project-a
```

**Import to specific collection:**
```bash
/import
# Then select collection when prompted
```

**From command line:**
```bash
npm run generate-embeddings -- --collection project-a
npm run chat -- --collection project-a
```

### Adding Documents

Two ways to add documents:

**Option 1: Interactive (Recommended)**
```bash
npm run chat
/import
# Follow the prompts to select collection and documents
```

**Option 2: Command Line**
```bash
# Copy PDFs to documents/ folder
cp your-file.pdf documents/

# Generate embeddings
npm run generate-embeddings

# Or for specific collection
npm run generate-embeddings -- --collection my-project
```

### Learning and Debugging

**See how RAG works:**
```bash
/show-prompt on
# Then ask a question - you'll see:
# - Which chunks were retrieved
# - Similarity scores
# - Complete prompt sent to LLM
```

**Check system status:**
```bash
/status   # Collection statistics
/config   # System configuration
```

## Architecture

The system follows an isolated service architecture where:
- Each service is self-contained with a single responsibility
- Services communicate through dependency injection of interfaces
- No direct coupling between services
- All services are independently testable

### Key Components

1. **Document Reader** - Reads and extracts text from PDF files
2. **Text Chunker** - Splits text into chunks with SHA-256 hash IDs for deduplication
3. **Embedding Client** - Generates vector embeddings via Bosch LLM Farm API
4. **Embedding Store** - Stores/retrieves embeddings with incremental save and resume support
5. **Vector Search** - Finds similar chunks using cosine similarity
6. **LLM Client** - Communicates with Bosch LLM Farm API
7. **Prompt Builder** - Constructs RAG prompts with context
8. **Progress Reporter** - Displays console progress output
9. **Config Service** - Manages configuration with collection support

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Keys

Create a `.env` file in the project root (use `.env.example` as a template):

```bash
LLM_FARM_API_KEY=your_llm_farm_api_key_here
```

**Getting API Keys:**
- Bosch LLM Farm: https://aoai-farm.bosch-temp.com (internal Bosch service)
- Provides access to both embedding generation and LLM services
- Note: 6M token/month limit
- **Important**: Requires local proxy setup within Bosch network - see [PROXY_SETUP.md](./PROXY_SETUP.md)

### 3. Configure Settings (Optional)

Add these optional environment variables to your `.env` file:
- `CHUNK_SIZE`: Number of characters per chunk (default: 500)
- `CHUNK_OVERLAP`: Characters to overlap between chunks (default: 50)
- `TOP_K`: Number of chunks to retrieve during queries (default: 3)
- `DOCUMENTS_PATH`: Path to documents folder (default: ./documents)
- `COLLECTIONS_PATH`: Path to collections directory (default: ./data/collections)
- `CHUNKS_PATH`: Path to chunks directory (default: ./data/chunks)

## Usage Workflow

### Step 1: Test Connectivity (Optional)

Verify your LLM Farm API connection:

```bash
npm run check-connections
```

This will test both the embedding and LLM services and report their status.

### Step 2: Add PDF Documents

Copy your PDF documents into the `documents/` folder:

```bash
cp your-document.pdf documents/
```

### Step 3: Generate Embeddings

Process your PDFs and create embeddings:

```bash
# Default collection
npm run generate-embeddings

# Specific collection (for organizing different document sets)
npm run generate-embeddings -- --collection project-a
```

This will:
- Read all PDFs from the `documents/` folder
- Split text into chunks with unique SHA-256 hash IDs
- Save chunks to `data/chunks/{collection}.chunks.json` for inspection
- Check for existing embeddings (resume capability)
- Generate embeddings using Bosch LLM Farm API
- Save incrementally every 50 chunks to `data/collections/{collection}.embeddings.json`
- Display progress in the console

**Resume Capability**: If interrupted, re-run the same command. Already-processed chunks are automatically skipped.

### Step 4: Start Chat Interface

Run the interactive chat interface:

```bash
# Default collection
npm run chat

# Specific collection
npm run chat -- --collection project-a
```

Ask questions about your documents:
```
Collection: default
Ask questions about your documents.
Type 'exit' or 'quit' to end the session.

You: What is the main topic of the document?
Assistant: [Answer based on your documents]

You: Explain the key concepts discussed
Assistant: [Answer with context from retrieved chunks]

You: exit
Goodbye!
```

Type `exit` or `quit` to end the session.

## Key Features

### Document Collections
Organize embeddings by project or context to keep unrelated document sets separate:
- **Default collection**: No `--collection` flag needed
- **Named collections**: Use `--collection project-name` for specific document sets
- **Isolated storage**: Each collection has its own embeddings and chunks files
- **Easy switching**: Change collection via CLI argument when chatting

### Resume Capability
Interrupted embedding generation can resume without re-processing:
- **Chunk IDs**: Each chunk gets a unique SHA-256 hash based on its text
- **Automatic skip**: Already-processed chunks detected by ID and skipped
- **Progress preserved**: Re-run the same command to continue where you left off
- **Cost savings**: No wasted API calls on duplicate processing

### Incremental Saving
Prevent data loss during long embedding generation runs:
- **Checkpoint saves**: Embeddings saved every 50 chunks
- **Atomic writes**: File corruption prevented via temp file + rename
- **Merge logic**: New embeddings merged with existing ones by chunk ID
- **Memory efficient**: Don't hold all embeddings in memory

### Chunk Inspection
Debug and understand your chunking strategy:
- **Human-readable format**: `chunks/{collection}.chunks.json` contains all text chunks
- **Complete metadata**: Includes chunk ID, text, positions, source document
- **Useful for tuning**: Review how documents are split to optimize chunk size/overlap

## How It Works

### Embedding Generation Flow (IndexingWorkflow)

```
PDFs → DocumentReader → TextChunker → [Checkpoint] → EmbeddingClient → EmbeddingStore
                            ↓                              ↓               ↓
                    Generate ChunkIDs               Generate Vectors    Incremental Save
                    Save chunks.json                (LLM Farm API)      (every 50 chunks)
                            ↓
                    Check Existing IDs
                    Skip Processed Chunks
```

1. **Read PDFs** - Extract text from PDF files
2. **Chunk Text** - Split into overlapping segments with SHA-256 hash IDs
3. **Save Chunks** - Export to `chunks/{collection}.chunks.json` for inspection
4. **Resume Check** - Load existing embeddings, build Set of processed chunk IDs
5. **Skip Processed** - Filter out chunks that already have embeddings
6. **Generate Embeddings** - Call LLM Farm API for new chunks only
7. **Incremental Save** - Save every 50 chunks to prevent data loss
8. **Report Progress** - Display status with existing/new/skipped counts

### Query Flow (QueryWorkflow)

1. **Embed Query** - Convert user question to vector
2. **Search** - Find N most similar chunks (cosine similarity)
3. **Build Prompt** - Construct prompt with retrieved context
4. **Query LLM** - Send to LLM Farm API
5. **Display Answer** - Show response to user

## Project Structure

```
rag-hands-on-garage/
├── src/
│   ├── services/          # Isolated service modules
│   │   ├── document-reader/
│   │   ├── text-chunker/      # Now generates SHA-256 chunk IDs
│   │   │   └── utils/         # chunkId.ts hash generation
│   │   ├── embedding-client/
│   │   ├── embedding-store/   # Now supports incremental save
│   │   ├── vector-search/
│   │   ├── llm-client/
│   │   ├── prompt-builder/
│   │   └── progress-reporter/
│   ├── workflows/             # IndexingWorkflow & QueryWorkflow
│   ├── config/                # ConfigService (collection-aware)
│   ├── di/                    # Dependency injection Container
│   └── cli/                   # CLI entry points with --collection support
├── documents/                 # Input PDFs (add your files here)
├── data/
│   ├── collections/           # Embeddings organized by collection
│   │   ├── default.embeddings.json
│   │   └── {collection}.embeddings.json
│   └── chunks/                # Human-readable chunks for inspection
│       ├── default.chunks.json
│       └── {collection}.chunks.json
├── tests/                     # Unit and integration tests
├── package.json
├── tsconfig.json
├── README.md
└── CLAUDE.md             # Development guide
```

## Common Use Cases

### Single Project Workflow
```bash
# Add PDFs to documents/
cp *.pdf documents/

# Generate embeddings (uses 'default' collection)
npm run generate-embeddings

# Chat with documents
npm run chat
```

### Multi-Project Workflow
```bash
# Process Project A documents
npm run generate-embeddings -- --collection project-a

# Process Project B documents (replace PDFs in documents/ folder first)
npm run generate-embeddings -- --collection project-b

# Chat with Project A
npm run chat -- --collection project-a

# Chat with Project B
npm run chat -- --collection project-b
```

### Resume After Interruption
```bash
# Start embedding generation
npm run generate-embeddings -- --collection large-dataset

# Process crashes at chunk 532 / 1074
# (50, 100, 150... 500 chunks already saved)

# Resume - skips first 500 chunks, continues from 501
npm run generate-embeddings -- --collection large-dataset
# Output: "Resume: Found 500 existing embeddings"
# Continues processing from chunk 501
```

### Inspect Chunking Results
```bash
# Generate embeddings
npm run generate-embeddings

# View chunks in JSON format
cat data/chunks/default.chunks.json | jq '.[0:5]'  # First 5 chunks
cat data/chunks/default.chunks.json | jq '.[] | select(.metadata.sourceDocument == "my-doc.pdf")'
```

## Development

### Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

### Development Mode

Run in development mode with hot reload:

```bash
npm run dev
```

### Testing

Run tests:

```bash
npm test
```

## Configuration Reference

All configuration is managed via environment variables (`ConfigService`):

**Required:**
- `LLM_FARM_API_KEY`: Bosch LLM Farm API key (for both embeddings and LLM)

**Optional (with defaults):**
- `CHUNK_SIZE`: Characters per chunk (default: 500)
- `CHUNK_OVERLAP`: Overlap between chunks (default: 50)
- `TOP_K`: Number of chunks to retrieve (default: 3)
- `DOCUMENTS_PATH`: Path to documents folder (default: ./documents)
- `COLLECTIONS_PATH`: Path to collections directory (default: ./data/collections)
- `CHUNKS_PATH`: Path to chunks directory (default: ./data/chunks)

## Learning Outcomes

By completing this project, you will learn:

- How RAG systems work end-to-end
- PDF text extraction and processing
- Text chunking strategies
- Vector embeddings and similarity search
- Prompt engineering for context injection
- Integration with modern LLM APIs
- Building practical AI applications
- Isolated service architecture patterns
- Dependency injection in TypeScript

## Troubleshooting

### Proxy Configuration Issues

**Problem**: "Maximum number of redirects exceeded" error when generating embeddings

**Root Cause**:
- Axios's built-in proxy support doesn't work correctly with corporate HTTP proxies (like Bosch's proxy at localhost:3128)
- The proxy causes Axios to enter redirect loops when trying to connect to the LLM Farm API

**Solution**:
The codebase uses the `tunnel` package instead of Axios's native proxy support:

```typescript
import * as tunnel from 'tunnel';

// Create tunnel agent for HTTPS-over-HTTP proxy
const httpsAgent = tunnel.httpsOverHttp({
  proxy: {
    host: '127.0.0.1',
    port: 3128
  }
});

// Use in Axios config
axios.create({
  httpsAgent,
  proxy: false  // Disable Axios's built-in proxy
});
```

**Requirements**:
- Local proxy running on port 3128 (e.g., Bosch proxy)
- Environment variable `https_proxy=http://localhost:3128` set
- `tunnel` package installed (already in dependencies)

**Verification**:
Test proxy connection with curl:
```bash
curl -x 127.0.0.1:3128 \
  -H "genaiplatform-farm-subscription-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input":["test"]}' \
  "https://aoai-farm.bosch-temp.com/api/openai/deployments/askbosch-prod-farm-openai-text-embedding-3-small/embeddings?api-version=2024-10-21"
```

### Other Common Issues

**Problem**: "Invalid API key" error
- **Solution**: Check your `.env` file has a valid `LLM_FARM_API_KEY`

**Problem**: "Resource not found" (404) error
- **Solution**: Verify the API endpoint URL includes `/embeddings` suffix for embedding requests

**Problem**: No embeddings generated
- **Solution**: Ensure PDFs are in `documents/` folder and are text-based (not image-only)

**Problem**: Out of memory during embedding generation
- **Solution**: Reduce `CHUNK_SIZE` or process fewer/smaller documents

**Problem**: Poor answer quality
- **Solution**: Increase `TOP_K` to retrieve more context chunks, or adjust `CHUNK_SIZE` for better granularity

## License

MIT

## Contributing

This is an educational project. Feel free to fork, experiment, and learn!
