import chalk from 'chalk';
import * as readline from 'readline';
import type { ICommandHandler } from '../ICommandHandler.js';
import type { CommandResult } from '../models/CommandResult.js';
import type { CommandHelp } from '../models/CommandHelp.js';
import type { ChatContext } from '../models/ChatContext.js';

/**
 * Command to delete a collection
 */
export class DeleteCommand implements ICommandHandler {
  async execute(args: string, context: ChatContext): Promise<CommandResult> {
    const collectionName = args.trim();

    if (!collectionName) {
      return {
        shouldExit: false,
        message: chalk.yellow('\nUsage: /delete <collection-name>\n'),
      };
    }

    // Prevent deleting current collection
    if (collectionName === context.collectionName) {
      return {
        shouldExit: false,
        message: chalk.red('\n✗ Cannot delete current collection. Switch to another collection first.\n'),
      };
    }

    // Check if collection exists
    const exists = await context.collectionManager.collectionExists(collectionName);
    if (!exists) {
      return {
        shouldExit: false,
        message: chalk.red(`\n✗ Collection '${collectionName}' not found\n`),
      };
    }

    // Confirm deletion
    const confirmed = await this.confirm(
      context.readline,
      chalk.yellow(`Delete collection '${collectionName}' and all its data? (y/n): `)
    );

    if (!confirmed) {
      return {
        shouldExit: false,
        message: chalk.gray('\nDeletion cancelled\n'),
      };
    }

    // Delete
    try {
      await context.collectionManager.deleteCollection(collectionName);
      return {
        shouldExit: false,
        message: chalk.green(`\n✓ Collection '${collectionName}' deleted\n`),
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
      name: 'delete',
      description: 'Delete a collection',
    };
  }
}
