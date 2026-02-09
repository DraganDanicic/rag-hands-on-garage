#!/usr/bin/env node

import { Container } from '../di/Container.js';
import chalk from 'chalk';

/**
 * CLI command to test connectivity with external LLM Farm services
 *
 * This command:
 * 1. Tests the embedding service (text-embedding-3-small)
 * 2. Tests the LLM service (gemini-2.0-flash-lite)
 * 3. Reports connection status for each service
 * 4. Exits with code 0 if both succeed, 1 if any fail
 *
 * Usage: npm run check-connections
 */
async function main(): Promise<void> {
  console.log(chalk.blue.bold('\nLLM Farm Service Connection Test\n'));
  console.log(chalk.gray('='.repeat(50)));

  let hasErrors = false;

  try {
    // Initialize dependency injection container
    const container = new Container();

    // Get required services
    const embeddingClient = container.getEmbeddingClient();
    const llmClient = container.getLlmClient();
    const progressReporter = container.getProgressReporter();

    console.log();

    // Test 1: Embedding Service
    try {
      progressReporter.start('Testing embedding service...');

      const startTime = Date.now();
      const embedding = await embeddingClient.generateEmbedding('test');
      const latency = Date.now() - startTime;

      // Verify response is valid
      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Invalid embedding response: expected non-empty array');
      }

      progressReporter.success(`Embedding service: Connected ✓ (${latency}ms, ${embedding.length} dimensions)`);
    } catch (error) {
      hasErrors = true;

      if (error instanceof Error) {
        progressReporter.error(`Embedding service: Failed ✗`);
        console.error(chalk.red(`  ${error.message}`));
      } else {
        progressReporter.error(`Embedding service: Failed ✗`);
        console.error(chalk.red(`  ${String(error)}`));
      }
    }

    console.log();

    // Test 2: LLM Service
    try {
      progressReporter.start('Testing LLM service...');

      const startTime = Date.now();
      const response = await llmClient.generateResponse({
        prompt: 'Say "Hello" and nothing else.',
        maxTokens: 50
      });
      const latency = Date.now() - startTime;

      // Verify response is valid
      if (!response.text || response.text.trim().length === 0) {
        throw new Error('Invalid LLM response: expected non-empty text');
      }

      progressReporter.success(`LLM service: Connected ✓ (${latency}ms)`);
      progressReporter.info(`Response preview: "${response.text.substring(0, 50)}${response.text.length > 50 ? '...' : ''}"`);
    } catch (error) {
      hasErrors = true;

      if (error instanceof Error) {
        progressReporter.error(`LLM service: Failed ✗`);
        console.error(chalk.red(`  ${error.message}`));
      } else {
        progressReporter.error(`LLM service: Failed ✗`);
        console.error(chalk.red(`  ${String(error)}`));
      }
    }

    // Display summary
    console.log();
    console.log(chalk.gray('='.repeat(50)));

    if (hasErrors) {
      console.log(chalk.red.bold('\nConnection Test: FAILED'));
      console.log(chalk.yellow('\nTroubleshooting tips:'));
      console.log(chalk.white('  1. Check that your .env file has LLM_FARM_API_KEY'));
      console.log(chalk.white('  2. Verify your API key is valid and active'));
      console.log(chalk.white('  3. Check your internet connection'));
      console.log(chalk.white('  4. Ensure you have access to https://aoai-farm.bosch-temp.com\n'));

      process.exit(1);
    } else {
      console.log(chalk.green.bold('\nConnection Test: PASSED'));
      console.log(chalk.white('\nAll services are operational. You can now:'));
      console.log(chalk.white('  - Run: npm run generate-embeddings'));
      console.log(chalk.white('  - Run: npm run chat\n'));
    }
  } catch (error) {
    console.error(chalk.red.bold('\nError initializing connection test:'));

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
