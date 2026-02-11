# ESC Key Cancellation in Interactive Commands

## Overview

Interactive commands that prompt for user input now support **ESC key** and **Ctrl+C** cancellation, allowing you to exit at any point during multi-step workflows.

## Affected Commands

### `/import` Command

The import command has multiple interactive steps:
1. Select target collection
2. Select documents to import
3. Confirm import settings
4. Confirm execution

You can now press **ESC** or **Ctrl+C** at any of these prompts to cancel.

## How It Works

### Cancel Indicators

When you press ESC or Ctrl+C:
- The prompt cancels immediately
- You see "Import cancelled" message
- Control returns to the chat prompt
- No partial operations are executed

### Visual Feedback

At the start of interactive workflows, you'll see:
```
(Press ESC or Ctrl+C to cancel at any time)
```

This reminder lets you know cancellation is available throughout the process.

## Usage Examples

### Example 1: Cancel During Collection Selection

```bash
You: /import

(Press ESC or Ctrl+C to cancel at any time)

Select target collection:
  1) Use current collection (default)
  2) Create new collection
  3) Select existing collection

Choice (1-3): [Press ESC]

Import cancelled

You:
```

### Example 2: Cancel During Document Selection

```bash
You: /import

(Press ESC or Ctrl+C to cancel at any time)

Select target collection:
  1) Use current collection (default)
  2) Create new collection

Choice (1-3): 1

Available documents:
  1) document1.pdf (1.2 MB)
  2) document2.pdf (0.8 MB)
  3) All documents

Select documents (comma-separated numbers or 3 for all): [Press ESC]

Import cancelled

You:
```

### Example 3: Cancel at Confirmation

```bash
You: /import

[... collection and document selection ...]

Importing 2 document(s) to: my-collection

Using GLOBAL settings:
  Chunk Size:          500 characters
  Chunk Overlap:       50 characters
  Checkpoint Interval: 50 chunks
  Embedding Model:     text-embedding-3-small

Proceed with import? (y/n): [Press ESC]

Import cancelled

You:
```

## Technical Details

### Supported Keys

- **ESC** (ASCII 27) - Cleanly exits the prompt
- **Ctrl+C** (ASCII 3) - Alternative cancellation method
- Both methods are equivalent and safe to use

### Raw Mode

The implementation temporarily enables terminal raw mode to capture individual keystrokes, including ESC. After cancellation, the terminal is restored to its previous state.

### No Side Effects

Cancellation is clean:
- No files are created or modified
- No partial data is saved
- Container state remains unchanged
- You can immediately retry or run other commands

## Other Interactive Features

While ESC cancellation is currently implemented for the `/import` command, the same pattern can be extended to:
- Future multi-step commands
- Configuration wizards
- Any interactive workflows

## Comparison to Other Methods

### Without ESC (Previous Behavior)

❌ Had to wait for prompt to timeout or force-quit the entire app
❌ Unclear how to exit multi-step workflows
❌ Could get "stuck" in prompts

### With ESC (Current Behavior)

✅ Press ESC at any prompt to cancel
✅ Clear visual indicator that cancellation is available
✅ Immediate return to chat prompt
✅ No partial operations or side effects

## Best Practices

### When to Use ESC

- Changed your mind about the operation
- Selected wrong option and want to restart
- Want to check something before proceeding
- Realized you need to change settings first
- Made a typo in collection name

### When to Complete the Workflow

- Settings look correct
- Ready to proceed with the operation
- Have time for the operation to complete

## Future Enhancements

Possible improvements:
- Add ESC cancellation to other interactive commands
- Show progress bars with ESC-to-cancel option during long operations
- Add "Back" option to go to previous step instead of full cancel
- Support UP/DOWN arrow keys for menu navigation

## Summary

**ESC key cancellation makes interactive commands more user-friendly:**

- **Press ESC or Ctrl+C** at any interactive prompt
- **Cancels immediately** with no side effects
- **Visual indicator** shows cancellation is available
- **Clean return** to chat prompt

You're never stuck in a workflow - just press ESC to get out!

## Testing

Try it yourself:

```bash
npm run chat

# Start import and cancel at different stages
> /import
[Press ESC at collection selection]

> /import
1 [Select collection]
[Press ESC at document selection]

> /import
1 [Select collection]
2 [Select documents]
[Press ESC at confirmation]
```

Each cancellation should return you cleanly to the chat prompt with "Import cancelled" message.
