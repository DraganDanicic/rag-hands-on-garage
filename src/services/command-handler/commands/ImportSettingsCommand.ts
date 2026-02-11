import chalk from 'chalk';
import type { ICommandHandler } from '../ICommandHandler.js';
import type { CommandResult } from '../models/CommandResult.js';
import type { CommandHelp } from '../models/CommandHelp.js';
import type { ChatContext } from '../models/ChatContext.js';

/**
 * Command to view and configure global import settings
 */
export class ImportSettingsCommand implements ICommandHandler {
  async execute(_args: string, _context: ChatContext): Promise<CommandResult> {
    return {
      shouldExit: false,
      message: chalk.yellow('\n⚠ The /import-settings command is deprecated.\n') +
               chalk.white('Please use /settings instead:\n\n') +
               chalk.gray('  /settings                    - View all settings\n') +
               chalk.gray('  /settings set chunk-size 600 - Change import settings\n') +
               chalk.gray('  /settings reset              - Reset to defaults\n\n') +
               chalk.gray('All import settings are now managed by /settings\n')
    };
  }


  getHelp(): CommandHelp {
    return {
      name: 'import-settings',
      description: 'View or configure global import settings',
    };
  }
}
