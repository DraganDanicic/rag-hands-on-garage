import type { ICommandHandler } from '../ICommandHandler.js';
import type { CommandResult } from '../models/CommandResult.js';
import type { CommandHelp } from '../models/CommandHelp.js';
import type { ChatContext } from '../models/ChatContext.js';
import type { Message } from '../../conversation-history/models/Message.js';
import chalk from 'chalk';

/**
 * /show-history command - Displays conversation history
 *
 * Usage:
 *   /show-history
 *
 * Description:
 *   Shows all messages in the current conversation history.
 *   Only works when use-history is enabled.
 */
export class ShowHistoryCommand implements ICommandHandler {

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
    const messages = conversationHistory.getMessages();

    if (messages.length === 0) {
      return {
        shouldExit: false,
        message: chalk.gray('\nNo conversation history yet.\n')
      };
    }

    let output = chalk.blue.bold('\n📜 Conversation History\n');
    output += chalk.blue('='.repeat(70)) + '\n';

    messages.forEach((msg: Message, i: number) => {
      const roleColor = msg.role === 'user' ? chalk.cyan : chalk.green;
      const roleLabel = msg.role === 'user' ? 'You' : 'Assistant';

      output += roleColor(`\n[${i + 1}] ${roleLabel}:\n`);
      output += chalk.white(msg.content) + '\n';
    });

    output += chalk.blue('\n' + '='.repeat(70)) + '\n';
    output += chalk.gray(`Total: ${conversationHistory.getTurnCount()} turns, ${conversationHistory.estimateTokens()} tokens (estimated)\n`);

    return { shouldExit: false, message: output };
  }

  getHelp(): CommandHelp {
    return {
      name: 'show-history',
      description: 'Show conversation history',
    };
  }
}
