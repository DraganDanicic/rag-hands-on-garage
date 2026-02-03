import axios, { AxiosInstance } from 'axios';
import { ILlmClient } from './ILlmClient.js';
import { LlmRequest } from './models/LlmRequest.js';
import { LlmResponse } from './models/LlmResponse.js';

export class GeminiLlmClient implements ILlmClient {
  private client: AxiosInstance;
  private readonly model = 'gemini-2.0-flash-exp';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(private apiKey: string) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('Gemini API key is required');
    }

    this.client = axios.create({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      timeout: 60000, // 60 seconds
    });
  }

  async generateResponse(request: LlmRequest): Promise<LlmResponse> {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new Error('Prompt is required');
    }

    return await this.executeWithRetry(async () => {
      try {
        const response = await this.client.post(
          `/models/${this.model}:generateContent`,
          {
            contents: [
              {
                parts: [
                  {
                    text: request.prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: request.temperature ?? 0.7,
              maxOutputTokens: request.maxTokens ?? 2048,
            },
          },
          {
            params: {
              key: this.apiKey,
            },
          }
        );

        // Extract text from Gemini response
        const candidates = response.data.candidates;
        if (!candidates || candidates.length === 0) {
          throw new Error('No response generated from Gemini');
        }

        const content = candidates[0]?.content;
        if (!content || !content.parts || content.parts.length === 0) {
          throw new Error('Invalid response structure from Gemini');
        }

        const text = content.parts[0]?.text || '';

        // Extract usage metadata if available
        const usageMetadata = response.data.usageMetadata;

        return {
          text,
          usage: usageMetadata
            ? {
                promptTokens: usageMetadata.promptTokenCount,
                completionTokens: usageMetadata.candidatesTokenCount,
                totalTokens: usageMetadata.totalTokenCount,
              }
            : undefined,
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const message = error.response?.data?.error?.message || error.message;

          if (status === 401 || status === 403) {
            throw new Error('Invalid Gemini API key');
          } else if (status === 429) {
            throw new Error('Gemini API rate limit exceeded. Please try again later.');
          } else if (status === 400) {
            throw new Error(`Invalid request to Gemini API: ${message}`);
          } else {
            throw new Error(`Gemini API error: ${message}`);
          }
        }
        throw error;
      }
    });
  }

  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Don't retry on client errors (4xx except 429)
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status && status >= 400 && status < 500 && status !== 429) {
            throw lastError;
          }
        }

        // If this was the last attempt, throw the error
        if (attempt === this.maxRetries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await this.sleep(this.retryDelay * attempt);
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
