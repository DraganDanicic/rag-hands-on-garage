/**
 * Result of executing a chat command
 */
export interface CommandResult {
  /** Whether the chat session should exit */
  shouldExit: boolean;
  /** Collection name to switch to (triggers container re-initialization) */
  shouldSwitchCollection?: string;
  /** Message to display to the user */
  message?: string;
}
