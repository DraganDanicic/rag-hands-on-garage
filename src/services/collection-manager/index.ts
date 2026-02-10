import { CollectionManager } from './CollectionManager.js';
import { ICollectionManager } from './ICollectionManager.js';

export { ICollectionManager } from './ICollectionManager.js';
export { CollectionInfo } from './models/CollectionInfo.js';

/**
 * Factory function to create a CollectionManager instance
 * @param collectionsPath - Path to collections directory
 * @param chunksPath - Path to chunks directory
 */
export function createCollectionManager(
  collectionsPath: string,
  chunksPath: string
): ICollectionManager {
  return new CollectionManager(collectionsPath, chunksPath);
}
