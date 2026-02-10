import type { ICommandHandler } from './ICommandHandler.js';
import type { CommandHelp } from './models/CommandHelp.js';

/**
 * Registry that maps command names to their handlers
 */
export class CommandRegistry {
  private handlers = new Map<string, ICommandHandler>();
  private aliases = new Map<string, string>(); // alias -> primary name

  /**
   * Register a command handler
   *
   * @param handler - Command handler to register
   */
  register(handler: ICommandHandler): void {
    const help = handler.getHelp();
    this.handlers.set(help.name, handler);

    // Register aliases
    if (help.aliases) {
      for (const alias of help.aliases) {
        this.aliases.set(alias, help.name);
      }
    }
  }

  /**
   * Get a command handler by name or alias
   *
   * @param name - Command name or alias
   * @returns Command handler or undefined if not found
   */
  get(name: string): ICommandHandler | undefined {
    // Check if it's an alias
    const primaryName = this.aliases.get(name) || name;
    return this.handlers.get(primaryName);
  }

  /**
   * Get help information for all registered commands
   *
   * @returns Array of command help objects
   */
  getAllHelp(): CommandHelp[] {
    return Array.from(this.handlers.values()).map((handler) => handler.getHelp());
  }

  /**
   * Check if a command exists
   *
   * @param name - Command name or alias
   * @returns True if command exists
   */
  has(name: string): boolean {
    const primaryName = this.aliases.get(name) || name;
    return this.handlers.has(primaryName);
  }
}
