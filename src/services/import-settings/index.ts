export type { IImportSettings } from './IImportSettings.js';
export type { ImportSettingsData } from './models/ImportSettingsData.js';
export { DEFAULT_IMPORT_SETTINGS } from './models/ImportSettingsData.js';
export { ImportSettings } from './ImportSettings.js';

import type { IConfigService } from '../../config/IConfigService.js';
import { ImportSettings } from './ImportSettings.js';

/**
 * Factory function to create ImportSettings service
 * @param configService - Configuration service for path resolution
 * @returns ImportSettings instance
 */
export function createImportSettings(configService: IConfigService): ImportSettings {
  return new ImportSettings(configService);
}
