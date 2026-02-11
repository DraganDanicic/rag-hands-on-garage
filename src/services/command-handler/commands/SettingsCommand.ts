import chalk from 'chalk';
import type { ICommandHandler } from '../ICommandHandler.js';
import type { CommandResult } from '../models/CommandResult.js';
import type { CommandHelp } from '../models/CommandHelp.js';
import type { ChatContext } from '../models/ChatContext.js';
import type { IQuerySettings } from '../../query-settings/IQuerySettings.js';
import type { IImportSettings } from '../../import-settings/IImportSettings.js';
import { QUERY_SETTINGS_CONSTRAINTS } from '../../query-settings/index.js';

/**
 * Unified settings command - manages all runtime and import settings
 */
export class SettingsCommand implements ICommandHandler {

  // Key aliases mapping - normalizes user input
  private readonly KEY_ALIASES: Record<string, string[]> = {
    'top-k': ['top k', 'topk', 'top_k', 'top-k'],
    'temperature': ['temp', 'temperature'],
    'max-tokens': ['max tokens', 'maxtokens', 'max_tokens', 'tokens', 'max-tokens'],
    'template': ['prompt-template', 'prompt template', 'prompt_template', 'template'],
    'show-prompt': ['show-prompt', 'showprompt', 'show_prompt', 'show prompt'],
    'chunk-size': ['chunk size', 'chunksize', 'chunk_size', 'chunk-size'],
    'chunk-overlap': ['chunk overlap', 'chunkoverlap', 'chunk_overlap', 'overlap', 'chunk-overlap'],
    'checkpoint-interval': ['checkpoint interval', 'checkpoint', 'checkpoint_interval', 'checkpoint-interval'],
    'embedding-model': ['embedding model', 'embeddingmodel', 'embedding_model', 'model', 'embedding-model'],
  };

  async execute(args: string, context: ChatContext): Promise<CommandResult> {
    const parts = args.trim().split(/\s+/).filter(p => p.length > 0);

    // No args: show all settings
    if (parts.length === 0) {
      return this.showAllSettings(context);
    }

    const subcommand = parts[0]?.toLowerCase();

    // /settings reset
    if (subcommand === 'reset') {
      return this.resetAllSettings(context);
    }

    // /settings help
    if (subcommand === 'help') {
      return this.showHelp();
    }

    // /settings set <key> <value>
    if (subcommand === 'set' && parts.length >= 3) {
      const key = parts[1]!;
      const value = parts.slice(2).join(' ');
      return this.setSetting(context, key, value);
    }

    // Invalid usage
    return this.showHelp();
  }

  private async showAllSettings(context: ChatContext): Promise<CommandResult> {
    const config = context.configService;
    const querySettings = context.container.getQuerySettings();
    const importSettings = context.container.getImportSettings();

    const qSettings = querySettings.getAllSettings();
    const iSettings = importSettings.getAllSettings();

    const lines = [
      '',
      chalk.blue.bold('Current Settings:'),
      '',
      chalk.cyan('Runtime Query Settings') + chalk.gray(' (modifiable, affects current session):'),
      `  ${'Top K (embeddings):'.padEnd(25)} ${chalk.white(qSettings.topK)} chunks`,
      `  ${'Temperature:'.padEnd(25)} ${chalk.white(qSettings.temperature)}`,
      `  ${'Max Tokens:'.padEnd(25)} ${chalk.white(qSettings.maxTokens)}`,
      `  ${'Prompt Template:'.padEnd(25)} ${chalk.white(qSettings.promptTemplate)}`,
      `  ${'Show Prompt:'.padEnd(25)} ${chalk.white(qSettings.showPrompt ? 'enabled' : 'disabled')}`,
      '',
      chalk.cyan('Import Settings') + chalk.gray(' (for NEW collections only):'),
      `  ${'Chunk Size:'.padEnd(25)} ${chalk.white(iSettings.chunkSize)} characters`,
      `  ${'Chunk Overlap:'.padEnd(25)} ${chalk.white(iSettings.chunkOverlap)} characters`,
      `  ${'Checkpoint Interval:'.padEnd(25)} ${chalk.white(iSettings.checkpointInterval)} chunks`,
      `  ${'Embedding Model:'.padEnd(25)} ${chalk.white(iSettings.embeddingModel)}`,
      '',
      chalk.cyan('System Configuration') + chalk.gray(' (from .env, read-only):'),
      `  ${'LLM Model:'.padEnd(25)} ${chalk.white(config.getLlmModel())}`,
      `  ${'Documents Path:'.padEnd(25)} ${chalk.white(config.getDocumentsPath())}`,
      '',
      chalk.gray('Commands:'),
      chalk.gray('  /settings set <key> <value>  - Change a setting'),
      chalk.gray('  /settings reset              - Reset to defaults'),
      chalk.gray('  /settings help               - Show detailed help'),
      '',
    ];

    return {
      shouldExit: false,
      message: lines.join('\n'),
    };
  }

