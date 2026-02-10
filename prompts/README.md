# Prompt Templates

This directory contains prompt templates for the RAG system. Templates control how the system formats context and questions when querying the LLM.

## Built-in Templates

### default.prompt.txt
The standard prompt template. Provides balanced responses that are accurate and helpful.

**Best for:** General questions, mixed topics, standard usage

### concise.prompt.txt
Optimized for brief, direct answers.

**Best for:** Quick lookups, simple questions, when you need just the facts

### detailed.prompt.txt
Generates comprehensive, thorough responses.

**Best for:** Complex topics, learning, when you need full explanations

### technical.prompt.txt
Focused on technical accuracy and actionable information.

**Best for:** Code examples, technical documentation, configuration details

## Using Templates

### Option 1: Use Built-in Template

Set in `.env`:
```env
PROMPT_TEMPLATE=default
```

Options: `default`, `concise`, `detailed`, `technical`

### Option 2: Create Custom Template

1. Create a new `.prompt.txt` file in this directory (or anywhere)
2. Set in `.env`:
```env
PROMPT_TEMPLATE_PATH=./prompts/my-custom.prompt.txt
```

## Template Format

Templates must contain two placeholders:
- `{context}` - Where retrieved document chunks are inserted
- `{question}` - Where the user's question is inserted

Example minimal template:
```
Context: {context}

Question: {question}

Answer:
```

## Template Best Practices

1. **Clear instructions**: Tell the LLM how to use the context
2. **Citation format**: Specify how to reference sources (e.g., [1], [2])
3. **Handling gaps**: Explain what to do if context is insufficient
4. **Tone and style**: Set the desired response style (concise, detailed, technical, etc.)
5. **Structure**: Use formatting (bullet points, sections) to organize complex responses

## Examples

### Custom Template for Bosch Documentation

```
You are a Bosch technical assistant. Answer based on official documentation.

Documentation Context:
{context}

Guidelines:
- Use Bosch terminology and standards
- Reference specific document sections with [1], [2], etc.
- If documentation is unclear, recommend contacting support
- Follow Bosch security and compliance guidelines

User Question: {question}

Response:
```

### Custom Template for Code Review

```
You are a code reviewer. Analyze the question based on the code context provided.

Code Context:
{context}

Review Guidelines:
- Focus on code quality, security, and best practices
- Cite specific code sections with [1], [2], etc.
- Suggest improvements when applicable
- If context lacks necessary code, specify what's needed

Question: {question}

Review:
```

## Testing Templates

After creating a custom template:

1. Generate embeddings: `npm run generate-embeddings`
2. Start chat: `npm run chat`
3. Ask a test question and verify the response format and quality
4. Adjust template as needed

## Troubleshooting

**Template not loading:**
- Check file path in `.env` is correct
- Ensure file has `.prompt.txt` extension
- Verify placeholders `{context}` and `{question}` are present

**Poor responses:**
- Try being more specific in instructions
- Add examples of desired response format
- Experiment with different built-in templates first
