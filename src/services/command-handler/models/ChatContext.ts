import type { Container } from '../../../di/Container.js';
import type { QueryWorkflow } from '../../../workflows/QueryWorkflow.js';
import type { IConfigService } from '../../../config/IConfigService.js';
import type { ICollectionManager } from '../../collection-manager/ICollectionManager.js';
import type * as readline from 'readline';

/**
 * Context object passed to command handlers containing all necessary dependencies
 */
export interface ChatContext {
  /** DI container with all services */
  container: Container;
  /** Query workflow for executing RAG queries */
  workflow: QueryWorkflow;
  /** Current collection name */
  collectionName: string;
  /** Readline interface for interactive input */
  readline: readline.Interface;
  /** Configuration service */
  configService: IConfigService;
  /** Collection manager for listing/validating collections */
  collectionManager: ICollectionManager;
}
