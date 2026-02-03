#!/usr/bin/env ts-node
/**
 * Manual test script for JsonEmbeddingStore
 * Run with: npx ts-node --esm src/services/embedding-store/manual-test.ts
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createEmbeddingStore } from './index.js';
import { StoredEmbedding } from './models/StoredEmbedding.js';

const TEST_DIR = path.join(process.cwd(), 'test-data', 'manual-test');
const TEST_FILE = path.join(TEST_DIR, 'embeddings.json');

async function runTests() {
  console.log('Starting manual tests for JsonEmbeddingStore...\n');
  let passed = 0;
  let failed = 0;

  // Clean up before tests
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }

  // Test 1: Create instance
  try {
    createEmbeddingStore(TEST_FILE);
    console.log('✓ Test 1: Create instance with valid file path');
    passed++;
  } catch (e) {
    console.log('✗ Test 1 failed:', e);
    failed++;
  }

  // Test 2: Save embeddings
  try {
    const store = createEmbeddingStore(TEST_FILE);
    const embeddings: StoredEmbedding[] = [
      {
        text: 'test text 1',
        vector: [0.1, 0.2, 0.3],
        source: 'test.txt',
        metadata: { index: 0 },
      },
      {
        text: 'test text 2',
        vector: [0.4, 0.5, 0.6],
      },
    ];
    await store.save(embeddings);

    // Verify file was created
    const fileExists = await fs.access(TEST_FILE).then(() => true).catch(() => false);
    if (!fileExists) throw new Error('File was not created');

    console.log('✓ Test 2: Save embeddings to file');
    passed++;
  } catch (e) {
    console.log('✗ Test 2 failed:', e);
    failed++;
  }

  // Test 3: Load embeddings
  try {
    const store = createEmbeddingStore(TEST_FILE);
    const loaded = await store.load();

    if (loaded.length !== 2) throw new Error(`Expected 2 embeddings, got ${loaded.length}`);
    if (loaded[0]?.text !== 'test text 1') throw new Error('Text mismatch');
    if (JSON.stringify(loaded[0]?.vector) !== JSON.stringify([0.1, 0.2, 0.3])) {
      throw new Error('Vector mismatch');
    }

    console.log('✓ Test 3: Load embeddings from file');
    passed++;
  } catch (e) {
    console.log('✗ Test 3 failed:', e);
    failed++;
  }

  // Test 4: Directory creation
  try {
    const nestedPath = path.join(TEST_DIR, 'nested', 'dir', 'embeddings.json');
    const store = createEmbeddingStore(nestedPath);
    await store.save([{ text: 'nested', vector: [1, 2, 3] }]);

    const fileExists = await fs.access(nestedPath).then(() => true).catch(() => false);
    if (!fileExists) throw new Error('Nested directory was not created');

    console.log('✓ Test 4: Create directory if it does not exist');
    passed++;
  } catch (e) {
    console.log('✗ Test 4 failed:', e);
    failed++;
  }

  // Test 5: Clear embeddings
  try {
    const store = createEmbeddingStore(TEST_FILE);
    await store.clear();

    const fileExists = await fs.access(TEST_FILE).then(() => true).catch(() => false);
    if (fileExists) throw new Error('File was not deleted');

    console.log('✓ Test 5: Clear embeddings');
    passed++;
  } catch (e) {
    console.log('✗ Test 5 failed:', e);
    failed++;
  }

  // Test 6: Load non-existent file returns empty array
  try {
    const store = createEmbeddingStore(TEST_FILE);
    const loaded = await store.load();

    if (loaded.length !== 0) throw new Error('Expected empty array');

    console.log('✓ Test 6: Return empty array when file does not exist');
    passed++;
  } catch (e) {
    console.log('✗ Test 6 failed:', e);
    failed++;
  }

  // Test 7: Validation - empty text
  try {
    const store = createEmbeddingStore(TEST_FILE);
    const invalid = [{ text: '', vector: [1, 2, 3] }];

    try {
      await store.save(invalid);
      throw new Error('Should have thrown validation error');
    } catch (e) {
      if (e instanceof Error && e.message.includes('text field')) {
        console.log('✓ Test 7: Validate embeddings have text field');
        passed++;
      } else {
        throw e;
      }
    }
  } catch (e) {
    console.log('✗ Test 7 failed:', e);
    failed++;
  }

  // Test 8: Validation - empty vector
  try {
    const store = createEmbeddingStore(TEST_FILE);
    const invalid: StoredEmbedding[] = [{ text: 'test', vector: [] }];

    try {
      await store.save(invalid);
      throw new Error('Should have thrown validation error');
    } catch (e) {
      if (e instanceof Error && e.message.includes('vector cannot be empty')) {
        console.log('✓ Test 8: Validate vector is not empty');
        passed++;
      } else {
        throw e;
      }
    }
  } catch (e) {
    console.log('✗ Test 8 failed:', e);
    failed++;
  }

  // Test 9: Atomic writes (no temp file left behind)
  try {
    const store = createEmbeddingStore(TEST_FILE);
    await store.save([{ text: 'atomic test', vector: [0.1, 0.2] }]);

    const tempFile = `${TEST_FILE}.tmp`;
    const tempExists = await fs.access(tempFile).then(() => true).catch(() => false);
    if (tempExists) throw new Error('Temp file was not cleaned up');

    console.log('✓ Test 9: Perform atomic writes');
    passed++;
  } catch (e) {
    console.log('✗ Test 9 failed:', e);
    failed++;
  }

  // Test 10: Preserve metadata
  try {
    const store = createEmbeddingStore(TEST_FILE);
    const embeddings: StoredEmbedding[] = [
      {
        text: 'metadata test',
        vector: [0.1, 0.2],
        metadata: {
          string: 'value',
          number: 42,
          boolean: true,
          nested: { key: 'nested value' },
        },
      },
    ];

    await store.save(embeddings);
    const loaded = await store.load();

    const expected = JSON.stringify(embeddings[0]?.metadata);
    const actual = JSON.stringify(loaded[0]?.metadata);
    if (expected !== actual) throw new Error('Metadata not preserved');

    console.log('✓ Test 10: Preserve metadata with various types');
    passed++;
  } catch (e) {
    console.log('✗ Test 10 failed:', e);
    failed++;
  }

  // Clean up after tests
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }

  console.log(`\n===== Test Results =====`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);
