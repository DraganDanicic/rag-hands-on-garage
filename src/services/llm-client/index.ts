import { LlmFarmLlmClient } from './LlmFarmLlmClient.js';
import { ILlmClient } from './ILlmClient.js';

export { ILlmClient } from './ILlmClient.js';
export { LlmRequest } from './models/LlmRequest.js';
export { LlmResponse } from './models/LlmResponse.js';

/**
 * Factory function to create an LLM Farm LLM Client instance
 * @param apiKey - LLM Farm API key
 */
export function createLlmClient(apiKey: string): ILlmClient {
  return new LlmFarmLlmClient(apiKey);
}
