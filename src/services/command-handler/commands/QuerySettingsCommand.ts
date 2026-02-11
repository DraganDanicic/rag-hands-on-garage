/**
 * Query Settings Command
 *
 * View and modify runtime query settings like top-K, temperature, max tokens, etc.
 */

import chalk from 'chalk';
import type { ICommandHandler } from '../ICommandHandler.js';
import type { ChatContext } from '../models/ChatContext.js';
import type { CommandResult } from '../models/CommandResult.js';
import type { CommandHelp } from '../models/CommandHelp.js';

export class QuerySettingsCommand implements ICommandHandler {

  getHelp(): CommandHelp {
    return {
      name: 'query-settings',
      description: 'View or modify runtime query settings (top-k, temperature, etc.)',
    };
  }

  async execute(_args: string, _context: ChatContext): Promise<CommandResult> {
    return {
      shouldExit: false,
      message: chalk.yellow('\n⚠ The /query-settings command is deprecated.\n') +
               chalk.white('Please use /settings instead:\n\n') +
               chalk.gray('  /settings              - View all settings\n') +
               chalk.gray('  /settings set top-k 5  - Change query settings\n') +
               chalk.gray('  /settings reset        - Reset to defaults\n\n') +
               chalk.gray('All query settings are now managed by /settings\n')
    };
  }

}
