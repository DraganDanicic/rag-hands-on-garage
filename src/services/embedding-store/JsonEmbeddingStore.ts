import { promises as fs } from 'fs';
import path from 'path';
import { IEmbeddingStore } from './IEmbeddingStore.js';
import { StoredEmbedding } from './models/StoredEmbedding.js';

export class JsonEmbeddingStore implements IEmbeddingStore {
  constructor(private filePath: string) {
    if (!filePath || filePath.trim().length === 0) {
      throw new Error('filePath cannot be empty');
    }
  }

  async save(embeddings: StoredEmbedding[]): Promise<void> {
    if (!Array.isArray(embeddings)) {
      throw new Error('embeddings must be an array');
    }

    // Validate each embedding
    for (const embedding of embeddings) {
      if (!embedding.text || typeof embedding.text !== 'string') {
        throw new Error('Each embedding must have a text field');
      }
      if (!Array.isArray(embedding.vector)) {
        throw new Error('Each embedding must have a vector array');
      }
      if (embedding.vector.length === 0) {
        throw new Error('Embedding vector cannot be empty');
      }
    }

    // Ensure directory exists
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });

    // Atomic write: write to temp file then rename
    const tempPath = `${this.filePath}.tmp`;
    const jsonData = JSON.stringify(embeddings, null, 2);

    try {
      await fs.writeFile(tempPath, jsonData, 'utf-8');
      await fs.rename(tempPath, this.filePath);
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      throw new Error(`Failed to save embeddings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async load(): Promise<StoredEmbedding[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const embeddings = JSON.parse(data);

      if (!Array.isArray(embeddings)) {
        throw new Error('Stored data is not an array');
      }

      return embeddings;
    } catch (error) {
      // If file doesn't exist, return empty array
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw new Error(`Failed to load embeddings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async clear(): Promise<void> {
    try {
      await fs.unlink(this.filePath);
    } catch (error) {
      // If file doesn't exist, that's fine
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new Error(`Failed to clear embeddings: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}
