#!/usr/bin/env node

import { Container } from '../di/Container.js';
import { IndexingWorkflow } from '../workflows/IndexingWorkflow.js';
import chalk from 'chalk';

/**
 * CLI command to generate embeddings from PDF documents
 *
 * This command:
 * 1. Reads all PDFs from the documents/ folder
 * 2. Chunks the text content
 * 3. Generates embeddings using OpenAI API
 * 4. Stores embeddings in data/collections/{collection}.embeddings.json
 *
 * Usage:
 *   npm run generate-embeddings                    (uses 'default' collection)
 *   npm run generate-embeddings -- --collection my-project
 */
async function main(): Promise<void> {
  // Parse command-line arguments for collection name
  const args = process.argv.slice(2);
  const collectionIndex = args.indexOf('--collection');
  const collectionName = collectionIndex >= 0 && args[collectionIndex + 1]
    ? args[collectionIndex + 1]
    : 'default';

  console.log(chalk.blue.bold('\nRAG Document Indexing\n'));
  console.log(chalk.gray('='.repeat(50)));
  console.log(chalk.white(`Collection: ${collectionName}`));
  console.log(chalk.gray('='.repeat(50)));

  try {
    // Initialize dependency injection container with collection name
    const container = new Container(collectionName);

    // Get required services
    const configService = container.getConfigService();
    const documentReader = container.getDocumentReader();
    const textChunker = container.getTextChunker();
    const embeddingClient = container.getEmbeddingClient();
    const embeddingStore = container.getEmbeddingStore();
    const progressReporter = container.getProgressReporter();

    // Create and execute indexing workflow
    const workflow = new IndexingWorkflow(
      configService,
      documentReader,
      textChunker,
      embeddingClient,
      embeddingStore,
      progressReporter
    );

    const embeddingCount = await workflow.execute();

    // Display summary
    console.log(chalk.gray('\n' + '='.repeat(50)));
    console.log(chalk.green.bold('\nIndexing Summary:'));
    console.log(chalk.white(`  Collection: ${collectionName}`));
    console.log(chalk.white(`  Total embeddings: ${embeddingCount}`));
    console.log(chalk.white(`  Embeddings: ${configService.getEmbeddingsPath()}`));
    console.log(chalk.white(`  Chunks: ${configService.getChunksPath()}`));
    if (collectionName === 'default') {
      console.log(chalk.green('\nYou can now run the chat interface with: npm run chat\n'));
    } else {
      console.log(chalk.green(`\nYou can now run the chat interface with: npm run chat -- --collection ${collectionName}\n`));
    }
  } catch (error) {
    console.error(chalk.red.bold('\nError during indexing:'));

    if (error instanceof Error) {
      console.error(chalk.red(`  ${error.message}`));

      if (error.stack) {
        console.error(chalk.gray('\nStack trace:'));
        console.error(chalk.gray(error.stack));
      }
    } else {
      console.error(chalk.red(`  ${String(error)}`));
    }

    console.log(chalk.yellow('\nTroubleshooting tips:'));
    console.log(chalk.white('  1. Ensure PDFs are in the documents/ folder'));
    console.log(chalk.white('  2. Check that your .env file has valid API keys'));
    console.log(chalk.white('  3. Verify your OpenAI API key is active'));
    console.log(chalk.white('  4. Check your internet connection\n'));

    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error(chalk.red('Unexpected error:'), error);
  process.exit(1);
});
