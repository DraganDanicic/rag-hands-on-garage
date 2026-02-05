import { IConfigService } from './IConfigService.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Configuration service implementation
 * Loads configuration from environment variables with defaults
 */
export class ConfigService implements IConfigService {
  private readonly llmFarmApiKey: string;
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;
  private readonly topK: number;
  private readonly documentsPath: string;
  private readonly embeddingsPath: string;

  constructor() {
    // Load environment variables from .env file
    dotenv.config();

    // Get current file's directory for resolving relative paths
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectRoot = path.resolve(__dirname, '../..');

    // Load API key (required)
    this.llmFarmApiKey = this.getRequiredEnvVar('LLM_FARM_API_KEY');

    // Load optional configuration with defaults
    this.chunkSize = this.parseNumber(process.env['CHUNK_SIZE'], 500);
    this.chunkOverlap = this.parseNumber(process.env['CHUNK_OVERLAP'], 50);
    this.topK = this.parseNumber(process.env['TOP_K'], 3);

    // Load paths with defaults
    this.documentsPath = process.env['DOCUMENTS_PATH'] ?? path.join(projectRoot, 'documents');
    this.embeddingsPath = process.env['EMBEDDINGS_PATH'] ?? path.join(projectRoot, 'data', 'embeddings.json');
  }

  getLlmFarmApiKey(): string {
    return this.llmFarmApiKey;
  }

  getChunkSize(): number {
    return this.chunkSize;
  }

  getChunkOverlap(): number {
    return this.chunkOverlap;
  }

  getTopK(): number {
    return this.topK;
  }

  getDocumentsPath(): string {
    return this.documentsPath;
  }

  getEmbeddingsPath(): string {
    return this.embeddingsPath;
  }

  /**
   * Get required environment variable or throw error
   */
  private getRequiredEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(
        `Required environment variable ${name} is not set. ` +
        `Please check your .env file or environment configuration.`
      );
    }
    return value;
  }

  /**
   * Parse number from environment variable with fallback to default
   */
  private parseNumber(value: string | undefined, defaultValue: number): number {
    if (!value) {
      return defaultValue;
    }

    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      console.warn(`Invalid number value "${value}", using default: ${defaultValue}`);
      return defaultValue;
    }

    return parsed;
  }
}
