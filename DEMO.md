# Feature Demo Guide

Quick demonstration of the new features.

## Feature 1: In-Chat Slash Commands

### Start a Chat Session
```bash
npm run chat
```

### Try These Commands
```
You: /help
[Shows all available commands]

You: /collections
[Lists all collections with stats]

You: /status
[Shows current collection details]

You: /settings
[Shows LLM configuration]

You: /collection farytales
[Switches to farytales collection]

You: /exit
[Exits chat session]
```

## Feature 2: Selective Document Processing

### List Available Documents
```bash
npm run rag-garage documents list
```

**Output:**
```
Available Documents:

  Brothers Grimm fairy stories - Cinderella.pdf              0.70 MB    2/10/2026
  Brothers Grimm Household Stories - The Sleeping Beauty.pdf 0.73 MB    2/10/2026

Total: 2 documents
```

### Preview What Would Be Processed
```bash
npm run generate -- --dry-run
```

**Output:**
```
[DRY RUN] Documents that would be processed:

  - Brothers Grimm Household Stories - The Sleeping Beauty.pdf (0.73 MB, 3 pages)
  - Brothers Grimm fairy stories - Cinderella.pdf (0.70 MB, 5 pages)

Total: 2 documents
No embeddings were generated.
```

### Select Specific Document
```bash
npm run generate -- --collection cinderella --documents "Brothers Grimm fairy stories - Cinderella.pdf" --dry-run
```

**Output:**
```
Processing 1 selected document(s)

[DRY RUN] Documents that would be processed:

  - Brothers Grimm fairy stories - Cinderella.pdf (0.70 MB, 5 pages)

Total: 1 document
No embeddings were generated.
```

### Interactive Mode
```bash
npm run generate -- --interactive
```

**Interaction:**
```
Available documents:

  [1] Brothers Grimm fairy stories - Cinderella.pdf (0.70 MB)
  [2] Brothers Grimm Household Stories - The Sleeping Beauty.pdf (0.73 MB)

Enter numbers to select (comma-separated), or "all" for all documents: 1

Selected 1 document(s)
```

## Combined Workflow Example

```bash
# 1. See what documents are available
npm run rag-garage documents list

# 2. Preview processing
npm run generate -- --collection demo --dry-run

# 3. Process one document
npm run generate -- --collection demo --documents "Brothers Grimm fairy stories - Cinderella.pdf"

# 4. Chat with that collection
npm run chat -- --collection demo

# 5. Use in-chat commands
/status          # See collection stats
/settings        # View LLM config
/help            # See all commands
What happens to Cinderella at the end?
/exit            # Leave chat
```

## Quick Test Script

Copy and paste to test features:

```bash
# Test document listing
echo "=== Testing Document List ===" && \
npm run rag-garage documents list && \

# Test dry run
echo -e "\n=== Testing Dry Run ===" && \
npm run generate -- --dry-run && \

# Test selective processing
echo -e "\n=== Testing Selective Processing ===" && \
npm run generate -- --collection test-demo --documents "Brothers Grimm fairy stories - Cinderella.pdf" --dry-run && \

echo -e "\n=== All Tests Complete ==="
```

## Expected Results

All commands should:
- ✅ Execute without errors
- ✅ Display formatted, colored output
- ✅ Show correct file information
- ✅ Maintain backward compatibility
