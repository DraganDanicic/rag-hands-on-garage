# Configuration Service

The configuration service provides centralized access to all application configuration values.

## Files

- **IConfigService.ts** - Configuration service interface
- **ConfigService.ts** - Implementation that loads from environment variables
- **index.ts** - Public exports (interface + factory function)

## Features

### Environment Variable Loading
Automatically loads configuration from environment variables using `dotenv`.

### Required Configuration
- `LLM_FARM_API_KEY` - Bosch LLM Farm API key for embeddings and LLM (required)

### Optional Configuration with Defaults
- `CHUNK_SIZE` - Text chunk size in characters (default: 500)
- `CHUNK_OVERLAP` - Overlap between chunks in characters (default: 50)
- `TOP_K` - Number of chunks to retrieve for RAG (default: 3)
- `DOCUMENTS_PATH` - Path to documents folder (default: `./documents`)
- `COLLECTIONS_PATH` - Path to collections directory (default: `./data/collections`)
- `CHUNKS_PATH` - Path to chunks directory (default: `./data/chunks`)

### Collection-Specific Paths
The ConfigService accepts an optional `collectionName` parameter (defaults to 'default'):
- Embeddings: `{COLLECTIONS_PATH}/{collectionName}.embeddings.json`
- Chunks: `{CHUNKS_PATH}/{collectionName}.chunks.json`

## Usage

```typescript
import { createConfigService } from './config/index.js';

// Default collection
const config = createConfigService();

// Specific collection
const configProjectA = createConfigService('project-a');

// Access configuration values
const apiKey = config.getLlmFarmApiKey();
const chunkSize = config.getChunkSize();
const topK = config.getTopK();
const embeddingsPath = config.getEmbeddingsPath(); // ./data/collections/default.embeddings.json
const chunksPath = config.getChunksPath(); // ./data/chunks/default.chunks.json
```

## Error Handling

- Throws descriptive errors if required environment variables are missing
- Falls back to defaults for invalid numeric values
- Logs warnings when invalid values are encountered

## Testing

Tests are located in `tests/config/ConfigService.test.ts` and verify:
- Required API keys validation
- Default value application
- Custom value loading
- Invalid value handling
