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

      // Read embeddings to count them and extract settings
      const content = await fs.readFile(embeddingsPath, 'utf-8');
      const parsed = JSON.parse(content);

      let embeddingCount = 0;
      let settings: CollectionInfo['settings'] = undefined;

      // New format with settings
      if (parsed && typeof parsed === 'object' && 'embeddings' in parsed && Array.isArray(parsed.embeddings)) {
        embeddingCount = parsed.embeddings.length;
        settings = parsed.settings;
      }
      // Legacy format: array of embeddings
      else if (Array.isArray(parsed)) {
        embeddingCount = parsed.length;
      }

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
        settings,
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

  async renameCollection(oldName: string, newName: string): Promise<void> {
    // Validate old collection exists
    const oldExists = await this.collectionExists(oldName);
    if (!oldExists) {
      throw new Error(`Collection '${oldName}' not found`);
    }

    // Validate new name doesn't exist
    const newExists = await this.collectionExists(newName);
    if (newExists) {
      throw new Error(`Collection '${newName}' already exists`);
    }

    // Rename embeddings file
    const oldEmbeddingsPath = path.join(this.collectionsPath, `${oldName}.embeddings.json`);
    const newEmbeddingsPath = path.join(this.collectionsPath, `${newName}.embeddings.json`);
    await fs.rename(oldEmbeddingsPath, newEmbeddingsPath);

    // Rename chunks file (if exists)
    const oldChunksPath = path.join(this.chunksPath, `${oldName}.chunks.json`);
    const newChunksPath = path.join(this.chunksPath, `${newName}.chunks.json`);
    try {
      await fs.rename(oldChunksPath, newChunksPath);
    } catch (error) {
      // Chunks file might not exist, that's OK
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        // If rename failed for another reason, we should rollback the embeddings rename
        try {
          await fs.rename(newEmbeddingsPath, oldEmbeddingsPath);
        } catch {
          // Ignore rollback errors
        }
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
