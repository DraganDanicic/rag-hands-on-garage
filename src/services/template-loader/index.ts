import { TemplateLoader } from './TemplateLoader.js';
import { ITemplateLoader } from './ITemplateLoader.js';

export { ITemplateLoader } from './ITemplateLoader.js';

/**
 * Factory function to create a TemplateLoader instance
 * @param promptsPath - Path to prompts directory
 */
export function createTemplateLoader(promptsPath: string): ITemplateLoader {
  return new TemplateLoader(promptsPath);
}
