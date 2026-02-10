import chalk from 'chalk';
import type { ICommandHandler } from '../ICommandHandler.js';
import type { CommandResult } from '../models/CommandResult.js';
import type { CommandHelp } from '../models/CommandHelp.js';
import type { ChatContext } from '../models/ChatContext.js';

/**
 * Command to display current LLM settings
 */
export class SettingsCommand implements ICommandHandler {
  async execute(_args: string, context: ChatContext): Promise<CommandResult> {
    const config = context.configService;

    const lines: string[] = [
      '',
      chalk.blue.bold('Current LLM Settings:'),
      '',
      `  ${chalk.cyan('Model:'.padEnd(20))} ${chalk.white(config.getLlmModel())}`,
      `  ${chalk.cyan('Temperature:'.padEnd(20))} ${chalk.white(config.getLlmTemperature())}`,
      `  ${chalk.cyan('Max Tokens:'.padEnd(20))} ${chalk.white(config.getLlmMaxTokens())}`,
      `  ${chalk.cyan('Top K Results:'.padEnd(20))} ${chalk.white(config.getTopK())}`,
      '',
    ];

    return {
      shouldExit: false,
      message: lines.join('\n'),
    };
  }

  getHelp(): CommandHelp {
    return {
      name: 'settings',
      description: 'Show current LLM settings',
    };
  }
}
