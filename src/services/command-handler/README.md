# Command Handler Service

The Command Handler service provides in-chat slash command functionality for the RAG chat interface.

## Purpose

Allows users to control the chat session, view configuration, switch collections, and access help without leaving the interactive chat session.

## Architecture

The service follows the **Command Pattern** with a registry-based architecture:

```
CommandParser ──> ParsedInput
                       │
                       ├─> command ──> CommandRegistry ──> ICommandHandler.execute()
                       │
                       └─> query ────> QueryWorkflow (regular RAG query)
```

## Components

### CommandParser
- Detects slash commands (lines starting with `/`)
- Extracts command name and arguments
- Returns `ParsedInput` with type `command` or `query`

**Pattern**: `/([a-z-]+)(?:\s+(.+))?`
- Command names: lowercase letters and hyphens only
- Arguments: everything after the first space

### CommandRegistry
- Maps command names to handler implementations
- Supports command aliases (e.g., `/exit` and `/quit`)
- Provides help information for all registered commands

### ICommandHandler
Interface for individual command implementations:
```typescript
interface ICommandHandler {
  execute(args: string, context: ChatContext): Promise<CommandResult>;
  getHelp(): CommandHelp;
}
```

### ChatContext
Dependency injection container passed to all commands:
```typescript
interface ChatContext {
  container: Container;
  workflow: QueryWorkflow;
  collectionName: string;
  readline: readline.Interface;
  configService: IConfigService;
  collectionManager: ICollectionManager;
}
```

## Available Commands

| Command | Aliases | Arguments | Description |
|---------|---------|-----------|-------------|
| `/help` | - | None | Show all available commands |
| `/exit` | `/quit` | None | Exit the chat session |
| `/collection` | - | `<name>` | Switch to a different collection |
| `/collections` | - | None | List all available collections |
| `/settings` | - | None | Show current LLM settings |
| `/status` | - | None | Show collection statistics |
| `/config` | - | None | Show full configuration |

## Command Implementation

Each command is a separate class implementing `ICommandHandler`:

```typescript
export class ExampleCommand implements ICommandHandler {
  async execute(args: string, context: ChatContext): Promise<CommandResult> {
    // 1. Validate arguments
    if (!args) {
      return {
        shouldExit: false,
        message: 'Usage: /example <arg>',
      };
    }

    // 2. Perform command logic
    const result = await context.configService.getSomething();

    // 3. Return result
    return {
      shouldExit: false,
      message: `Result: ${result}`,
    };
  }

  getHelp(): CommandHelp {
    return {
      name: 'example',
      aliases: ['ex'],
      description: 'Example command description',
      usage: '/example <arg>',
    };
  }
}
```

## Command Results

Commands return a `CommandResult` object:

```typescript
interface CommandResult {
  shouldExit: boolean;              // Exit chat session?
  shouldSwitchCollection?: string;  // Switch to this collection?
  message?: string;                 // Message to display to user
}
```

### Special Behaviors

**Exit**: `shouldExit: true` terminates the chat session
**Collection Switch**: `shouldSwitchCollection: "name"` triggers:
1. Container re-initialization with new collection
2. Workflow recreation with new services
3. Context update

## Integration with Chat

In `src/cli/commands/chat.ts`:

```typescript
const parsed = commandParser.parse(userInput);

if (parsed.type === 'command') {
  const handler = commandRegistry.get(parsed.name);

  if (handler) {
    const result = await handler.execute(parsed.args, context);

    if (result.message) {
      console.log(result.message);
    }

    if (result.shouldExit) {
      rl.close();
      return;
    }

    if (result.shouldSwitchCollection) {
      // Re-initialize container and workflow
      collectionName = result.shouldSwitchCollection;
      container = new Container(collectionName);
      // ... recreate services
    }
  }
} else {
  // Regular query -> QueryWorkflow
  const answer = await workflow.query(parsed.text);
}
```

## Error Handling

Commands throw errors for invalid input:
```typescript
throw new Error('Collection not found');
```

The chat loop catches errors and displays them using `ErrorHandler`:
```typescript
catch (error) {
  const guidance = errorHandler.getGuidance(error);
  console.error(chalk.red(`✗ ${guidance.title}: ${guidance.message}`));
}
```

## Adding New Commands

1. Create command class in `src/services/command-handler/commands/`:
```typescript
export class MyCommand implements ICommandHandler {
  async execute(args: string, context: ChatContext): Promise<CommandResult> {
    // Implementation
  }

  getHelp(): CommandHelp {
    return {
      name: 'mycommand',
      description: 'What it does',
    };
  }
}
```

2. Register in `createCommandRegistry()`:
```typescript
export function createCommandRegistry(): CommandRegistry {
  const registry = new CommandRegistry();
  // ... existing commands
  registry.register(new MyCommand());
  return registry;
}
```

3. Export from `index.ts`:
```typescript
export { MyCommand } from './commands/MyCommand.js';
```

## Testing

Commands are tested by mocking `ChatContext`:

```typescript
describe('MyCommand', () => {
  it('should do something', async () => {
    const mockContext: ChatContext = {
      container: {} as Container,
      workflow: {} as QueryWorkflow,
      collectionName: 'test',
      readline: {} as readline.Interface,
      configService: {
        getSomething: jest.fn(() => 'value'),
      } as any,
      collectionManager: {} as ICollectionManager,
    };

    const command = new MyCommand();
    const result = await command.execute('arg', mockContext);

    expect(result.shouldExit).toBe(false);
    expect(result.message).toContain('expected');
  });
});
```

## Dependencies

This service does NOT depend on any other services. It only:
- Uses interfaces from other services (via ChatContext)
- Coordinates service interactions (orchestration)

Commands receive dependencies via `ChatContext`, following the isolated service architecture.

## Usage Example

```typescript
// In chat session
You: /help
Available Commands:
  /help              Show this help message
  /exit, /quit       Exit chat session
  ...

You: /collection project-a
✓ Switched to collection 'project-a'

You: /status
Collection: project-a
  Embeddings: 342 chunks
  File size: 2.4 MB
  Last modified: 2/10/2026

You: What is this about?
Assistant: [Regular RAG query response]

You: /exit
Goodbye!
```

## Benefits

1. **User-friendly**: No need to exit chat to change settings
2. **Discoverable**: `/help` shows all available commands
3. **Extensible**: Easy to add new commands
4. **Testable**: Commands are isolated and mockable
5. **Consistent**: All commands follow the same pattern
