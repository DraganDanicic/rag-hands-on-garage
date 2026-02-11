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
      chalk.yellow('Statistics:'),
      `  ${chalk.cyan('Embeddings:'.padEnd(20))} ${chalk.white(stats.embeddingCount)} chunks`,
      `  ${chalk.cyan('File Size:'.padEnd(20))} ${chalk.white(sizeMB)} MB`,
      `  ${chalk.cyan('Last Modified:'.padEnd(20))} ${chalk.white(`${date} ${time}`)}`,
      '',
    ];

    // Add settings if available
    if (stats.settings) {
      lines.push(
        chalk.yellow('Settings (locked):'),
        `  ${chalk.cyan('Chunk Size:'.padEnd(20))} ${chalk.white(stats.settings.chunkSize)} characters`,
        `  ${chalk.cyan('Chunk Overlap:'.padEnd(20))} ${chalk.white(stats.settings.chunkOverlap)} characters`,
        `  ${chalk.cyan('Embedding Model:'.padEnd(20))} ${chalk.white(stats.settings.embeddingModel)}`,
        '',
      );
    } else {
      lines.push(
        chalk.gray('Settings: Not available (legacy collection)'),
        '',
      );
    }

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