  private async setSetting(context: ChatContext, userKey: string, value: string): Promise<CommandResult> {
    // Normalize key using aliases
    const normalizedKey = this.normalizeKey(userKey);

    if (!normalizedKey) {
      return {
        shouldExit: false,
        message: chalk.red(`\n✗ Unknown setting: ${userKey}\n`) +
                 chalk.gray('Use /settings help to see available settings\n')
      };
    }

    // Route to appropriate service
    const querySettings = context.container.getQuerySettings();
    const importSettings = context.container.getImportSettings();

    try {
      // Query settings (runtime)
      if (['top-k', 'temperature', 'max-tokens', 'template', 'show-prompt'].includes(normalizedKey)) {
        return await this.setQuerySetting(querySettings, normalizedKey, value);
      }

      // Import settings (global defaults)
      if (['chunk-size', 'chunk-overlap', 'checkpoint-interval', 'embedding-model'].includes(normalizedKey)) {
        return await this.setImportSetting(importSettings, normalizedKey, value);
      }

      return {
        shouldExit: false,
        message: chalk.red(`\n✗ Unknown setting category\n`)
      };

    } catch (error) {
      return {
        shouldExit: false,
        message: chalk.red(`\n✗ Error: ${error instanceof Error ? error.message : String(error)}\n`)
      };
    }
  }

  private async setQuerySetting(querySettings: IQuerySettings, key: string, value: string): Promise<CommandResult> {
    switch (key) {
      case 'top-k': {
        const topK = parseInt(value, 10);
        if (isNaN(topK)) throw new Error('Top-K must be a number');
        querySettings.setTopK(topK);
        await querySettings.save();
        return {
          shouldExit: false,
          message: chalk.green(`\n✓ Top-K set to ${topK} chunks\n`)
        };
      }

      case 'temperature': {
        const temp = parseFloat(value);
        if (isNaN(temp)) throw new Error('Temperature must be a number');
        querySettings.setTemperature(temp);
        await querySettings.save();
        return {
          shouldExit: false,
          message: chalk.green(`\n✓ Temperature set to ${temp}\n`)
        };
      }

      case 'max-tokens': {
        const maxTokens = parseInt(value, 10);
        if (isNaN(maxTokens)) throw new Error('Max tokens must be a number');
        querySettings.setMaxTokens(maxTokens);
        await querySettings.save();
        return {
          shouldExit: false,
          message: chalk.green(`\n✓ Max tokens set to ${maxTokens}\n`)
        };
      }

      case 'template': {
        // Validate template exists before setting
        const validTemplates = ['default', 'concise', 'detailed', 'technical'];
        const templateLower = value.toLowerCase();

        // Check if it's a built-in template
        const isBuiltIn = validTemplates.includes(templateLower);

        // Check if it's a file path (contains / or \)
        const isFilePath = value.includes('/') || value.includes('\\');

        if (!isBuiltIn && !isFilePath) {
          return {
            shouldExit: false,
            message: chalk.red(`\n✗ Unknown template: '${value}'\n`) +
                     chalk.yellow('Available built-in templates:\n') +
                     validTemplates.map(t => chalk.gray(`  - ${t}`)).join('\n') + '\n' +
                     chalk.gray('\nOr provide a file path to a custom template.\n')
          };
        }

        querySettings.setPromptTemplate(value);
        await querySettings.save();
        return {
          shouldExit: false,
          message: chalk.green(`\n✓ Prompt template set to '${value}'\n`) +
                   (isBuiltIn ? '' : chalk.gray('(Custom template file will be loaded on next query)\n'))
        };
      }

      case 'show-prompt': {
        const enabled = ['true', '1', 'yes', 'on', 'enabled'].includes(value.toLowerCase());
        querySettings.setShowPrompt(enabled);
        await querySettings.save();
        return {
          shouldExit: false,
          message: chalk.green(`\n✓ Show prompt ${enabled ? 'enabled' : 'disabled'}\n`)
        };
      }

      default:
        throw new Error('Unknown query setting');
    }
  }

