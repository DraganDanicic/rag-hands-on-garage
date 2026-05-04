# Conversation History Service

## Purpose

Manages conversation history for multi-turn conversations in the RAG chat system. Enables the LLM to maintain context across multiple questions and answers.

## Responsibilities

- Store user questions and assistant responses as structured messages
- Implement sliding window strategy to limit history size
- Provide token-aware message retrieval for LLM context
- Track conversation statistics (turn count, token usage)

## Architecture

### Isolation

This service is self-contained and has minimal dependencies:
- **Interface dependency**: `IQuerySettings` (for configuration only)
- **No service dependencies**: Does not call other services
- **Pure data management**: Stores and retrieves message history

### Configuration

Reads these settings from `IQuerySettings`:
- `history-window-size`: Number of turns to keep (default: 5)

### Strategy

**Sliding Window:**
- Keeps most recent N turns (configurable)
- Each turn = 1 user message + 1 assistant message = 2 messages
- Automatically drops oldest messages when window is exceeded
- Predictable memory and token usage

## Interface

### `IConversationHistory`

```typescript
interface IConversationHistory {
  // Add messages
  addUserMessage(content: string): void;
  addAssistantMessage(content: string): void;

  // Retrieve messages
  getMessages(): Message[];
  getMessagesForContext(maxTokens: number): Message[];

  // Management
  clear(): void;
  getTurnCount(): number;
  estimateTokens(): number;
}
```

### Key Methods

**`getMessagesForContext(maxTokens: number)`**
- Returns messages that fit within token budget
- Prioritizes most recent messages
- Works backwards from newest to oldest
- Stops when budget is exceeded

**`getTurnCount()`**
- Returns number of complete conversation turns
- A turn = user message + assistant response
- Used for display and statistics

**`estimateTokens()`**
- Estimates total token count for all messages
- Uses ~4 characters per token heuristic
- Cached in message metadata for efficiency

## Usage

### Initialization

```typescript
import { createConversationHistory } from '../conversation-history/index.js';

const conversationHistory = createConversationHistory(querySettings);
```

### Adding Messages

```typescript
// After user asks a question
conversationHistory.addUserMessage(question);

// After LLM responds
conversationHistory.addAssistantMessage(response);
```

### Retrieving for LLM Context

```typescript
// Get messages that fit within 2000 token budget
const historyMessages = conversationHistory.getMessagesForContext(2000);

// Use in prompt builder
const messages = promptBuilder.buildPromptWithHistory(
  question,
  contexts,
  historyMessages
);
```

### Management

```typescript
// Check statistics
const turnCount = conversationHistory.getTurnCount();
const tokenCount = conversationHistory.estimateTokens();

// Clear on collection switch
conversationHistory.clear();
```

## Token Estimation

Uses a simple heuristic: **~4 characters per token**

This approximation:
- Works well for English and most languages
- Slightly overestimates (better than underestimating)
- Accuracy: ±20% of actual token count
- Good enough for budget management

For precise token counting, would need to use actual tokenizer (adds dependency).

## Example Flow

```typescript
// Turn 1
conversationHistory.addUserMessage("What is Cinderella about?");
conversationHistory.addAssistantMessage("Cinderella is a folktale...");

// Turn 2
conversationHistory.addUserMessage("Who wrote it?");
// Before querying LLM, get history for context
const history = conversationHistory.getMessagesForContext(2000);
// history = [
//   { role: 'user', content: 'What is Cinderella about?' },
//   { role: 'assistant', content: 'Cinderella is a folktale...' },
//   { role: 'user', content: 'Who wrote it?' }
// ]
```

## Design Decisions

### Why Sliding Window?

**Pros:**
- Simple to implement and understand
- Predictable memory and token usage
- Works for 80% of use cases
- No external dependencies

**Cons:**
- Loses old context (acceptable for most conversations)
- Doesn't prioritize important messages (could enhance later)

### Why Not Persistent Storage?

**v1 Scope:**
- Keep it simple
- In-memory is sufficient for single session
- No file I/O complexity

**Future Enhancement:**
- Could save to `data/conversations/{session}.json`
- Enable conversation resume across sessions

### Why Token Estimation Instead of Exact Counting?

**Trade-offs:**
- Exact counting requires tokenizer library (dependency)
- Estimation is fast and good enough for budget management
- Slightly overestimates = safer (won't exceed limits)

## Integration Points

### Used By

- **QueryWorkflow**: Retrieves history for LLM context
- **Chat CLI**: Adds messages after each turn
- **Command Handlers**: For /show-history, /clear-history, /history-stats

### Uses

- **QuerySettings**: Reads `history-window-size` configuration

## Testing Considerations

### Unit Tests

- Window size enforcement (5 turns = 10 messages max)
- Token budget limiting (getMessagesForContext)
- Turn counting accuracy
- Token estimation accuracy
- Clear functionality

### Integration Tests

- End-to-end conversation flow
- Collection switch clearing
- Settings changes during conversation

## Future Enhancements

1. **Smart History Selection** - Use embeddings to include only relevant past turns
2. **LLM-Based Compression** - Summarize old history to reduce tokens
3. **Persistent History** - Save conversations to disk
4. **Per-Collection History** - Different history for each collection
5. **Message Metadata** - Track sources, confidence scores, etc.
