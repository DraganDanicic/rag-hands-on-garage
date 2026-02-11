import { Command } from 'commander';
import * as readline from 'readline';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Container } from '../../di/Container.js';
import { QueryWorkflow } from '../../workflows/QueryWorkflow.js';
import { CommandParser, createCommandRegistry } from '../../services/command-handler/index.js';
import type { ChatContext } from '../../services/command-handler/index.js';
import chalk from 'chalk';

export const chatCommand = new Command('chat')
  .description('Start interactive chat with your documents')
  .option('-c, --collection <name>', 'Collection name', 'default')
  .action(async (options) => {
    let collectionName = options.collection;

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

      // Create readline interface for interactive input
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      // Interactive question loop
      const askQuestion = () => {
        rl.question(chalk.cyan('\nYou: '), async (question) => {
          const trimmedQuestion = question.trim();

          // Parse input to detect commands vs queries
          const parsed = commandParser.parse(trimmedQuestion);

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
                  return;
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

              askQuestion();
              return;
            } else {
              // Unknown command
              console.log(chalk.yellow(`\nUnknown command: /${parsed.name}`));
              console.log(chalk.gray('Type /help to see available commands\n'));
              askQuestion();
              return;
            }
          }

          // Check for legacy exit commands (backward compatibility)
          if (trimmedQuestion.toLowerCase() === 'exit' || trimmedQuestion.toLowerCase() === 'quit') {
            console.log(chalk.yellow('\nGoodbye!\n'));
            rl.close();
            return;
          }

          // Skip empty questions
          if (!trimmedQuestion) {
            askQuestion();
            return;
          }

          try {
            // Execute query workflow
            const answer = await workflow.query(trimmedQuestion);

            console.log(chalk.green('\nAssistant: ') + chalk.white(answer));
          } catch (error) {
            // Handle no embeddings error with helpful message
            if (error instanceof Error && error.message.includes('No embeddings found')) {
              console.log(
                chalk.yellow('\n⚠ No embeddings available yet. ') +
                chalk.gray('Use /import to add documents first.\n')
              );
            } else {
              // Use ErrorHandler for context-specific guidance
              const errorHandler = container.getErrorHandler();
              const guidance = errorHandler.getGuidance(error);

              console.error(chalk.red(`\n✗ ${guidance.title}: `) + chalk.white(guidance.message));

              if (guidance.tips.length > 0 && guidance.tips.length <= 2) {
                // Show just first 2 tips for in-chat errors (keep it concise)
                console.log(chalk.yellow('Tip: ') + chalk.gray(guidance.tips[0]));
              }
            }
          }

          // Ask next question
          askQuestion();
        });
      };

      // Start the conversation
      askQuestion();
    } catch (error) {
      // Use ErrorHandler for context-specific guidance
      // Create a minimal container just for error handling
      const errorContainer = new Container();
      try {
        await errorContainer.initialize();
      } catch {
        // If even error handler init fails, use basic error display
      }
      const errorHandler = errorContainer.getErrorHandler();
      const guidance = errorHandler.getGuidance(error);

      console.error(chalk.red.bold(`\n✗ ${guidance.title}`));
      console.error(chalk.red(guidance.message));

      if (guidance.tips.length > 0) {
        console.log(chalk.yellow('\nTroubleshooting:'));
        for (const tip of guidance.tips) {
          console.log(chalk.white(`  ${tip}`));
        }
      }

      if (guidance.suggestedCommands && guidance.suggestedCommands.length > 0) {
        console.log(chalk.cyan('\nSuggested commands:'));
        for (const cmd of guidance.suggestedCommands) {
          console.log(chalk.gray(`  $ ${cmd}`));
        }
      }

      console.log(); // Empty line
      process.exit(1);
    }
  });
