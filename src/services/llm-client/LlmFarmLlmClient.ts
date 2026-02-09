import axios, { AxiosInstance } from 'axios';
import * as tunnel from 'tunnel';
import { ILlmClient } from './ILlmClient.js';
import { LlmRequest } from './models/LlmRequest.js';
import { LlmResponse } from './models/LlmResponse.js';

export class LlmFarmLlmClient implements ILlmClient {
  private client: AxiosInstance;
  private readonly model = 'gemini-2.0-flash-lite';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(private apiKey: string) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('LLM Farm API key is required');
    }

    // Configure proxy using tunnel package (Axios native proxy has issues with Bosch network)
    // The tunnel package properly handles HTTPS over HTTP proxy connections
    const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY;
    const httpsAgent = proxyUrl ? tunnel.httpsOverHttp({
      proxy: {
        host: '127.0.0.1',
        port: 3128
      }
    }) : undefined;

    this.client = axios.create({
      baseURL: 'https://aoai-farm.bosch-temp.com/api/openai/deployments/google-gemini-2-0-flash-lite/chat/completions',
      headers: {
        'genaiplatform-farm-subscription-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds
      httpsAgent, // Use tunnel agent for proxy support
      proxy: false, // Disable Axios's built-in proxy (doesn't work with this setup)
    });
  }

  async generateResponse(request: LlmRequest): Promise<LlmResponse> {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new Error('Prompt is required');
    }

    return await this.executeWithRetry(async () => {
      try {
        // Use OpenAI Chat Completions format
        const response = await this.client.post('', {
          model: this.model,
          messages: [
            {
              role: 'user',
              content: request.prompt,
            },
          ],
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 2048,
        });

        // Extract text from OpenAI-compatible response format
        const choices = response.data.choices;
        if (!choices || choices.length === 0) {
          throw new Error('No response generated from LLM Farm');
        }

        const message = choices[0]?.message;
        if (!message || !message.content) {
          throw new Error('Invalid response structure from LLM Farm');
        }

        const text = message.content;

        // Extract usage metadata if available
        const usage = response.data.usage;

        return {
          text,
          usage: usage
            ? {
                promptTokens: usage.prompt_tokens,
                completionTokens: usage.completion_tokens,
                totalTokens: usage.total_tokens,
              }
            : undefined,
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const message = error.response?.data?.error?.message || error.message;

          if (status === 401 || status === 403) {
            throw new Error('Invalid LLM Farm API key');
          } else if (status === 429) {
            throw new Error('LLM Farm API rate limit exceeded. Please try again later.');
          } else if (status === 400) {
            throw new Error(`Invalid request to LLM Farm API: ${message}`);
          } else {
            throw new Error(`LLM Farm API error: ${message}`);
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
