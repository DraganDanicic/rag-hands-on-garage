import chalk from 'chalk';
import type { ICommandHandler } from '../ICommandHandler.js';
import type { CommandResult } from '../models/CommandResult.js';
import type { CommandHelp } from '../models/CommandHelp.js';
import type { ChatContext } from '../models/ChatContext.js';

/**
 * Command to list all available collections
 */
export class CollectionsCommand implements ICommandHandler {
  async execute(_args: string, context: ChatContext): Promise<CommandResult> {
    const collections = await context.collectionManager.listCollections();

    if (collections.length === 0) {
      return {
        shouldExit: false,
        message: chalk.yellow('\nNo collections found. Generate embeddings first.\n'),
      };
    }

    const lines: string[] = [
      '',
      chalk.blue.bold('Available Collections:'),
      '',
    ];

    for (const collection of collections) {
      const isCurrent = collection.name === context.collectionName;
      const marker = isCurrent ? chalk.green('●') : chalk.gray('○');
      const name = isCurrent ? chalk.green.bold(collection.name) : chalk.white(collection.name);

      const sizeMB = (collection.fileSizeBytes / 1024 / 1024).toFixed(2);
      const date = collection.lastModified.toLocaleDateString();

      lines.push(
        `  ${marker} ${name.padEnd(30)} ${chalk.gray(`${collection.embeddingCount} chunks`).padEnd(25)} ${chalk.gray(sizeMB + ' MB').padEnd(15)} ${chalk.gray(date)}`
      );
    }

    lines.push('');
    lines.push(chalk.gray(`Use ${chalk.cyan('/collection <name>')} to switch collections`));
    lines.push('');

    return {
      shouldExit: false,
      message: lines.join('\n'),
    };
  }

  getHelp(): CommandHelp {
    return {
      name: 'collections',
      description: 'List all available collections',
    };
  }
}
