/**
 * Manual test for VectorSearch service (ES Module)
 * Run with: node src/services/vector-search/__tests__/manual-test.mjs
 */

import { VectorSearch } from '../../../../dist/services/vector-search/VectorSearch.js';

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`✗ ${message}`);
    testsFailed++;
  }
}

function assertEquals(actual, expected, message) {
  if (actual === expected) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`✗ ${message}`);
    console.error(`  Expected: ${expected}, Got: ${actual}`);
    testsFailed++;
  }
}

function assertClose(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) < tolerance) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`✗ ${message}`);
    console.error(`  Expected: ${expected}, Got: ${actual}`);
    testsFailed++;
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    console.error(`✗ ${message} (expected to throw)`);
    testsFailed++;
  } catch (error) {
    console.log(`✓ ${message}`);
    testsPassed++;
  }
}

// Test suite
console.log('\n=== VectorSearch Tests ===\n');

const vectorSearch = new VectorSearch();

// Test 1: Identical vectors should have similarity of 1.0
console.log('Test 1: Identical vectors');
const vector1 = [1, 2, 3, 4, 5];
const embeddings1 = [
  {
    text: 'identical',
    vector: [1, 2, 3, 4, 5],
    source: 'test',
  },
];
const results1 = vectorSearch.search(vector1, embeddings1, 1);
assertEquals(results1.length, 1, 'Should return 1 result');
assertClose(results1[0].score, 1.0, 0.0001, 'Identical vectors should have score ~1.0');
assertEquals(results1[0].rank, 1, 'First result should have rank 1');

// Test 2: Orthogonal vectors should have similarity of ~0
console.log('\nTest 2: Orthogonal vectors');
const vector2 = [1, 0, 0];
const embeddings2 = [
  {
    text: 'orthogonal',
    vector: [0, 1, 0],
    source: 'test',
  },
];
const results2 = vectorSearch.search(vector2, embeddings2, 1);
assertClose(results2[0].score, 0, 0.0001, 'Orthogonal vectors should have score ~0');

// Test 3: Opposite vectors should have similarity of -1.0
console.log('\nTest 3: Opposite vectors');
const vector3 = [1, 2, 3];
const embeddings3 = [
  {
    text: 'opposite',
    vector: [-1, -2, -3],
    source: 'test',
  },
];
const results3 = vectorSearch.search(vector3, embeddings3, 1);
assertClose(results3[0].score, -1.0, 0.0001, 'Opposite vectors should have score ~-1.0');

// Test 4: Results should be sorted by score (descending)
console.log('\nTest 4: Results sorted by score');
const vector4 = [1, 0, 0];
const embeddings4 = [
  { text: 'low similarity', vector: [0, 1, 0], source: 'test' },
  { text: 'high similarity', vector: [1, 0, 0], source: 'test' },
  { text: 'medium similarity', vector: [0.7, 0.7, 0], source: 'test' },
];
const results4 = vectorSearch.search(vector4, embeddings4, 3);
assertEquals(results4.length, 3, 'Should return 3 results');
assert(
  results4[0].score >= results4[1].score &&
    results4[1].score >= results4[2].score,
  'Results should be sorted by score (descending)'
);
assertEquals(results4[0].embedding.text, 'high similarity', 'Best match should be first');

// Test 5: TopK limiting
console.log('\nTest 5: TopK limiting');
const vector5 = [1, 2, 3];
const embeddings5 = [
  { text: 'result1', vector: [1, 2, 3], source: 'test' },
  { text: 'result2', vector: [2, 3, 4], source: 'test' },
  { text: 'result3', vector: [3, 4, 5], source: 'test' },
  { text: 'result4', vector: [4, 5, 6], source: 'test' },
  { text: 'result5', vector: [5, 6, 7], source: 'test' },
];
const results5 = vectorSearch.search(vector5, embeddings5, 3);
assertEquals(results5.length, 3, 'Should return only topK results');

// Test 6: Rank assignment
console.log('\nTest 6: Rank assignment');
assertEquals(results5[0].rank, 1, 'First result should have rank 1');
assertEquals(results5[1].rank, 2, 'Second result should have rank 2');
assertEquals(results5[2].rank, 3, 'Third result should have rank 3');

