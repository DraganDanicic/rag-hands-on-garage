/**
 * Represents a single message in a conversation
 */
export interface Message {
  /** Role of the message sender */
  role: 'user' | 'assistant' | 'system';

  /** Content of the message */
  content: string;

  /** Optional timestamp when message was created */
  timestamp?: Date;

  /** Optional estimated token count for this message */
  tokenEstimate?: number;
}
