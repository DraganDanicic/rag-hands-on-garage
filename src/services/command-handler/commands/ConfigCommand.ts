import chalk from 'chalk';
import type { ICommandHandler } from '../ICommandHandler.js';
import type { CommandResult } from '../models/CommandResult.js';
import type { CommandHelp } from '../models/CommandHelp.js';
import type { ChatContext } from '../models/ChatContext.js';

/**
 * Command to display full configuration
 */
export class ConfigCommand implements ICommandHandler {
  async execute(_args: string, context: ChatContext): Promise<CommandResult> {
    const config = context.configService;

    const lines: string[] = [
      '',
      chalk.blue.bold('Configuration:'),
      '',
      chalk.yellow.bold('Paths:'),
      `  ${chalk.cyan('Documents:'.padEnd(20))} ${chalk.white(config.getDocumentsPath())}`,
      `  ${chalk.cyan('Embeddings:'.padEnd(20))} ${chalk.white(config.getEmbeddingsPath())}`,
      `  ${chalk.cyan('Chunks:'.padEnd(20))} ${chalk.white(config.getChunksPath())}`,
      '',
      chalk.yellow.bold('Chunking:'),
      `  ${chalk.cyan('Chunk Size:'.padEnd(20))} ${chalk.white(config.getChunkSize())}`,
      `  ${chalk.cyan('Chunk Overlap:'.padEnd(20))} ${chalk.white(config.getChunkOverlap())}`,
      '',
      chalk.yellow.bold('LLM:'),
      `  ${chalk.cyan('Model:'.padEnd(20))} ${chalk.white(config.getLlmModel())}`,
      `  ${chalk.cyan('Temperature:'.padEnd(20))} ${chalk.white(config.getLlmTemperature())}`,
      `  ${chalk.cyan('Max Tokens:'.padEnd(20))} ${chalk.white(config.getLlmMaxTokens())}`,
      '',
      chalk.yellow.bold('Search:'),
      `  ${chalk.cyan('Top K Results:'.padEnd(20))} ${chalk.white(config.getTopK())}`,
      '',
      chalk.yellow.bold('Current Collection:'),
      `  ${chalk.cyan('Name:'.padEnd(20))} ${chalk.white(context.collectionName)}`,
      '',
    ];

    return {
      shouldExit: false,
      message: lines.join('\n'),
    };
  }

  getHelp(): CommandHelp {
    return {
      name: 'config',
      description: 'Show full configuration',
    };
  }
}
