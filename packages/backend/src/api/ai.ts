/**
 * AI API Routes
 * Handles AI model invocations via AWS Bedrock
 */

import { Router, Request, Response } from 'express';
import { getBedrockService } from '../services/bedrock';

const router = Router();

/**
 * POST /api/v1/ai/invoke
 * Invoke AI model with automatic fallback
 */
router.post('/invoke', async (req: Request, res: Response) => {
  try {
    const {
      modelId,
      prompt,
      systemPrompt,
      context,
      temperature,
      maxTokens,
    } = req.body;

    // Validate required fields
    if (!modelId || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: modelId and prompt are required',
      });
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
    return res.status(200).json({
      success: true,
      content: response.text,
      model: modelId,
      usage: {
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
      },
    });
  } catch (error: any) {
    console.error('❌ [AI API] Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'AI invocation failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/ai/chat
 * Multi-turn conversation
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, maxTokens } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: messages (array)',
      });
    }

    console.log(`💬 [AI API] Chat request with ${messages.length} messages`);

    const bedrockService = getBedrockService();
    const response = await bedrockService.chat(messages);

    console.log(`✅ [AI API] Chat response generated`);

    return res.status(200).json({
      success: true,
      content: response.text,
      model: response.modelId,
      usage: {
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
      },
    });
  } catch (error: any) {
    console.error('❌ [AI API] Chat error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Chat failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/ai/health
 * Health check for AI service
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const bedrockService = getBedrockService();
    const cacheStats = await bedrockService.getCacheStats();

    return res.status(200).json({
      success: true,
      status: 'healthy',
      cache: cacheStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
    });
  }
});

export default router;
