import { Command } from 'commander';
import { Container } from '../../di/Container.js';
import chalk from 'chalk';
import { promises as fs } from 'fs';

export const statusCommand = new Command('status')
  .description('Show system status and health')
  .action(async () => {
    console.log(chalk.blue.bold('\nRAG System Status'));
    console.log(chalk.gray('='.repeat(50)));

    try {
      const container = new Container();
      await container.initialize();
      const config = container.getConfigService();
      const collectionManager = container.getCollectionManager();
      const embeddingClient = container.getEmbeddingClient();
      const llmClient = container.getLlmClient();

      // Test API connectivity
      console.log(chalk.cyan('\nAPI Connectivity:'));

      let embeddingApiOk = false;
      let llmApiOk = false;

      try {
        const startEmb = Date.now();
        await embeddingClient.generateEmbedding('test');
        const embTime = Date.now() - startEmb;
        console.log(chalk.green('  ✓ Embedding API:      ') + chalk.gray(`Connected (${embTime}ms)`));
        embeddingApiOk = true;
      } catch (error) {
        console.log(chalk.red('  ✗ Embedding API:      ') + chalk.gray('Failed'));
        console.log(chalk.gray(`    ${error instanceof Error ? error.message : String(error)}`));
      }

      try {
        const startLlm = Date.now();
        await llmClient.generateResponse({ prompt: 'test' });
        const llmTime = Date.now() - startLlm;
        console.log(chalk.green('  ✓ LLM API:            ') + chalk.gray(`Connected (${llmTime}ms)`));
        llmApiOk = true;
      } catch (error) {
        console.log(chalk.red('  ✗ LLM API:            ') + chalk.gray('Failed'));
        console.log(chalk.gray(`    ${error instanceof Error ? error.message : String(error)}`));
      }

      // Collections status
      console.log(chalk.cyan('\nCollections:'));
      const collections = await collectionManager.listCollections();

      if (collections.length === 0) {
        console.log(chalk.yellow('  No collections found'));
      } else {
        let totalEmbeddings = 0;
        let totalSize = 0;

        for (const col of collections) {
          totalEmbeddings += col.embeddingCount;
          totalSize += col.fileSizeBytes;
        }

        const totalSizeInMB = (totalSize / 1024 / 1024).toFixed(2);

        console.log(chalk.white(`  Total Collections:    ${collections.length}`));
        console.log(chalk.white(`  Total Embeddings:     ${totalEmbeddings} chunks`));
        console.log(chalk.white(`  Total Size:           ${totalSizeInMB} MB`));
      }

      // Documents status
      console.log(chalk.cyan('\nDocuments:'));
      const documentsPath = config.getDocumentsPath();

      try {
        const files = await fs.readdir(documentsPath);
        const supportedExtensions = ['.pdf', '.txt', '.md'];
        const supportedFiles = files.filter(f => {
          const ext = f.toLowerCase().substring(f.lastIndexOf('.'));
          return supportedExtensions.includes(ext);
        });

        console.log(chalk.white(`  Directory:            ${documentsPath}`));
        console.log(chalk.white(`  Supported Files:      ${supportedFiles.length} files (PDF/TXT/MD)`));

        if (supportedFiles.length === 0) {
          console.log(chalk.yellow('  No supported documents found'));
        }
      } catch (error) {
        console.log(chalk.yellow(`  Directory:            ${documentsPath} (not found)`));
      }

      // Overall health
      console.log(chalk.cyan('\nSystem Health:'));
      if (embeddingApiOk && llmApiOk && collections.length > 0) {
        console.log(chalk.green('  ✓ All systems operational\n'));
      } else {
        const issues = [];
        if (!embeddingApiOk) issues.push('Embedding API');
        if (!llmApiOk) issues.push('LLM API');
        if (collections.length === 0) issues.push('No collections');

        console.log(chalk.yellow(`  ⚠ Issues detected: ${issues.join(', ')}\n`));
      }

      // Quick actions
      console.log(chalk.cyan('Quick Actions:'));
      console.log(chalk.white('  Generate embeddings:  ') + chalk.gray('rag-garage generate'));
      console.log(chalk.white('  Start chat:           ') + chalk.gray('rag-garage chat'));
      console.log(chalk.white('  List collections:     ') + chalk.gray('rag-garage collections list'));
      console.log(chalk.white('  Validate config:      ') + chalk.gray('rag-garage config validate'));
      console.log();
    } catch (error) {
      const container = new Container();
      await container.initialize();
      const errorHandler = container.getErrorHandler();
      const guidance = errorHandler.getGuidance(error);

      console.error(chalk.red(`\n✗ ${guidance.title}`));
      console.error(chalk.red(guidance.message));

      if (guidance.tips.length > 0) {
        console.log(chalk.yellow('\nTroubleshooting:'));
        for (const tip of guidance.tips.slice(0, 3)) {
          console.log(chalk.white(`  ${tip}`));
        }
      }
      console.log();
      process.exit(1);
    }
  });
