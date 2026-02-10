import { Command } from 'commander';
import * as readline from 'readline';
import { Container } from '../../di/Container.js';
import { IndexingWorkflow } from '../../workflows/IndexingWorkflow.js';
import type { IDocumentReader } from '../../services/document-reader/IDocumentReader.js';
import type { Document } from '../../services/document-reader/models/Document.js';
import chalk from 'chalk';

/**
 * Interactive document selection helper
 */
async function interactiveDocumentSelection(
  documentReader: IDocumentReader,
  documentsPath: string
): Promise<Document[]> {
  const metadata = await documentReader.listDocuments(documentsPath);

  if (metadata.length === 0) {
    throw new Error('No PDF documents found in documents directory');
  }

  console.log(chalk.blue.bold('\nAvailable documents:\n'));

  metadata.forEach((doc, index) => {
    const sizeMB = (doc.fileSizeBytes / 1024 / 1024).toFixed(2);
    console.log(chalk.white(`  [${index + 1}] ${doc.fileName} (${sizeMB} MB)`));
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer: string = await new Promise((resolve) => {
    rl.question(
      chalk.cyan('\nEnter numbers to select (comma-separated), or "all" for all documents: '),
      (ans) => {
        rl.close();
        resolve(ans);
      }
    );
  });

  let selectedFileNames: string[];

  if (answer.trim().toLowerCase() === 'all') {
    selectedFileNames = metadata.map(m => m.fileName);
  } else {
    const indices = answer.split(',').map(s => parseInt(s.trim()) - 1);
    selectedFileNames = indices
      .filter(i => !isNaN(i) && i >= 0 && i < metadata.length)
      .map(i => metadata[i]!.fileName);
  }

  if (selectedFileNames.length === 0) {
    throw new Error('No documents selected');
  }

  console.log(chalk.gray(`\nSelected ${selectedFileNames.length} document(s)\n`));

  return documentReader.readSelectedDocuments(documentsPath, selectedFileNames);
}

export const generateCommand = new Command('generate')
  .description('Generate embeddings from PDF documents')
  .option('-c, --collection <name>', 'Collection name', 'default')
  .option('-d, --documents <files>', 'Comma-separated list of PDF files to process')
  .option('-i, --interactive', 'Interactive document selection')
  .option('--dry-run', 'Show what would be processed without generating embeddings')
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

      const documentsPath = configService.getDocumentsPath();

      // Determine which documents to process
      let documents: Document[];

      if (options.interactive) {
        // Interactive mode
        documents = await interactiveDocumentSelection(documentReader, documentsPath);
      } else if (options.documents) {
        // Specific files mode
        const fileNames = options.documents.split(',').map((f: string) => f.trim());
        progressReporter.info(`Processing ${fileNames.length} selected document(s)`);
        documents = await documentReader.readSelectedDocuments(documentsPath, fileNames);
      } else {
        // Default: all documents
        progressReporter.info(`Reading documents from: ${documentsPath}`);
        documents = await documentReader.readDocuments(documentsPath);
      }

      // Dry run mode - show what would be processed
      if (options.dryRun) {
        console.log(chalk.yellow('\n[DRY RUN] Documents that would be processed:\n'));
        for (const doc of documents) {
          const sizeMB = (doc.metadata.fileSize / 1024 / 1024).toFixed(2);
          console.log(chalk.white(`  - ${doc.metadata.fileName} (${sizeMB} MB, ${doc.metadata.pageCount} pages)`));
        }
        console.log(chalk.gray(`\nTotal: ${documents.length} document${documents.length !== 1 ? 's' : ''}`));
        console.log(chalk.gray('No embeddings were generated.\n'));
        return;
      }

      // Create and execute indexing workflow with selected documents
      const workflow = new IndexingWorkflow(
        configService,
        documentReader,
        textChunker,
        embeddingClient,
        embeddingStore,
        progressReporter
      );

      const totalEmbeddings = await workflow.execute(documents);

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
