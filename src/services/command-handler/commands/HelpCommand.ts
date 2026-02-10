import chalk from 'chalk';
import type { ICommandHandler } from '../ICommandHandler.js';
import type { CommandResult } from '../models/CommandResult.js';
import type { CommandHelp } from '../models/CommandHelp.js';
import type { ChatContext } from '../models/ChatContext.js';
import type { CommandRegistry } from '../CommandRegistry.js';

/**
 * Command to display help information
 */
export class HelpCommand implements ICommandHandler {
  constructor(private registry: CommandRegistry) {}

  async execute(_args: string, _context: ChatContext): Promise<CommandResult> {
    const allHelp = this.registry.getAllHelp();

    // Sort by command name
    allHelp.sort((a, b) => a.name.localeCompare(b.name));

    const lines: string[] = [
      '',
      chalk.blue.bold('Available Commands:'),
      '',
    ];

    for (const help of allHelp) {
      // Build command display with aliases
      let commandDisplay = `/${help.name}`;
      if (help.aliases && help.aliases.length > 0) {
        commandDisplay += `, /${help.aliases.join(', /')}`;
      }

      // Add usage pattern if available
      if (help.usage) {
        commandDisplay = help.usage;
      }

      lines.push(
        `  ${chalk.cyan(commandDisplay.padEnd(25))} ${chalk.gray(help.description)}`
      );
    }

    lines.push('');

    return {
      shouldExit: false,
      message: lines.join('\n'),
    };
  }

  getHelp(): CommandHelp {
    return {
      name: 'help',
      description: 'Show this help message',
    };
  }
}
