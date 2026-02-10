import { Command } from 'commander';
import { Container } from '../../di/Container.js';
import chalk from 'chalk';

export const documentsCommand = new Command('documents')
  .description('Manage PDF documents');

documentsCommand
  .command('list')
  .description('List available PDF documents')
  .action(async () => {
    try {
      const container = new Container();
      await container.initialize();

      const config = container.getConfigService();
      const documentReader = container.getDocumentReader();

      const documentsPath = config.getDocumentsPath();
      const docs = await documentReader.listDocuments(documentsPath);

      if (docs.length === 0) {
        console.log(chalk.yellow('\nNo PDF documents found.\n'));
        console.log(chalk.gray(`Add PDFs to: ${documentsPath}\n`));
        return;
      }

      console.log(chalk.blue.bold('\nAvailable Documents:\n'));

      for (const doc of docs) {
        const sizeMB = (doc.fileSizeBytes / 1024 / 1024).toFixed(2);
        const date = doc.lastModified.toLocaleDateString();

        console.log(
          chalk.white(`  ${doc.fileName.padEnd(40)}`) +
          chalk.gray(`${sizeMB.padStart(8)} MB`) +
          chalk.gray(`    ${date}`)
        );
      }

      console.log(chalk.gray(`\nTotal: ${docs.length} document${docs.length !== 1 ? 's' : ''}\n`));
    } catch (error) {
      // Use ErrorHandler for context-specific guidance
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

      console.log(); // Empty line
      process.exit(1);
    }
  });
