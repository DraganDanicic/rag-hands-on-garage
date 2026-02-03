import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'fs';
import path from 'path';
import { createEmbeddingStore } from './index.js';
import { StoredEmbedding } from './models/StoredEmbedding.js';

const TEST_DIR = path.join(process.cwd(), 'test-data', 'embedding-store');
const TEST_FILE = path.join(TEST_DIR, 'test-embeddings.json');

describe('JsonEmbeddingStore', () => {
  before(async () => {
    // Clean up test directory before tests
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }
  });

  after(async () => {
    // Clean up test directory after tests
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should create instance with valid file path', () => {
    const store = createEmbeddingStore(TEST_FILE);
    assert.ok(store);
  });

  it('should throw error when file path is empty', () => {
    assert.throws(
      () => createEmbeddingStore(''),
      /filePath cannot be empty/
    );
  });

  it('should save embeddings to file', async () => {
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
    assert.strictEqual(fileExists, true);

    // Verify content
    const content = await fs.readFile(TEST_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    assert.strictEqual(parsed.length, 2);
    assert.strictEqual(parsed[0].text, 'test text 1');
  });

  it('should create directory if it does not exist', async () => {
    const nestedPath = path.join(TEST_DIR, 'nested', 'dir', 'embeddings.json');
    const store = createEmbeddingStore(nestedPath);
    const embeddings: StoredEmbedding[] = [
      {
        text: 'nested test',
        vector: [1, 2, 3],
      },
    ];

    await store.save(embeddings);

    // Verify file was created in nested directory
    const fileExists = await fs.access(nestedPath).then(() => true).catch(() => false);
    assert.strictEqual(fileExists, true);

    // Clean up
    await fs.rm(path.join(TEST_DIR, 'nested'), { recursive: true });
  });

  it('should load embeddings from file', async () => {
    const store = createEmbeddingStore(TEST_FILE);
    const embeddings: StoredEmbedding[] = [
      {
        text: 'load test',
        vector: [0.7, 0.8, 0.9],
        source: 'source.txt',
        metadata: { key: 'value' },
      },
    ];

    await store.save(embeddings);
    const loaded = await store.load();

    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].text, 'load test');
    assert.deepStrictEqual(loaded[0].vector, [0.7, 0.8, 0.9]);
    assert.strictEqual(loaded[0].source, 'source.txt');
    assert.deepStrictEqual(loaded[0].metadata, { key: 'value' });
  });

  it('should return empty array when file does not exist', async () => {
    const nonExistentFile = path.join(TEST_DIR, 'non-existent.json');
    const store = createEmbeddingStore(nonExistentFile);

    const loaded = await store.load();
    assert.deepStrictEqual(loaded, []);
  });

  it('should clear embeddings', async () => {
    const store = createEmbeddingStore(TEST_FILE);
    const embeddings: StoredEmbedding[] = [
      {
        text: 'clear test',
        vector: [1, 2, 3],
      },
    ];

    await store.save(embeddings);
    await store.clear();

    // Verify file was deleted
    const fileExists = await fs.access(TEST_FILE).then(() => true).catch(() => false);
    assert.strictEqual(fileExists, false);
  });

  it('should handle clear when file does not exist', async () => {
    const nonExistentFile = path.join(TEST_DIR, 'non-existent-clear.json');
    const store = createEmbeddingStore(nonExistentFile);

    // Should not throw error
    await assert.doesNotReject(store.clear());
  });

  it('should perform atomic writes', async () => {
    const store = createEmbeddingStore(TEST_FILE);
    const embeddings: StoredEmbedding[] = [
      {
        text: 'atomic test',
        vector: [0.1, 0.2],
      },
    ];

    await store.save(embeddings);

    // Check that temp file does not exist after save
    const tempFile = `${TEST_FILE}.tmp`;
    const tempExists = await fs.access(tempFile).then(() => true).catch(() => false);
    assert.strictEqual(tempExists, false);

    // Verify final file exists
    const fileExists = await fs.access(TEST_FILE).then(() => true).catch(() => false);
    assert.strictEqual(fileExists, true);
  });

  it('should validate embeddings have text field', async () => {
    const store = createEmbeddingStore(TEST_FILE);
    const invalidEmbeddings = [
      {
        vector: [1, 2, 3],
      } as unknown as StoredEmbedding,
    ];

    await assert.rejects(
      store.save(invalidEmbeddings),
      /Each embedding must have a text field/
    );
  });

  it('should validate embeddings have vector array', async () => {
    const store = createEmbeddingStore(TEST_FILE);
    const invalidEmbeddings = [
      {
        text: 'test',
        vector: 'not an array',
      } as unknown as StoredEmbedding,
    ];

    await assert.rejects(
      store.save(invalidEmbeddings),
      /Each embedding must have a vector array/
    );
  });

  it('should validate vector is not empty', async () => {
    const store = createEmbeddingStore(TEST_FILE);
    const invalidEmbeddings: StoredEmbedding[] = [
      {
        text: 'test',
        vector: [],
      },
    ];

    await assert.rejects(
      store.save(invalidEmbeddings),
      /Embedding vector cannot be empty/
    );
  });

  it('should validate input is an array', async () => {
    const store = createEmbeddingStore(TEST_FILE);

    await assert.rejects(
      store.save('not an array' as unknown as StoredEmbedding[]),
      /embeddings must be an array/
    );
  });

  it('should handle multiple save operations', async () => {
    const store = createEmbeddingStore(TEST_FILE);

    // Save first batch
    const batch1: StoredEmbedding[] = [
      {
        text: 'batch 1',
        vector: [1, 2],
      },
    ];
    await store.save(batch1);

    // Save second batch (overwrites)
    const batch2: StoredEmbedding[] = [
      {
        text: 'batch 2 - item 1',
        vector: [3, 4],
      },
      {
        text: 'batch 2 - item 2',
        vector: [5, 6],
      },
    ];
    await store.save(batch2);

    const loaded = await store.load();
    assert.strictEqual(loaded.length, 2);
    assert.strictEqual(loaded[0].text, 'batch 2 - item 1');
    assert.strictEqual(loaded[1].text, 'batch 2 - item 2');
  });

  it('should preserve metadata with various types', async () => {
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
          array: [1, 2, 3],
        },
      },
    ];

    await store.save(embeddings);
    const loaded = await store.load();

    assert.deepStrictEqual(loaded[0].metadata, {
      string: 'value',
      number: 42,
      boolean: true,
      nested: { key: 'nested value' },
      array: [1, 2, 3],
    });
  });
});
