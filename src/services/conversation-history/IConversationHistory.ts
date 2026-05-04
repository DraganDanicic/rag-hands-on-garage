import { Message } from './models/Message.js';

/**
 * Service for managing conversation history in multi-turn conversations
 *
 * Responsibilities:
 * - Store user and assistant messages
 * - Implement sliding window strategy to limit history size
 * - Provide token-aware message retrieval
 * - Track conversation statistics
 */
export interface IConversationHistory {
  /**
   * Add a user message to the conversation history
   * @param content - The user's message content
   */
  addUserMessage(content: string): void;

  /**
   * Add an assistant message to the conversation history
   * @param content - The assistant's response content
   */
  addAssistantMessage(content: string): void;

  /**
   * Get all messages in the conversation history
   * @returns Array of all messages
   */
  getMessages(): Message[];

  /**
   * Get messages for LLM context, respecting token budget
   *
   * Returns the most recent messages that fit within the token limit.
   * Drops oldest messages first if exceeding budget.
   *
   * @param maxTokens - Maximum token budget for history
   * @returns Array of messages that fit within budget
   */
  getMessagesForContext(maxTokens: number): Message[];

  /**
   * Clear all conversation history
   */
  clear(): void;

  /**
   * Get the number of conversation turns (user + assistant pairs)
   * @returns Number of complete turns
   */
  getTurnCount(): number;

  /**
   * Estimate total token count for all messages in history
   * @returns Estimated token count
   */
  estimateTokens(): number;
}
