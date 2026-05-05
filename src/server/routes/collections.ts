import { Router, Request, Response } from 'express';
import { Container } from '../../di/Container.js';
import { promises as fs } from 'fs';
import path from 'path';

const router = Router();

/**
 * Helper function to get chunk count from chunks file
 */
async function getChunkCount(chunksPath: string, exists: boolean): Promise<number> {
  if (!exists) return 0;

  try {
    const content = await fs.readFile(chunksPath, 'utf-8');
    const chunks = JSON.parse(content);
    return Array.isArray(chunks) ? chunks.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Validate collection name format
 */
function isValidCollectionName(name: string | undefined): boolean {
  if (!name) return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name);
}

/**
 * GET /api/collections
 * List all available collections with metadata
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Create container to get CollectionManager
    const container = new Container();
    await container.initialize();

    const collectionManager = container.getCollectionManager();

    // Get list of all collections
    const collections = await collectionManager.listCollections();

    // Get chunk counts for each collection
    const response = await Promise.all(
      collections.map(async (c) => {
        const chunksPath = path.join(
          container.getConfigService().getChunksPath().replace('default', c.name)
        );
        const chunkCount = await getChunkCount(chunksPath, c.chunksExists);

        return {
          name: c.name,
          embeddings: c.embeddingCount,
          chunks: chunkCount,
          size: c.fileSizeBytes,
          lastModified: c.lastModified.toISOString(),
        };
      })
    );

    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to list collections: ${message}` });
  }
});

/**
 * DELETE /api/collections/:name
 * Delete a collection and its associated data files
 */
router.delete('/:name', async (req: Request, res: Response) => {
  const collectionName = req.params['name'];

  // Validate collection name format
  if (!isValidCollectionName(collectionName)) {
    res.status(400).json({
      error: 'Invalid collection name. Use only letters, numbers, hyphens, underscores, and dots.',
    });
    return;
  }

  try {
    // Create container to get CollectionManager
    const container = new Container();
    await container.initialize();

    const collectionManager = container.getCollectionManager();

    // Delete the collection
    await collectionManager.deleteCollection(collectionName!);

    // Return success
    res.status(200).json({
      message: `Collection '${collectionName}' deleted`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Map "not found" errors to 404
    if (message.includes('not found') || message.includes('does not exist')) {
      res.status(404).json({
        error: `Collection '${collectionName}' not found`,
      });
      return;
    }

    // Unexpected error
    res.status(500).json({
      error: `Failed to delete collection: ${message}`,
    });
  }
});

export default router;
