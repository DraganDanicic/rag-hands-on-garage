export interface IProgressReporter {
  /**
   * Report the start of a process
   * @param message - Message to display
   */
  start(message: string): void;

  /**
   * Report progress of an ongoing process
   * @param current - Current progress value
   * @param total - Total progress value
   * @param message - Optional message to display
   */
  progress(current: number, total: number, message?: string): void;

  /**
   * Report successful completion
   * @param message - Success message
   */
  success(message: string): void;

  /**
   * Report an error
   * @param message - Error message
   */
  error(message: string): void;

  /**
   * Report an informational message
   * @param message - Info message
   */
  info(message: string): void;
}
