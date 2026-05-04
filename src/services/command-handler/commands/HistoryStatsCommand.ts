import type { ICommandHandler } from '../ICommandHandler.js';
import type { CommandResult } from '../models/CommandResult.js';
import type { CommandHelp } from '../models/CommandHelp.js';
import type { ChatContext } from '../models/ChatContext.js';
import chalk from 'chalk';

/**
 * /history-stats command - Shows conversation history statistics
 *
 * Usage:
 *   /history-stats
 *
 * Description:
 *   Displays statistics about the current conversation history including
 *   turn count, token usage, and window size information.
 */
export class HistoryStatsCommand implements ICommandHandler {

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
    const totalTokens = conversationHistory.estimateTokens();
    const windowSize = querySettings.getHistoryWindowSize();
    const maxHistoryTokens = querySettings.getHistoryMaxTokens();
    const maxContextTokens = querySettings.getMaxContextTokens();

    let output = chalk.blue.bold('\n📊 Conversation History Statistics\n');
    output += chalk.blue('='.repeat(70)) + '\n\n';

    // Current usage
    output += chalk.yellow('Current Usage:\n');
    output += chalk.white(`  Turns: ${turnCount} / ${windowSize} (max window size)\n`);
    output += chalk.white(`  Messages: ${conversationHistory.getMessages().length}\n`);
    output += chalk.white(`  Tokens (estimated): ${totalTokens} / ${maxHistoryTokens} (max history budget)\n`);

    // Token budget breakdown
    const historyPercentage = maxHistoryTokens > 0 ? (totalTokens / maxHistoryTokens * 100).toFixed(1) : '0';

    output += chalk.yellow('\nToken Budget:\n');
    output += chalk.white(`  History budget: ${totalTokens} / ${maxHistoryTokens} (${historyPercentage}% used)\n`);
    output += chalk.white(`  Total context budget: ${maxContextTokens} tokens\n`);
    output += chalk.white(`  Remaining for RAG chunks: ~${Math.max(0, maxContextTokens - totalTokens - 200)} tokens\n`);
    output += chalk.gray(`  (200 tokens reserved for system prompt overhead)\n`);

    // Window management
    output += chalk.yellow('\nWindow Management:\n');
    if (turnCount >= windowSize) {
      output += chalk.yellow(`  ⚠️  Window is full - oldest messages will be dropped\n`);
    } else {
      const remaining = windowSize - turnCount;
      output += chalk.green(`  ✓ ${remaining} turns remaining before window limit\n`);
    }

    if (totalTokens >= maxHistoryTokens) {
      output += chalk.yellow(`  ⚠️  Token limit reached - oldest messages will be dropped\n`);
    } else {
      const remaining = maxHistoryTokens - totalTokens;
      output += chalk.green(`  ✓ ~${remaining} tokens remaining\n`);
    }

    output += chalk.blue('\n' + '='.repeat(70)) + '\n';

    return { shouldExit: false, message: output };
  }

  getHelp(): CommandHelp {
    return {
      name: 'history-stats',
      description: 'Show conversation history statistics',
    };
  }
}
