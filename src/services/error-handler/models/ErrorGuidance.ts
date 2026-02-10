/**
 * Error guidance information
 * Provides context-specific help for different error types
 */
export interface ErrorGuidance {
  /**
   * Error category/title
   */
  title: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Step-by-step troubleshooting tips
   */
  tips: string[];

  /**
   * Suggested commands to run
   */
  suggestedCommands?: string[];
}
