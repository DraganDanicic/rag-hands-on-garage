import { Command } from 'commander';
import { Container } from '../../di/Container.js';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

export const configCommand = new Command('config')
  .description('Configuration management');

// Show current configuration
configCommand
  .command('show')
  .description('Show current configuration')
  .action(async () => {
    try {
      const container = new Container();
      await container.initialize();
      const config = container.getConfigService();

      console.log(chalk.blue.bold('\nConfiguration:\n'));

      // API Settings
      console.log(chalk.cyan('API Settings:'));
      const apiKey = config.getLlmFarmApiKey();
      const maskedKey = apiKey.substring(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4);
      console.log(chalk.white(`  LLM Farm API Key:     ${maskedKey} `) + chalk.green('✓'));
      console.log(chalk.white(`  LLM Model:            ${config.getLlmModel()}`));
      console.log(chalk.white(`  Embedding Model:      ${config.getEmbeddingModel()}`));

      // LLM Parameters
      console.log(chalk.cyan('\nLLM Parameters:'));
      console.log(chalk.white(`  Temperature:          ${config.getLlmTemperature()}`));
      console.log(chalk.white(`  Max Tokens:           ${config.getLlmMaxTokens()}`));

      // Chunking
      console.log(chalk.cyan('\nChunking:'));
      console.log(chalk.white(`  Chunk Size:           ${config.getChunkSize()} characters`));
      console.log(chalk.white(`  Chunk Overlap:        ${config.getChunkOverlap()} characters`));

      // Search
      console.log(chalk.cyan('\nSearch:'));
      console.log(chalk.white(`  Top K Results:        ${config.getTopK()}`));

      // Prompt Template
      console.log(chalk.cyan('\nPrompt Template:'));
      const templatePath = config.getPromptTemplatePath();
      const templateName = config.getPromptTemplate();
      if (templatePath) {
        console.log(chalk.white(`  Using:                Custom file`));
        console.log(chalk.white(`  Path:                 ${templatePath}`));
      } else if (templateName) {
        console.log(chalk.white(`  Using:                ${templateName} (built-in)`));
      } else {
        console.log(chalk.white(`  Using:                default (built-in)`));
      }

      // Performance
      console.log(chalk.cyan('\nPerformance & Reliability:'));
      console.log(chalk.white(`  Checkpoint Interval:  ${config.getCheckpointInterval()} chunks`));
      console.log(chalk.white(`  Max Retries:          ${config.getMaxRetries()}`));
      console.log(chalk.white(`  Retry Delay:          ${config.getRetryDelayMs()} ms`));
      console.log(chalk.white(`  Embedding Timeout:    ${config.getEmbeddingApiTimeoutMs()} ms`));
      console.log(chalk.white(`  LLM Timeout:          ${config.getLlmApiTimeoutMs()} ms`));

      // Proxy
      console.log(chalk.cyan('\nProxy:'));
      console.log(chalk.white(`  Enabled:              ${config.isProxyEnabled() ? chalk.green('yes') : chalk.gray('no')}`));
      if (config.isProxyEnabled()) {
        console.log(chalk.white(`  Host:                 ${config.getProxyHost()}`));
        console.log(chalk.white(`  Port:                 ${config.getProxyPort()}`));
      }

      // Paths
      console.log(chalk.cyan('\nPaths:'));
      console.log(chalk.white(`  Documents:            ${config.getDocumentsPath()}`));
      console.log(chalk.white(`  Prompts:              ${config.getPromptsPath()}`));

      console.log(chalk.gray('\nConfiguration file: .env'));
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

// Validate configuration
configCommand
  .command('validate')
  .description('Validate configuration and environment')
  .action(async () => {
    console.log(chalk.blue.bold('\nValidating configuration...\n'));

    let hasErrors = false;
    let hasWarnings = false;

    try {
      // Get project root
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const projectRoot = path.resolve(__dirname, '../../..');
      const envPath = path.join(projectRoot, '.env');

      // Check .env file exists
      try {
        await fs.access(envPath);
        console.log(chalk.green('✓') + chalk.white(' .env file exists'));
      } catch {
        console.log(chalk.red('✗') + chalk.white(' .env file not found'));
        console.log(chalk.yellow('  Create it from .env.example: cp .env.example .env'));
        hasErrors = true;
      }

      // Try to initialize container
      const container = new Container();
      await container.initialize();
      const config = container.getConfigService();

      // Check API key
      const apiKey = config.getLlmFarmApiKey();
      if (apiKey && apiKey.length > 0) {
        console.log(chalk.green('✓') + chalk.white(' LLM_FARM_API_KEY is set'));
      } else {
        console.log(chalk.red('✗') + chalk.white(' LLM_FARM_API_KEY is missing'));
        hasErrors = true;
      }

      // Check numeric values are valid
      const numericChecks = [
        { name: 'LLM_TEMPERATURE', value: config.getLlmTemperature(), min: 0, max: 2 },
        { name: 'LLM_MAX_TOKENS', value: config.getLlmMaxTokens(), min: 1, max: 10000 },
        { name: 'CHUNK_SIZE', value: config.getChunkSize(), min: 100, max: 5000 },
        { name: 'CHUNK_OVERLAP', value: config.getChunkOverlap(), min: 0, max: 1000 },
        { name: 'TOP_K', value: config.getTopK(), min: 1, max: 20 },
      ];

      for (const check of numericChecks) {
        if (check.value >= check.min && check.value <= check.max) {
          console.log(chalk.green('✓') + chalk.white(` ${check.name} is valid (${check.value})`));
        } else {
          console.log(chalk.red('✗') + chalk.white(` ${check.name} out of range: ${check.value}`));
          hasErrors = true;
        }
      }

      // Check directories exist and are writable
      const directories = [
        config.getDocumentsPath(),
        path.dirname(config.getPromptsPath()),
      ];

      for (const dir of directories) {
        try {
          await fs.access(dir);
          console.log(chalk.green('✓') + chalk.white(` Directory exists: ${dir}`));
        } catch {
          console.log(chalk.yellow('⚠') + chalk.white(` Directory missing: ${dir}`));
          console.log(chalk.gray(`  Will be created when needed`));
          hasWarnings = true;
        }
      }

      // Check chunk overlap ratio
      const overlapRatio = (config.getChunkOverlap() / config.getChunkSize()) * 100;
      if (overlapRatio >= 10 && overlapRatio <= 20) {
        console.log(chalk.green('✓') + chalk.white(` Chunk overlap ratio is optimal (${overlapRatio.toFixed(1)}%)`));
      } else {
        console.log(chalk.yellow('⚠') + chalk.white(` Chunk overlap ratio: ${overlapRatio.toFixed(1)}%`));
        console.log(chalk.gray('  Recommended: 10-20% for better context'));
        hasWarnings = true;
      }

      // Validate prompt template
      const templatePath = config.getPromptTemplatePath();
      const templateName = config.getPromptTemplate();
      if (templatePath) {
        try {
          await fs.access(templatePath);
          console.log(chalk.green('✓') + chalk.white(` Custom prompt template exists`));
        } catch {
          console.log(chalk.red('✗') + chalk.white(` Custom prompt template not found: ${templatePath}`));
          hasErrors = true;
        }
      } else if (templateName) {
        const builtInPath = path.join(config.getPromptsPath(), `${templateName}.prompt.txt`);
        try {
          await fs.access(builtInPath);
          console.log(chalk.green('✓') + chalk.white(` Built-in template '${templateName}' is valid`));
        } catch {
          console.log(chalk.yellow('⚠') + chalk.white(` Built-in template '${templateName}' not found, using default`));
          hasWarnings = true;
        }
      } else {
        console.log(chalk.green('✓') + chalk.white(' Using default prompt template'));
      }

      // Summary
      console.log();
      if (hasErrors) {
        console.log(chalk.red('✗ Configuration has errors. Please fix them before proceeding.\n'));
        process.exit(1);
      } else if (hasWarnings) {
        console.log(chalk.yellow(`⚠ Configuration is valid but has ${hasWarnings ? 'warnings' : 'a warning'}.\n`));
      } else {
        console.log(chalk.green('✓ Configuration is valid!\n'));
      }
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