// Test 7: Empty embeddings array
console.log('\nTest 7: Empty embeddings array');
const results7 = vectorSearch.search([1, 2, 3], [], 5);
assertEquals(results7.length, 0, 'Empty embeddings should return empty results');

// Test 8: TopK larger than embeddings array
console.log('\nTest 8: TopK larger than embeddings array');
const embeddings8 = [
  { text: 'only one', vector: [1, 2, 3], source: 'test' },
];
const results8 = vectorSearch.search([1, 2, 3], embeddings8, 10);
assertEquals(results8.length, 1, 'Should return all available results when topK > array length');

// Test 9: Invalid query vector (empty)
console.log('\nTest 9: Invalid query vector (empty)');
assertThrows(
  () => vectorSearch.search([], embeddings1, 1),
  'Empty query vector should throw error'
);

// Test 10: Invalid query vector (null)
console.log('\nTest 10: Invalid query vector (null)');
assertThrows(
  () => vectorSearch.search(null, embeddings1, 1),
  'Null query vector should throw error'
);

// Test 11: Invalid embeddings (null)
console.log('\nTest 11: Invalid embeddings (null)');
assertThrows(
  () => vectorSearch.search([1, 2, 3], null, 1),
  'Null embeddings should throw error'
);

// Test 12: Invalid topK (zero)
console.log('\nTest 12: Invalid topK (zero)');
assertThrows(
  () => vectorSearch.search([1, 2, 3], embeddings1, 0),
  'topK of 0 should throw error'
);

// Test 13: Invalid topK (negative)
console.log('\nTest 13: Invalid topK (negative)');
assertThrows(
  () => vectorSearch.search([1, 2, 3], embeddings1, -1),
  'Negative topK should throw error'
);

// Test 14: Mismatched vector dimensions
console.log('\nTest 14: Mismatched vector dimensions');
const embeddingsMismatched = [
  { text: 'valid', vector: [1, 2, 3], source: 'test' },
  { text: 'invalid', vector: [1, 2], source: 'test' }, // Different dimension
  { text: 'another valid', vector: [4, 5, 6], source: 'test' },
];
const resultsMismatched = vectorSearch.search([1, 2, 3], embeddingsMismatched, 10);
assertEquals(
  resultsMismatched.length,
  2,
  'Should skip embeddings with mismatched dimensions'
);

// Test 15: Empty vector in embeddings
console.log('\nTest 15: Empty vector in embeddings');
const embeddingsEmpty = [
  { text: 'valid', vector: [1, 2, 3], source: 'test' },
  { text: 'empty', vector: [], source: 'test' },
  { text: 'another valid', vector: [4, 5, 6], source: 'test' },
];
const resultsEmpty = vectorSearch.search([1, 2, 3], embeddingsEmpty, 10);
assertEquals(resultsEmpty.length, 2, 'Should skip embeddings with empty vectors');

// Test 16: Zero vector handling
console.log('\nTest 16: Zero vector handling');
const embeddingsZero = [
  { text: 'zero vector', vector: [0, 0, 0], source: 'test' },
];
const resultsZero = vectorSearch.search([1, 2, 3], embeddingsZero, 1);
assertEquals(resultsZero.length, 1, 'Should handle zero vectors');
assertEquals(resultsZero[0].score, 0, 'Zero vector should have score of 0');

// Test 17: Large vectors (simulating embeddings)
console.log('\nTest 17: Large vectors (simulating 1536-dim embeddings)');
const largeVector = Array(1536).fill(0).map((_, i) => Math.sin(i * 0.1));
const largeEmbeddings = [
  { text: 'large1', vector: Array(1536).fill(0).map((_, i) => Math.sin(i * 0.1)), source: 'test' },
  { text: 'large2', vector: Array(1536).fill(0).map((_, i) => Math.cos(i * 0.1)), source: 'test' },
];
const resultsLarge = vectorSearch.search(largeVector, largeEmbeddings, 2);
assertEquals(resultsLarge.length, 2, 'Should handle large dimension vectors');
assertClose(resultsLarge[0].score, 1.0, 0.0001, 'Identical large vectors should have score ~1.0');

// Summary
console.log('\n=== Test Summary ===');
console.log(`✓ Passed: ${testsPassed}`);
console.log(`✗ Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}\n`);

if (testsFailed > 0) {
  process.exit(1);
}
