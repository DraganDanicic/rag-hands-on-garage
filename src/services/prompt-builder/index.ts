import { PromptBuilder } from './PromptBuilder.js';
import { IPromptBuilder } from './IPromptBuilder.js';

export { IPromptBuilder } from './IPromptBuilder.js';
export { PromptTemplate } from './models/PromptTemplate.js';

/**
 * Factory function to create a PromptBuilder instance
 */
export function createPromptBuilder(): IPromptBuilder {
  return new PromptBuilder();
}
