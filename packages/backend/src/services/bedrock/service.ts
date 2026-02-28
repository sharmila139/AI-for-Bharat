import { getBedrockClient, BedrockMessage, BedrockResponse } from './client';
import { getBedrockCache } from './cache';

export class BedrockService {
  private client = getBedrockClient();
  private cache = getBedrockCache();

  /**
   * Generate text with caching
   */
  async generateWithCache(
    prompt: string,
    options?: {
      modelType?: 'sonnet' | 'haiku';
      useCache?: boolean;
      systemPrompt?: string;
    }
  ): Promise<BedrockResponse> {
    const modelType = options?.modelType || 'haiku';
    const useCache = options?.useCache !== false;

    // Check cache first
    if (useCache) {
      const modelId = modelType === 'haiku' ? 'haiku' : 'sonnet';
      const cached = await this.cache.get(prompt, modelId);
      if (cached) {
        return {
          text: cached,
          inputTokens: 0,
          outputTokens: 0,
          modelId: `cached-${modelId}`,
        };
      }
    }

    // Generate new response
    const response = await this.client.generateText(prompt, {
      modelType,
      systemPrompt: options?.systemPrompt,
    });

    // Cache the response
    if (useCache) {
      const modelId = modelType === 'haiku' ? 'haiku' : 'sonnet';
      await this.cache.set(prompt, modelId, response.text);
    }

    return response;
  }

  /**
   * Stream text generation
   */
  async *streamGenerate(
    prompt: string,
    options?: { modelType?: 'sonnet' | 'haiku' }
  ): AsyncGenerator<string> {
    yield* this.client.streamText(prompt, options);
  }

  /**
   * Multi-turn conversation
   */
  async chat(messages: BedrockMessage[]): Promise<BedrockResponse> {
    return this.client.chat(messages);
  }

  /**
   * Generate embeddings
   */
  async embed(text: string): Promise<number[]> {
    return this.client.generateEmbedding(text);
  }

  /**
   * Batch embeddings generation
   */
  async batchEmbed(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(texts.map((text) => this.embed(text)));
    return embeddings;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear cache
   */
  async clearCache() {
    return this.cache.clear();
  }
}

// Singleton instance
let serviceInstance: BedrockService | null = null;

export function getBedrockService(): BedrockService {
  if (!serviceInstance) {
    serviceInstance = new BedrockService();
  }
  return serviceInstance;
}
