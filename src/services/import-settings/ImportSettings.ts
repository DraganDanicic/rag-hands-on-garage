import { promises as fs } from 'fs';
import path from 'path';
import type { IImportSettings } from './IImportSettings.js';
import type { ImportSettingsData } from './models/ImportSettingsData.js';
import { DEFAULT_IMPORT_SETTINGS } from './models/ImportSettingsData.js';
import type { IConfigService } from '../../config/IConfigService.js';

/**
 * Import settings service implementation
 * Manages global import settings with file persistence
 */
export class ImportSettings implements IImportSettings {
  private settings!: ImportSettingsData;
  private settingsPath: string;

  constructor(configService: IConfigService) {
    // Settings file path: data/import-settings.json
    const embeddingsPath = configService.getEmbeddingsPath();
    const dataDir = path.dirname(path.dirname(embeddingsPath));
    this.settingsPath = path.join(dataDir, 'import-settings.json');

    // Initialize with defaults
    this.resetToDefaults();
  }

  async initialize(): Promise<void> {
    try {
      await this.load();
    } catch {
      // File doesn't exist yet, use defaults
      // This is normal for first run
    }
  }

  async save(): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.settingsPath);
    await fs.mkdir(dir, { recursive: true });

    // Write settings to file
    await fs.writeFile(
      this.settingsPath,
      JSON.stringify(this.settings, null, 2),
      'utf-8'
    );
  }

  async load(): Promise<void> {
    const data = await fs.readFile(this.settingsPath, 'utf-8');
    this.settings = JSON.parse(data) as ImportSettingsData;
  }

  resetToDefaults(): void {
    this.settings = { ...DEFAULT_IMPORT_SETTINGS };
  }

  getChunkSize(): number {
    return this.settings.chunkSize;
  }

  getChunkOverlap(): number {
    return this.settings.chunkOverlap;
  }

  getCheckpointInterval(): number {
    return this.settings.checkpointInterval;
  }

  getEmbeddingModel(): string {
    return this.settings.embeddingModel;
  }

  setChunkSize(size: number): void {
    if (size <= 0) {
      throw new Error('Chunk size must be positive');
    }
    if (size < this.settings.chunkOverlap) {
      throw new Error('Chunk size must be greater than chunk overlap');
    }
    this.settings.chunkSize = size;
  }

  setChunkOverlap(overlap: number): void {
    if (overlap < 0) {
      throw new Error('Chunk overlap must be non-negative');
    }
    if (overlap >= this.settings.chunkSize) {
      throw new Error('Chunk overlap must be less than chunk size');
    }
    this.settings.chunkOverlap = overlap;
  }

  setCheckpointInterval(interval: number): void {
    if (interval <= 0) {
      throw new Error('Checkpoint interval must be positive');
    }
    this.settings.checkpointInterval = interval;
  }

  setEmbeddingModel(model: string): void {
    if (!model || model.trim().length === 0) {
      throw new Error('Embedding model cannot be empty');
    }
    this.settings.embeddingModel = model.trim();
  }

  getAllSettings(): ImportSettingsData {
    return { ...this.settings };
  }
}
