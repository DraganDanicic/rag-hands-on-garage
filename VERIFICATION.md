# Feature Verification Guide

This document provides manual verification steps for the new features implemented.

## Feature 1: In-Chat Slash Commands

### Commands to Test

#### 1. `/help` - Show Available Commands
```bash
npm run chat
# In chat:
/help
```
**Expected**: Display list of all available commands with descriptions

#### 2. `/exit` and `/quit` - Exit Chat
```bash
npm run chat
# In chat:
/exit
# or
/quit
```
**Expected**: Session terminates with "Goodbye!" message

#### 3. `/collections` - List Collections
```bash
npm run chat
# In chat:
/collections
```
**Expected**: Display all collections with statistics (count, size, date)
**Note**: Current collection marked with green dot (●)

#### 4. `/collection <name>` - Switch Collection
```bash
npm run chat
# In chat:
/collections              # See available collections
/collection farytales     # Switch to farytales collection
/status                   # Verify switched collection
```
**Expected**:
- Container and workflow re-initialized
- Confirmation message: "✓ Switched to collection 'farytales'"
- Subsequent queries use new collection

#### 5. `/status` - Collection Statistics
```bash
npm run chat
# In chat:
/status
```
**Expected**: Display current collection stats (embeddings count, file size, last modified)

#### 6. `/settings` - LLM Settings
```bash
npm run chat
# In chat:
/settings
```
**Expected**: Display LLM configuration (model, temperature, max tokens, top K)

#### 7. `/config` - Full Configuration
```bash
npm run chat
# In chat:
/config
```
**Expected**: Display all configuration including paths, chunking, LLM, and search settings

### Error Cases to Test

#### Unknown Command
```bash
npm run chat
# In chat:
/unknown
```
**Expected**: "Unknown command: /unknown" with suggestion to use /help

#### Invalid Collection
```bash
npm run chat
# In chat:
/collection nonexistent
```
**Expected**: Error message "Collection 'nonexistent' not found"

#### Missing Arguments
```bash
npm run chat
# In chat:
/collection
```
**Expected**: Show current collection and usage pattern

### Backward Compatibility

#### Legacy Exit Commands
```bash
npm run chat
# In chat:
exit
# or
quit
```
**Expected**: Still works without slash prefix

#### Regular Queries
```bash
npm run chat
# In chat:
What is this about?
```
**Expected**: Treated as regular RAG query, not as command

## Feature 2: Selective Document Processing

### 1. List Documents
```bash
npm run rag-garage documents list
# or
node dist/cli/rag-garage.js documents list
```
**Expected**: Display all PDF files in documents directory with size and date

### 2. Dry Run Mode
```bash
npm run generate -- --dry-run
```
**Expected**: Show what documents would be processed without generating embeddings

### 3. Select Specific Documents
```bash
npm run generate -- --collection test-selective --documents "Brothers Grimm fairy stories - Cinderella.pdf" --dry-run
```
**Expected**:
- Process only Cinderella.pdf
- Show document metadata
- No embeddings generated (dry-run)

### 4. Select Multiple Documents
```bash
npm run generate -- --collection test-multi --documents "Brothers Grimm fairy stories - Cinderella.pdf,Brothers Grimm Household Stories - The Sleeping Beauty.pdf" --dry-run
```
**Expected**: Process both specified documents

### 5. Interactive Mode
```bash
npm run generate -- --collection test-interactive --interactive
```
**Expected**:
- Show numbered list of available documents
- Prompt for selection (comma-separated numbers or "all")
- Confirm selection
- Process selected documents

Example interaction:
```
Available documents:

  [1] Brothers Grimm fairy stories - Cinderella.pdf (0.70 MB)
  [2] Brothers Grimm Household Stories - The Sleeping Beauty.pdf (0.73 MB)

Enter numbers to select (comma-separated), or "all" for all documents: 1

Selected 1 document(s)

[Processing continues...]
```

### 6. Default Behavior (All Documents)
```bash
npm run generate -- --collection test-default
```
**Expected**: Process all PDF documents in documents directory (backward compatible)

### Error Cases to Test

#### Invalid File Name
```bash
npm run generate -- --documents "nonexistent.pdf"
```
**Expected**: Error "Document not found: nonexistent.pdf"

#### Non-PDF File
```bash
npm run generate -- --documents "README.md"
```
**Expected**: Error "Not a PDF file: README.md"

#### Empty Selection in Interactive Mode
```bash
npm run generate -- --interactive
# Enter: [empty]
```
**Expected**: Error "No documents selected"

## Integration Testing

### Complete Workflow
```bash
# 1. List available documents
npm run rag-garage documents list

# 2. Generate embeddings for one document
npm run generate -- --collection cinderella --documents "Brothers Grimm fairy stories - Cinderella.pdf"

# 3. Start chat with that collection
npm run chat -- --collection cinderella

# 4. Test in-chat commands
/help
/status
/collections
/collection default
/collection cinderella
What happens to Cinderella?
/exit
```

## Verification Checklist

### In-Chat Commands
- [ ] `/help` displays all available commands
- [ ] `/exit` and `/quit` terminate the session
- [ ] `/collection <name>` switches collections successfully
- [ ] `/collections` lists all collections with current marked
- [ ] `/settings` shows LLM configuration
- [ ] `/status` displays collection statistics
- [ ] `/config` shows full configuration
- [ ] Unknown commands show helpful error
- [ ] Collection switching re-initializes container
- [ ] Error messages use ErrorHandler
- [ ] Legacy `exit`/`quit` still works
- [ ] Regular queries work unchanged

### Document Selection
- [ ] `documents list` shows all PDFs
- [ ] `--dry-run` shows files without processing
- [ ] `--documents "file.pdf"` processes only that file
- [ ] `--documents "file1.pdf,file2.pdf"` processes multiple files
- [ ] `--interactive` shows selection UI
- [ ] Interactive mode accepts "all" option
- [ ] Interactive mode accepts comma-separated numbers
- [ ] Invalid file names show clear errors
- [ ] Default behavior (all documents) still works
- [ ] Resume capability works with selective processing

### Backward Compatibility
- [ ] All existing CLI commands work unchanged
- [ ] Generate without options processes all documents
- [ ] Chat without commands works as before
- [ ] Existing `.env` configuration valid
- [ ] No breaking changes to API or behavior

## Performance Verification

### Command Response Time
- Commands should respond instantly (< 100ms)
- Collection switching should complete in < 2 seconds
- No noticeable delay in command processing

### Memory Usage
- Collection switching should properly clean up previous container
- No memory leaks during extended chat sessions
- Command execution should not increase memory footprint

## User Experience Verification

### Discoverability
- New users can find commands via `/help`
- Error messages guide users to correct usage
- Command names are intuitive and memorable

### Consistency
- All commands follow same pattern
- Error messages use consistent formatting
- Output styling is uniform (colors, alignment)

### Flexibility
- Users can switch collections mid-session
- Selective processing allows incremental indexing
- Interactive mode accommodates different workflows
