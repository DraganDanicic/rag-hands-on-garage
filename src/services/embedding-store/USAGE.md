# Embedding Store Service - Usage Guide

## Overview
The Embedding Store Service provides JSON-based persistent storage for embeddings with atomic writes and automatic directory creation.

## Quick Start

```typescript
import { createEmbeddingStore, StoredEmbedding } from './services/embedding-store/index.js';

// Create store instance
const store = createEmbeddingStore('./data/embeddings.json');

// Prepare embeddings
const embeddings: StoredEmbedding[] = [
  {
    text: 'The quick brown fox',
    vector: [0.1, 0.2, 0.3, 0.4],
    source: 'document1.txt',
    metadata: { chunkIndex: 0 }
  },
  {
    text: 'jumps over the lazy dog',
    vector: [0.5, 0.6, 0.7, 0.8],
    source: 'document1.txt',
    metadata: { chunkIndex: 1 }
  }
];

// Save embeddings
await store.save(embeddings);

// Load embeddings
const loaded = await store.load();
console.log(`Loaded ${loaded.length} embeddings`);

// Clear all embeddings
await store.clear();
```

## API Reference

### createEmbeddingStore(filePath: string): IEmbeddingStore
Factory function to create an embedding store instance.

**Parameters:**
- `filePath` - Path to JSON file (directories will be created automatically)

**Returns:** IEmbeddingStore instance

**Throws:**
- Error if filePath is empty

---

### save(embeddings: StoredEmbedding[]): Promise<void>
Saves embeddings to storage using atomic writes.

**Parameters:**
- `embeddings` - Array of StoredEmbedding objects

**Behavior:**
- Creates parent directories if they don't exist
- Uses atomic write (temp file + rename) to prevent corruption
- Overwrites existing file contents

**Throws:**
- Error if embeddings is not an array
- Error if any embedding lacks required fields
- Error if any embedding has empty vector

---

### load(): Promise<StoredEmbedding[]>
Loads all embeddings from storage.

**Returns:** Array of StoredEmbedding objects (empty array if file doesn't exist)

**Throws:**
- Error if file exists but contains invalid JSON
- Error if file read fails for reasons other than file not found

---

### clear(): Promise<void>
Removes the storage file.

**Behavior:**
- Deletes the file if it exists
- Does nothing if file doesn't exist (no error)

**Throws:**
- Error if file deletion fails for reasons other than file not found

## StoredEmbedding Interface

```typescript
interface StoredEmbedding {
  text: string;              // Original text that was embedded
  vector: number[];          // Embedding vector (must not be empty)
  source?: string;           // Optional source identifier
  metadata?: Record<string, unknown>;  // Optional metadata
}
```

## Key Features

### Atomic Writes
The service uses atomic writes to prevent data corruption:
1. Writes to temporary file (.tmp)
2. Renames temp file to target file
3. Cleans up temp file on errors

### Directory Auto-Creation
Parent directories are created automatically:

```typescript
const store = createEmbeddingStore('./data/nested/path/embeddings.json');
await store.save(embeddings);  // Creates ./data/nested/path/ automatically
```

### Validation
All embeddings are validated before saving:
- Must have non-empty `text` field
- Must have `vector` array field
- Vector array must not be empty

### Metadata Support
Metadata can contain any JSON-serializable values:

```typescript
{
  text: 'example',
  vector: [0.1, 0.2],
  metadata: {
    string: 'value',
    number: 42,
    boolean: true,
    nested: { key: 'value' },
    array: [1, 2, 3]
  }
}
```

## Testing

Run the manual test suite:
```bash
npm run build
node dist/services/embedding-store/manual-test.js
```

## Error Handling

```typescript
try {
  await store.save(embeddings);
} catch (error) {
  console.error('Failed to save embeddings:', error.message);
}

try {
  const embeddings = await store.load();
} catch (error) {
  console.error('Failed to load embeddings:', error.message);
  // File doesn't exist returns empty array, so this is likely JSON parse error
}
```

## Best Practices

1. **Use absolute paths or path.join()** to avoid path issues:
   ```typescript
   import path from 'path';
   const filePath = path.join(process.cwd(), 'data', 'embeddings.json');
   ```

2. **Validate embeddings before saving** to catch errors early:
   ```typescript
   if (!embeddings.every(e => e.vector.length > 0)) {
     throw new Error('All embeddings must have vectors');
   }
   ```

3. **Handle missing files gracefully**:
   ```typescript
   const embeddings = await store.load();
   if (embeddings.length === 0) {
     console.log('No embeddings found, starting fresh');
   }
   ```

4. **Use clear() carefully** - it permanently deletes data:
   ```typescript
   if (confirm('Clear all embeddings?')) {
     await store.clear();
   }
   ```
