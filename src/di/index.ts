import { Container } from './Container.js';
import { IContainer } from './IContainer.js';

export { IContainer } from './IContainer.js';

/**
 * Factory function to create a Container instance
 */
export function createContainer(): IContainer {
  return new Container();
}
