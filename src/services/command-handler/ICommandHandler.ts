import type { CommandResult } from './models/CommandResult.js';
import type { CommandHelp } from './models/CommandHelp.js';
import type { ChatContext } from './models/ChatContext.js';

/**
 * Interface for individual command handlers
 */
export interface ICommandHandler {
  /**
   * Execute the command
   *
   * @param args - Command arguments string
   * @param context - Chat context with all dependencies
   * @returns Command execution result
   */
  execute(args: string, context: ChatContext): Promise<CommandResult>;

  /**
   * Get help information for this command
   *
   * @returns Command help metadata
   */
  getHelp(): CommandHelp;
}
