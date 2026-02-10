# Customizing the RAG Prompt

This guide explains how to customize the LLM prompt that includes the retrieved embeddings/context in the RAG query workflow.

## Overview

The RAG query process works like this:
1. User asks a question
2. Question is embedded via `EmbeddingClient`
3. Similar chunks are retrieved via `VectorSearch`
4. **PromptBuilder** constructs the prompt with context ← **You can customize this**
5. Prompt is sent to LLM via `LlmClient`
6. Response is returned to user

## Current Default Prompt

The default prompt template is located in:
**`src/services/prompt-builder/PromptBuilder.ts`** (lines 4-18)

```typescript
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
```

## How to Customize the Prompt

### Option 1: Modify the Default Template (Simplest)

Edit the `DEFAULT_TEMPLATE` constant in `src/services/prompt-builder/PromptBuilder.ts`:

**Example: Make the assistant more technical**
```typescript
const DEFAULT_TEMPLATE: PromptTemplate = {
  template: `You are a technical expert assistant. Provide detailed, accurate answers based on the provided documentation.

Context from relevant documents:
{context}

Instructions:
- Answer using ONLY information from the context above
- Include technical details and examples when available
- Cite source numbers [1], [2], etc.
- If information is incomplete, state what's missing
- Use bullet points for clarity

User Question: {question}

Technical Answer:`,
};
```

**Example: Conversational tone**
```typescript
const DEFAULT_TEMPLATE: PromptTemplate = {
  template: `Hi! I'm here to help answer your questions using the information I have available.

Here's what I found in the documentation:
{context}

Guidelines:
- I'll only use information from the context above
- I'll mention which source [1], [2], etc. I'm using
- If I don't have enough info, I'll let you know
- I'll keep my answers friendly and clear

Your question: {question}

My answer:`,
};
```

**Example: Specific domain (e.g., legal documents)**
```typescript
const DEFAULT_TEMPLATE: PromptTemplate = {
  template: `You are a legal document assistant. Provide accurate information based strictly on the provided legal text.

Relevant legal text:
{context}

Important:
- Only reference information explicitly stated in the context
- Cite article/section numbers when available [1], [2]
- Do not interpret or provide legal advice beyond what's written
- State clearly if the context doesn't address the question
- Use precise legal terminology

Question: {question}

Response:`,
};
```

### Option 2: Add Configuration Support (More Flexible)

If you want to change prompts without editing code, add configuration support:

**Step 1: Add to ConfigService**

Edit `src/config/IConfigService.ts`:
```typescript
export interface IConfigService {
  // ... existing properties
  getPromptTemplate(): string | undefined;
}
```

Edit `src/config/ConfigService.ts`:
```typescript
getPromptTemplate(): string | undefined {
  return process.env.PROMPT_TEMPLATE;
}
```

**Step 2: Modify PromptBuilder Factory**

Edit `src/services/prompt-builder/index.ts`:
```typescript
import { PromptBuilder } from './PromptBuilder.js';
import { IPromptBuilder } from './IPromptBuilder.js';
import { IConfigService } from '../../config/IConfigService.js';

export function createPromptBuilder(config: IConfigService): IPromptBuilder {
  return new PromptBuilder(config);
}

export { IPromptBuilder };
```

**Step 3: Update PromptBuilder Constructor**

Edit `src/services/prompt-builder/PromptBuilder.ts`:
```typescript
export class PromptBuilder implements IPromptBuilder {
  private defaultTemplate: PromptTemplate;

  constructor(config: IConfigService) {
    const customTemplate = config.getPromptTemplate();

    this.defaultTemplate = customTemplate
      ? { template: customTemplate }
      : DEFAULT_TEMPLATE;
  }

  buildPrompt(question: string, contexts: string[]): string {
    return this.buildPromptWithTemplate(question, contexts, this.defaultTemplate);
  }

  // ... rest of the class
}
```

**Step 4: Use in .env**

Add to your `.env` file:
```bash
PROMPT_TEMPLATE="You are a helpful assistant...\n\nContext:\n{context}\n\nQuestion: {question}\n\nAnswer:"
```

### Option 3: External Template File (Most Flexible)

Store templates in separate files for easy management:

**Step 1: Create templates directory**
```bash
mkdir -p templates
```

**Step 2: Create template files**

`templates/default.txt`:
```
You are a helpful assistant. Answer the user's question based on the provided context.

Context:
{context}

Instructions:
- Answer the question using only information from the context above
- If the context contains relevant information, cite the source number (e.g., [1], [2])
- If the context does not contain sufficient information to answer the question, clearly state that you don't have enough information
- Be concise and direct in your response

Question: {question}

Answer:
```

`templates/technical.txt`:
```
You are a technical documentation expert. Provide detailed answers based on the provided technical documentation.

Documentation:
{context}

Guidelines:
- Use only the information from the documentation above
- Include code examples and technical details when available
- Reference sources with [1], [2] notation
- Be precise and technically accurate
- If documentation is incomplete, specify what's missing

Question: {question}

Detailed Answer:
```

**Step 3: Add configuration**

In `src/config/IConfigService.ts`:
```typescript
getPromptTemplatePath(): string;
```

In `src/config/ConfigService.ts`:
```typescript
getPromptTemplatePath(): string {
  return process.env.PROMPT_TEMPLATE_PATH || './templates/default.txt';
}
```

**Step 4: Load template in PromptBuilder**

```typescript
import * as fs from 'fs';

export class PromptBuilder implements IPromptBuilder {
  private defaultTemplate: PromptTemplate;

  constructor(config: IConfigService) {
    const templatePath = config.getPromptTemplatePath();

    try {
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      this.defaultTemplate = { template: templateContent };
    } catch (error) {
      console.warn(`Could not load template from ${templatePath}, using default`);
      this.defaultTemplate = DEFAULT_TEMPLATE;
    }
  }

  // ... rest of the class
}
```

