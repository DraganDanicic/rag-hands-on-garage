import { ConfigService } from './ConfigService.js';
import { IConfigService } from './IConfigService.js';

export { IConfigService } from './IConfigService.js';

/**
 * Factory function to create a ConfigService instance
 * @param collectionName - Name of the document collection (defaults to 'default')
 */
export function createConfigService(collectionName?: string): IConfigService {
  return new ConfigService(collectionName);
}
