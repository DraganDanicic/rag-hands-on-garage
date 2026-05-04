import { Message } from '../../conversation-history/models/Message.js';

export interface LlmRequest {
  /**
   * The prompt to send to the LLM (legacy single-turn format)
   * @deprecated Use messages instead for multi-turn conversations
   */
  prompt?: string;

  /**
   * Array of messages for multi-turn conversations (new format)
   * Supports conversation history with system, user, and assistant roles
   */
  messages?: Message[];

  /**
   * Optional temperature for response generation (0.0 to 1.0)
   */
  temperature?: number;

  /**
   * Optional maximum number of tokens to generate
   */
  maxTokens?: number;
}
