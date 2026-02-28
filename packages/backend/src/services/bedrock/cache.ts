import { createHash } from 'crypto';
import { createClient, RedisClientType } from 'redis';

export interface CacheConfig {
  redisUrl: string;
  ttl: number; // Time to live in seconds
}

export class BedrockCache {
  private client: RedisClientType;
  private ttl: number;
  private connected: boolean = false;

  constructor(config: CacheConfig) {
    this.client = createClient({ url: config.redisUrl });
    this.ttl = config.ttl;
    this.setupClient();
  }

  private async setupClient(): Promise<void> {
    this.client.on('error', (err) => console.error('Redis Client Error', err));
    this.client.on('connect', () => {
      this.connected = true;
      console.log('Redis connected for Bedrock cache');
    });
    await this.client.connect();
  }

  /**
   * Generate cache key from prompt
   */
  private getCacheKey(prompt: string, modelId: string): string {
    const hash = createHash('sha256').update(`${modelId}:${prompt}`).digest('hex');
    return `bedrock:${hash}`;
  }

  /**
   * Get cached response
   */
  async get(prompt: string, modelId: string): Promise<string | null> {
    if (!this.connected) return null;

    try {
      const key = this.getCacheKey(prompt, modelId);
      return await this.client.get(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached response
   */
  async set(prompt: string, modelId: string, response: string): Promise<void> {
    if (!this.connected) return;

    try {
      const key = this.getCacheKey(prompt, modelId);
      await this.client.setEx(key, this.ttl, response);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Clear cache for specific pattern
   */
  async clear(pattern: string = 'bedrock:*'): Promise<void> {
    if (!this.connected) return;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ keys: number; memory: string }> {
    if (!this.connected) return { keys: 0, memory: '0' };

    try {
      const keys = await this.client.keys('bedrock:*');
      const info = await this.client.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : '0';

      return { keys: keys.length, memory };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { keys: 0, memory: '0' };
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }
}

// Singleton instance
let cacheInstance: BedrockCache | null = null;

export function getBedrockCache(): BedrockCache {
  if (!cacheInstance) {
    cacheInstance = new BedrockCache({
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      ttl: parseInt(process.env.BEDROCK_CACHE_TTL || '3600'), // 1 hour default
    });
  }
  return cacheInstance;
}
