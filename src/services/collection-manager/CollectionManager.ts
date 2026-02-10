import { promises as fs } from 'fs';
import * as path from 'path';
import { ICollectionManager } from './ICollectionManager.js';
import { CollectionInfo } from './models/CollectionInfo.js';

/**
 * Collection manager implementation
 * Scans file system for collection files and manages them
 */
export class CollectionManager implements ICollectionManager {
  constructor(
    private readonly collectionsPath: string,
    private readonly chunksPath: string
  ) {}

  async listCollections(): Promise<CollectionInfo[]> {
    try {
      const files = await fs.readdir(this.collectionsPath);

      const embeddingFiles = files.filter(f => f.endsWith('.embeddings.json'));

      const collections: CollectionInfo[] = [];

      for (const file of embeddingFiles) {
        const name = file.replace('.embeddings.json', '');
        try {
          const info = await this.getCollectionInfo(name);
          collections.push(info);
        } catch (error) {
          // Skip collections with errors
          console.warn(`Skipping collection '${name}': ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      return collections;
    } catch (error) {
      // Collections directory doesn't exist yet
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async getCollectionInfo(name: string): Promise<CollectionInfo> {
    const embeddingsPath = path.join(this.collectionsPath, `${name}.embeddings.json`);
    const chunksPath = path.join(this.chunksPath, `${name}.chunks.json`);

    try {
      // Read embeddings file stats
      const stats = await fs.stat(embeddingsPath);

      // Read embeddings to count them
      const content = await fs.readFile(embeddingsPath, 'utf-8');
      const embeddings = JSON.parse(content);
      const embeddingCount = Array.isArray(embeddings) ? embeddings.length : 0;

      // Check if chunks file exists
      let chunksExists = false;
      try {
        await fs.access(chunksPath);
        chunksExists = true;
      } catch {
        chunksExists = false;
      }

      return {
        name,
        embeddingCount,
        fileSizeBytes: stats.size,
        lastModified: stats.mtime,
        embeddingsPath,
        chunksPath,
        chunksExists,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Collection '${name}' not found`);
      }
      throw error;
    }
  }

  async deleteCollection(name: string): Promise<void> {
    const embeddingsPath = path.join(this.collectionsPath, `${name}.embeddings.json`);
    const chunksPath = path.join(this.chunksPath, `${name}.chunks.json`);

    // Check if collection exists
    const exists = await this.collectionExists(name);
    if (!exists) {
      throw new Error(`Collection '${name}' not found`);
    }

    // Delete embeddings file
    await fs.unlink(embeddingsPath);

    // Delete chunks file if it exists
    try {
      await fs.unlink(chunksPath);
    } catch (error) {
      // Chunks file may not exist, that's ok
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async collectionExists(name: string): Promise<boolean> {
    const embeddingsPath = path.join(this.collectionsPath, `${name}.embeddings.json`);

    try {
      await fs.access(embeddingsPath);
      return true;
    } catch {
      return false;
    }
  }
}
