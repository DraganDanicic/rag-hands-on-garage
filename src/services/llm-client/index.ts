import { GeminiLlmClient } from './GeminiLlmClient.js';
import { ILlmClient } from './ILlmClient.js';

export { ILlmClient } from './ILlmClient.js';
export { LlmRequest } from './models/LlmRequest.js';
export { LlmResponse } from './models/LlmResponse.js';

/**
 * Factory function to create a Gemini LLM Client instance
 * @param apiKey - Google Gemini API key
 */
export function createLlmClient(apiKey: string): ILlmClient {
  return new GeminiLlmClient(apiKey);
}
