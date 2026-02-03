import { ConsoleProgressReporter } from './ConsoleProgressReporter.js';
import { IProgressReporter } from './IProgressReporter.js';

export { IProgressReporter } from './IProgressReporter.js';

/**
 * Factory function to create a ConsoleProgressReporter instance
 */
export function createProgressReporter(): IProgressReporter {
  return new ConsoleProgressReporter();
}
