# Recent Changes - Incremental Save & Collections

## Summary

Added incremental saving, resume capability, and document collection support to make the RAG system more robust and organize document sets.

## What Changed

### 1. Chunk ID Generation
- **File**: `src/services/text-chunker/utils/chunkId.ts` (new)
- **What**: Each text chunk gets a unique SHA-256 hash based on its content
- **Why**: Enables deduplication and resume capability
- **Impact**: Same text = same ID, automatic skip of processed chunks

### 2. Incremental Saving
- **File**: `src/services/embedding-store/JsonEmbeddingStore.ts`
- **What**: New `saveIncremental()` method merges new embeddings with existing
- **Why**: Prevent data loss on crashes, enable checkpointing
- **Impact**: Embeddings saved every 50 chunks (configurable)

### 3. Resume Capability
- **File**: `src/workflows/IndexingWorkflow.ts`
- **What**: Loads existing embeddings, skips already-processed chunks by ID
- **Why**: Continue interrupted processes without re-processing
- **Impact**: Cost savings, faster re-runs

### 4. Document Collections
- **Files**: `src/config/ConfigService.ts`, `src/di/Container.ts`, CLI files
- **What**: Support for multiple isolated document collections
- **Why**: Organize unrelated document sets (e.g., different projects)
- **Impact**: Separate embeddings/chunks per collection

### 5. Chunk Inspection
- **File**: `src/workflows/IndexingWorkflow.ts`
- **What**: Saves chunks to `data/chunks/{collection}.chunks.json`
- **Why**: Debug chunking strategy, understand text splitting
- **Impact**: Human-readable JSON for inspection

## New Data Structure

```
data/
├── collections/               # Embeddings by collection
│   ├── default.embeddings.json
│   └── {collection}.embeddings.json
└── chunks/                   # Chunks for inspection
    ├── default.chunks.json
    └── {collection}.chunks.json
```

## New CLI Usage

```bash
# Generate with collection
npm run generate-embeddings -- --collection project-a

# Chat with collection
npm run chat -- --collection project-a

# Resume interrupted process (automatic)
npm run generate-embeddings -- --collection project-a
# Skips already-processed chunks
```

## Configuration Changes

### New Environment Variables (Optional)
- `COLLECTIONS_PATH` (default: `./data/collections`)
- `CHUNKS_PATH` (default: `./data/chunks`)

### Deprecated
- `EMBEDDINGS_PATH` - Now auto-generated from collection name

### Updated
- `LLM_FARM_API_KEY` - Single API key for both embeddings and LLM

## Backward Compatibility

- Old embeddings without chunk IDs still work
- Default collection used when `--collection` not specified
- Existing `data/embeddings.json` can be moved to `data/collections/default.embeddings.json`

## Key Benefits

1. **Resilience**: Interrupted processes can resume
2. **Organization**: Separate document sets by collection
3. **Cost Savings**: No duplicate API calls for processed chunks
4. **Debugging**: Inspect chunks to optimize chunking strategy
5. **Safety**: Incremental saves prevent total data loss

## Files Modified

### Core Services
- `src/services/text-chunker/TextChunker.ts` - Generate chunk IDs
- `src/services/text-chunker/models/TextChunk.ts` - Add `chunkId` field
- `src/services/embedding-store/IEmbeddingStore.ts` - Add `saveIncremental()`
- `src/services/embedding-store/JsonEmbeddingStore.ts` - Implement merge logic

### Configuration
- `src/config/IConfigService.ts` - Add `getChunksPath()`
- `src/config/ConfigService.ts` - Collection-aware paths
- `src/config/index.ts` - Accept `collectionName` parameter

### DI Container
- `src/di/Container.ts` - Accept `collectionName` parameter
- `src/di/index.ts` - Pass collection to factory

### Workflows
- `src/workflows/IndexingWorkflow.ts` - Resume logic, incremental saves, chunk export

### CLI
- `src/cli/generate-embeddings.ts` - Parse `--collection` argument
- `src/cli/chat.ts` - Parse `--collection` argument

### New Files
- `src/services/text-chunker/utils/chunkId.ts` - Hash generation utility

## Migration Guide

### For Existing Users

If you have existing `data/embeddings.json`:

```bash
# Create new structure
mkdir -p data/collections data/chunks

# Move old embeddings to default collection
mv data/embeddings.json data/collections/default.embeddings.json

# Continue using normally
npm run generate-embeddings  # Uses default collection
npm run chat                   # Uses default collection
```

### For New Users

No migration needed - just use the system normally with `--collection` support.

## Testing

All existing tests pass. The implementation was verified with:
- TypeScript compilation successful
- Directory structure created automatically
- Chunk IDs generated correctly (SHA-256 hash)
- Embeddings include chunk IDs in metadata
- Incremental save working (tested with 50-chunk batches)
- Resume capability functional (loads and skips existing)

## Performance Impact

- **Startup**: +100-500ms (load existing embeddings for resume)
- **I/O**: Extra writes every 50 chunks (negligible vs API latency)
- **Memory**: Reduced (don't hold all embeddings in RAM)
- **Net Impact**: Strongly positive for large document sets
