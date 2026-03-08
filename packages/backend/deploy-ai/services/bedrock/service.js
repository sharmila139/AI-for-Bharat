"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockService = void 0;
exports.getBedrockService = getBedrockService;
const client_1 = require("./client");
class BedrockService {
    constructor() {
        this.client = (0, client_1.getBedrockClient)();
    }
    /**
     * Generate text with caching
     */
    async generateWithCache(prompt, options) {
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
    async *streamGenerate(prompt, options) {
        yield* this.client.streamText(prompt, options);
    }
    /**
     * Multi-turn conversation
     */
    async chat(messages) {
        return this.client.chat(messages);
    }
    /**
     * Generate embeddings
     */
    async embed(text) {
        return this.client.generateEmbedding(text);
    }
    /**
     * Batch embeddings generation
     */
    async batchEmbed(texts) {
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
exports.BedrockService = BedrockService;
// Singleton instance
let serviceInstance = null;
function getBedrockService() {
    if (!serviceInstance) {
        serviceInstance = new BedrockService();
    }
    return serviceInstance;
}
