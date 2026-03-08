/**
 * AWS Lambda Handler for AI API
 * Simplified handler for AI invocation endpoint
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getBedrockService } from './services/bedrock';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
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
    const {
      modelId,
      prompt,
      systemPrompt,
      context,
      temperature,
      maxTokens,
    } = body;

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
    const bedrockService = getBedrockService();

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
  } catch (error: any) {
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
