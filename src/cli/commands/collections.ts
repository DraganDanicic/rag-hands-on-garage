import { Command } from 'commander';
import { Container } from '../../di/Container.js';
import chalk from 'chalk';
import * as readline from 'readline';

export const collectionsCommand = new Command('collections')
  .description('Manage document collections');

// List all collections
collectionsCommand
  .command('list')
  .description('List all collections with statistics')
  .action(async () => {
    try {
      const container = new Container();
      await container.initialize();
      const collectionManager = container.getCollectionManager();

      const collections = await collectionManager.listCollections();

      if (collections.length === 0) {
        console.log(chalk.yellow('\nNo collections found.'));
        console.log(chalk.white('Create one with: rag-garage generate --collection <name>\n'));
        return;
      }

      console.log(chalk.blue.bold('\nCollections:\n'));

      let totalEmbeddings = 0;
      let totalSize = 0;

      for (const col of collections) {
        const sizeInMB = (col.fileSizeBytes / 1024 / 1024).toFixed(2);
        const lastMod = col.lastModified.toLocaleDateString();

        console.log(
          chalk.white(`  ${col.name.padEnd(25)}`) +
          chalk.green('✓ ') +
          chalk.white(`${col.embeddingCount.toString().padStart(4)} embeddings`) +
          chalk.gray(`    ${sizeInMB.padStart(6)} MB`) +
          chalk.gray(`    ${lastMod}`)
        );

        totalEmbeddings += col.embeddingCount;
        totalSize += col.fileSizeBytes;
      }

      const totalSizeInMB = (totalSize / 1024 / 1024).toFixed(2);
      console.log(chalk.gray('\n' + '-'.repeat(70)));
      console.log(
        chalk.white(`  Total: ${collections.length} collections, `) +
        chalk.white(`${totalEmbeddings} embeddings, `) +
        chalk.white(`${totalSizeInMB} MB\n`)
      );
    } catch (error) {
      const container = new Container();
      await container.initialize();
      const errorHandler = container.getErrorHandler();
      const guidance = errorHandler.getGuidance(error);

      console.error(chalk.red(`\n✗ ${guidance.title}`));
      console.error(chalk.red(guidance.message + '\n'));
      process.exit(1);
    }
  });

// Show collection info
collectionsCommand
  .command('info <name>')
  .description('Show detailed information about a collection')
  .action(async (name) => {
    try {
      const container = new Container();
      await container.initialize();
      const collectionManager = container.getCollectionManager();

      const info = await collectionManager.getCollectionInfo(name);

      console.log(chalk.blue.bold(`\nCollection: ${info.name}\n`));
      console.log(chalk.white('  Embeddings:      ') + chalk.green(info.embeddingCount.toString()));
      console.log(chalk.white('  File Size:       ') + chalk.gray((info.fileSizeBytes / 1024 / 1024).toFixed(2) + ' MB'));
      console.log(chalk.white('  Last Modified:   ') + chalk.gray(info.lastModified.toString()));
      console.log(chalk.white('  Embeddings Path: ') + chalk.gray(info.embeddingsPath));
      console.log(chalk.white('  Chunks Path:     ') + chalk.gray(info.chunksPath));
      console.log(chalk.white('  Chunks File:     ') + (info.chunksExists ? chalk.green('✓ exists') : chalk.yellow('✗ missing')));
      console.log();
    } catch (error) {
      const container = new Container();
      await container.initialize();
      const errorHandler = container.getErrorHandler();
      const guidance = errorHandler.getGuidance(error);

      console.error(chalk.red(`\n✗ ${guidance.title}`));
      console.error(chalk.red(guidance.message + '\n'));
      process.exit(1);
    }
  });

// Delete collection
collectionsCommand
  .command('delete <name>')
  .description('Delete a collection')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (name, options) => {
    try {
      const container = new Container();
      await container.initialize();
      const collectionManager = container.getCollectionManager();

      // Check if collection exists
      const exists = await collectionManager.collectionExists(name);
      if (!exists) {
        console.error(chalk.red(`\n✗ Collection '${name}' not found\n`));
        process.exit(1);
      }

      // Get collection info
      const info = await collectionManager.getCollectionInfo(name);

      // Confirm deletion unless --yes flag is provided
      if (!options.yes) {
        console.log(chalk.yellow(`\nAre you sure you want to delete collection '${name}'?`));
        console.log(chalk.white(`  Embeddings: ${info.embeddingCount}`));
        console.log(chalk.white(`  Size: ${(info.fileSizeBytes / 1024 / 1024).toFixed(2)} MB`));
        console.log(chalk.red('\nThis action cannot be undone!'));

        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const answer = await new Promise<string>((resolve) => {
          rl.question(chalk.cyan('\nType "yes" to confirm: '), (ans) => {
            rl.close();
            resolve(ans);
          });
        });

        if (answer.toLowerCase() !== 'yes') {
          console.log(chalk.yellow('\nDeletion cancelled.\n'));
          return;
        }
      }

      // Delete collection
      await collectionManager.deleteCollection(name);

      console.log(chalk.green(`\n✓ Collection '${name}' deleted successfully\n`));
    } catch (error) {
      const container = new Container();
      await container.initialize();
      const errorHandler = container.getErrorHandler();
      const guidance = errorHandler.getGuidance(error);

      console.error(chalk.red(`\n✗ ${guidance.title}`));
      console.error(chalk.red(guidance.message + '\n'));
      process.exit(1);
    }
  });
