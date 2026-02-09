/**
 * Integration tests for LLM Farm clients
 *
 * These tests verify that:
 * 1. LlmFarmEmbeddingClient can generate embeddings successfully
 * 2. LlmFarmLlmClient can generate LLM responses successfully
 * 3. Both clients handle errors correctly (401, 429, 400)
 * 4. Custom headers are sent correctly
 * 5. Request/response formats match LLM Farm API expectations
 *
 * Note: These tests use mocked HTTP responses to avoid hitting the real API
 * For real API testing, set LLM_FARM_API_KEY in environment and enable the skipped tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { LlmFarmEmbeddingClient } from '../../src/services/embedding-client/LlmFarmEmbeddingClient.js';
import { LlmFarmLlmClient } from '../../src/services/llm-client/LlmFarmLlmClient.js';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LLM Farm Integration Tests', () => {
  const testApiKey = 'test-llm-farm-api-key';
  let axiosCreateMock: any;
  let axiosInstanceMock: any;

  beforeEach(() => {
    // Create axios instance mock
    axiosInstanceMock = {
      post: jest.fn(),
    };

    axiosCreateMock = jest.fn(() => axiosInstanceMock);
    mockedAxios.create = axiosCreateMock;
    mockedAxios.isAxiosError = jest.fn((error: any) => error?.isAxiosError === true) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('LlmFarmEmbeddingClient', () => {
    describe('Initialization', () => {
      it('should throw error when API key is missing', () => {
        expect(() => new LlmFarmEmbeddingClient('')).toThrow('LLM Farm API key is required');
      });

      it('should initialize with correct base URL and headers', () => {
        new LlmFarmEmbeddingClient(testApiKey);

        expect(axiosCreateMock).toHaveBeenCalledWith({
          baseURL: 'https://aoai-farm.bosch-temp.com/api/openai/deployments/askbosch-prod-farm-openai-text-embedding-3-small',
          headers: {
            'genaiplatform-farm-subscription-key': testApiKey,
            'Content-Type': 'application/json',
          },
          params: {
            'api-version': '2024-10-21',
          },
          timeout: 30000,
        });
      });
    });

    describe('Generate Single Embedding', () => {
      it('should generate single embedding successfully', async () => {
        const client = new LlmFarmEmbeddingClient(testApiKey);
        const mockEmbedding = Array(1536).fill(0).map((_, i) => i / 1536);

        axiosInstanceMock.post.mockResolvedValueOnce({
          data: {
            data: [{ embedding: mockEmbedding }],
          },
        });

        const result = await client.generateEmbedding('test text');

        expect(result).toEqual(mockEmbedding);
        expect(axiosInstanceMock.post).toHaveBeenCalledWith('', {
          model: 'askbosch-prod-farm-openai-text-embedding-3-small',
          input: ['test text'],
        });
      });
    });

    describe('Generate Batch Embeddings', () => {
      it('should generate batch embeddings successfully', async () => {
        const client = new LlmFarmEmbeddingClient(testApiKey);
        const mockEmbedding1 = Array(1536).fill(0).map((_, i) => i / 1536);
        const mockEmbedding2 = Array(1536).fill(0).map((_, i) => (i + 100) / 1536);

        axiosInstanceMock.post.mockResolvedValueOnce({
          data: {
            data: [
              { embedding: mockEmbedding1 },
              { embedding: mockEmbedding2 },
            ],
          },
        });

        const result = await client.generateEmbeddings(['text 1', 'text 2']);

        expect(result).toEqual([mockEmbedding1, mockEmbedding2]);
        expect(axiosInstanceMock.post).toHaveBeenCalledWith('', {
          model: 'askbosch-prod-farm-openai-text-embedding-3-small',
          input: ['text 1', 'text 2'],
        });
      });

      it('should return empty array when given empty array', async () => {
        const client = new LlmFarmEmbeddingClient(testApiKey);

        const result = await client.generateEmbeddings([]);

        expect(result).toEqual([]);
        expect(axiosInstanceMock.post).not.toHaveBeenCalled();
      });

      it('should throw error when all texts are empty', async () => {
        const client = new LlmFarmEmbeddingClient(testApiKey);

        await expect(client.generateEmbeddings(['', '  ', ''])).rejects.toThrow(
          'At least one non-empty text is required'
        );
      });
    });

    describe('Error Handling', () => {
      it('should throw error on 401 Unauthorized', async () => {
        const client = new LlmFarmEmbeddingClient(testApiKey);

        const error: any = new Error('Request failed');
        error.isAxiosError = true;
        error.response = { status: 401, data: { error: { message: 'Unauthorized' } } };
        axiosInstanceMock.post.mockRejectedValueOnce(error);

        await expect(client.generateEmbedding('test')).rejects.toThrow(
          'Invalid LLM Farm API key'
        );
      });

      it('should throw error on 403 Forbidden', async () => {
        const client = new LlmFarmEmbeddingClient(testApiKey);

        const error: any = new Error('Request failed');
        error.isAxiosError = true;
        error.response = { status: 403, data: { error: { message: 'Forbidden' } } };
        axiosInstanceMock.post.mockRejectedValueOnce(error);

        await expect(client.generateEmbedding('test')).rejects.toThrow(
          'Invalid LLM Farm API key'
        );
      });

      it('should throw error on 429 Rate Limit', async () => {
        const client = new LlmFarmEmbeddingClient(testApiKey);

        const error: any = new Error('Request failed');
        error.isAxiosError = true;
        error.response = { status: 429, data: { error: { message: 'Rate limit exceeded' } } };
        axiosInstanceMock.post.mockRejectedValueOnce(error);

        await expect(client.generateEmbedding('test')).rejects.toThrow(
          'LLM Farm API rate limit exceeded'
        );
      });

      it('should throw error on 400 Bad Request', async () => {
        const client = new LlmFarmEmbeddingClient(testApiKey);

        const error: any = new Error('Request failed');
        error.isAxiosError = true;
        error.response = { status: 400, data: { error: { message: 'Invalid input' } } };
        axiosInstanceMock.post.mockRejectedValueOnce(error);

        await expect(client.generateEmbedding('test')).rejects.toThrow(
          'Invalid request to LLM Farm API: Invalid input'
        );
      });

      it('should retry on 500 Server Error and eventually fail', async () => {
        const client = new LlmFarmEmbeddingClient(testApiKey);

        const error: any = new Error('Server error');
        error.isAxiosError = true;
        error.response = { status: 500, data: { error: { message: 'Server error' } } };
        axiosInstanceMock.post.mockRejectedValue(error);

        await expect(client.generateEmbedding('test')).rejects.toThrow(
          'LLM Farm API error: Server error'
        );

        // Should retry 3 times
        expect(axiosInstanceMock.post).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('LlmFarmLlmClient', () => {
    describe('Initialization', () => {
      it('should throw error when API key is missing', () => {
        expect(() => new LlmFarmLlmClient('')).toThrow('LLM Farm API key is required');
      });

      it('should initialize with correct base URL and headers', () => {
        new LlmFarmLlmClient(testApiKey);

        expect(axiosCreateMock).toHaveBeenCalledWith({
          baseURL: 'https://aoai-farm.bosch-temp.com/api/openai/deployments/google-gemini-2-0-flash-lite/chat/completions',
          headers: {
            'genaiplatform-farm-subscription-key': testApiKey,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        });
      });
    });

    describe('Generate Response', () => {
      it('should generate response successfully', async () => {
        const client = new LlmFarmLlmClient(testApiKey);

        axiosInstanceMock.post.mockResolvedValueOnce({
          data: {
            choices: [
              {
                message: {
                  content: 'This is a test response',
                },
              },
            ],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 20,
              total_tokens: 30,
            },
          },
        });

        const result = await client.generateResponse({
          prompt: 'test prompt',
        });

        expect(result.text).toBe('This is a test response');
        expect(result.usage).toEqual({
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        });

        expect(axiosInstanceMock.post).toHaveBeenCalledWith('', {
          model: 'gemini-2.0-flash-lite',
          messages: [
            {
              role: 'user',
              content: 'test prompt',
            },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        });
      });

      it('should handle custom temperature and maxTokens', async () => {
        const client = new LlmFarmLlmClient(testApiKey);

        axiosInstanceMock.post.mockResolvedValueOnce({
          data: {
            choices: [
              {
                message: {
                  content: 'Response',
                },
              },
            ],
          },
        });

        await client.generateResponse({
          prompt: 'test',
          temperature: 0.5,
          maxTokens: 1000,
        });

        expect(axiosInstanceMock.post).toHaveBeenCalledWith('', {
          model: 'gemini-2.0-flash-lite',
          messages: [
            {
              role: 'user',
              content: 'test',
            },
          ],
          temperature: 0.5,
          max_tokens: 1000,
        });
      });

      it('should handle response without usage metadata', async () => {
        const client = new LlmFarmLlmClient(testApiKey);

        axiosInstanceMock.post.mockResolvedValueOnce({
          data: {
            choices: [
              {
                message: {
                  content: 'Response',
                },
              },
            ],
          },
        });

        const result = await client.generateResponse({
          prompt: 'test',
        });

        expect(result.text).toBe('Response');
        expect(result.usage).toBeUndefined();
      });

      it('should throw error when prompt is empty', async () => {
        const client = new LlmFarmLlmClient(testApiKey);

        await expect(
          client.generateResponse({
            prompt: '',
          })
        ).rejects.toThrow('Prompt is required');
      });

      it('should throw error when no choices in response', async () => {
        const client = new LlmFarmLlmClient(testApiKey);

        axiosInstanceMock.post.mockResolvedValueOnce({
          data: {
            choices: [],
          },
        });

        await expect(
          client.generateResponse({
            prompt: 'test',
          })
        ).rejects.toThrow('No response generated from LLM Farm');
      });

      it('should throw error when message is missing', async () => {
        const client = new LlmFarmLlmClient(testApiKey);

        axiosInstanceMock.post.mockResolvedValueOnce({
          data: {
            choices: [{}],
          },
        });

        await expect(
          client.generateResponse({
            prompt: 'test',
          })
        ).rejects.toThrow('Invalid response structure from LLM Farm');
      });
    });

    describe('Error Handling', () => {
      it('should throw error on 401 Unauthorized', async () => {
        const client = new LlmFarmLlmClient(testApiKey);

        const error: any = new Error('Request failed');
        error.isAxiosError = true;
        error.response = { status: 401, data: { error: { message: 'Unauthorized' } } };
        axiosInstanceMock.post.mockRejectedValueOnce(error);

        await expect(
          client.generateResponse({ prompt: 'test' })
        ).rejects.toThrow('Invalid LLM Farm API key');
      });

      it('should throw error on 403 Forbidden', async () => {
        const client = new LlmFarmLlmClient(testApiKey);

        const error: any = new Error('Request failed');
        error.isAxiosError = true;
        error.response = { status: 403, data: { error: { message: 'Forbidden' } } };
        axiosInstanceMock.post.mockRejectedValueOnce(error);

        await expect(
          client.generateResponse({ prompt: 'test' })
        ).rejects.toThrow('Invalid LLM Farm API key');
      });

      it('should throw error on 429 Rate Limit', async () => {
        const client = new LlmFarmLlmClient(testApiKey);

        const error: any = new Error('Request failed');
        error.isAxiosError = true;
        error.response = { status: 429, data: { error: { message: 'Rate limit exceeded' } } };
        axiosInstanceMock.post.mockRejectedValueOnce(error);

        await expect(
          client.generateResponse({ prompt: 'test' })
        ).rejects.toThrow('LLM Farm API rate limit exceeded');
      });

      it('should throw error on 400 Bad Request', async () => {
        const client = new LlmFarmLlmClient(testApiKey);

        const error: any = new Error('Request failed');
        error.isAxiosError = true;
        error.response = { status: 400, data: { error: { message: 'Invalid request' } } };
        axiosInstanceMock.post.mockRejectedValueOnce(error);

        await expect(
          client.generateResponse({ prompt: 'test' })
        ).rejects.toThrow('Invalid request to LLM Farm API: Invalid request');
      });

      it('should retry on 500 Server Error and eventually fail', async () => {
        const client = new LlmFarmLlmClient(testApiKey);

        const error: any = new Error('Server error');
        error.isAxiosError = true;
        error.response = { status: 500, data: { error: { message: 'Server error' } } };
        axiosInstanceMock.post.mockRejectedValue(error);

        await expect(
          client.generateResponse({ prompt: 'test' })
        ).rejects.toThrow('LLM Farm API error: Server error');

        // Should retry 3 times
        expect(axiosInstanceMock.post).toHaveBeenCalledTimes(3);
      });
    });
  });
});
