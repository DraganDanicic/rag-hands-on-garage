# LLM Client Service

## Responsibility
Sends prompts to Google Gemini 2.0 Flash Lite API and returns generated responses.

## Public Interface
```typescript
interface ILlmClient {
  generateResponse(prompt: string): Promise<string>;
  generateResponseWithOptions(request: LlmRequest): Promise<LlmResponse>;
}
```

## Models
- **LlmRequest**: Contains prompt, temperature, max tokens, and other generation parameters
- **LlmResponse**: Contains generated text, token usage, and metadata

## Dependencies (Injected)
- None (HTTP client is internal implementation detail)

## Usage Example
```typescript
import { createLlmClient } from './services/llm-client';

const llmClient = createLlmClient(apiKey);

// Simple usage
const response = await llmClient.generateResponse("What is RAG?");
console.log(response);

// With options
const detailedResponse = await llmClient.generateResponseWithOptions({
  prompt: "Explain RAG in detail",
  temperature: 0.7,
  maxTokens: 500
});
console.log(detailedResponse.text);
```

## Implementation Notes
- Uses Google Gemini 2.0 Flash Lite model
- Default temperature: 0.7 (balanced creativity/consistency)
- Includes retry logic for API failures
- Validates API key on instantiation
- Streams responses for better UX (optional enhancement)

## Testing Considerations
- Mock HTTP calls to Gemini API
- Test error handling for API failures
- Verify correct request format
- Test with various temperature settings
- Validate response parsing
