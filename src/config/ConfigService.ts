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
  private readonly chunksPath: string;
  private readonly promptsPath: string;

  // LLM Configuration
  private readonly llmModel: string;
  private readonly llmTemperature: number;
  private readonly llmMaxTokens: number;

  // Embedding Configuration
  private readonly embeddingModel: string;

  // Prompt Template Configuration
  private readonly promptTemplatePath: string | undefined;
  private readonly promptTemplate: string | undefined;

  // Performance & Reliability Configuration
  private readonly checkpointInterval: number;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly embeddingApiTimeoutMs: number;
  private readonly llmApiTimeoutMs: number;

  // Proxy Configuration
  private readonly proxyEnabled: boolean;
  private readonly proxyHost: string;
  private readonly proxyPort: number;

  // Store project root for path resolution
  private readonly projectRoot: string;

  constructor(collectionName: string = 'default') {
    // Load environment variables from .env file
    dotenv.config();

    // Get current file's directory for resolving relative paths
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.projectRoot = path.resolve(__dirname, '../..');

    // Load API key (required)
    this.llmFarmApiKey = this.getRequiredEnvVar('LLM_FARM_API_KEY');

    // Load chunking configuration with defaults
    this.chunkSize = this.parseNumber(process.env['CHUNK_SIZE'], 500);
    this.chunkOverlap = this.parseNumber(process.env['CHUNK_OVERLAP'], 50);
    this.topK = this.parseNumber(process.env['TOP_K'], 3);

    // Load LLM configuration with defaults
    this.llmModel = process.env['LLM_MODEL'] ?? 'gemini-2.0-flash-lite';
    this.llmTemperature = this.parseFloat(process.env['LLM_TEMPERATURE'], 0.7);
    this.llmMaxTokens = this.parseNumber(process.env['LLM_MAX_TOKENS'], 2048);

    // Load embedding configuration with defaults
    this.embeddingModel = process.env['EMBEDDING_MODEL'] ?? 'askbosch-prod-farm-openai-text-embedding-3-small';

    // Load prompt template configuration
    this.promptTemplatePath = process.env['PROMPT_TEMPLATE_PATH'];
    this.promptTemplate = process.env['PROMPT_TEMPLATE'];

    // Load performance & reliability configuration with defaults
    this.checkpointInterval = this.parseNumber(process.env['CHECKPOINT_INTERVAL'], 50);
    this.maxRetries = this.parseNumber(process.env['MAX_RETRIES'], 3);
    this.retryDelayMs = this.parseNumber(process.env['RETRY_DELAY_MS'], 1000);
    this.embeddingApiTimeoutMs = this.parseNumber(process.env['EMBEDDING_API_TIMEOUT_MS'], 30000);
    this.llmApiTimeoutMs = this.parseNumber(process.env['LLM_API_TIMEOUT_MS'], 60000);

    // Load proxy configuration with defaults
    this.proxyEnabled = this.parseBoolean(process.env['PROXY_ENABLED'], false);
    this.proxyHost = process.env['PROXY_HOST'] ?? '127.0.0.1';
    this.proxyPort = this.parseNumber(process.env['PROXY_PORT'], 3128);

    // Load paths with defaults
    this.documentsPath = process.env['DOCUMENTS_PATH'] ?? path.join(this.projectRoot, 'documents');
    this.promptsPath = process.env['PROMPTS_PATH'] ?? path.join(this.projectRoot, 'prompts');

    // Collection-specific paths
    const collectionsDir = process.env['COLLECTIONS_PATH'] ?? path.join(this.projectRoot, 'data', 'collections');
    const chunksDir = process.env['CHUNKS_PATH'] ?? path.join(this.projectRoot, 'data', 'chunks');

    this.embeddingsPath = path.join(collectionsDir, `${collectionName}.embeddings.json`);
    this.chunksPath = path.join(chunksDir, `${collectionName}.chunks.json`);
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

  getChunksPath(): string {
    return this.chunksPath;
  }

  // LLM Configuration getters
  getLlmModel(): string {
    return this.llmModel;
  }

  getLlmTemperature(): number {
    return this.llmTemperature;
  }

  getLlmMaxTokens(): number {
    return this.llmMaxTokens;
  }

  // Embedding Configuration getters
  getEmbeddingModel(): string {
    return this.embeddingModel;
  }

  // Prompt Template Configuration getters
  getPromptTemplatePath(): string | undefined {
    return this.promptTemplatePath;
  }

  getPromptTemplate(): string | undefined {
    return this.promptTemplate;
  }

  getPromptsPath(): string {
    return this.promptsPath;
  }

  // Performance & Reliability Configuration getters
  getCheckpointInterval(): number {
    return this.checkpointInterval;
  }

  getMaxRetries(): number {
    return this.maxRetries;
  }

  getRetryDelayMs(): number {
    return this.retryDelayMs;
  }

  getEmbeddingApiTimeoutMs(): number {
    return this.embeddingApiTimeoutMs;
  }

  getLlmApiTimeoutMs(): number {
    return this.llmApiTimeoutMs;
  }

  // Proxy Configuration getters
  isProxyEnabled(): boolean {
    return this.proxyEnabled;
  }

  getProxyHost(): string {
    return this.proxyHost;
  }

  getProxyPort(): number {
    return this.proxyPort;
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

  /**
   * Parse float from environment variable with fallback to default
   */
  private parseFloat(value: string | undefined, defaultValue: number): number {
    if (!value) {
      return defaultValue;
    }

    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      console.warn(`Invalid float value "${value}", using default: ${defaultValue}`);
      return defaultValue;
    }

    return parsed;
  }

  /**
   * Parse boolean from environment variable with fallback to default
   */
  private parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (!value) {
      return defaultValue;
    }

    const normalized = value.toLowerCase().trim();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
      return true;
    }
    if (normalized === 'false' || normalized === '0' || normalized === 'no') {
      return false;
    }

    console.warn(`Invalid boolean value "${value}", using default: ${defaultValue}`);
    return defaultValue;
  }
}
