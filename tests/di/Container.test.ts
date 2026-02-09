/**
 * Tests for Container (Dependency Injection)
 *
 * These tests verify that:
 * 1. Container properly instantiates all services
 * 2. Services are configured with values from config service
 * 3. Services maintain singleton pattern (same instance returned)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Container } from '../../src/di/Container.js';

describe('Container', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save and set up environment
    originalEnv = { ...process.env };
    process.env['LLM_FARM_API_KEY'] = 'test-llm-farm-key';
    process.env['CHUNK_SIZE'] = '1000';
    process.env['CHUNK_OVERLAP'] = '100';
    process.env['TOP_K'] = '5';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Service Instantiation', () => {
    it('should instantiate config service', () => {
      const container = new Container();
      const configService = container.getConfigService();

      expect(configService).toBeDefined();
      expect(configService.getLlmFarmApiKey()).toBe('test-llm-farm-key');
    });

    it('should instantiate document reader service', () => {
      const container = new Container();
      const documentReader = container.getDocumentReader();

      expect(documentReader).toBeDefined();
      expect(typeof documentReader.readDocuments).toBe('function');
    });

    it('should instantiate text chunker service', () => {
      const container = new Container();
      const textChunker = container.getTextChunker();

      expect(textChunker).toBeDefined();
      expect(typeof textChunker.chunkText).toBe('function');
    });

    it('should instantiate embedding client service', () => {
      const container = new Container();
      const embeddingClient = container.getEmbeddingClient();

      expect(embeddingClient).toBeDefined();
      expect(typeof embeddingClient.generateEmbedding).toBe('function');
    });

    it('should instantiate LLM client service', () => {
      const container = new Container();
      const llmClient = container.getLlmClient();

      expect(llmClient).toBeDefined();
      expect(typeof llmClient.generateResponse).toBe('function');
    });

    it('should instantiate progress reporter service', () => {
      const container = new Container();
      const progressReporter = container.getProgressReporter();

      expect(progressReporter).toBeDefined();
      expect(typeof progressReporter.start).toBe('function');
      expect(typeof progressReporter.progress).toBe('function');
    });

    it('should instantiate embedding store service', () => {
      const container = new Container();
      const embeddingStore = container.getEmbeddingStore();

      expect(embeddingStore).toBeDefined();
      expect(typeof embeddingStore.save).toBe('function');
      expect(typeof embeddingStore.load).toBe('function');
    });

    it('should instantiate vector search service', () => {
      const container = new Container();
      const vectorSearch = container.getVectorSearch();

      expect(vectorSearch).toBeDefined();
      expect(typeof vectorSearch.search).toBe('function');
    });

    it('should instantiate prompt builder service', () => {
      const container = new Container();
      const promptBuilder = container.getPromptBuilder();

      expect(promptBuilder).toBeDefined();
      expect(typeof promptBuilder.buildPrompt).toBe('function');
    });
  });

  describe('Service Configuration', () => {
    it('should configure text chunker with config values', () => {
      const container = new Container();
      const textChunker = container.getTextChunker();
      const config = textChunker.getConfig();

      expect(config.chunkSize).toBe(1000);
      expect(config.chunkOverlap).toBe(100);
    });

    it('should configure services with API keys from config', () => {
      const container = new Container();
      const configService = container.getConfigService();

      expect(configService.getLlmFarmApiKey()).toBe('test-llm-farm-key');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same config service instance', () => {
      const container = new Container();
      const service1 = container.getConfigService();
      const service2 = container.getConfigService();

      expect(service1).toBe(service2);
    });

    it('should return same document reader instance', () => {
      const container = new Container();
      const service1 = container.getDocumentReader();
      const service2 = container.getDocumentReader();

      expect(service1).toBe(service2);
    });

    it('should return same text chunker instance', () => {
      const container = new Container();
      const service1 = container.getTextChunker();
      const service2 = container.getTextChunker();

      expect(service1).toBe(service2);
    });

    it('should return same embedding client instance', () => {
      const container = new Container();
      const service1 = container.getEmbeddingClient();
      const service2 = container.getEmbeddingClient();

      expect(service1).toBe(service2);
    });

    it('should return same LLM client instance', () => {
      const container = new Container();
      const service1 = container.getLlmClient();
      const service2 = container.getLlmClient();

      expect(service1).toBe(service2);
    });

    it('should return same progress reporter instance', () => {
      const container = new Container();
      const service1 = container.getProgressReporter();
      const service2 = container.getProgressReporter();

      expect(service1).toBe(service2);
    });

    it('should return same embedding store instance', () => {
      const container = new Container();
      const service1 = container.getEmbeddingStore();
      const service2 = container.getEmbeddingStore();

      expect(service1).toBe(service2);
    });

    it('should return same vector search instance', () => {
      const container = new Container();
      const service1 = container.getVectorSearch();
      const service2 = container.getVectorSearch();

      expect(service1).toBe(service2);
    });

    it('should return same prompt builder instance', () => {
      const container = new Container();
      const service1 = container.getPromptBuilder();
      const service2 = container.getPromptBuilder();

      expect(service1).toBe(service2);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when required environment variables are missing', () => {
      // Clear and set to empty to override dotenv loading
      delete process.env['LLM_FARM_API_KEY'];
      process.env['LLM_FARM_API_KEY'] = '';

      expect(() => new Container()).toThrow(
        'Required environment variable LLM_FARM_API_KEY is not set'
      );
    });
  });
});
