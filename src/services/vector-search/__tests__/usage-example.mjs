/**
 * Usage example for VectorSearch service
 * Run with: node src/services/vector-search/__tests__/usage-example.mjs
 */

import { createVectorSearch } from '../../../../dist/services/vector-search/index.js';

console.log('\n=== VectorSearch Usage Example ===\n');

// Create the vector search instance using the factory
const vectorSearch = createVectorSearch();

// Sample embeddings (normally these would come from an embedding API)
const sampleEmbeddings = [
  {
    text: 'The quick brown fox jumps over the lazy dog',
    vector: [0.2, 0.5, 0.8, 0.1, 0.3],
    source: 'document1.txt',
    metadata: { chunkIndex: 0 }
  },
  {
    text: 'Machine learning is a subset of artificial intelligence',
    vector: [0.9, 0.1, 0.3, 0.7, 0.4],
    source: 'document2.txt',
    metadata: { chunkIndex: 0 }
  },
  {
    text: 'Neural networks are inspired by biological neural networks',
    vector: [0.8, 0.2, 0.4, 0.6, 0.5],
    source: 'document2.txt',
    metadata: { chunkIndex: 1 }
  },
  {
    text: 'The cat sat on the mat',
    vector: [0.3, 0.4, 0.7, 0.2, 0.4],
    source: 'document1.txt',
    metadata: { chunkIndex: 1 }
  },
  {
    text: 'Deep learning uses multiple layers of neural networks',
    vector: [0.85, 0.15, 0.35, 0.65, 0.45],
    source: 'document3.txt',
    metadata: { chunkIndex: 0 }
  }
];

// Query: looking for content about neural networks
const queryVector = [0.82, 0.18, 0.38, 0.62, 0.48];

console.log('Query: Looking for content about neural networks\n');

// Search for top 3 most similar embeddings
const results = vectorSearch.search(queryVector, sampleEmbeddings, 3);

console.log('Top 3 Results:\n');

results.forEach((result) => {
  console.log(`Rank ${result.rank}:`);
  console.log(`  Text: ${result.embedding.text}`);
  console.log(`  Score: ${result.score.toFixed(4)}`);
  console.log(`  Source: ${result.embedding.source}`);
  console.log(`  Metadata:`, result.embedding.metadata);
  console.log();
});

// Example 2: Find all results with minimum similarity threshold
console.log('\n--- Filtering by Similarity Threshold ---\n');
const allResults = vectorSearch.search(queryVector, sampleEmbeddings, sampleEmbeddings.length);
const threshold = 0.98;
const filteredResults = allResults.filter(r => r.score >= threshold);

console.log(`Results with score >= ${threshold}:\n`);
filteredResults.forEach((result) => {
  console.log(`- ${result.embedding.text.substring(0, 50)}... (Score: ${result.score.toFixed(4)})`);
});

if (filteredResults.length === 0) {
  console.log('No results meet the threshold criteria.');
}

console.log('\n=== Example Complete ===\n');
