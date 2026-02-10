import axios, { AxiosInstance } from 'axios';
import * as tunnel from 'tunnel';
import { ILlmClient } from './ILlmClient.js';
import { LlmRequest } from './models/LlmRequest.js';
import { LlmResponse } from './models/LlmResponse.js';

export interface LlmClientConfig {
  model?: string;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  proxyEnabled?: boolean;
  proxyHost?: string;
  proxyPort?: number;
}

export class LlmFarmLlmClient implements ILlmClient {
  private client: AxiosInstance;
  private readonly model: string;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(
    private apiKey: string,
    config: LlmClientConfig = {}
  ) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('LLM Farm API key is required');
    }

    // Apply configuration with defaults
    this.model = config.model ?? 'gemini-2.0-flash-lite';
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelayMs ?? 1000;
    const timeout = config.timeoutMs ?? 60000;

    // Use proxy config from ConfigService (which auto-detects from https_proxy)
    // This ensures consistent proxy behavior with EmbeddingClient
    const proxyEnabled = config.proxyEnabled ?? false;
    const proxyHost = config.proxyHost ?? '127.0.0.1';
    const proxyPort = config.proxyPort ?? 3128;

    // Configure proxy using tunnel package (Axios native proxy has issues with Bosch network)
    // The tunnel package properly handles HTTPS over HTTP proxy connections
    const httpsAgent = proxyEnabled ? tunnel.httpsOverHttp({
      proxy: {
        host: proxyHost,
        port: proxyPort
      }
    }) : undefined;

    // Construct baseURL based on model name
    // Convert model name to deployment name format (dots -> dashes for URL)
    const modelForUrl = this.model.replace(/\./g, '-');
    const deploymentName = modelForUrl.startsWith('google-')
      ? modelForUrl
      : `google-${modelForUrl}`;

    this.client = axios.create({
      baseURL: `https://aoai-farm.bosch-temp.com/api/openai/deployments/${deploymentName}/chat/completions`,
      headers: {
        'genaiplatform-farm-subscription-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout,
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
