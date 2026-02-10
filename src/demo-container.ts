/**
 * Demo script to verify the Container and ConfigService work correctly
 * Run with: LLM_FARM_API_KEY=test ts-node --esm src/demo-container.ts
 */

import { createContainer } from './di/index.js';

async function main() {
  try {
    console.log('Creating container...');
    const container = createContainer();

    console.log('\n=== Configuration Service ===');
    const config = container.getConfigService();
    console.log('LLM Farm API Key:', config.getLlmFarmApiKey().substring(0, 10) + '...');
    console.log('Chunk Size:', config.getChunkSize());
    console.log('Chunk Overlap:', config.getChunkOverlap());
    console.log('Top K:', config.getTopK());
    console.log('Documents Path:', config.getDocumentsPath());
    console.log('Embeddings Path:', config.getEmbeddingsPath());
    console.log('Chunks Path:', config.getChunksPath());

    console.log('\n=== Services ===');
    console.log('Document Reader:', container.getDocumentReader() ? '✓' : '✗');
    console.log('Text Chunker:', container.getTextChunker() ? '✓' : '✗');
    console.log('Embedding Client:', container.getEmbeddingClient() ? '✓' : '✗');
    console.log('LLM Client:', container.getLlmClient() ? '✓' : '✗');
    console.log('Progress Reporter:', container.getProgressReporter() ? '✓' : '✗');

    console.log('\n=== Text Chunker Configuration ===');
    const chunker = container.getTextChunker();
    const chunkerConfig = chunker.getConfig();
    console.log('Configured Chunk Size:', chunkerConfig.chunkSize);
    console.log('Configured Chunk Overlap:', chunkerConfig.chunkOverlap);

    console.log('\n=== Singleton Pattern Verification ===');
    const config1 = container.getConfigService();
    const config2 = container.getConfigService();
    console.log('Config singleton:', config1 === config2 ? '✓' : '✗');

    const chunker1 = container.getTextChunker();
    const chunker2 = container.getTextChunker();
    console.log('Text Chunker singleton:', chunker1 === chunker2 ? '✓' : '✗');

    console.log('\n✓ All services instantiated successfully!');
  } catch (error) {
    console.error('\n✗ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
