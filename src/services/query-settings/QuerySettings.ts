/**
 * Query Settings Implementation
 *
 * Manages runtime query parameters with persistence to JSON.
 * Settings affect query behavior but not data structure (unlike ImportSettings).
 */

import fs from 'fs/promises';
import path from 'path';
import type { IConfigService } from '../../config/IConfigService.js';
import type {
  IQuerySettings,
  QuerySettingsData
} from './IQuerySettings.js';
import {
  DEFAULT_QUERY_SETTINGS,
  QUERY_SETTINGS_CONSTRAINTS
} from './IQuerySettings.js';

export class QuerySettings implements IQuerySettings {
  private settings: QuerySettingsData;
  private readonly settingsPath: string;

  constructor(private readonly configService: IConfigService) {
    this.settings = { ...DEFAULT_QUERY_SETTINGS };

    // Store settings in data directory (same directory as embeddings)
    const embeddingsPath = this.configService.getEmbeddingsPath();
    const dataDir = path.dirname(embeddingsPath);
    this.settingsPath = path.join(dataDir, '..', 'query-settings.json');
  }

  async initialize(): Promise<void> {
    await this.load();
  }

  // Getters
  getTopK(): number {
    return this.settings.topK;
  }

  getTemperature(): number {
    return this.settings.temperature;
  }

  getMaxTokens(): number {
    return this.settings.maxTokens;
  }

  getPromptTemplate(): string {
    return this.settings.promptTemplate;
  }

  getShowPrompt(): boolean {
    return this.settings.showPrompt;
  }

  // Setters with validation
  setTopK(value: number): void {
    const { min, max } = QUERY_SETTINGS_CONSTRAINTS.topK;
    if (value < min || value > max) {
      throw new Error(`Top-K must be between ${min} and ${max}`);
    }
    this.settings.topK = Math.round(value);
  }

  setTemperature(value: number): void {
    const { min, max } = QUERY_SETTINGS_CONSTRAINTS.temperature;
    if (value < min || value > max) {
      throw new Error(`Temperature must be between ${min} and ${max}`);
    }
    this.settings.temperature = value;
  }

  setMaxTokens(value: number): void {
    const { min, max } = QUERY_SETTINGS_CONSTRAINTS.maxTokens;
    if (value < min || value > max) {
      throw new Error(`Max tokens must be between ${min} and ${max}`);
    }
    this.settings.maxTokens = Math.round(value);
  }

  setPromptTemplate(template: string): void {
    // For now, accept any string. Future: validate against available templates
    this.settings.promptTemplate = template;
  }

  setShowPrompt(value: boolean): void {
    this.settings.showPrompt = value;
  }

  // Utilities
  resetToDefaults(): void {
    this.settings = { ...DEFAULT_QUERY_SETTINGS };
  }

  getAllSettings(): QuerySettingsData {
    return { ...this.settings };
  }

  async save(): Promise<void> {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.settingsPath), { recursive: true });

      // Write settings with pretty formatting
      await fs.writeFile(
        this.settingsPath,
        JSON.stringify(this.settings, null, 2),
        'utf-8'
      );
    } catch (error) {
      throw new Error(`Failed to save query settings: ${error}`);
    }
  }

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      const loaded = JSON.parse(data) as QuerySettingsData;

      // Validate loaded settings
      this.validateSettings(loaded);

      this.settings = loaded;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist - use defaults and create file
        this.settings = { ...DEFAULT_QUERY_SETTINGS };
        await this.save();
      } else if (error instanceof SyntaxError) {
        // Corrupted JSON - use defaults
        console.warn('Warning: Corrupted query settings file, using defaults');
        this.settings = { ...DEFAULT_QUERY_SETTINGS };
        await this.save();
      } else {
        throw new Error(`Failed to load query settings: ${error}`);
      }
    }
  }

  private validateSettings(settings: QuerySettingsData): void {
    // Validate all numeric settings
    const { topK, temperature, maxTokens } = settings;

    if (topK < QUERY_SETTINGS_CONSTRAINTS.topK.min ||
        topK > QUERY_SETTINGS_CONSTRAINTS.topK.max) {
      throw new Error('Invalid topK value in settings file');
    }

    if (temperature < QUERY_SETTINGS_CONSTRAINTS.temperature.min ||
        temperature > QUERY_SETTINGS_CONSTRAINTS.temperature.max) {
      throw new Error('Invalid temperature value in settings file');
    }

    if (maxTokens < QUERY_SETTINGS_CONSTRAINTS.maxTokens.min ||
        maxTokens > QUERY_SETTINGS_CONSTRAINTS.maxTokens.max) {
      throw new Error('Invalid maxTokens value in settings file');
    }
  }
}
