import { IConversationHistory } from './IConversationHistory.js';
import { Message } from './models/Message.js';
import { estimateTokens } from './utils/tokenEstimator.js';
import { IQuerySettings } from '../query-settings/IQuerySettings.js';

/**
 * Implementation of conversation history management
 *
 * Uses a sliding window strategy to keep the most recent N turns.
 * Automatically drops old messages when window size is exceeded.
 */
export class ConversationHistory implements IConversationHistory {
  private messages: Message[] = [];

  constructor(private readonly querySettings: IQuerySettings) {}

  addUserMessage(content: string): void {
    const message: Message = {
      role: 'user',
      content,
      timestamp: new Date(),
      tokenEstimate: estimateTokens(content),
    };

    this.messages.push(message);
    this.enforceWindowSize();
  }

  addAssistantMessage(content: string): void {
    const message: Message = {
      role: 'assistant',
      content,
      timestamp: new Date(),
      tokenEstimate: estimateTokens(content),
    };

    this.messages.push(message);
    this.enforceWindowSize();
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  getMessagesForContext(maxTokens: number): Message[] {
    // Start from most recent and work backwards
    const result: Message[] = [];
    let currentTokens = 0;

    for (let i = this.messages.length - 1; i >= 0; i--) {
      const message = this.messages[i];
      if (!message) continue;

      const messageTokens = message.tokenEstimate || estimateTokens(message.content);

      if (currentTokens + messageTokens <= maxTokens) {
        result.unshift(message); // Add to front to maintain chronological order
        currentTokens += messageTokens;
      } else {
        // Stop when we exceed budget
        break;
      }
    }

    return result;
  }

  clear(): void {
    this.messages = [];
  }

  getTurnCount(): number {
    // Count pairs of user + assistant messages
    // A turn is complete when we have both user and assistant messages
    let userCount = 0;
    let assistantCount = 0;

    for (const message of this.messages) {
      if (message.role === 'user') {
        userCount++;
      } else if (message.role === 'assistant') {
        assistantCount++;
      }
    }

    // Number of complete turns is the minimum of the two
    return Math.min(userCount, assistantCount);
  }

  estimateTokens(): number {
    return this.messages.reduce((total, message) => {
      return total + (message.tokenEstimate || estimateTokens(message.content));
    }, 0);
  }

  /**
   * Enforce the sliding window size by removing oldest messages
   *
   * Keeps the most recent N turns (where N is history-window-size).
   * Each turn consists of a user message and an assistant response.
   */
  private enforceWindowSize(): void {
    const windowSize = this.querySettings.getHistoryWindowSize();
    const maxMessages = windowSize * 2; // 2 messages per turn (user + assistant)

    if (this.messages.length > maxMessages) {
      // Remove oldest messages
      const removeCount = this.messages.length - maxMessages;
      this.messages.splice(0, removeCount);
    }
  }
}

/**
 * Factory function to create ConversationHistory instance
 */
export function createConversationHistory(
  querySettings: IQuerySettings
): IConversationHistory {
  return new ConversationHistory(querySettings);
}
