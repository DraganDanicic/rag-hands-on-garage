import { promises as fs } from 'fs';
import path from 'path';
import { IEmbeddingStore } from './IEmbeddingStore.js';
import { StoredEmbedding } from './models/StoredEmbedding.js';
import type { ImportSettingsData } from '../import-settings/models/ImportSettingsData.js';

export class JsonEmbeddingStore implements IEmbeddingStore {
  constructor(private filePath: string) {
    if (!filePath || filePath.trim().length === 0) {
      throw new Error('filePath cannot be empty');
    }
  }

  async save(embeddings: StoredEmbedding[], settings?: ImportSettingsData): Promise<void> {
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

    // Create data structure (with or without settings)
    const data = settings
      ? { settings, embeddings }
      : embeddings; // Legacy format for backward compatibility

    // Atomic write: write to temp file then rename
    const tempPath = `${this.filePath}.tmp`;
    const jsonData = JSON.stringify(data, null, 2);

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

  async saveIncremental(embeddings: StoredEmbedding[]): Promise<void> {
    if (!Array.isArray(embeddings)) {
      throw new Error('embeddings must be an array');
    }

    // Load existing embeddings and settings
    const { embeddings: existingEmbeddings, settings } = await this.load();

    // Create a map of chunkId -> embedding for efficient lookup and merge
    const embeddingMap = new Map<string, StoredEmbedding>();

    // Add existing embeddings to map
    for (const embedding of existingEmbeddings) {
      const chunkId = embedding.metadata?.chunkId as string | undefined;
      if (chunkId) {
        embeddingMap.set(chunkId, embedding);
      } else {
        // Keep embeddings without chunkId (backward compatibility)
        // Use a unique temporary key based on text + vector to avoid collisions
        const tempKey = `legacy_${embedding.text.substring(0, 50)}_${embedding.vector[0]}`;
        embeddingMap.set(tempKey, embedding);
      }
    }

    // Add/overwrite with new embeddings
    for (const embedding of embeddings) {
      const chunkId = embedding.metadata?.chunkId as string | undefined;
      if (chunkId) {
        embeddingMap.set(chunkId, embedding);
      } else {
        // If new embedding doesn't have chunkId, still add it
        const tempKey = `legacy_${embedding.text.substring(0, 50)}_${embedding.vector[0]}`;
        embeddingMap.set(tempKey, embedding);
      }
    }

    // Convert map back to array
    const mergedEmbeddings = Array.from(embeddingMap.values());

    // Save using the existing save method (preserve settings if they existed)
    await this.save(mergedEmbeddings, settings);
  }

  async load(): Promise<{ embeddings: StoredEmbedding[]; settings?: ImportSettingsData }> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(data);

      // Check if new format (with settings)
      if (parsed && typeof parsed === 'object' && 'embeddings' in parsed && Array.isArray(parsed.embeddings)) {
        return {
          embeddings: parsed.embeddings as StoredEmbedding[],
          settings: parsed.settings as ImportSettingsData | undefined,
        };
      }

      // Legacy format: array of embeddings
      if (Array.isArray(parsed)) {
        return { embeddings: parsed as StoredEmbedding[], settings: undefined };
      }

      throw new Error('Stored data has invalid format');
    } catch (error) {
      // If file doesn't exist, return empty array
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { embeddings: [], settings: undefined };
      }
      throw new Error(`Failed to load embeddings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async loadEmbeddings(): Promise<StoredEmbedding[]> {
    const { embeddings } = await this.load();
    return embeddings;
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
