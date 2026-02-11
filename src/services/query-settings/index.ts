/**
 * Query Settings Service
 *
 * Exports interface and factory function.
 */

import type { IConfigService } from '../../config/IConfigService.js';
import type { IQuerySettings } from './IQuerySettings.js';
import { QuerySettings } from './QuerySettings.js';

export type { IQuerySettings, QuerySettingsData } from './IQuerySettings.js';
export {
  DEFAULT_QUERY_SETTINGS,
  QUERY_SETTINGS_CONSTRAINTS
} from './IQuerySettings.js';

export function createQuerySettings(
  configService: IConfigService
): IQuerySettings {
  return new QuerySettings(configService);
}
