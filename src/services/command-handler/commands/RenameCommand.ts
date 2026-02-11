import chalk from 'chalk';
import * as readline from 'readline';
import type { ICommandHandler } from '../ICommandHandler.js';
import type { CommandResult } from '../models/CommandResult.js';
import type { CommandHelp } from '../models/CommandHelp.js';
import type { ChatContext } from '../models/ChatContext.js';

/**
 * Command to rename a collection
 */
export class RenameCommand implements ICommandHandler {
  async execute(args: string, context: ChatContext): Promise<CommandResult> {
    const parts = args.trim().split(/\s+/).filter(p => p.length > 0);

    if (parts.length !== 2) {
      return {
        shouldExit: false,
        message: chalk.yellow('\nUsage: /rename <old-name> <new-name>\n'),
      };
    }

    const oldName = parts[0];
    const newName = parts[1];

    if (!oldName || !newName) {
      return {
        shouldExit: false,
        message: chalk.yellow('\nUsage: /rename <old-name> <new-name>\n'),
      };
    }

    // Prevent renaming current collection
    if (oldName === context.collectionName) {
      return {
        shouldExit: false,
        message: chalk.red('\n✗ Cannot rename current collection. Switch to another collection first.\n'),
      };
    }

    // Confirm
    const confirmed = await this.confirm(
      context.readline,
      chalk.yellow(`Rename collection '${oldName}' to '${newName}'? (y/n): `)
    );

    if (!confirmed) {
      return {
        shouldExit: false,
        message: chalk.gray('\nRename cancelled\n'),
      };
    }

    // Rename
    try {
      await context.collectionManager.renameCollection(oldName, newName);
      return {
        shouldExit: false,
        message: chalk.green(`\n✓ Collection '${oldName}' renamed to '${newName}'\n`),
      };
    } catch (error) {
      return {
        shouldExit: false,
        message: chalk.red(`\n✗ Error: ${error instanceof Error ? error.message : String(error)}\n`),
      };
    }
  }

  private async confirm(rl: readline.Interface, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      rl.question(message, (answer) => {
        resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
      });
    });
  }

  getHelp(): CommandHelp {
    return {
      name: 'rename',
      description: 'Rename a collection',
    };
  }
}
