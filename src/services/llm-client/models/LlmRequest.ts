export interface LlmRequest {
  /**
   * The prompt to send to the LLM
   */
  prompt: string;

  /**
   * Optional temperature for response generation (0.0 to 1.0)
   */
  temperature?: number;

  /**
   * Optional maximum number of tokens to generate
   */
  maxTokens?: number;
}
