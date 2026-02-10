#!/usr/bin/env node

import * as readline from 'readline';
import { Container } from '../di/Container.js';
import { QueryWorkflow } from '../workflows/QueryWorkflow.js';
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
  const collectionName = collectionIndex >= 0 && args[collectionIndex + 1]
    ? args[collectionIndex + 1]
    : 'default';

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

    // Verify embeddings exist before starting chat
    console.log(chalk.gray('Checking for indexed documents...'));
    const embeddings = await embeddingStore.load();

    if (embeddings.length === 0) {
      console.log(chalk.red.bold(`\nNo embeddings found for collection '${collectionName}'!`));
      console.log(chalk.yellow('\nYou need to generate embeddings first:'));
      console.log(chalk.white('  1. Add PDF documents to the documents/ folder'));
      if (collectionName === 'default') {
        console.log(chalk.white('  2. Run: npm run generate-embeddings\n'));
      } else {
        console.log(chalk.white(`  2. Run: npm run generate-embeddings -- --collection ${collectionName}\n`));
      }
      process.exit(1);
    }

    console.log(chalk.green(`Found ${embeddings.length} indexed chunks.\n`));
    console.log(chalk.gray('='.repeat(50)));

    // Create readline interface for interactive input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('\nYou: '),
    });

    // Display initial prompt
    rl.prompt();

    // Handle each line of input
    rl.on('line', async (input: string) => {
      const question = input.trim();

      // Check for exit commands
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
