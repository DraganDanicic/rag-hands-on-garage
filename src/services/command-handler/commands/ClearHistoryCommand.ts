import type { ICommandHandler } from '../ICommandHandler.js';
import type { CommandResult } from '../models/CommandResult.js';
import type { CommandHelp } from '../models/CommandHelp.js';
import type { ChatContext } from '../models/ChatContext.js';
import chalk from 'chalk';

/**
 * /clear-history command - Clears conversation history
 *
 * Usage:
 *   /clear-history
 *
 * Description:
 *   Resets the conversation history for the current session.
 *   Only works when use-history is enabled.
 */
export class ClearHistoryCommand implements ICommandHandler {

  async execute(_args: string, context: ChatContext): Promise<CommandResult> {
    const querySettings = context.container.getQuerySettings();

    if (!querySettings.getUseHistory()) {
      return {
        shouldExit: false,
        message: chalk.yellow('\nConversation history is disabled. Enable it with:\n') +
          chalk.cyan('  /settings set use-history true\n')
      };
    }

    const conversationHistory = context.container.getConversationHistory();
    const turnCount = conversationHistory.getTurnCount();

    conversationHistory.clear();

    return {
      shouldExit: false,
      message: chalk.green(`\n✓ Conversation history cleared (${turnCount} turns removed)\n`)
    };
  }

  getHelp(): CommandHelp {
    return {
      name: 'clear-history',
      description: 'Clear conversation history',
    };
  }
}
