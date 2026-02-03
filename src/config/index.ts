import { ConfigService } from './ConfigService.js';
import { IConfigService } from './IConfigService.js';

export { IConfigService } from './IConfigService.js';

/**
 * Factory function to create a ConfigService instance
 */
export function createConfigService(): IConfigService {
  return new ConfigService();
}
