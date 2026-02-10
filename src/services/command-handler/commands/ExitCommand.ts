import type { ICommandHandler } from '../ICommandHandler.js';
import type { CommandResult } from '../models/CommandResult.js';
import type { CommandHelp } from '../models/CommandHelp.js';
import type { ChatContext } from '../models/ChatContext.js';

/**
 * Command to exit the chat session
 */
export class ExitCommand implements ICommandHandler {
  async execute(_args: string, _context: ChatContext): Promise<CommandResult> {
    return {
      shouldExit: true,
    };
  }

  getHelp(): CommandHelp {
    return {
      name: 'exit',
      aliases: ['quit'],
      description: 'Exit the chat session',
    };
  }
}
