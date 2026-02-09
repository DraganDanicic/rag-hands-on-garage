import axios, { AxiosInstance } from 'axios';
import * as tunnel from 'tunnel';
import { IEmbeddingClient } from './IEmbeddingClient.js';

export class LlmFarmEmbeddingClient implements IEmbeddingClient {
  private client: AxiosInstance;
  private readonly model = 'askbosch-prod-farm-openai-text-embedding-3-small';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(private readonly apiKey: string) {
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
      baseURL: 'https://aoai-farm.bosch-temp.com/api/openai/deployments/askbosch-prod-farm-openai-text-embedding-3-small/embeddings',
      headers: {
        'genaiplatform-farm-subscription-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      params: {
        'api-version': '2024-10-21',
      },
      timeout: 30000, // 30 seconds
      httpsAgent, // Use tunnel agent for proxy support
      proxy: false, // Disable Axios's built-in proxy (doesn't work with this setup)
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0]!;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    // Validate texts
    const validTexts = texts.filter(text => text && text.trim().length > 0);
    if (validTexts.length === 0) {
      throw new Error('At least one non-empty text is required');
    }

    return await this.executeWithRetry(async () => {
      try {
        const response = await this.client.post('', {
          model: this.model,
          input: validTexts,
        });

        // Extract embeddings from response
        const embeddings: number[][] = response.data.data.map(
          (item: { embedding: number[] }) => item.embedding
        );

        return embeddings;
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
