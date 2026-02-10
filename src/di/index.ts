import { Container } from './Container.js';
import { IContainer } from './IContainer.js';

export { IContainer } from './IContainer.js';

/**
 * Factory function to create a Container instance
 * @param collectionName - Name of the document collection (defaults to 'default')
 */
export function createContainer(collectionName?: string): IContainer {
  return new Container(collectionName);
}
