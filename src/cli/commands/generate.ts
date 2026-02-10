import { Command } from 'commander';
import { Container } from '../../di/Container.js';
import { IndexingWorkflow } from '../../workflows/IndexingWorkflow.js';
import chalk from 'chalk';

export const generateCommand = new Command('generate')
  .description('Generate embeddings from PDF documents')
  .option('-c, --collection <name>', 'Collection name', 'default')
  .option('-f, --force', 'Regenerate all (ignore existing embeddings - not yet implemented)')
  .option('--dry-run', 'Show what would be processed (not yet implemented)')
  .action(async (options) => {
    const collectionName = options.collection;

    console.log(chalk.blue.bold('\nRAG Document Indexing\n'));
    console.log(chalk.gray('='.repeat(50)));
    console.log(chalk.white(`Collection: ${collectionName}`));
    console.log(chalk.gray('='.repeat(50)));

    try {
      // Initialize dependency injection container with collection name
      const container = new Container(collectionName);
      await container.initialize();

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

      const totalEmbeddings = await workflow.execute();

      console.log(chalk.green.bold(`\n✓ Successfully indexed ${totalEmbeddings} chunks`));
      console.log(chalk.gray(`Collection: ${collectionName}`));
      console.log(chalk.gray(`Embeddings: ${configService.getEmbeddingsPath()}`));
      console.log(chalk.gray(`Chunks: ${configService.getChunksPath()}\n`));
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
