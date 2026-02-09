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

## Architecture

The system follows an isolated service architecture where:
- Each service is self-contained with a single responsibility
- Services communicate through dependency injection of interfaces
- No direct coupling between services
- All services are independently testable

### Key Components

1. **Document Reader** - Reads and extracts text from PDF files
2. **Text Chunker** - Splits text into chunks with configurable overlap
3. **Embedding Client** - Generates vector embeddings via Bosch LLM Farm API
4. **Embedding Store** - Stores and retrieves embeddings from JSON files
5. **Vector Search** - Finds similar chunks using cosine similarity
6. **LLM Client** - Communicates with Bosch LLM Farm API
7. **Prompt Builder** - Constructs RAG prompts with context
8. **Progress Reporter** - Displays console progress output

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
- `EMBEDDINGS_PATH`: Path to embeddings file (default: ./data/embeddings.json)

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
npm run generate-embeddings
```

This will:
- Read all PDFs from the `documents/` folder
- Split text into chunks based on configuration
- Generate embeddings using Bosch LLM Farm API
- Store embeddings in `data/embeddings.json`
- Display progress in the console

### Step 4: Start Chat Interface

Run the interactive chat interface:

```bash
npm run chat
```

Ask questions about your documents:
```
> What is the main topic of the document?
> Explain the key concepts discussed
> exit
```

Type `exit` or `quit` to end the session.

## How It Works

### Embedding Generation Flow (IndexingWorkflow)

1. **Read PDFs** - Extract text from PDF files
2. **Chunk Text** - Split into overlapping segments
3. **Generate Embeddings** - Call LLM Farm API for each chunk
4. **Store** - Save embeddings to local JSON file
5. **Report Progress** - Display status in console

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
│   │   ├── text-chunker/
│   │   ├── embedding-client/
│   │   ├── embedding-store/
│   │   ├── vector-search/
│   │   ├── llm-client/
│   │   ├── prompt-builder/
│   │   └── progress-reporter/
│   ├── workflows/         # IndexingWorkflow & QueryWorkflow
│   ├── config/           # ConfigService
│   ├── di/               # Dependency injection Container
│   └── cli/              # CLI entry points (3 commands)
├── documents/            # Input PDFs (add your files here)
├── data/                 # Generated embeddings
├── tests/                # Unit and integration tests
├── package.json
├── tsconfig.json
├── README.md
└── CLAUDE.md             # Development guide
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
- `EMBEDDINGS_PATH`: Path to embeddings JSON file (default: ./data/embeddings.json)

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
