import { LlmRequest } from './models/LlmRequest.js';
import { LlmResponse } from './models/LlmResponse.js';

export interface ILlmClient {
  /**
   * Generate a response from the LLM
   * @param request - Request containing prompt and optional parameters
   * @returns LLM response with generated text
   */
  generateResponse(request: LlmRequest): Promise<LlmResponse>;
}
