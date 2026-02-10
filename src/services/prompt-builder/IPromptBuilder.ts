import { PromptTemplate } from './models/PromptTemplate.js';

export interface IPromptBuilder {
  /**
   * Initialize the prompt builder (load template if needed)
   * Must be called before buildPrompt
   */
  initialize(): Promise<void>;

  /**
   * Builds a RAG prompt using the configured template
   * @param question - The user's question
   * @param contexts - Array of context strings to include in the prompt
   * @returns Formatted prompt string
   */
  buildPrompt(question: string, contexts: string[]): string;

  /**
   * Builds a RAG prompt using a custom template
   * @param question - The user's question
   * @param contexts - Array of context strings to include in the prompt
   * @param template - Custom prompt template
   * @returns Formatted prompt string
   */
  buildPromptWithTemplate(
    question: string,
    contexts: string[],
    template: PromptTemplate
  ): string;
}
