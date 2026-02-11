# Testing Query Settings and Show Prompt Features

## Overview

This document provides test cases for the new query settings and prompt visibility features implemented in the RAG chat system.

## Features Implemented

### 1. Query Settings Management (`/query-settings`)

Runtime configuration for query behavior:
- **top-k**: Number of embeddings to retrieve (1-10, default: 3)
- **temperature**: LLM temperature (0.0-2.0, default: 0.7)
- **max-tokens**: Maximum response tokens (100-8000, default: 2048)
- **template**: Prompt template name (default: 'default')
- **show-prompt**: Display prompt details (boolean, default: false)

Settings persist to `data/query-settings.json` across sessions.

### 2. Prompt Visibility Toggle (`/show-prompt`)

Toggle display of:
- Retrieved chunks with similarity scores
- Complete final prompt sent to LLM

## Manual Test Cases

### Test Case 1: View Current Settings

```bash
npm run chat
> /query-settings
```

**Expected Output:**
```
Query Settings (runtime):
  Top-K (embeddings):   3 chunks
  Temperature:          0.7
  Max Tokens:           2048
  Prompt Template:      default
  Show Prompt:          disabled

These settings affect the current chat session.
Commands:
  /query-settings set <key> <value>
  /query-settings reset
```

### Test Case 2: Change Top-K

```bash
> /query-settings set top-k 5
```

**Expected Output:**
```
✓ Top-K set to 5 chunks

Next query will retrieve 5 embeddings for context.
```

**Verify:**
```bash
> /query-settings
```

Should show `Top-K (embeddings): 5 chunks`

### Test Case 3: Change Temperature

```bash
> /query-settings set temperature 0.9
```

**Expected Output:**
```
✓ Temperature set to 0.9

Higher values (e.g., 1.5) = more creative, lower values (e.g., 0.3) = more focused.
```

### Test Case 4: Change Max Tokens

```bash
> /query-settings set max-tokens 4096
```

**Expected Output:**
```
✓ Max tokens set to 4096

LLM responses will be limited to 4096 tokens.
```

### Test Case 5: Reset to Defaults

```bash
> /query-settings set temperature 1.5
> /query-settings set top-k 7
> /query-settings reset
> /query-settings
```

**Expected Output:**
Should show all settings back to defaults (top-k: 3, temperature: 0.7, etc.)

### Test Case 6: Enable Prompt Visibility

```bash
> /show-prompt on
```

**Expected Output:**
```
👁️  Prompt visibility enabled

The next query will display retrieved chunks with similarity scores and the complete prompt sent to the LLM.
```

### Test Case 7: Disable Prompt Visibility

```bash
> /show-prompt off
```

**Expected Output:**
```
🙈 Prompt visibility disabled

Prompt details will be hidden for subsequent queries.
```

### Test Case 8: Toggle Prompt Visibility (No Args)

```bash
> /show-prompt
```

**Expected Behavior:**
Toggles the current state. If currently off, turns on (and vice versa).

### Test Case 9: Query with Prompt Visibility Enabled

```bash
> /show-prompt on
> What is the main topic?
```

**Expected Output:**
Should display something like:

```
======================================================================
📋 Prompt Details
======================================================================

Retrieved Chunks:

[1] Score: 87.3%
──────────────────────────────────────────────────
The document discusses the implementation of RAG systems using...

[2] Score: 82.1%
──────────────────────────────────────────────────
Key components include vector databases, embedding models, and...

[3] Score: 75.6%
──────────────────────────────────────────────────
Performance optimization requires careful tuning of chunk sizes...

Final Prompt Sent to LLM:
──────────────────────────────────────────────────────────────────────
You are a helpful assistant. Answer the user's question based on...

Context:
[1] The document discusses the implementation of RAG systems...
[2] Key components include vector databases, embedding models...
[3] Performance optimization requires careful tuning of chunk...

Question: What is the main topic?

Answer:
======================================================================

ℹ Querying LLM...
✓ Query completed successfully

--------------------------------------------------
Assistant:
[Response from LLM]
--------------------------------------------------
```

### Test Case 10: Settings Persistence

```bash
# Session 1
npm run chat
> /query-settings set top-k 7
> /show-prompt on
> /exit

# Session 2 (new terminal)
npm run chat
> /query-settings
```

**Expected Output:**
Should show `Top-K: 7` and `Show Prompt: enabled`, confirming settings persisted.

### Test Case 11: Validation - Invalid Top-K

```bash
> /query-settings set top-k 50
```

