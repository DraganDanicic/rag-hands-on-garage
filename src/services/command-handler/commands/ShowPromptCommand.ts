/**
 * Show Prompt Command
 *
 * Toggle visibility of the prompt details (retrieved chunks + final prompt).
 */

import chalk from 'chalk';
import type { ICommandHandler } from '../ICommandHandler.js';
import type { ChatContext } from '../models/ChatContext.js';
import type { CommandResult } from '../models/CommandResult.js';
import type { CommandHelp } from '../models/CommandHelp.js';

export class ShowPromptCommand implements ICommandHandler {
  getHelp(): CommandHelp {
    return {
      name: 'show-prompt',
      description: 'Toggle prompt visibility (show retrieved chunks and final prompt)',
    };
  }

  async execute(args: string, context: ChatContext): Promise<CommandResult> {
    const querySettings = context.container.getQuerySettings();
    const current = querySettings.getShowPrompt();

    // Determine new value
    let newValue: boolean;
    const trimmedArgs = args.trim().toLowerCase();

    if (!trimmedArgs || trimmedArgs === '') {
      // No args - toggle
      newValue = !current;
    } else if (trimmedArgs === 'on' || trimmedArgs === 'true' || trimmedArgs === '1') {
      newValue = true;
    } else if (trimmedArgs === 'off' || trimmedArgs === 'false' || trimmedArgs === '0') {
      newValue = false;
    } else {
      return {
        shouldExit: false,
        message: chalk.yellow('\nUsage: /show-prompt [on|off]\n\nToggles display of prompt details before each query.\n')
      };
    }

    // Update setting
    querySettings.setShowPrompt(newValue);
    await querySettings.save();

    const status = newValue ? 'enabled' : 'disabled';
    const icon = newValue ? '👁️ ' : '🙈';
    const explanation = newValue
      ? 'The next query will display retrieved chunks with similarity scores and the complete prompt sent to the LLM.'
      : 'Prompt details will be hidden for subsequent queries.';

    return {
      shouldExit: false,
      message: chalk.green(`\n${icon} Prompt visibility ${status}\n\n`) +
               chalk.gray(explanation + '\n')
    };
  }
}
