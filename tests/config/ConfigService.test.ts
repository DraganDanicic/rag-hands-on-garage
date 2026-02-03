/**
 * Tests for ConfigService
 *
 * These tests verify that:
 * 1. Configuration service loads environment variables correctly
 * 2. Default values are applied when environment variables are not set
 * 3. Required API keys throw errors when missing
 * 4. Invalid numeric values fall back to defaults with warnings
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ConfigService } from '../../src/config/ConfigService.js';

describe('ConfigService', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Required API Keys', () => {
    it('should throw error when OPENAI_API_KEY is missing', () => {
      delete process.env['OPENAI_API_KEY'];
      process.env['GEMINI_API_KEY'] = 'test-gemini-key';

      expect(() => new ConfigService()).toThrow(
        'Required environment variable OPENAI_API_KEY is not set'
      );
    });

    it('should throw error when GEMINI_API_KEY is missing', () => {
      process.env['OPENAI_API_KEY'] = 'test-openai-key';
      delete process.env['GEMINI_API_KEY'];

      expect(() => new ConfigService()).toThrow(
        'Required environment variable GEMINI_API_KEY is not set'
      );
    });

    it('should load API keys when both are provided', () => {
      process.env['OPENAI_API_KEY'] = 'test-openai-key';
      process.env['GEMINI_API_KEY'] = 'test-gemini-key';

      const config = new ConfigService();

      expect(config.getOpenAiApiKey()).toBe('test-openai-key');
      expect(config.getGeminiApiKey()).toBe('test-gemini-key');
    });
  });

  describe('Default Values', () => {
    beforeEach(() => {
      // Set required API keys
      process.env['OPENAI_API_KEY'] = 'test-openai-key';
      process.env['GEMINI_API_KEY'] = 'test-gemini-key';
    });

    it('should use default chunkSize of 500 when not specified', () => {
      delete process.env['CHUNK_SIZE'];

      const config = new ConfigService();

      expect(config.getChunkSize()).toBe(500);
    });

    it('should use default chunkOverlap of 50 when not specified', () => {
      delete process.env['CHUNK_OVERLAP'];

      const config = new ConfigService();

      expect(config.getChunkOverlap()).toBe(50);
    });

    it('should use default topK of 3 when not specified', () => {
      delete process.env['TOP_K'];

      const config = new ConfigService();

      expect(config.getTopK()).toBe(3);
    });

    it('should use default documentsPath when not specified', () => {
      delete process.env['DOCUMENTS_PATH'];

      const config = new ConfigService();
      const path = config.getDocumentsPath();

      expect(path).toContain('documents');
    });

    it('should use default embeddingsPath when not specified', () => {
      delete process.env['EMBEDDINGS_PATH'];

      const config = new ConfigService();
      const path = config.getEmbeddingsPath();

      expect(path).toContain('embeddings.json');
    });
  });

  describe('Custom Values', () => {
    beforeEach(() => {
      // Set required API keys
      process.env['OPENAI_API_KEY'] = 'test-openai-key';
      process.env['GEMINI_API_KEY'] = 'test-gemini-key';
    });

    it('should use custom chunkSize when provided', () => {
      process.env['CHUNK_SIZE'] = '1000';

      const config = new ConfigService();

      expect(config.getChunkSize()).toBe(1000);
    });

    it('should use custom chunkOverlap when provided', () => {
      process.env['CHUNK_OVERLAP'] = '100';

      const config = new ConfigService();

      expect(config.getChunkOverlap()).toBe(100);
    });

    it('should use custom topK when provided', () => {
      process.env['TOP_K'] = '5';

      const config = new ConfigService();

      expect(config.getTopK()).toBe(5);
    });

    it('should use custom documentsPath when provided', () => {
      process.env['DOCUMENTS_PATH'] = '/custom/documents';

      const config = new ConfigService();

      expect(config.getDocumentsPath()).toBe('/custom/documents');
    });

    it('should use custom embeddingsPath when provided', () => {
      process.env['EMBEDDINGS_PATH'] = '/custom/embeddings.json';

      const config = new ConfigService();

      expect(config.getEmbeddingsPath()).toBe('/custom/embeddings.json');
    });
  });

  describe('Invalid Values', () => {
    beforeEach(() => {
      // Set required API keys
      process.env['OPENAI_API_KEY'] = 'test-openai-key';
      process.env['GEMINI_API_KEY'] = 'test-gemini-key';
    });

    it('should fallback to default when chunkSize is invalid', () => {
      process.env['CHUNK_SIZE'] = 'invalid';

      const config = new ConfigService();

      expect(config.getChunkSize()).toBe(500); // default
    });

    it('should fallback to default when chunkOverlap is invalid', () => {
      process.env['CHUNK_OVERLAP'] = 'invalid';

      const config = new ConfigService();

      expect(config.getChunkOverlap()).toBe(50); // default
    });

    it('should fallback to default when topK is invalid', () => {
      process.env['TOP_K'] = 'invalid';

      const config = new ConfigService();

      expect(config.getTopK()).toBe(3); // default
    });
  });
});
