export interface LlmResponse {
  /**
   * Generated text response from the LLM
   */
  text: string;

  /**
   * Optional usage metadata
   */
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}
