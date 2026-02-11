import chalk from 'chalk';
import type { ICommandHandler } from '../ICommandHandler.js';
import type { CommandResult } from '../models/CommandResult.js';
import type { CommandHelp } from '../models/CommandHelp.js';
import type { ChatContext } from '../models/ChatContext.js';
import { IndexingWorkflow } from '../../../workflows/IndexingWorkflow.js';
import type { ImportSettingsData } from '../../import-settings/models/ImportSettingsData.js';

/**
 * Command to start embedding generation from within chat
 */
export class ImportCommand implements ICommandHandler {
  async execute(args: string, context: ChatContext): Promise<CommandResult> {
    try {
      const importSettings = context.container.getImportSettings();
      const collectionManager = context.collectionManager;
      const configService = context.configService;
      const documentReader = context.container.getDocumentReader();

      // Step 1: Prompt for collection
      const collectionName = await this.promptForCollection(context, args.trim());
      if (!collectionName) {
        return { shouldExit: false, message: chalk.gray('\nImport cancelled\n') };
      }

      // Step 2: Determine which settings to use
      const collectionExists = await collectionManager.collectionExists(collectionName);
      let settingsToUse: ImportSettingsData;
      let settingsSource: 'global' | 'collection';

      if (collectionExists) {
        // Load collection-specific settings (locked)
        const collectionInfo = await collectionManager.getCollectionInfo(collectionName);
        if (collectionInfo.settings) {
          settingsToUse = collectionInfo.settings;
          settingsSource = 'collection';
        } else {
          // Legacy collection without settings, use global
          settingsToUse = importSettings.getAllSettings();
          settingsSource = 'global';
        }
      } else {
        // New collection, use global settings
        settingsToUse = importSettings.getAllSettings();
        settingsSource = 'global';
      }

      // Step 3: Prompt for documents
      const documentsPath = configService.getDocumentsPath();
      const availableDocs = await documentReader.listDocuments(documentsPath);

      if (availableDocs.length === 0) {
        return {
          shouldExit: false,
          message: chalk.red(`\n✗ No supported documents found in ${documentsPath}\n`) +
            chalk.gray('Add PDF, TXT, or MD files to the documents/ folder and try again\n'),
        };
      }

      const selectedFileNames = await this.promptForDocuments(availableDocs);
      if (!selectedFileNames || selectedFileNames.length === 0) {
        return { shouldExit: false, message: chalk.gray('\nImport cancelled\n') };
      }

      // Step 4: Display settings being used
      this.displaySettingsInfo(collectionName, settingsToUse, settingsSource, selectedFileNames.length, collectionExists);

      // Step 5: Confirm
      const confirmed = await this.confirm(chalk.yellow('\nProceed with import? (y/n): '));
      if (!confirmed) {
        return { shouldExit: false, message: chalk.gray('\nImport cancelled\n') };
      }

      // Step 6: Read selected documents
      console.log(chalk.blue('\n▶ Reading documents...\n'));
      const documents = await documentReader.readSelectedDocuments(documentsPath, selectedFileNames);

      // Step 7: Create a temporary container for the target collection if different
      let targetContainer = context.container;
      if (collectionName !== context.collectionName) {
        const { Container } = await import('../../../di/Container.js');
        targetContainer = new (Container as any)(collectionName);
        await targetContainer.initialize();
      }

      // Step 8: Execute IndexingWorkflow
      const workflow = new IndexingWorkflow(
        targetContainer.getConfigService(),
        targetContainer.getDocumentReader(),
        targetContainer.getTextChunker(),
        targetContainer.getEmbeddingClient(),
        targetContainer.getEmbeddingStore(),
        targetContainer.getProgressReporter()
      );

      const count = await workflow.execute(documents);

      // Step 9: Save settings metadata if new collection
      if (!collectionExists) {
        const embeddingStore = targetContainer.getEmbeddingStore();
        const { embeddings } = await embeddingStore.load();
        await embeddingStore.save(embeddings, settingsToUse);
      }

      return {
        shouldExit: false,
        message: chalk.green(`\n✓ Successfully indexed ${count} chunks to '${collectionName}'\n`),
      };
    } catch (error) {
      return {
        shouldExit: false,
        message: chalk.red(`\n✗ Import failed: ${error instanceof Error ? error.message : String(error)}\n`),
      };
    }
  }

  private async promptForCollection(context: ChatContext, argsCollection: string): Promise<string | null> {
    // If collection specified in args, use it
    if (argsCollection) {
      return argsCollection;
    }

    // List available options
    const collections = await context.collectionManager.listCollections();
    console.log(chalk.gray('\n(Press ESC or Ctrl+C to cancel at any time)'));
    console.log(chalk.blue('\nSelect target collection:'));
    console.log(`  ${chalk.cyan('1)')} Use current collection (${chalk.bold(context.collectionName)})`);
    console.log(`  ${chalk.cyan('2)')} Create new collection`);

    if (collections.length > 0) {
      console.log(`  ${chalk.cyan('3)')} Select existing collection`);
    }

    const choice = await this.question(chalk.yellow('\nChoice (1-3): '));

    // ESC or Ctrl+C pressed
    if (choice === null) {
      return null;
    }

    if (choice === '1') {
      return context.collectionName;
    } else if (choice === '2') {
      const name = await this.question(chalk.yellow('New collection name: '));
      if (name === null) return null; // ESC pressed
      return name.trim() || null;
    } else if (choice === '3' && collections.length > 0) {
      console.log(chalk.blue('\nAvailable collections:'));
      collections.forEach((c, i) => {
        console.log(`  ${chalk.cyan(`${i + 1})`)} ${c.name} (${c.embeddingCount} chunks)`);
      });
      const idx = await this.question(chalk.yellow(`\nSelect (1-${collections.length}): `));
      if (idx === null) return null; // ESC pressed
      const index = parseInt(idx, 10) - 1;
      if (index >= 0 && index < collections.length) {
        return collections[index]?.name || null;
      }
    }

