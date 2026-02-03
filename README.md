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
- **Embedding Service**: OpenAI text-embedding-3-small
- **LLM Service**: Google Gemini 2.0 Flash Lite
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
3. **Embedding Client** - Generates vector embeddings via OpenAI API
4. **Embedding Store** - Stores and retrieves embeddings from JSON files
5. **Vector Search** - Finds similar chunks using cosine similarity
6. **LLM Client** - Communicates with Google Gemini API
7. **Prompt Builder** - Constructs RAG prompts with context
8. **Progress Reporter** - Displays console progress output
9. **RAG Orchestrator** - Coordinates the complete RAG flow

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Keys

Create a `.env` file in the project root (use `.env.example` as a template):

```bash
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**Getting API Keys:**
- OpenAI API: https://platform.openai.com/api-keys
- Google Gemini API: https://ai.google.dev/

### 3. Configure Settings (Optional)

Edit `src/config/default-config.ts` to adjust:
- `chunkSize`: Number of characters per chunk (default: 500)
- `chunkOverlap`: Characters to overlap between chunks (default: 50)
- `topK`: Number of chunks to retrieve during queries (default: 3)
- `promptTemplate`: Template for constructing RAG prompts

## Usage Workflow

### Step 1: Add PDF Documents

Copy your PDF documents into the `documents/` folder:

```bash
cp your-document.pdf documents/
```

### Step 2: Generate Embeddings

Process your PDFs and create embeddings:

```bash
npm run generate-embeddings
```

This will:
- Read all PDFs from the `documents/` folder
- Split text into chunks based on configuration
- Generate embeddings using OpenAI API
- Store embeddings in `data/embeddings.json`
- Display progress in the console

### Step 3: Start Chat Interface

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

### Embedding Generation Flow

1. **Read PDFs** - Extract text from PDF files
2. **Chunk Text** - Split into overlapping segments
3. **Generate Embeddings** - Call OpenAI API for each chunk
4. **Store** - Save embeddings to local JSON file
5. **Report Progress** - Display status in console

### Query Flow

1. **Embed Query** - Convert user question to vector
2. **Search** - Find N most similar chunks (cosine similarity)
3. **Build Prompt** - Construct prompt with retrieved context
4. **Query LLM** - Send to Gemini API
5. **Display Answer** - Show response to user

## Project Structure

```
rag-hands-on-garage/
├── src/
│   ├── services/          # Isolated service modules
│   ├── workflows/         # High-level orchestration
│   ├── config/           # Configuration management
│   ├── cli/              # CLI entry points
│   └── container.ts      # Dependency injection
├── documents/            # Input PDFs (add your files here)
├── data/                 # Generated embeddings
├── tests/                # Unit tests
├── package.json
├── tsconfig.json
└── README.md
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

All configuration is in `src/config/`:

- `chunkSize`: Characters per chunk (e.g., 500)
- `chunkOverlap`: Overlap between chunks (e.g., 50)
- `topK`: Number of chunks to retrieve (e.g., 3)
- `openaiApiKey`: OpenAI API key for embeddings
- `geminiApiKey`: Google Gemini API key
- `promptTemplate`: Template with `{context}` and `{question}` placeholders

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

**Problem**: "Invalid API key" error
- **Solution**: Check your `.env` file has valid API keys

**Problem**: No embeddings generated
- **Solution**: Ensure PDFs are in `documents/` folder and are text-based (not image-only)

**Problem**: Out of memory during embedding generation
- **Solution**: Reduce `chunkSize` or process fewer/smaller documents

**Problem**: Poor answer quality
- **Solution**: Increase `topK` to retrieve more context chunks, or adjust `chunkSize` for better granularity

## License

MIT

## Contributing

This is an educational project. Feel free to fork, experiment, and learn!
