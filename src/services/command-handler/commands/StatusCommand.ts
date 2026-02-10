import chalk from 'chalk';
import type { ICommandHandler } from '../ICommandHandler.js';
import type { CommandResult } from '../models/CommandResult.js';
import type { CommandHelp } from '../models/CommandHelp.js';
import type { ChatContext } from '../models/ChatContext.js';

/**
 * Command to display collection statistics
 */
export class StatusCommand implements ICommandHandler {
  async execute(_args: string, context: ChatContext): Promise<CommandResult> {
    const exists = await context.collectionManager.collectionExists(context.collectionName);

    if (!exists) {
      return {
        shouldExit: false,
        message: chalk.yellow(
          `\nCollection '${context.collectionName}' has no embeddings yet.\n` +
          `Run ${chalk.cyan('npm run generate-embeddings')} to create it.\n`
        ),
      };
    }

    const stats = await context.collectionManager.getCollectionInfo(context.collectionName);

    const sizeMB = (stats.fileSizeBytes / 1024 / 1024).toFixed(2);
    const date = stats.lastModified.toLocaleDateString();
    const time = stats.lastModified.toLocaleTimeString();

    const lines: string[] = [
      '',
      chalk.blue.bold(`Collection: ${context.collectionName}`),
      '',
      `  ${chalk.cyan('Embeddings:'.padEnd(20))} ${chalk.white(stats.embeddingCount)} chunks`,
      `  ${chalk.cyan('File Size:'.padEnd(20))} ${chalk.white(sizeMB)} MB`,
      `  ${chalk.cyan('Last Modified:'.padEnd(20))} ${chalk.white(`${date} ${time}`)}`,
      '',
    ];

    return {
      shouldExit: false,
      message: lines.join('\n'),
    };
  }

  getHelp(): CommandHelp {
    return {
      name: 'status',
      description: 'Show collection statistics',
    };
  }
}
