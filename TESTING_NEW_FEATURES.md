# Testing New Advanced Command System Features

This document provides step-by-step instructions for testing all the new features implemented in the advanced command system expansion.

## Prerequisites

1. Build the project:
   ```bash
   npm run build
   ```

2. Ensure you have existing collections (check with `ls data/collections/`)

## Feature 1: Import Settings Management (`/import-settings`)

### Test 1.1: View Current Settings
```bash
npm run chat
```

In the chat:
```
/import-settings
```

**Expected Output:**
- Shows global import settings (chunk size, overlap, checkpoint interval, embedding model)
- Message about settings applying to NEW collections
- Note about existing collections using locked settings

### Test 1.2: Change a Setting
```
/import-settings set chunk-size 1000
```

**Expected Output:**
- Success message confirming change
- Settings saved to `data/import-settings.json`

Verify:
```
cat data/import-settings.json
```

### Test 1.3: Reset to Defaults
```
/import-settings reset
```

**Expected Output:**
- Success message
- Settings reverted to defaults (500, 50, 50, askbosch-prod-farm-openai-text-embedding-3-small)

### Test 1.4: Invalid Setting
```
/import-settings set invalid-key 123
```

**Expected Output:**
- Error message about unknown setting
- List of available keys

## Feature 2: Collection Status with Settings (`/status`)

### Test 2.1: View Collection with Settings
```
/status
```

**Expected Output:**
- Collection statistics (embeddings count, file size, last modified)
- Settings section showing locked settings (if available)
- Or "Settings: Not available (legacy collection)" for old collections

### Test 2.2: Legacy Collection
If you have an old collection without settings metadata:
```
/collection <legacy-collection-name>
/status
```

**Expected Output:**
- Statistics shown normally
- "Settings: Not available (legacy collection)" message

## Feature 3: Collection Deletion (`/delete`)

### Test 3.1: Delete a Collection
First, create a test collection or use a non-current one:
```
/delete farytales
```

**Expected Output:**
- Confirmation prompt
- Type 'y' to confirm
- Success message
- Collection files deleted from `data/collections/` and `data/chunks/`

### Test 3.2: Attempt to Delete Current Collection
```
/delete default
```

**Expected Output:**
- Error: "Cannot delete current collection. Switch to another collection first."

### Test 3.3: Delete Non-Existent Collection
```
/delete non-existent
```

**Expected Output:**
- Error: "Collection 'non-existent' not found"

## Feature 4: Collection Renaming (`/rename`)

### Test 4.1: Rename a Collection
First, ensure you're not on the collection you want to rename:
```
/rename old-name new-name
```

**Expected Output:**
- Confirmation prompt
- Type 'y' to confirm
- Success message
- Both embeddings and chunks files renamed

Verify:
```bash
ls data/collections/
ls data/chunks/
```

### Test 4.2: Attempt to Rename Current Collection
```
/rename default something-else
```

**Expected Output:**
- Error: "Cannot rename current collection. Switch to another collection first."

### Test 4.3: Rename to Existing Name
```
/rename collection-a collection-b
```
(where both exist)

**Expected Output:**
- Error: "Collection 'collection-b' already exists"

## Feature 5: Tab Completion

### Test 5.1: Command Completion
In chat, type:
```
/im[TAB]
```

**Expected:**
- Auto-completes to `/import` or shows options (`/import`, `/import-settings`)

### Test 5.2: Collection Name Completion
```
/collection fa[TAB]
```

**Expected:**
- Completes to collection name starting with "fa" (e.g., "farytales")

### Test 5.3: Setting Key Completion
```
/import-settings set chu[TAB]
```

**Expected:**
- Shows/completes to "chunk-size" or "chunk-overlap"

### Test 5.4: Multiple Commands
Press TAB after typing `/`:
```
/[TAB]
```

**Expected:**
- Shows all available commands

## Feature 6: In-Chat Import (`/import`)

### Test 6.1: Import to Current Collection

**Setup:** Ensure you have PDF files in `documents/` folder.

```
/import
```

**Expected Flow:**
1. Prompt: "Select target collection"
   - Option 1: Use current collection
   - Option 2: Create new collection
   - Option 3: Select existing collection

   Choose: `1`

2. Shows available PDF documents with sizes
3. Prompt: "Select documents (comma-separated or all)"

   Enter: `1,2` (or number for all)

4. **Important:** Shows settings being used:
   - If existing collection: "Using COLLECTION settings (locked)"
   - If new collection: "Using GLOBAL settings"
   - Displays: chunk size, overlap, checkpoint interval, model

5. Confirmation prompt: "Proceed with import? (y/n)"

   Enter: `y`

6. Executes IndexingWorkflow
7. Shows progress
8. Success message with count

### Test 6.2: Import to New Collection
```
/import
```

