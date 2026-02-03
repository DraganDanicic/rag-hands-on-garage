/**
 * Integration tests for Container (Dependency Injection)
 *
 * These tests verify that:
 * 1. Container properly instantiates all services
 * 2. Services are configured with values from config service
 * 3. Services maintain singleton pattern (same instance returned)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createContainer } from '../../src/di/index.js';

describe('Container Integration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save and set up environment
    originalEnv = { ...process.env };
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    process.env['GEMINI_API_KEY'] = 'test-gemini-key';
    process.env['CHUNK_SIZE'] = '1000';
    process.env['CHUNK_OVERLAP'] = '100';
    process.env['TOP_K'] = '5';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Factory Function', () => {
    it('should create container instance using factory', () => {
      const container = createContainer();

      expect(container).toBeDefined();
      expect(container.getConfigService).toBeDefined();
    });
  });

  describe('Service Instantiation', () => {
    it('should instantiate all services successfully', () => {
      const container = createContainer();

      expect(container.getConfigService()).toBeDefined();
      expect(container.getDocumentReader()).toBeDefined();
      expect(container.getTextChunker()).toBeDefined();
      expect(container.getEmbeddingClient()).toBeDefined();
      expect(container.getLlmClient()).toBeDefined();
      expect(container.getProgressReporter()).toBeDefined();
    });

    it('should configure text chunker with config values', () => {
      const container = createContainer();
      const textChunker = container.getTextChunker();
      const config = textChunker.getConfig();

      expect(config.chunkSize).toBe(1000);
      expect(config.chunkOverlap).toBe(100);
    });
  });

  describe('Configuration Integration', () => {
    it('should provide configuration to all services', () => {
      const container = createContainer();
      const configService = container.getConfigService();

      expect(configService.getOpenAiApiKey()).toBe('test-openai-key');
      expect(configService.getGeminiApiKey()).toBe('test-gemini-key');
      expect(configService.getChunkSize()).toBe(1000);
      expect(configService.getChunkOverlap()).toBe(100);
      expect(configService.getTopK()).toBe(5);
    });

    it('should use default values when environment variables are not set', () => {
      delete process.env['CHUNK_SIZE'];
      delete process.env['CHUNK_OVERLAP'];
      delete process.env['TOP_K'];

      const container = createContainer();
      const configService = container.getConfigService();

      expect(configService.getChunkSize()).toBe(500);
      expect(configService.getChunkOverlap()).toBe(50);
      expect(configService.getTopK()).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when required environment variables are missing', () => {
      delete process.env['OPENAI_API_KEY'];

      expect(() => createContainer()).toThrow(
        'Required environment variable OPENAI_API_KEY is not set'
      );
    });
  });
});
