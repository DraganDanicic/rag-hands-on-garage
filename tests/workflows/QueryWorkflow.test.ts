/**
 * Tests for QueryWorkflow
 *
 * These tests verify that:
 * 1. The workflow orchestrates RAG query correctly
 * 2. Query embedding, vector search, prompt building, and LLM call work together
 * 3. Progress is reported at each step
 * 4. Errors are handled gracefully
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { QueryWorkflow } from '../../src/workflows/QueryWorkflow.js';
import { IConfigService } from '../../src/config/IConfigService.js';
import { IEmbeddingClient } from '../../src/services/embedding-client/IEmbeddingClient.js';
import { IEmbeddingStore } from '../../src/services/embedding-store/IEmbeddingStore.js';
import { IVectorSearch } from '../../src/services/vector-search/IVectorSearch.js';
import { IPromptBuilder } from '../../src/services/prompt-builder/IPromptBuilder.js';
import { ILlmClient } from '../../src/services/llm-client/ILlmClient.js';
import { IProgressReporter } from '../../src/services/progress-reporter/IProgressReporter.js';
import { StoredEmbedding } from '../../src/services/embedding-store/models/StoredEmbedding.js';
import { SearchResult } from '../../src/services/vector-search/models/SearchResult.js';
import { LlmResponse } from '../../src/services/llm-client/models/LlmResponse.js';

describe('QueryWorkflow', () => {
  let mockConfigService: jest.Mocked<IConfigService>;
  let mockEmbeddingClient: jest.Mocked<IEmbeddingClient>;
  let mockEmbeddingStore: jest.Mocked<IEmbeddingStore>;
  let mockVectorSearch: jest.Mocked<IVectorSearch>;
  let mockPromptBuilder: jest.Mocked<IPromptBuilder>;
  let mockLlmClient: jest.Mocked<ILlmClient>;
  let mockProgressReporter: jest.Mocked<IProgressReporter>;
  let workflow: QueryWorkflow;

  beforeEach(() => {
    mockConfigService = {
      getTopK: jest.fn(() => 3),
      getDocumentsPath: jest.fn(() => '/docs'),
      getEmbeddingsPath: jest.fn(() => '/embeddings.json'),
      getOpenAiApiKey: jest.fn(() => 'test-key'),
      getGeminiApiKey: jest.fn(() => 'test-key'),
      getLlmFarmApiKey: jest.fn(() => 'test-key'),
      getChunkSize: jest.fn(() => 500),
      getChunkOverlap: jest.fn(() => 50),
    } as jest.Mocked<IConfigService>;

    mockEmbeddingClient = {
      generateEmbedding: jest.fn(),
      generateEmbeddings: jest.fn(),
    } as jest.Mocked<IEmbeddingClient>;

    mockEmbeddingStore = {
      load: jest.fn(),
      save: jest.fn(),
      clear: jest.fn(),
    } as jest.Mocked<IEmbeddingStore>;

    mockVectorSearch = {
      search: jest.fn(),
    } as jest.Mocked<IVectorSearch>;

    mockPromptBuilder = {
      buildPrompt: jest.fn(),
      buildPromptWithTemplate: jest.fn(),
    } as jest.Mocked<IPromptBuilder>;

    mockLlmClient = {
      generateResponse: jest.fn(),
    } as jest.Mocked<ILlmClient>;

    mockProgressReporter = {
      start: jest.fn(),
      progress: jest.fn(),
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    } as jest.Mocked<IProgressReporter>;

    workflow = new QueryWorkflow(
      mockConfigService,
      mockEmbeddingClient,
      mockEmbeddingStore,
      mockVectorSearch,
      mockPromptBuilder,
      mockLlmClient,
      mockProgressReporter
    );
  });

  describe('query', () => {
    it('should successfully execute full RAG query workflow', async () => {
      const question = 'What is RAG?';
      const queryVector = new Array(1536).fill(0.1);
      const storedEmbeddings: StoredEmbedding[] = [
        {
          text: 'RAG stands for Retrieval-Augmented Generation',
          vector: new Array(1536).fill(0.2),
          source: 'doc1.pdf',
        },
        {
          text: 'It combines retrieval with generation',
          vector: new Array(1536).fill(0.3),
          source: 'doc1.pdf',
        },
      ];

      const searchResults: SearchResult[] = [
        {
          embedding: storedEmbeddings[0]!,
          score: 0.95,
          rank: 1,
        },
        {
          embedding: storedEmbeddings[1]!,
          score: 0.85,
          rank: 2,
        },
      ];

      const prompt = 'Context: RAG info\nQuestion: What is RAG?';
      const llmResponse: LlmResponse = {
        text: 'RAG is a technique that combines retrieval with generation.',
      };

      mockEmbeddingClient.generateEmbedding.mockResolvedValue(queryVector);
      mockEmbeddingStore.load.mockResolvedValue(storedEmbeddings);
      mockVectorSearch.search.mockReturnValue(searchResults);
      mockPromptBuilder.buildPrompt.mockReturnValue(prompt);
      mockLlmClient.generateResponse.mockResolvedValue(llmResponse);

      const result = await workflow.query(question);

      expect(result).toBe(llmResponse.text);
      expect(mockEmbeddingClient.generateEmbedding).toHaveBeenCalledWith(question);
      expect(mockEmbeddingStore.load).toHaveBeenCalled();
      expect(mockVectorSearch.search).toHaveBeenCalledWith(
        queryVector,
        storedEmbeddings,
        3
      );
      expect(mockPromptBuilder.buildPrompt).toHaveBeenCalledWith(question, [
        'RAG stands for Retrieval-Augmented Generation',
        'It combines retrieval with generation',
      ]);
      expect(mockLlmClient.generateResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt,
          temperature: 0.7,
        })
      );
      expect(mockProgressReporter.success).toHaveBeenCalledWith(
        'Query completed successfully'
      );
    });

    it('should throw error when no embeddings are stored', async () => {
      mockEmbeddingClient.generateEmbedding.mockResolvedValue(
        new Array(1536).fill(0.1)
      );
      mockEmbeddingStore.load.mockResolvedValue([]);

      await expect(workflow.query('Test question')).rejects.toThrow(
        'No embeddings found in storage'
      );
      expect(mockProgressReporter.error).toHaveBeenCalled();
    });

    it('should throw error when no relevant context found', async () => {
      const storedEmbeddings: StoredEmbedding[] = [
        {
          text: 'Some text',
          vector: new Array(1536).fill(0.1),
        },
      ];

      mockEmbeddingClient.generateEmbedding.mockResolvedValue(
        new Array(1536).fill(0.1)
      );
      mockEmbeddingStore.load.mockResolvedValue(storedEmbeddings);
      mockVectorSearch.search.mockReturnValue([]);

      await expect(workflow.query('Test question')).rejects.toThrow(
        'No relevant context found for the query'
      );
    });

    it('should handle embedding generation errors', async () => {
      const error = new Error('OpenAI API error');
      mockEmbeddingClient.generateEmbedding.mockRejectedValue(error);

      await expect(workflow.query('Test question')).rejects.toThrow('OpenAI API error');
      expect(mockProgressReporter.error).toHaveBeenCalledWith(
        expect.stringContaining('Query workflow failed')
      );
    });

    it('should handle LLM errors', async () => {
      const queryVector = new Array(1536).fill(0.1);
      const storedEmbeddings: StoredEmbedding[] = [
        {
          text: 'Test content',
          vector: new Array(1536).fill(0.2),
        },
      ];

      const searchResults: SearchResult[] = [
        {
          embedding: storedEmbeddings[0]!,
          score: 0.9,
          rank: 1,
        },
      ];

      mockEmbeddingClient.generateEmbedding.mockResolvedValue(queryVector);
      mockEmbeddingStore.load.mockResolvedValue(storedEmbeddings);
      mockVectorSearch.search.mockReturnValue(searchResults);
      mockPromptBuilder.buildPrompt.mockReturnValue('Test prompt');
      mockLlmClient.generateResponse.mockRejectedValue(
        new Error('Gemini API error')
      );

      await expect(workflow.query('Test question')).rejects.toThrow('Gemini API error');
      expect(mockProgressReporter.error).toHaveBeenCalled();
    });

    it('should report progress at each step', async () => {
      const question = 'Test question';
      const queryVector = new Array(1536).fill(0.1);
      const storedEmbeddings: StoredEmbedding[] = [
        {
          text: 'Test content',
          vector: new Array(1536).fill(0.2),
        },
      ];

      const searchResults: SearchResult[] = [
        {
          embedding: storedEmbeddings[0]!,
          score: 0.9,
          rank: 1,
        },
      ];

      const llmResponse: LlmResponse = { text: 'Test response' };

      mockEmbeddingClient.generateEmbedding.mockResolvedValue(queryVector);
      mockEmbeddingStore.load.mockResolvedValue(storedEmbeddings);
      mockVectorSearch.search.mockReturnValue(searchResults);
      mockPromptBuilder.buildPrompt.mockReturnValue('Test prompt');
      mockLlmClient.generateResponse.mockResolvedValue(llmResponse);

      await workflow.query(question);

      expect(mockProgressReporter.info).toHaveBeenCalledWith('Embedding query...');
      expect(mockProgressReporter.info).toHaveBeenCalledWith('Loading embeddings...');
      expect(mockProgressReporter.info).toHaveBeenCalledWith(
        expect.stringContaining('Searching for top')
      );
      expect(mockProgressReporter.info).toHaveBeenCalledWith('Querying LLM...');
      expect(mockProgressReporter.success).toHaveBeenCalledWith(
        'Query completed successfully'
      );
    });

    it('should use topK from config', async () => {
      const customTopK = 5;
      mockConfigService.getTopK.mockReturnValue(customTopK);

      const queryVector = new Array(1536).fill(0.1);
      const storedEmbeddings: StoredEmbedding[] = [
        { text: 'Text 1', vector: new Array(1536).fill(0.2) },
      ];
      const searchResults: SearchResult[] = [
        { embedding: storedEmbeddings[0]!, score: 0.9, rank: 1 },
      ];

      mockEmbeddingClient.generateEmbedding.mockResolvedValue(queryVector);
      mockEmbeddingStore.load.mockResolvedValue(storedEmbeddings);
      mockVectorSearch.search.mockReturnValue(searchResults);
      mockPromptBuilder.buildPrompt.mockReturnValue('Test prompt');
      mockLlmClient.generateResponse.mockResolvedValue({ text: 'Response' });

      await workflow.query('Test question');

      expect(mockVectorSearch.search).toHaveBeenCalledWith(
        queryVector,
        storedEmbeddings,
        customTopK
      );
    });

    it('should extract context texts from search results', async () => {
      const question = 'Test question';
      const storedEmbeddings: StoredEmbedding[] = [
        { text: 'Context 1', vector: new Array(1536).fill(0.2) },
        { text: 'Context 2', vector: new Array(1536).fill(0.3) },
        { text: 'Context 3', vector: new Array(1536).fill(0.4) },
      ];

      const searchResults: SearchResult[] = [
        { embedding: storedEmbeddings[0]!, score: 0.95, rank: 1 },
        { embedding: storedEmbeddings[1]!, score: 0.85, rank: 2 },
        { embedding: storedEmbeddings[2]!, score: 0.75, rank: 3 },
      ];

      mockEmbeddingClient.generateEmbedding.mockResolvedValue(
        new Array(1536).fill(0.1)
      );
      mockEmbeddingStore.load.mockResolvedValue(storedEmbeddings);
      mockVectorSearch.search.mockReturnValue(searchResults);
      mockPromptBuilder.buildPrompt.mockReturnValue('Test prompt');
      mockLlmClient.generateResponse.mockResolvedValue({ text: 'Response' });

      await workflow.query(question);

      expect(mockPromptBuilder.buildPrompt).toHaveBeenCalledWith(question, [
        'Context 1',
        'Context 2',
        'Context 3',
      ]);
    });
  });
});
