"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockCache = void 0;
exports.getBedrockCache = getBedrockCache;
const crypto_1 = require("crypto");
const redis_1 = require("redis");
class BedrockCache {
    constructor(config) {
        this.connected = false;
        this.client = (0, redis_1.createClient)({ url: config.redisUrl });
        this.ttl = config.ttl;
        this.setupClient();
    }
    async setupClient() {
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
    getCacheKey(prompt, modelId) {
        const hash = (0, crypto_1.createHash)('sha256').update(`${modelId}:${prompt}`).digest('hex');
        return `bedrock:${hash}`;
    }
    /**
     * Get cached response
     */
    async get(prompt, modelId) {
        if (!this.connected)
            return null;
        try {
            const key = this.getCacheKey(prompt, modelId);
            return await this.client.get(key);
        }
        catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }
    /**
     * Set cached response
     */
    async set(prompt, modelId, response) {
        if (!this.connected)
            return;
        try {
            const key = this.getCacheKey(prompt, modelId);
            await this.client.setEx(key, this.ttl, response);
        }
        catch (error) {
            console.error('Cache set error:', error);
        }
    }
    /**
     * Clear cache for specific pattern
     */
    async clear(pattern = 'bedrock:*') {
        if (!this.connected)
            return;
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
        }
        catch (error) {
            console.error('Cache clear error:', error);
        }
    }
    /**
     * Get cache statistics
     */
    async getStats() {
        if (!this.connected)
            return { keys: 0, memory: '0' };
        try {
            const keys = await this.client.keys('bedrock:*');
            const info = await this.client.info('memory');
            const memoryMatch = info.match(/used_memory_human:(.+)/);
            const memory = memoryMatch ? memoryMatch[1].trim() : '0';
            return { keys: keys.length, memory };
        }
        catch (error) {
            console.error('Cache stats error:', error);
            return { keys: 0, memory: '0' };
        }
    }
    /**
     * Close connection
     */
    async close() {
        if (this.connected) {
            await this.client.quit();
            this.connected = false;
        }
    }
}
exports.BedrockCache = BedrockCache;
// Singleton instance
let cacheInstance = null;
function getBedrockCache() {
    if (!cacheInstance) {
        cacheInstance = new BedrockCache({
            redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
            ttl: parseInt(process.env.BEDROCK_CACHE_TTL || '3600'), // 1 hour default
        });
    }
    return cacheInstance;
}
