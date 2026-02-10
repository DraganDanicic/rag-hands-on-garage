import { ErrorHandler } from './ErrorHandler.js';
import { IErrorHandler } from './IErrorHandler.js';

export { IErrorHandler } from './IErrorHandler.js';
export { ErrorGuidance } from './models/ErrorGuidance.js';

/**
 * Factory function to create an ErrorHandler instance
 */
export function createErrorHandler(): IErrorHandler {
  return new ErrorHandler();
}
