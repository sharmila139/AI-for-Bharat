import { getBedrockClient, BedrockMessage, BedrockResponse } from './client';

export class BedrockService {
  private client = getBedrockClient();

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

    // Generate new response (cache disabled for Lambda)
    const response = await this.client.generateText(prompt, {
      modelType,
      systemPrompt: options?.systemPrompt,
    });

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
    return { keys: 0, memory: '0', enabled: false };
  }

  /**
   * Clear cache
   */
  async clearCache() {
    return { cleared: 0 };
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