  private async setImportSetting(importSettings: IImportSettings, key: string, value: string): Promise<CommandResult> {
    switch (key) {
      case 'chunk-size': {
        const size = parseInt(value, 10);
        if (isNaN(size)) throw new Error('Chunk size must be a number');
        importSettings.setChunkSize(size);
        await importSettings.save();
        return {
          shouldExit: false,
          message: chalk.green(`\n✓ Chunk size set to ${size} characters\n`) +
                   chalk.gray('(Applies to new collections only)\n')
        };
      }

      case 'chunk-overlap': {
        const overlap = parseInt(value, 10);
        if (isNaN(overlap)) throw new Error('Chunk overlap must be a number');
        importSettings.setChunkOverlap(overlap);
        await importSettings.save();
        return {
          shouldExit: false,
          message: chalk.green(`\n✓ Chunk overlap set to ${overlap} characters\n`) +
                   chalk.gray('(Applies to new collections only)\n')
        };
      }

      case 'checkpoint-interval': {
        const interval = parseInt(value, 10);
        if (isNaN(interval)) throw new Error('Checkpoint interval must be a number');
        importSettings.setCheckpointInterval(interval);
        await importSettings.save();
        return {
          shouldExit: false,
          message: chalk.green(`\n✓ Checkpoint interval set to ${interval} chunks\n`) +
                   chalk.gray('(Applies to new collections only)\n')
        };
      }

      case 'embedding-model': {
        importSettings.setEmbeddingModel(value);
        await importSettings.save();
        return {
          shouldExit: false,
          message: chalk.green(`\n✓ Embedding model set to '${value}'\n`) +
                   chalk.gray('(Applies to new collections only)\n')
        };
      }

      default:
        throw new Error('Unknown import setting');
    }
  }

  private async resetAllSettings(context: ChatContext): Promise<CommandResult> {
    const querySettings = context.container.getQuerySettings();
    const importSettings = context.container.getImportSettings();

    querySettings.resetToDefaults();
    await querySettings.save();

    importSettings.resetToDefaults();
    await importSettings.save();

    return {
      shouldExit: false,
      message: chalk.green('\n✓ All settings reset to defaults\n') +
               chalk.gray('Use /settings to view current values\n')
    };
  }

  private normalizeKey(userKey: string): string | null {
    const lowerKey = userKey.toLowerCase().trim();

    // Check each canonical key and its aliases
    for (const [canonical, aliases] of Object.entries(this.KEY_ALIASES)) {
      if (aliases.includes(lowerKey)) {
        return canonical;
      }
    }

    return null;
  }

  private showHelp(): CommandResult {
    const lines = [
      '',
      chalk.blue.bold('Settings Command Help'),
      '',
      chalk.cyan('Usage:'),
      '  /settings                     - View all settings',
      '  /settings set <key> <value>   - Change a setting',
      '  /settings reset               - Reset all to defaults',
      '  /settings help                - Show this help',
      '',
      chalk.cyan('Available Settings:'),
      '',
      chalk.yellow('Runtime Query Settings:'),
      `  top-k           Number of embeddings to retrieve (${QUERY_SETTINGS_CONSTRAINTS.topK.min}-${QUERY_SETTINGS_CONSTRAINTS.topK.max})`,
      `  temperature     LLM temperature (${QUERY_SETTINGS_CONSTRAINTS.temperature.min}-${QUERY_SETTINGS_CONSTRAINTS.temperature.max})`,
      `  max-tokens      Maximum response tokens (${QUERY_SETTINGS_CONSTRAINTS.maxTokens.min}-${QUERY_SETTINGS_CONSTRAINTS.maxTokens.max})`,
      '  template        Prompt template (default, concise, detailed, technical)',
      '  show-prompt     Show prompt before queries (true/false)',
      '',
      chalk.yellow('Import Settings (for new collections):'),
      '  chunk-size         Characters per chunk (100-5000)',
      '  chunk-overlap      Overlapping characters (0-500)',
      '  checkpoint-interval Save frequency in chunks (1-1000)',
      '  embedding-model    Model name for embeddings',
      '',
      chalk.cyan('Examples:'),
      '  /settings set top-k 5',
      '  /settings set "max tokens" 2000',
      '  /settings set temperature 0.9',
      '  /settings set chunk-size 600',
      '',
      chalk.gray('Note: Key names are flexible - you can use spaces, hyphens, or underscores.'),
      '',
    ];

    return {
      shouldExit: false,
      message: lines.join('\n'),
    };
  }

  getHelp(): CommandHelp {
    return {
      name: 'settings',
      description: 'View and modify all settings (query and import)',
    };
  }
}