**Step 5: Use in .env**

```bash
# Use technical template
PROMPT_TEMPLATE_PATH=./templates/technical.txt

# Or use default
# PROMPT_TEMPLATE_PATH=./templates/default.txt
```

## Template Variables

Your custom template **must** include these placeholders:

- `{context}` - Where retrieved document chunks will be inserted
- `{question}` - Where the user's question will be inserted

Example:
```
System: You are an expert.

Documents:
{context}

User asks: {question}

Your answer:
```

## Context Formatting

The `{context}` placeholder will be replaced with numbered chunks:

```
[1] First retrieved chunk text here...

[2] Second retrieved chunk text here...

[3] Third retrieved chunk text here...
```

You can customize how contexts are formatted by modifying the `formatContexts()` method in `PromptBuilder.ts:42-50`.

**Example: Add metadata**
```typescript
private formatContexts(contexts: string[]): string {
  if (!contexts || contexts.length === 0) {
    return 'No relevant context found in documents.';
  }

  return contexts
    .map((context, index) => {
      return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SOURCE [${index + 1}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${context}
`;
    })
    .join('\n');
}
```

**Example: Add chunk similarity scores**

You'd need to modify the service to pass scores, but the formatting would look like:
```typescript
private formatContexts(contexts: Array<{text: string, score: number}>): string {
  return contexts
    .map((item, index) =>
      `[${index + 1}] (Relevance: ${(item.score * 100).toFixed(1)}%)\n${item.text}`
    )
    .join('\n\n');
}
```

## Testing Your Custom Prompt

After modifying the prompt:

1. **Rebuild the project** (if using TypeScript):
   ```bash
   npm run build
   ```

2. **Test with a query**:
   ```bash
   npm run chat
   ```

3. **Verify the prompt** by adding debug output:

   In `src/workflows/QueryWorkflow.ts`, add before LLM call:
   ```typescript
   const prompt = this.promptBuilder.buildPrompt(query, contextTexts);
   console.log('=== DEBUG: Full Prompt ===');
   console.log(prompt);
   console.log('=== END DEBUG ===');

   const answer = await this.llmClient.query(prompt);
   ```

4. **Compare outputs** with different prompts to see which works best

## Prompt Engineering Tips

### Do's
✓ Be specific about the task and constraints
✓ Include instructions on how to handle missing information
✓ Ask for source citations to verify accuracy
✓ Specify the desired output format (bullet points, paragraphs, etc.)
✓ Set the tone (professional, casual, technical, etc.)

### Don'ts
✗ Don't make prompts too long (context window limits)
✗ Don't give conflicting instructions
✗ Don't forget to include {context} and {question} placeholders
✗ Don't assume the LLM will follow complex multi-step instructions
✗ Don't make the assistant "hallucinate" by allowing it to go beyond context

## Common Use Cases

### 1. Strict Factual Responses
```
You are a fact-checking assistant. Only provide information explicitly stated in the context.

Context: {context}

Rules:
- Quote directly from sources when possible
- Mark citations with [1], [2], etc.
- If information is not in the context, say "Not found in provided documents"
- Never infer or extrapolate

Question: {question}
Answer:
```

### 2. Educational Assistant
```
You are a patient tutor helping someone learn. Use the provided educational materials to explain concepts clearly.

Learning materials:
{context}

Teaching approach:
- Break down complex concepts into simple terms
- Use examples from the materials when available
- Cite sources [1], [2] so the student can review
- If materials don't cover the topic, suggest what to look for
- Encourage further questions

Student's question: {question}

Explanation:
```

### 3. Code Documentation Assistant
```
You are a code documentation assistant. Help developers understand code based on provided documentation.

Documentation:
{context}

Instructions:
- Provide code examples when available in docs
- Reference specific functions/classes mentioned
- Cite documentation sections [1], [2]
- If docs are incomplete, state what's missing
- Use technical terminology accurately

Developer question: {question}

Answer:
```

### 4. Multi-lingual Support
```
You are a multilingual assistant. Answer in the same language as the question.

Context (English):
{context}

Instructions:
- Translate and adapt context to match question language
- Maintain technical accuracy
- Cite sources [1], [2]
- State if context doesn't contain the answer

Question: {question}

Answer:
```

## Advanced: Per-Collection Templates

You could extend the system to use different prompts for different document collections:

```bash
# In .env
PROMPT_TEMPLATE_legal=./templates/legal.txt
PROMPT_TEMPLATE_technical=./templates/technical.txt
PROMPT_TEMPLATE_general=./templates/general.txt

# Then use
npm run chat -- --collection legal
```

This would require modifying the Container and ConfigService to support collection-specific templates.

## Files to Modify

**Quick reference for where to make changes:**

| What to Change | File | Line |
|---------------|------|------|
| Default prompt text | `src/services/prompt-builder/PromptBuilder.ts` | 4-18 |
| Context formatting | `src/services/prompt-builder/PromptBuilder.ts` | 42-50 |
| Add config support | `src/config/IConfigService.ts` | - |
| Add config support | `src/config/ConfigService.ts` | - |
| Template model | `src/services/prompt-builder/models/PromptTemplate.ts` | - |
| Service interface | `src/services/prompt-builder/IPromptBuilder.ts` | - |

## Related Documentation

- [CLAUDE.md](./CLAUDE.md) - Architecture overview
- [README.md](./README.md) - Project documentation
- [src/services/prompt-builder/README.md](./src/services/prompt-builder/README.md) - PromptBuilder service docs

## Questions?

For prompt engineering best practices, see:
- [OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [Anthropic Prompt Engineering](https://docs.anthropic.com/claude/docs/prompt-engineering)
