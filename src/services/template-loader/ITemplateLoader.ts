import { PromptTemplate } from '../prompt-builder/models/PromptTemplate.js';

/**
 * Template loader service interface
 * Loads prompt templates from files or built-in templates
 */
export interface ITemplateLoader {
  /**
   * Load a template by name or file path
   * @param nameOrPath - Built-in template name (e.g., 'default', 'concise') or file path
   * @returns The loaded template
   * @throws Error if template not found or invalid
   */
  loadTemplate(nameOrPath: string): Promise<PromptTemplate>;

  /**
   * Get list of available built-in template names
   * @returns Array of template names
   */
  listBuiltInTemplates(): string[];
}
