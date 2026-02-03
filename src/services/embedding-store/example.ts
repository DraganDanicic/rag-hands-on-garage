/**
 * Example usage of the Embedding Store Service
 * Run with: npm run build && node dist/services/embedding-store/example.js
 */

import path from 'path';
import { createEmbeddingStore, StoredEmbedding } from './index.js';

async function main() {
  console.log('=== Embedding Store Service Example ===\n');

  // Create store instance
  const filePath = path.join(process.cwd(), 'data', 'example-embeddings.json');
  const store = createEmbeddingStore(filePath);
  console.log(`Created store at: ${filePath}\n`);

  // Example 1: Save embeddings
  console.log('1. Saving embeddings...');
  const embeddings: StoredEmbedding[] = [
    {
      text: 'Artificial Intelligence is transforming technology',
      vector: [0.12, 0.34, 0.56, 0.78],
      source: 'ai-article.txt',
      metadata: {
        chunkIndex: 0,
        documentType: 'article',
        createdAt: new Date().toISOString(),
      },
    },
    {
      text: 'Machine learning models require large datasets',
      vector: [0.23, 0.45, 0.67, 0.89],
      source: 'ai-article.txt',
      metadata: {
        chunkIndex: 1,
        documentType: 'article',
        createdAt: new Date().toISOString(),
      },
    },
    {
      text: 'Deep neural networks power modern AI systems',
      vector: [0.34, 0.56, 0.78, 0.90],
      source: 'ai-article.txt',
      metadata: {
        chunkIndex: 2,
        documentType: 'article',
        createdAt: new Date().toISOString(),
      },
    },
  ];

  await store.save(embeddings);
  console.log(`Saved ${embeddings.length} embeddings\n`);

  // Example 2: Load embeddings
  console.log('2. Loading embeddings...');
  const loaded = await store.load();
  console.log(`Loaded ${loaded.length} embeddings:`);
  loaded.forEach((emb, idx) => {
    console.log(`  [${idx}] "${emb.text.substring(0, 40)}..."`);
    console.log(`      Vector: [${emb.vector.join(', ')}]`);
    console.log(`      Source: ${emb.source}`);
    console.log(`      Metadata: ${JSON.stringify(emb.metadata)}`);
  });
  console.log();

  // Example 3: Add more embeddings (overwrites)
  console.log('3. Saving new batch (overwrites previous)...');
  const newBatch: StoredEmbedding[] = [
    {
      text: 'Vector databases enable efficient similarity search',
      vector: [0.11, 0.22, 0.33, 0.44],
      source: 'db-guide.txt',
      metadata: { section: 'introduction' },
    },
    {
      text: 'RAG systems combine retrieval with generation',
      vector: [0.55, 0.66, 0.77, 0.88],
      source: 'rag-overview.txt',
      metadata: { section: 'concepts' },
    },
  ];

  await store.save(newBatch);
  const afterSave = await store.load();
  console.log(`Now have ${afterSave.length} embeddings (previous batch was overwritten)\n`);

  // Example 4: Clear embeddings
  console.log('4. Clearing all embeddings...');
  await store.clear();
  const afterClear = await store.load();
  console.log(`After clear: ${afterClear.length} embeddings\n`);

  // Example 5: Load from empty store
  console.log('5. Loading from empty store (returns empty array)...');
  const empty = await store.load();
  console.log(`Loaded ${empty.length} embeddings (as expected)\n`);

  console.log('=== Example Complete ===');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
