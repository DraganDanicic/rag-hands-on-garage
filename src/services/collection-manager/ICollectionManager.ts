import { CollectionInfo } from './models/CollectionInfo.js';

/**
 * Collection manager service interface
 * Manages document collections (list, inspect, delete)
 */
export interface ICollectionManager {
  /**
   * List all available collections
   * @returns Array of collection information
   */
  listCollections(): Promise<CollectionInfo[]>;

  /**
   * Get detailed information about a specific collection
   * @param name - Collection name
   * @returns Collection information
   * @throws Error if collection doesn't exist
   */
  getCollectionInfo(name: string): Promise<CollectionInfo>;

  /**
   * Delete a collection (removes embeddings and chunks files)
   * @param name - Collection name
   * @throws Error if collection doesn't exist
   */
  deleteCollection(name: string): Promise<void>;

  /**
   * Check if a collection exists
   * @param name - Collection name
   * @returns True if collection exists
   */
  collectionExists(name: string): Promise<boolean>;
}
