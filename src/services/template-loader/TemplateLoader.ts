import { promises as fs } from 'fs';
import * as path from 'path';
import { ITemplateLoader } from './ITemplateLoader.js';
import { PromptTemplate } from '../prompt-builder/models/PromptTemplate.js';

/**
 * Template loader implementation
 * Loads prompt templates from built-in templates or custom files
 */
export class TemplateLoader implements ITemplateLoader {
  private readonly builtInTemplates = ['default', 'concise', 'detailed', 'technical'];

  constructor(private readonly promptsPath: string) {}

  async loadTemplate(nameOrPath: string): Promise<PromptTemplate> {
    let templateContent: string;

    // Check if it's a built-in template name
    if (this.builtInTemplates.includes(nameOrPath)) {
      const templatePath = path.join(this.promptsPath, `${nameOrPath}.prompt.txt`);
      try {
        templateContent = await fs.readFile(templatePath, 'utf-8');
      } catch (error) {
        throw new Error(
          `Built-in template '${nameOrPath}' not found at ${templatePath}. ` +
          `Available templates: ${this.builtInTemplates.join(', ')}`
        );
      }
    } else {
      // Treat as file path
      try {
        // Resolve relative paths from project root
        const resolvedPath = path.isAbsolute(nameOrPath)
          ? nameOrPath
          : path.resolve(nameOrPath);

        templateContent = await fs.readFile(resolvedPath, 'utf-8');
      } catch (error) {
        throw new Error(
          `Template file not found: ${nameOrPath}. ` +
          `Please check the path in PROMPT_TEMPLATE_PATH.`
        );
      }
    }

    // Validate template has required placeholders
    this.validateTemplate(templateContent, nameOrPath);

    return {
      template: templateContent,
    };
  }

  listBuiltInTemplates(): string[] {
    return [...this.builtInTemplates];
  }

  /**
   * Validate that template contains required placeholders
   */
  private validateTemplate(templateContent: string, nameOrPath: string): void {
    const hasContext = templateContent.includes('{context}');
    const hasQuestion = templateContent.includes('{question}');

    if (!hasContext || !hasQuestion) {
      const missing: string[] = [];
      if (!hasContext) missing.push('{context}');
      if (!hasQuestion) missing.push('{question}');

      throw new Error(
        `Invalid template '${nameOrPath}': Missing required placeholders: ${missing.join(', ')}. ` +
        `Templates must contain both {context} and {question} placeholders.`
      );
    }
  }
}