    return null;
  }

  private async promptForDocuments(
    availableDocs: Array<{ fileName: string; fileSizeBytes: number }>
  ): Promise<string[] | null> {
    console.log(chalk.blue('\nAvailable documents:'));
    availableDocs.forEach((doc, i) => {
      const sizeMB = (doc.fileSizeBytes / 1024 / 1024).toFixed(2);
      console.log(`  ${chalk.cyan(`${i + 1})`)} ${doc.fileName} (${sizeMB} MB)`);
    });
    console.log(`  ${chalk.cyan(`${availableDocs.length + 1})`)} All documents`);

    const selection = await this.question(
      chalk.yellow(`\nSelect documents (comma-separated numbers or ${availableDocs.length + 1} for all): `)
    );

    // ESC or Ctrl+C pressed
    if (selection === null) {
      return null;
    }

    const trimmed = selection.trim();
    if (!trimmed) {
      return null;
    }

    // Check for "all" option
    if (trimmed === String(availableDocs.length + 1)) {
      return availableDocs.map(d => d.fileName);
    }

    // Parse comma-separated indices
    const indices = trimmed.split(',').map(s => parseInt(s.trim(), 10));
    const fileNames: string[] = [];

    for (const idx of indices) {
      if (idx >= 1 && idx <= availableDocs.length) {
        const doc = availableDocs[idx - 1];
        if (doc) {
          fileNames.push(doc.fileName);
        }
      }
    }

    return fileNames.length > 0 ? fileNames : null;
  }

  private displaySettingsInfo(
    collection: string,
    settings: ImportSettingsData,
    source: 'global' | 'collection',
    docCount: number,
    exists: boolean
  ): void {
    console.log();
    console.log(chalk.blue(`Importing ${docCount} document(s) to: ${chalk.bold(collection)}`));
    console.log();

    if (source === 'collection') {
      console.log(chalk.yellow('Using COLLECTION settings (locked):'));
      console.log(chalk.gray('  (Settings from when collection was created)'));
    } else {
      console.log(chalk.green('Using GLOBAL settings:'));
      if (exists) {
        console.log(chalk.gray('  (Legacy collection - settings will be saved)'));
      } else {
        console.log(chalk.gray('  (Change with: /import-settings set <key> <value>)'));
      }
    }

    console.log();
    console.log(`  Chunk Size:          ${settings.chunkSize} characters`);
    console.log(`  Chunk Overlap:       ${settings.chunkOverlap} characters`);
    console.log(`  Checkpoint Interval: ${settings.checkpointInterval} chunks`);
    console.log(`  Embedding Model:     ${settings.embeddingModel}`);
  }

  private async confirm(
    message: string
  ): Promise<boolean> {
    const answer = await this.question(message);
    if (answer === null) return false; // ESC pressed
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  }

  private async question(
    message: string
  ): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const stdin = process.stdin;
      const wasRaw = stdin.isRaw;

      try {
        // Save existing stdin listeners (from readline)
        const existingListeners = stdin.listeners('data');

        // Remove all data listeners temporarily to prevent echo interference
        stdin.removeAllListeners('data');

        // Enable raw mode to capture ESC key
        if (stdin.setRawMode) {
          stdin.setRawMode(true);
        }

        let buffer = '';

        const cleanup = () => {
          stdin.removeListener('data', onData);
          if (stdin.setRawMode) {
            stdin.setRawMode(wasRaw || false);
          }
          // Restore readline listeners
          for (const listener of existingListeners) {
            stdin.on('data', listener as any);
          }
        };

        const onData = (chunk: Buffer) => {
          const data = chunk.toString();

          // Check for ESC key (ASCII 27)
          if (data.charCodeAt(0) === 27) {
            cleanup();
            process.stdout.write('\n');
            resolve(null);
            return;
          }

          // Handle Enter key
          if (data === '\r' || data === '\n') {
            cleanup();
            process.stdout.write('\n');
            resolve(buffer.trim());
            return;
          }

          // Handle Backspace (ASCII 127 or 8)
          if (data.charCodeAt(0) === 127 || data.charCodeAt(0) === 8) {
            if (buffer.length > 0) {
              buffer = buffer.slice(0, -1);
              // Clear line and rewrite
              process.stdout.write('\r' + message + buffer + ' \b');
            }
            return;
          }

          // Handle Ctrl+C
          if (data.charCodeAt(0) === 3) {
            cleanup();
            process.stdout.write('\n');
            resolve(null);
            return;
          }

          // Ignore other control characters
          if (data.charCodeAt(0) < 32 && data !== '\t') {
            return;
          }

          // Add character to buffer
          buffer += data;

          // Echo the character
          process.stdout.write(data);
        };

        stdin.on('data', onData);

        // Display the question once before listening
        process.stdout.write(message);
      } catch (error) {
        // Cleanup on error
        if (stdin.setRawMode) {
          stdin.setRawMode(false);
        }
        reject(error);
      }
    });
  }

  getHelp(): CommandHelp {
    return {
      name: 'import',
      description: 'Import documents and generate embeddings',
    };
  }
}
