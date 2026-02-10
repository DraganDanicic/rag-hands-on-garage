import { ErrorGuidance } from './models/ErrorGuidance.js';

/**
 * Error handler service interface
 * Provides context-aware error guidance based on error patterns
 */
export interface IErrorHandler {
  /**
   * Get helpful guidance for an error
   * @param error - The error that occurred
   * @returns Guidance with troubleshooting tips
   */
  getGuidance(error: Error | unknown): ErrorGuidance;

  /**
   * Format error guidance as a user-friendly string
   * @param guidance - The error guidance
   * @returns Formatted string for display
   */
  formatGuidance(guidance: ErrorGuidance): string;
}
