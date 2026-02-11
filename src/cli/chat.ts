#!/usr/bin/env node

import * as readline from 'readline';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Container } from '../di/Container.js';
import { QueryWorkflow } from '../workflows/QueryWorkflow.js';
import { CommandParser, createCommandRegistry } from '../services/command-handler/index.js';
import { Completer } from '../services/command-handler/Completer.js';
import type { ChatContext } from '../services/command-handler/index.js';
import chalk from 'chalk';

/**
 * CLI command for interactive chat interface
 *
 * This command:
 * 1. Starts an interactive terminal session
 * 2. Accepts user questions in a loop
 * 3. Uses RAG to retrieve relevant context
 * 4. Queries the LLM and displays responses
 * 5. Continues until user types 'exit' or 'quit'
 *
 * Usage:
 *   npm run chat                              (uses 'default' collection)
 *   npm run chat -- --collection my-project
 */
async function main(): Promise<void> {
  // Parse command-line arguments for collection name
  const args = process.argv.slice(2);
  const collectionIndex = args.indexOf('--collection');
  let collectionName: string = (collectionIndex >= 0 && args[collectionIndex + 1]) || 'default';

  // Check if requested collection exists, fallback if needed
  const requestedCollection = collectionName;
  const collectionsPath = process.env.COLLECTIONS_PATH || './data/collections';
  const embeddingsPath = path.join(collectionsPath, `${collectionName}.embeddings.json`);

  try {
    await fs.access(embeddingsPath);
  } catch {
    // Requested collection doesn't exist, find alternatives
    try {
      const files = await fs.readdir(collectionsPath);
      const embeddingFiles = files
        .filter(f => f.endsWith('.embeddings.json'))
        .map(f => f.replace('.embeddings.json', ''))
        .sort();

      if (embeddingFiles.length > 0) {
        collectionName = embeddingFiles[0]!;
        console.log(
          chalk.yellow(`\nCollection '${requestedCollection}' not found. Using '${collectionName}' instead.\n`)
        );
      }
    } catch {
      // Collections directory doesn't exist, let existing error handle it
    }
  }

  console.log(chalk.blue.bold('\nRAG Interactive Chat\n'));
  console.log(chalk.gray('='.repeat(50)));
  console.log(chalk.white(`Collection: ${collectionName}`));
  console.log(chalk.white('Ask questions about your documents.'));
  console.log(chalk.white(`Type ${chalk.cyan('/help')} for available commands or ${chalk.yellow("'exit'")} to end the session.\n`));

  try {
    // Initialize command parser and registry
    const commandParser = new CommandParser();
    const commandRegistry = createCommandRegistry();

    // Initialize dependency injection container with collection name
    let container = new Container(collectionName);
    await container.initialize();

    // Get required services
    let configService = container.getConfigService();
    let querySettings = container.getQuerySettings();
    let embeddingClient = container.getEmbeddingClient();
    let embeddingStore = container.getEmbeddingStore();
    let vectorSearch = container.getVectorSearch();
    let promptBuilder = container.getPromptBuilder();
    let llmClient = container.getLlmClient();
    let progressReporter = container.getProgressReporter();
    let collectionManager = container.getCollectionManager();
    let templateLoader = container.getTemplateLoader();

    // Create query workflow
    let workflow = new QueryWorkflow(
      querySettings,
      embeddingClient,
      embeddingStore,
      vectorSearch,
      promptBuilder,
      llmClient,
      progressReporter,
      templateLoader
    );

    // Verify embeddings exist before starting chat
    console.log(chalk.gray('Checking for indexed documents...'));
    const { embeddings } = await embeddingStore.load();

    if (embeddings.length === 0) {
      console.log(chalk.yellow(`\nNo embeddings found for collection '${collectionName}'.`));
      console.log(chalk.gray('Use the /import command to add documents and generate embeddings.\n'));
      console.log(chalk.gray('Type /help to see all available commands.\n'));
      // Don't exit - allow chat to start in empty mode
    } else {
      console.log(chalk.green(`Found ${embeddings.length} indexed chunks.\n`));
    }

    console.log(chalk.gray('='.repeat(50)));

    // Create tab completion service
    const completer = new Completer(commandRegistry, collectionManager);

    // Create readline interface for interactive input with tab completion
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('\nYou: '),
      completer: (line: string) => completer.complete(line),
    });

    // Display initial prompt
    rl.prompt();

    // Handle each line of input
    rl.on('line', async (input: string) => {
      const question = input.trim();

      // Parse input to detect commands vs queries
      const parsed = commandParser.parse(question);

      // Handle commands
      if (parsed.type === 'command') {
        const handler = commandRegistry.get(parsed.name!);

        if (handler) {
          try {
            // Build chat context
            const context: ChatContext = {
              container,
              workflow,
              collectionName,
              readline: rl,
              configService,
              collectionManager,
            };

            // Execute command
            const result = await handler.execute(parsed.args!, context);

            // Display message if provided
            if (result.message) {
              console.log(result.message);
            }

            // Handle exit
            if (result.shouldExit) {
              console.log(chalk.yellow('\nGoodbye!\n'));
              rl.close();
              process.exit(0);
            }

            // Handle collection switching
            if (result.shouldSwitchCollection) {
              try {
                // Re-initialize container with new collection
                collectionName = result.shouldSwitchCollection;
                container = new Container(collectionName);
                await container.initialize();

                // Get all services again
                configService = container.getConfigService();
                querySettings = container.getQuerySettings();
                embeddingClient = container.getEmbeddingClient();
                embeddingStore = container.getEmbeddingStore();
                vectorSearch = container.getVectorSearch();
                promptBuilder = container.getPromptBuilder();
                llmClient = container.getLlmClient();
                progressReporter = container.getProgressReporter();
                collectionManager = container.getCollectionManager();
                templateLoader = container.getTemplateLoader();

                // Recreate workflow with new services
                workflow = new QueryWorkflow(
                  querySettings,
                  embeddingClient,
                  embeddingStore,
                  vectorSearch,
                  promptBuilder,
                  llmClient,
                  progressReporter,
                  templateLoader
                );

                console.log(chalk.green(`\n✓ Switched to collection '${collectionName}'\n`));
              } catch (error) {
                const errorHandler = container.getErrorHandler();
                const guidance = errorHandler.getGuidance(error);
                console.error(chalk.red(`\n✗ ${guidance.title}: ${guidance.message}\n`));
              }
            }
          } catch (error) {
            const errorHandler = container.getErrorHandler();
            const guidance = errorHandler.getGuidance(error);
            console.error(chalk.red(`\n✗ ${guidance.title}: `) + chalk.white(guidance.message));

            if (guidance.tips.length > 0 && guidance.tips.length <= 2) {
              console.log(chalk.yellow('Tip: ') + chalk.gray(guidance.tips[0]));
            }
          }

          rl.prompt();
          return;
        } else {
          // Unknown command
          console.log(chalk.yellow(`\nUnknown command: /${parsed.name}`));
          console.log(chalk.gray('Type /help to see available commands\n'));
          rl.prompt();
          return;
        }
      }

      // Check for legacy exit commands (backward compatibility)
      if (question.toLowerCase() === 'exit' || question.toLowerCase() === 'quit') {
        console.log(chalk.yellow('\nGoodbye!\n'));
        rl.close();
        process.exit(0);
      }

      // Skip empty input
      if (!question) {
        rl.prompt();
        return;
      }

      try {
        // Execute query workflow
        console.log(); // Empty line for spacing
        const response = await workflow.query(question);

        // Display response
        console.log(chalk.gray('\n' + '-'.repeat(50)));
        console.log(chalk.green.bold('Assistant:'));
        console.log(chalk.white(response));
        console.log(chalk.gray('-'.repeat(50)));
      } catch (error) {
        // Handle no embeddings error with helpful message
        if (error instanceof Error && error.message.includes('No embeddings found')) {
          console.log(
            chalk.yellow('\n⚠ No embeddings available yet. ') +
            chalk.gray('Use /import to add documents first.\n')
          );
        } else {
          console.error(chalk.red.bold('\nError processing query:'));

          if (error instanceof Error) {
            console.error(chalk.red(`  ${error.message}`));
          } else {
            console.error(chalk.red(`  ${String(error)}`));
          }

          console.log(chalk.yellow('\nTroubleshooting tips:'));
          console.log(chalk.white('  1. Check your .env file has valid API keys'));
          console.log(chalk.white('  2. Verify your API keys are active'));
          console.log(chalk.white('  3. Check your internet connection'));
        }
      }

      // Show prompt again
      rl.prompt();
    });

    // Handle Ctrl+C
    rl.on('SIGINT', () => {
      console.log(chalk.yellow('\n\nReceived SIGINT. Goodbye!\n'));
      process.exit(0);
    });
  } catch (error) {
    console.error(chalk.red.bold('\nError initializing chat:'));

    if (error instanceof Error) {
      console.error(chalk.red(`  ${error.message}`));

      if (error.stack) {
        console.error(chalk.gray('\nStack trace:'));
        console.error(chalk.gray(error.stack));
      }
    } else {
      console.error(chalk.red(`  ${String(error)}`));
    }

    console.log(chalk.yellow('\nPlease check your configuration and try again.\n'));
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error(chalk.red('Unexpected error:'), error);
  process.exit(1);
});
