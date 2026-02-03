# Dependency Injection Container

The DI container manages all application services and their dependencies.

## Files

- **IContainer.ts** - Container interface
- **Container.ts** - Implementation that instantiates and wires services
- **index.ts** - Public exports (interface + factory function)

## Features

### Service Management
The container instantiates and manages all application services:
- Configuration Service
- Document Reader
- Text Chunker
- Embedding Client (OpenAI)
- LLM Client (Gemini)
- Progress Reporter

### Dependency Injection
Services are automatically configured with their dependencies:
- Text Chunker receives chunking configuration from ConfigService
- Embedding Client receives OpenAI API key from ConfigService
- LLM Client receives Gemini API key from ConfigService

### Singleton Pattern
Each service is instantiated once and reused across the application.

## Usage

```typescript
import { createContainer } from './di/index.js';

// Create container (automatically loads config and instantiates services)
const container = createContainer();

// Access services
const configService = container.getConfigService();
const textChunker = container.getTextChunker();
const embeddingClient = container.getEmbeddingClient();
const llmClient = container.getLlmClient();
const documentReader = container.getDocumentReader();
const progressReporter = container.getProgressReporter();
```

## Service Initialization Order

1. **ConfigService** - Loaded first to provide configuration
2. **DocumentReader** - No dependencies
3. **ProgressReporter** - No dependencies
4. **TextChunker** - Configured with chunkSize and chunkOverlap
5. **EmbeddingClient** - Configured with OpenAI API key
6. **LLmClient** - Configured with Gemini API key

## Error Handling

Container will throw an error during instantiation if:
- Required environment variables are missing (API keys)
- Invalid configuration values are provided

## Testing

Integration tests are located in `tests/di/Container.integration.test.ts` and verify:
- All services are instantiated correctly
- Services are configured with values from ConfigService
- Singleton pattern is maintained
- Error handling for missing required configuration
