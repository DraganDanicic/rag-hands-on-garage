# LLM Client Service

## Responsibility
Sends prompts to Bosch LLM Farm API (gemini-2.0-flash-lite model) and returns generated responses.

## Public Interface
```typescript
interface ILlmClient {
  generateResponse(request: LlmRequest): Promise<LlmResponse>;
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

const response = await llmClient.generateResponse({
  prompt: "What is RAG?",
  temperature: 0.7,
  maxTokens: 500
});
console.log(response.text);
console.log(`Tokens used: ${response.usage?.totalTokens}`);
```

## Implementation Notes
- Uses Bosch LLM Farm endpoint for gemini-2.0-flash-lite
- Default temperature: 0.7 (balanced creativity/consistency)
- Default max tokens: 2048
- Includes retry logic for transient API failures (3 retries with exponential backoff)
- Validates API key on instantiation
- Handles 401/403 (invalid key), 429 (rate limit), 400 (bad request) errors
- Custom header: `genaiplatform-farm-subscription-key`
- Timeout: 60 seconds
- Returns token usage metadata when available

## Testing Considerations
- Mock HTTP calls to LLM Farm API
- Test error handling for 401, 403, 429, 400, 500 status codes
- Verify correct request format with custom headers
- Test with various temperature and maxTokens settings
- Validate response parsing (text and usage metadata)
- Test retry logic for 5xx errors
