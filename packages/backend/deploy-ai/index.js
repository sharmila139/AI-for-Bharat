"use strict";
/**
 * AWS Lambda Handler for AI API
 * Simplified handler for AI invocation endpoint
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const bedrock_1 = require("./services/bedrock");
const handler = async (event) => {
    // CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    };
    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }
    try {
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        const { modelId, prompt, systemPrompt, context, temperature, maxTokens, } = body;
        // Validate required fields
        if (!modelId || !prompt) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Missing required fields: modelId and prompt are required',
                }),
            };
        }
        console.log(`🤖 [AI API] Received request for model: ${modelId}`);
        console.log(`🤖 [AI API] Prompt length: ${prompt.length} characters`);
        // Determine model type from modelId
        const modelType = modelId.includes('haiku') ? 'haiku' : 'sonnet';
        // Get Bedrock service
        const bedrockService = (0, bedrock_1.getBedrockService)();
        // Generate response
        const response = await bedrockService.generateWithCache(prompt, {
            modelType,
            useCache: false, // Disable cache for real-time requests
            systemPrompt,
        });
        console.log(`✅ [AI API] Response generated successfully`);
        console.log(`✅ [AI API] Input tokens: ${response.inputTokens}`);
        console.log(`✅ [AI API] Output tokens: ${response.outputTokens}`);
        // Return response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                content: response.text,
                model: modelId,
                usage: {
                    inputTokens: response.inputTokens,
                    outputTokens: response.outputTokens,
                },
            }),
        };
    }
    catch (error) {
        console.error('❌ [AI API] Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'AI invocation failed',
                message: error.message,
            }),
        };
    }
};
exports.handler = handler;
