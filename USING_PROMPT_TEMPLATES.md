# Using Prompt Templates

## Overview

The RAG system supports multiple prompt templates that control how the LLM responds to your questions. You can switch between built-in templates or create custom ones.

## Built-in Templates

The system includes 4 built-in templates:

### 1. **default** (Default)
Balanced responses with clear structure.

**Best for:** General questions, comprehensive answers

**File:** `prompts/default.prompt.txt`

### 2. **concise**
Brief, direct answers.

**Best for:** Quick facts, simple questions

**File:** `prompts/concise.prompt.txt`

**Features:**
- Shortest accurate answer possible
- Bullet points for multiple items
- Source citations with [1], [2], etc.

### 3. **detailed**
Comprehensive, in-depth explanations.

**Best for:** Complex topics, learning, research

**File:** `prompts/detailed.prompt.txt`

**Features:**
- Thorough explanations
- Multiple perspectives
- Context and background information

### 4. **technical**
Technical, precise responses for developers.

**Best for:** Code-related questions, technical documentation

**File:** `prompts/technical.prompt.txt`

**Features:**
- Technical terminology
- Precise definitions
- Code examples where applicable

## Switching Templates

### View Current Template

```bash
/query-settings
```

Shows:
```
Query Settings (runtime):
  ...
  Prompt Template:      default
  ...
```

### Change Template

```bash
/query-settings set template concise
```

Available templates: `default`, `concise`, `detailed`, `technical`

The change takes effect immediately for the next query.

### Test Different Templates

```bash
# Try concise responses
/query-settings set template concise
What is RAG?

# Try detailed explanations
/query-settings set template detailed
What is RAG?

# Try technical responses
/query-settings set template technical
What is RAG?

# Back to default
/query-settings set template default
```

## Creating Custom Templates

You can create your own prompt templates:

### 1. Create Template File

Create a `.prompt.txt` file in the `prompts/` directory:

```bash
# Example: prompts/storytelling.prompt.txt
You are a creative storytelling assistant. Answer questions by weaving the information into an engaging narrative.

Context:
{context}

Instructions:
- Tell a story that incorporates the factual information
- Use vivid descriptions and engaging language
- Maintain accuracy while being entertaining
- Use narrative structure (beginning, middle, end)

Question: {question}

Answer:
```

### 2. Required Placeholders

Every template MUST include:
- `{context}` - Where retrieved chunks will be inserted
- `{question}` - Where the user's question will be inserted

Missing these will cause an error.

### 3. Use Custom Template

```bash
/query-settings set template storytelling
```

Or use a full path:

```bash
/query-settings set template /path/to/my/custom.prompt.txt
```

## Template Format

Templates use simple placeholder replacement:

```
[System instructions and personality]

Context:
{context}

[Additional instructions]

Question: {question}

Answer:
```

### Context Formatting

The `{context}` placeholder is replaced with numbered chunks:

```
Context:
[1] First retrieved chunk...
[2] Second retrieved chunk...
[3] Third retrieved chunk...
```

The number of chunks depends on your `top-k` setting.

## Combining with Other Settings

Templates work with all other query settings:

```bash
# Concise responses with more context
/query-settings set template concise
/query-settings set top-k 7

# Creative detailed responses
/query-settings set template detailed
/query-settings set temperature 1.2

# Technical responses with limited output
/query-settings set template technical
/query-settings set max-tokens 500
```

## Debugging Templates

Enable prompt visibility to see how your template is being used:

```bash
/show-prompt on
/query-settings set template concise
What is the main topic?
```

This will display:
1. Retrieved chunks with scores
2. **The complete final prompt** after template substitution

You can see exactly what's being sent to the LLM.

## Best Practices

### 1. **Match Template to Task**
- Research questions → `detailed`
- Quick lookups → `concise`
- Code documentation → `technical`
- General use → `default`

### 2. **Combine with Temperature**
```bash
# Concise + low temperature = very focused answers
/query-settings set template concise
/query-settings set temperature 0.3

# Detailed + high temperature = creative explanations
/query-settings set template detailed
/query-settings set temperature 1.0
```

### 3. **Adjust Context Amount**
```bash
# Concise template works well with fewer chunks
/query-settings set template concise
/query-settings set top-k 3

# Detailed template benefits from more context
/query-settings set template detailed
/query-settings set top-k 7
```

### 4. **Test with Show Prompt**
Always test new custom templates with `/show-prompt on` to verify:
- Placeholders are replaced correctly
- Format looks good
- Instructions are clear

## Examples

### Example 1: Quick Facts

```bash
/query-settings set template concise
/query-settings set top-k 3
/query-settings set temperature 0.5

What are the key features of RAG?
```

**Result:** Brief bullet-point list with citations

### Example 2: Deep Dive

```bash
/query-settings set template detailed
/query-settings set top-k 7
/query-settings set temperature 0.8

Explain how vector search works in RAG systems.
```

**Result:** Comprehensive explanation with context and examples

### Example 3: Code Documentation

```bash
/query-settings set template technical
/query-settings set top-k 5
/query-settings set temperature 0.3

How is the embedding store implemented?
```

**Result:** Technical explanation with precise terminology

## Error Handling

### Invalid Template Name

```bash
/query-settings set template nonexistent
```

**Result:**
- Error message displayed
- Falls back to `default` template
- Query continues with default

### Missing Placeholders

If a custom template is missing `{context}` or `{question}`:

**Result:**
- Error during template loading
- Template rejected
- Falls back to `default`

## Template Storage Location

- **Built-in templates:** `prompts/*.prompt.txt`
- **Custom templates:** Anywhere accessible, use full path or place in `prompts/` folder

## Persistence

Template settings persist across chat sessions in `data/query-settings.json`:

```json
{
  "topK": 3,
  "temperature": 0.7,
  "maxTokens": 2048,
  "promptTemplate": "concise",  ← Your selected template
  "showPrompt": false
}
```

## Reset to Default

```bash
/query-settings reset
```

Resets template to `default` along with all other settings.

## Advanced: Template Variables

Currently supported placeholders:
- `{context}` - Retrieved chunks (numbered [1], [2], etc.)
- `{question}` - User's question

Future enhancements could add:
- `{collection}` - Collection name
- `{date}` - Current date
- `{chunks_count}` - Number of chunks retrieved
- `{sources}` - Source documents

## Summary

**To switch templates:**
```bash
/query-settings set template <name>
```

**Available built-in templates:**
- `default` - Balanced
- `concise` - Brief
- `detailed` - Comprehensive
- `technical` - Technical

**To create custom templates:**
1. Create `.prompt.txt` file with `{context}` and `{question}` placeholders
2. Save to `prompts/` folder or use full path
3. Set via `/query-settings set template <name-or-path>`

**To debug:**
```bash
/show-prompt on
```

See the actual prompt sent to the LLM with your template applied.
