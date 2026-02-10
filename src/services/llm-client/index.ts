import { LlmFarmLlmClient, LlmClientConfig } from './LlmFarmLlmClient.js';
import { ILlmClient } from './ILlmClient.js';

export { ILlmClient } from './ILlmClient.js';
export { LlmRequest } from './models/LlmRequest.js';
export { LlmResponse } from './models/LlmResponse.js';
export { LlmClientConfig } from './LlmFarmLlmClient.js';

/**
 * Factory function to create an LLM Farm LLM Client instance
 * @param apiKey - LLM Farm API key
 * @param config - Optional client configuration
 */
export function createLlmClient(
  apiKey: string,
  config?: LlmClientConfig
): ILlmClient {
  return new LlmFarmLlmClient(apiKey, config);
}