Select option `2` (Create new collection)

Enter new collection name: `test-collection`

**Expected:**
- Shows "Using GLOBAL settings" (reads from `/import-settings`)
- Creates new collection with settings metadata

Verify settings saved:
```
/collection test-collection
/status
```

Should show the settings that were used.

### Test 6.3: Import to Existing Collection with Locked Settings
```
/import
```

Select an existing collection.

**Expected:**
- Shows "Using COLLECTION settings (locked)"
- Displays settings from when collection was created
- Note: "Settings from when collection was created cannot be changed"

### Test 6.4: Import with Modified Global Settings
```
/import-settings set chunk-size 1000
/import
```

Create a new collection.

**Expected:**
- Uses the modified settings (chunk-size: 1000)
- Saves these settings to the new collection

Verify:
```
/collection <new-collection-name>
/status
```

Should show chunk-size: 1000 in locked settings.

### Test 6.5: Import with Collection Argument
```
/import my-collection
```

**Expected:**
- Skips collection selection prompt
- Uses "my-collection" directly
- Shows document selection

## Feature 7: Settings Hierarchy

### Test 7.1: New Collection Inherits Global Settings
```
/import-settings set chunk-size 800
/import-settings set chunk-overlap 100
/import
```

Create new collection → verify it uses 800/100.

### Test 7.2: Existing Collection Locked Settings
With an existing collection that has settings:
```
/status
```

Note the settings.

```
/import-settings set chunk-size 500
/import
```

Import to the SAME existing collection.

**Expected:**
- Import shows COLLECTION settings (original), not the new global 500
- Collection maintains its original settings

### Test 7.3: Legacy Collection Gets Settings on Import
With a legacy collection (no settings):
```
/collection <legacy-collection>
/status
```

Should show "Settings: Not available (legacy collection)"

```
/import-settings set chunk-size 600
/import
```

Import to the legacy collection.

**Expected:**
- Shows "Using GLOBAL settings (legacy collection - settings will be saved)"
- After import, settings are saved to the collection

Verify:
```
/status
```

Should now show settings.

## Regression Testing

### Existing Features Should Still Work

1. **Basic Chat:**
   ```
   What is the content about?
   ```
   Should work normally.

2. **Collection Switching:**
   ```
   /collection <name>
   ```
   Should switch collections.

3. **List Collections:**
   ```
   /collections
   ```
   Should list all collections with stats.

4. **Settings Display:**
   ```
   /settings
   ```
   Should show runtime settings.

5. **Config Display:**
   ```
   /config
   ```
   Should show configuration.

6. **Help:**
   ```
   /help
   ```
   Should show all commands including new ones.

7. **Exit:**
   ```
   /exit
   ```
   Should exit cleanly.

## Error Handling Tests

1. **Invalid chunk size:**
   ```
   /import-settings set chunk-size abc
   ```
   Expected: "Chunk size must be a number"

2. **Invalid overlap (greater than size):**
   ```
   /import-settings set chunk-size 100
   /import-settings set chunk-overlap 200
   ```
   Expected: Error about overlap vs size

3. **Empty model name:**
   ```
   /import-settings set embedding-model ""
   ```
   Expected: Error about empty model

4. **Import with no PDFs:**
   Move all PDFs out of `documents/`
   ```
   /import
   ```
   Expected: Error about no documents found

## Verification Checklist

- [ ] `/import-settings` shows current settings
- [ ] `/import-settings set` changes and persists settings
- [ ] `/import-settings reset` restores defaults
- [ ] `/status` shows collection settings (or legacy message)
- [ ] `/delete` deletes collection with confirmation
- [ ] `/delete` prevents deleting current collection
- [ ] `/rename` renames collection with confirmation
- [ ] `/rename` prevents renaming current collection
- [ ] `/import` shows interactive prompts
- [ ] `/import` displays which settings will be used
- [ ] `/import` creates new collections with global settings
- [ ] `/import` uses locked settings for existing collections
- [ ] `/import` saves settings to new collections
- [ ] Tab completion works for commands
- [ ] Tab completion works for collection names
- [ ] Tab completion works for setting keys
- [ ] `/help` includes all new commands
- [ ] Settings file persists at `data/import-settings.json`
- [ ] Collection metadata includes settings
- [ ] Legacy collections show appropriate message
- [ ] All existing features still work

## Files to Inspect

After testing, verify file structure:

```bash
# Settings file
cat data/import-settings.json

# Collection with settings
cat data/collections/<collection>.embeddings.json | jq '.settings'

# Chunks file
ls data/chunks/
```

## Notes

- Settings are locked per collection to maintain data consistency
- Global settings only apply to NEW collections
- Tab completion caches collection names for 5 seconds
- Import workflow supports resume capability
- All confirmation prompts default to 'n' (safe default)
