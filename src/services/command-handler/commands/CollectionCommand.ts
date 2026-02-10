import chalk from 'chalk';
import type { ICommandHandler } from '../ICommandHandler.js';
import type { CommandResult } from '../models/CommandResult.js';
import type { CommandHelp } from '../models/CommandHelp.js';
import type { ChatContext } from '../models/ChatContext.js';

/**
 * Command to switch to a different collection
 */
export class CollectionCommand implements ICommandHandler {
  async execute(args: string, context: ChatContext): Promise<CommandResult> {
    const collectionName = args.trim();

    // If no args, show current collection
    if (!collectionName) {
      return {
        shouldExit: false,
        message: chalk.blue(`\nCurrent collection: ${chalk.bold(context.collectionName)}\n`),
      };
    }

    // Check if already on this collection
    if (collectionName === context.collectionName) {
      return {
        shouldExit: false,
        message: chalk.yellow(`\nAlready using collection '${collectionName}'\n`),
      };
    }

    // Validate collection exists
    const exists = await context.collectionManager.collectionExists(collectionName);
    if (!exists) {
      throw new Error(
        `Collection '${collectionName}' not found. Use /collections to see available collections.`
      );
    }

    // Return result to trigger collection switch in chat.ts
    return {
      shouldExit: false,
      shouldSwitchCollection: collectionName,
    };
  }

  getHelp(): CommandHelp {
    return {
      name: 'collection',
      description: 'Switch to a different collection',
      usage: '/collection <name>',
    };
  }
}
