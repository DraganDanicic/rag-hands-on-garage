import { IPromptBuilder } from './IPromptBuilder.js';
import { PromptTemplate } from './models/PromptTemplate.js';

const DEFAULT_TEMPLATE: PromptTemplate = {
  template: `You are a helpful assistant. Answer the user's question based on the provided context.

Context:
{context}

Instructions:
- Answer the question using only information from the context above
- If the context contains relevant information, cite the source number (e.g., [1], [2])
- If the context does not contain sufficient information to answer the question, clearly state that you don't have enough information
- Be concise and direct in your response

Question: {question}

Answer:`,
};

export class PromptBuilder implements IPromptBuilder {
  buildPrompt(question: string, contexts: string[]): string {
    return this.buildPromptWithTemplate(question, contexts, DEFAULT_TEMPLATE);
  }

  buildPromptWithTemplate(
    question: string,
    contexts: string[],
    template: PromptTemplate
  ): string {
    // Format contexts with numbering
    const formattedContext = this.formatContexts(contexts);

    // Replace placeholders in template (use replaceAll to handle multiple occurrences)
    const prompt = template.template
      .replaceAll('{context}', formattedContext)
      .replaceAll('{question}', question);

    return prompt;
  }

  private formatContexts(contexts: string[]): string {
    if (!contexts || contexts.length === 0) {
      return 'No context available.';
    }

    return contexts
      .map((context, index) => `[${index + 1}] ${context}`)
      .join('\n\n');
  }
}
