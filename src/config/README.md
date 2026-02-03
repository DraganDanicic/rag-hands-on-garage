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
- `OPENAI_API_KEY` - OpenAI API key for embeddings (required)
- `GEMINI_API_KEY` - Google Gemini API key for LLM (required)

### Optional Configuration with Defaults
- `CHUNK_SIZE` - Text chunk size in characters (default: 500)
- `CHUNK_OVERLAP` - Overlap between chunks in characters (default: 50)
- `TOP_K` - Number of chunks to retrieve for RAG (default: 3)
- `DOCUMENTS_PATH` - Path to documents folder (default: `./documents`)
- `EMBEDDINGS_PATH` - Path to embeddings storage file (default: `./data/embeddings.json`)

## Usage

```typescript
import { createConfigService } from './config/index.js';

const config = createConfigService();

// Access configuration values
const apiKey = config.getOpenAiApiKey();
const chunkSize = config.getChunkSize();
const topK = config.getTopK();
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