**Expected Output:**
```
✗ Top-K must be between 1 and 10

Valid ranges:
  top-k:       1-10
  temperature: 0.0-2.0
  max-tokens:  100-8000
```

### Test Case 12: Validation - Invalid Temperature

```bash
> /query-settings set temperature 3.0
```

**Expected Output:**
```
✗ Temperature must be between 0.0 and 2.0

Valid ranges:
  top-k:       1-10
  temperature: 0.0-2.0
  max-tokens:  100-8000
```

### Test Case 13: Tab Completion

```bash
> /query[TAB]
```
Should complete to `/query-settings`

```bash
> /show[TAB]
```
Should complete to `/show-prompt`

```bash
> /query-settings set [TAB]
```
Should show: `top-k temperature max-tokens template`

```bash
> /query-settings set tem[TAB]
```
Should complete to `temperature`

### Test Case 14: Help Command

```bash
> /help
```

**Expected Output:**
Should include the new commands:
```
/query-settings           View or modify runtime query settings (top-k, temperature, etc.)
/show-prompt              Toggle prompt visibility (show retrieved chunks and final prompt)
```

### Test Case 15: Top-K Effect on Query Results

```bash
# Use default top-k (3)
> What is RAG?
[Note the number of chunks retrieved]

> /query-settings set top-k 5
> What is RAG?
[Should retrieve 5 chunks instead of 3]

> /query-settings set top-k 1
> What is RAG?
[Should retrieve only 1 chunk]
```

**Verification:**
With `/show-prompt on`, you can see exactly how many chunks are being used.

## Automated Test Script

Create and run this script to verify basic functionality:

```bash
cat << 'EOF' > test-query-settings-automated.sh
#!/bin/bash
echo "=== Automated Query Settings Test ==="

# Test 1: View defaults
echo -e "\n[Test 1] View default settings"
echo "/query-settings
/exit" | npm run chat 2>&1 | grep -A 10 "Query Settings"

# Test 2: Change setting
echo -e "\n[Test 2] Change top-k to 5"
echo "/query-settings set top-k 5
/query-settings
/exit" | npm run chat 2>&1 | grep -A 10 "Top-K"

# Test 3: Enable show-prompt
echo -e "\n[Test 3] Enable prompt visibility"
echo "/show-prompt on
/query-settings
/exit" | npm run chat 2>&1 | grep -A 10 "Show Prompt"

# Test 4: Reset
echo -e "\n[Test 4] Reset to defaults"
echo "/query-settings reset
/query-settings
/exit" | npm run chat 2>&1 | grep -A 10 "Query Settings"

echo -e "\n=== Tests Complete ==="
EOF

chmod +x test-query-settings-automated.sh
./test-query-settings-automated.sh
```

## File Locations

- **Settings File**: `data/query-settings.json`
- **Service**: `src/services/query-settings/`
- **Commands**:
  - `src/services/command-handler/commands/QuerySettingsCommand.ts`
  - `src/services/command-handler/commands/ShowPromptCommand.ts`
- **Workflow**: `src/workflows/QueryWorkflow.ts` (displays prompt when enabled)

## Success Criteria Checklist

- [x] `/query-settings` displays current runtime settings
- [x] `/query-settings set top-k N` changes number of retrieved embeddings
- [x] `/query-settings set temperature N` changes LLM temperature
- [x] `/query-settings set max-tokens N` changes token limit
- [x] `/query-settings set template NAME` changes prompt template
- [x] `/query-settings reset` restores defaults
- [x] Settings persist across chat sessions
- [x] `/show-prompt` toggles prompt visibility
- [x] `/show-prompt on` shows retrieved chunks with scores
- [x] `/show-prompt on` shows complete final prompt
- [x] Prompt display format is clear and readable
- [x] Tab completion works for new commands
- [x] Help text includes new commands
- [x] Settings validation prevents invalid values
- [x] Query results reflect changed settings (top-K, temperature, etc.)
- [x] Backward compatible (works without settings file)

## Known Limitations

1. **Prompt Templates**: Currently accepts any string for template name. Template validation would require implementing multiple prompt templates first.

2. **Collection-Specific Settings**: Query settings are global (per machine), not per-collection. This is intentional - they control runtime behavior, not data structure.

3. **Max Tokens**: The maxTokens setting is passed to the LLM client, but the actual effect depends on the LLM provider's implementation.

## Notes

- Settings file is created automatically on first use with defaults
- Corrupted settings file will be replaced with defaults
- Settings are validated before being applied
- Show-prompt feature is designed for learning and debugging, not production use
- All settings take effect immediately (no restart required)
