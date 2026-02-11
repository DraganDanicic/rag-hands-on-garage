import type { CommandRegistry } from './CommandRegistry.js';
import type { ICollectionManager } from '../collection-manager/ICollectionManager.js';

/**
 * Tab completion service for interactive chat
 * Provides autocomplete for commands, collection names, and setting keys
 */
export class Completer {
  private collectionNamesCache: string[] = [];
  private lastCacheUpdate: number = 0;
  private readonly cacheExpiryMs = 5000; // 5 seconds

  constructor(
    private readonly registry: CommandRegistry,
    private readonly collectionManager: ICollectionManager
  ) {
    // Pre-populate collection cache asynchronously
    this.refreshCollectionCache();
  }

  /**
   * Readline completer function
   * @param line - Current input line
   * @returns Tuple of [completions, partial]
   */
  complete(line: string): [string[], string] {
    const trimmed = line.trim();

    // Command completion
    if (trimmed.startsWith('/')) {
      return this.completeCommand(trimmed);
    }

    // No completion for regular queries
    return [[], line];
  }

  /**
   * Complete command names and arguments
   */
  private completeCommand(line: string): [string[], string] {
    const parts = line.split(/\s+/);
    const command = parts[0]?.substring(1) || ''; // Remove /

    // Complete command name
    if (parts.length === 1 || (parts.length === 2 && !line.endsWith(' '))) {
      const allCommands = this.registry.getAllHelp().map(h => '/' + h.name);
      const matches = allCommands.filter(c => c.startsWith(line));
      return [matches.length > 0 ? matches : allCommands, line];
    }

    // Complete command arguments
    const argsStart = line.indexOf(' ');
    if (argsStart === -1) {
      return [[], line];
    }

    const argsLine = line.substring(argsStart + 1);
    const argsParts = argsLine.split(/\s+/);
    const lastArg = argsParts[argsParts.length - 1] || '';

    return this.completeArguments(command, argsParts, lastArg, line);
  }

  /**
   * Complete command arguments based on command type
   */
  private completeArguments(
    command: string,
    args: string[],
    lastArg: string,
    fullLine: string
  ): [string[], string] {
    switch (command) {
      case 'collection':
      case 'delete':
        // Complete collection names
        return this.completeCollectionName(lastArg);

      case 'rename':
        // For rename, complete both arguments
        if (args.length <= 2) {
          return this.completeCollectionName(lastArg);
        }
        break;

      case 'import-settings':
        // Complete setting keys for 'set' subcommand
        if (args.length >= 1 && args[0] === 'set') {
          if (args.length === 2 || (args.length === 3 && !fullLine.endsWith(' '))) {
            return this.completeImportSettingKey(lastArg);
          }
        }
        break;

      case 'query-settings':
        // Complete setting keys for 'set' subcommand
        if (args.length >= 1 && args[0] === 'set') {
          if (args.length === 2 || (args.length === 3 && !fullLine.endsWith(' '))) {
            return this.completeQuerySettingKey(lastArg);
          }
          // Complete template values when setting template
          if (args.length >= 2 && args[1] === 'template') {
            if (args.length === 3 || (args.length === 4 && !fullLine.endsWith(' '))) {
              return this.completeTemplateValue(lastArg);
            }
          }
        }
        break;
    }

    return [[], fullLine];
  }

  /**
   * Complete collection names
   */
  private completeCollectionName(partial: string): [string[], string] {
    // Refresh cache if expired
    const now = Date.now();
    if (now - this.lastCacheUpdate > this.cacheExpiryMs) {
      this.refreshCollectionCache();
    }

    const matches = this.collectionNamesCache.filter(n => n.startsWith(partial));
    return [matches.length > 0 ? matches : this.collectionNamesCache, partial];
  }

  /**
   * Complete import setting keys
   */
  private completeImportSettingKey(partial: string): [string[], string] {
    const keys = ['chunk-size', 'chunk-overlap', 'checkpoint-interval', 'embedding-model'];
    const matches = keys.filter(k => k.startsWith(partial));
    return [matches.length > 0 ? matches : keys, partial];
  }

  /**
   * Complete query setting keys
   */
  private completeQuerySettingKey(partial: string): [string[], string] {
    const keys = ['top-k', 'temperature', 'max-tokens', 'template'];
    const matches = keys.filter(k => k.startsWith(partial));
    return [matches.length > 0 ? matches : keys, partial];
  }

  /**
   * Complete template values
   */
  private completeTemplateValue(partial: string): [string[], string] {
    const templates = ['default', 'concise', 'detailed', 'technical'];
    const matches = templates.filter(t => t.startsWith(partial));
    return [matches.length > 0 ? matches : templates, partial];
  }

  /**
   * Refresh collection names cache asynchronously
   */
  private async refreshCollectionCache(): Promise<void> {
    try {
      const collections = await this.collectionManager.listCollections();
      this.collectionNamesCache = collections.map(c => c.name);
      this.lastCacheUpdate = Date.now();
    } catch {
      // Ignore errors, use stale cache
    }
  }
}
