import { Command } from 'commander';
import * as readline from 'readline';
import { Container } from '../../di/Container.js';
import { QueryWorkflow } from '../../workflows/QueryWorkflow.js';
import chalk from 'chalk';

export const chatCommand = new Command('chat')
  .description('Start interactive chat with your documents')
  .option('-c, --collection <name>', 'Collection name', 'default')
  .action(async (options) => {
    const collectionName = options.collection;

    console.log(chalk.blue.bold('\nRAG Interactive Chat\n'));
    console.log(chalk.gray('='.repeat(50)));
    console.log(chalk.white(`Collection: ${collectionName}`));
    console.log(chalk.white('Ask questions about your documents.'));
    console.log(chalk.white(`Type ${chalk.yellow("'exit'")} or ${chalk.yellow("'quit'")} to end the session.\n`));

    try {
      // Initialize dependency injection container with collection name
      const container = new Container(collectionName);
      await container.initialize();

      // Get required services
      const configService = container.getConfigService();
      const embeddingClient = container.getEmbeddingClient();
      const embeddingStore = container.getEmbeddingStore();
      const vectorSearch = container.getVectorSearch();
      const promptBuilder = container.getPromptBuilder();
      const llmClient = container.getLlmClient();
      const progressReporter = container.getProgressReporter();

      // Create query workflow
      const workflow = new QueryWorkflow(
        configService,
        embeddingClient,
        embeddingStore,
        vectorSearch,
        promptBuilder,
        llmClient,
        progressReporter
      );

      // Create readline interface for interactive input
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      // Interactive question loop
      const askQuestion = () => {
        rl.question(chalk.cyan('\nYou: '), async (question) => {
          const trimmedQuestion = question.trim();

          // Check for exit commands
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
            // Use ErrorHandler for context-specific guidance
            const errorHandler = container.getErrorHandler();
            const guidance = errorHandler.getGuidance(error);

            console.error(chalk.red(`\n✗ ${guidance.title}: `) + chalk.white(guidance.message));

            if (guidance.tips.length > 0 && guidance.tips.length <= 2) {
              // Show just first 2 tips for in-chat errors (keep it concise)
              console.log(chalk.yellow('Tip: ') + chalk.gray(guidance.tips[0]));
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
