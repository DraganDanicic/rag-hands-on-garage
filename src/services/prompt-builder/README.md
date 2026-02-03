# Prompt Builder Service

## Responsibility
Constructs RAG prompts by combining user questions with retrieved context using a template.

## Public Interface
```typescript
interface IPromptBuilder {
  buildPrompt(question: string, contexts: string[]): string;
  buildPromptWithTemplate(question: string, contexts: string[], template: PromptTemplate): string;
}
```

## Models
- **PromptTemplate**: Contains template string with {context} and {question} placeholders

## Dependencies (Injected)
- None (pure string manipulation logic)

## Usage Example
```typescript
import { createPromptBuilder } from './services/prompt-builder';

const promptBuilder = createPromptBuilder();

const question = "What is machine learning?";
const contexts = [
  "Machine learning is a subset of AI...",
  "ML algorithms learn from data..."
];

const prompt = promptBuilder.buildPrompt(question, contexts);
console.log(prompt);
```

## Implementation Notes
- Default template includes system instructions for RAG behavior
- Contexts are numbered and concatenated
- Template uses {context} and {question} as placeholders
- Instructs LLM to cite sources and admit when context is insufficient
- Keeps prompt concise to minimize token usage

## Testing Considerations
- Test template placeholder replacement
- Verify context numbering is correct
- Test with empty contexts array
- Test with multiple contexts
- Validate output format matches expected structure
