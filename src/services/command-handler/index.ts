import { CommandRegistry } from './CommandRegistry.js';
import { ExitCommand } from './commands/ExitCommand.js';
import { HelpCommand } from './commands/HelpCommand.js';
import { CollectionCommand } from './commands/CollectionCommand.js';
import { CollectionsCommand } from './commands/CollectionsCommand.js';
import { SettingsCommand } from './commands/SettingsCommand.js';
import { StatusCommand } from './commands/StatusCommand.js';
import { ConfigCommand } from './commands/ConfigCommand.js';

export { CommandParser } from './CommandParser.js';
export { CommandRegistry } from './CommandRegistry.js';
export type { ICommandHandler } from './ICommandHandler.js';

// Models
export type { ParsedInput } from './models/ParsedInput.js';
export type { CommandResult } from './models/CommandResult.js';
export type { CommandHelp } from './models/CommandHelp.js';
export type { ChatContext } from './models/ChatContext.js';

// Commands
export { ExitCommand } from './commands/ExitCommand.js';
export { HelpCommand } from './commands/HelpCommand.js';
export { CollectionCommand } from './commands/CollectionCommand.js';
export { CollectionsCommand } from './commands/CollectionsCommand.js';
export { SettingsCommand } from './commands/SettingsCommand.js';
export { StatusCommand } from './commands/StatusCommand.js';
export { ConfigCommand } from './commands/ConfigCommand.js';

/**
 * Factory function to create and configure a command registry with all commands
 */
export function createCommandRegistry(): CommandRegistry {
  const registry = new CommandRegistry();

  // Register all commands
  registry.register(new ExitCommand());

  const helpCommand = new HelpCommand(registry);
  registry.register(helpCommand);

  registry.register(new CollectionCommand());
  registry.register(new CollectionsCommand());
  registry.register(new SettingsCommand());
  registry.register(new StatusCommand());
  registry.register(new ConfigCommand());

  return registry;
}
