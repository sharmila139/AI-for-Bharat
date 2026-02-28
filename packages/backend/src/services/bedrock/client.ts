import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

export interface BedrockConfig {
  region: string;
  modelIdClaude: string;
  modelIdHaiku: string;
  modelIdTitan: string;
  modelIdEmbed: string;
  maxTokens: number;
  temperature: number;
}

export interface BedrockMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BedrockResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  modelId: string;
}

export class BedrockClient {
  private client: BedrockRuntimeClient;
  private cloudwatch: CloudWatchClient;
  private config: BedrockConfig;

  constructor(config: BedrockConfig) {
    this.config = config;
    this.client = new BedrockRuntimeClient({ region: config.region });
    this.cloudwatch = new CloudWatchClient({ region: config.region });
  }

  /**
   * Generate text using Claude model
   */
  async generateText(
    prompt: string,
    options?: {
      modelType?: 'sonnet' | 'haiku';
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    }
  ): Promise<BedrockResponse> {
    const modelId =
      options?.modelType === 'haiku' ? this.config.modelIdHaiku : this.config.modelIdClaude;

    const body = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options?.maxTokens || this.config.maxTokens,
      temperature: options?.temperature || this.config.temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      ...(options?.systemPrompt && { system: options.systemPrompt }),
    };

    try {
      const command = new InvokeModelCommand({
        modelId,
        body: JSON.stringify(body),
      });

      const response = await this.client.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));

      const bedrockResponse: BedrockResponse = {
        text: result.content[0].text,
        inputTokens: result.usage.input_tokens,
        outputTokens: result.usage.output_tokens,
        modelId,
      };

      // Log metrics
      await this.logMetrics(bedrockResponse);

      return bedrockResponse;
    } catch (error) {
      console.error('Bedrock generation error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Generate text with streaming response
   */
  async *streamText(
    prompt: string,
    options?: {
      modelType?: 'sonnet' | 'haiku';
      maxTokens?: number;
      temperature?: number;
    }
  ): AsyncGenerator<string> {
    const modelId =
      options?.modelType === 'haiku' ? this.config.modelIdHaiku : this.config.modelIdClaude;

    const body = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options?.maxTokens || this.config.maxTokens,
      temperature: options?.temperature || this.config.temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    try {
      const command = new InvokeModelWithResponseStreamCommand({
        modelId,
        body: JSON.stringify(body),
      });

      const response = await this.client.send(command);

      if (response.body) {
        for await (const event of response.body) {
          if (event.chunk) {
            const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
            if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
              yield chunk.delta.text;
            }
          }
        }
      }
    } catch (error) {
      console.error('Bedrock streaming error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Multi-turn conversation
   */
  async chat(messages: BedrockMessage[], options?: { maxTokens?: number }): Promise<BedrockResponse> {
    const body = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options?.maxTokens || this.config.maxTokens,
      temperature: this.config.temperature,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    };

    try {
      const command = new InvokeModelCommand({
        modelId: this.config.modelIdClaude,
        body: JSON.stringify(body),
      });

      const response = await this.client.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));

      return {
        text: result.content[0].text,
        inputTokens: result.usage.input_tokens,
        outputTokens: result.usage.output_tokens,
        modelId: this.config.modelIdClaude,
      };
    } catch (error) {
      console.error('Bedrock chat error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Generate embeddings for RAG
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const body = {
      inputText: text,
    };

    try {
      const command = new InvokeModelCommand({
        modelId: this.config.modelIdEmbed,
        body: JSON.stringify(body),
      });

      const response = await this.client.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));

      return result.embedding;
    } catch (error) {
      console.error('Bedrock embedding error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Log usage metrics to CloudWatch
   */
  private async logMetrics(response: BedrockResponse): Promise<void> {
    try {
      await this.cloudwatch.send(
        new PutMetricDataCommand({
          Namespace: 'RuralConnect/Bedrock',
          MetricData: [
            {
              MetricName: 'InputTokens',
              Value: response.inputTokens,
              Unit: 'Count',
              Dimensions: [{ Name: 'ModelId', Value: response.modelId }],
            },
            {
              MetricName: 'OutputTokens',
              Value: response.outputTokens,
              Unit: 'Count',
              Dimensions: [{ Name: 'ModelId', Value: response.modelId }],
            },
          ],
        })
      );
    } catch (error) {
      console.error('Failed to log metrics:', error);
    }
  }

  /**
   * Handle Bedrock errors with retry logic
   */
  private handleError(error: any): Error {
    if (error.name === 'ThrottlingException') {
      return new Error('Rate limit exceeded. Please try again later.');
    }
    if (error.name === 'ModelNotReadyException') {
      return new Error('Model access not yet approved. Check AWS Console.');
    }
    if (error.name === 'ValidationException') {
      return new Error('Invalid request parameters.');
    }
    return new Error(`Bedrock error: ${error.message}`);
  }
}

// Singleton instance
let bedrockClient: BedrockClient | null = null;

export function getBedrockClient(): BedrockClient {
  if (!bedrockClient) {
    bedrockClient = new BedrockClient({
      region: process.env.BEDROCK_REGION || 'us-east-1',
      modelIdClaude: process.env.BEDROCK_MODEL_CLAUDE_SONNET || 'anthropic.claude-3-sonnet-20240229-v1:0',
      modelIdHaiku: process.env.BEDROCK_MODEL_CLAUDE_HAIKU || 'anthropic.claude-3-haiku-20240307-v1:0',
      modelIdTitan: process.env.BEDROCK_MODEL_TITAN_TEXT || 'amazon.titan-text-express-v1',
      modelIdEmbed: process.env.BEDROCK_MODEL_TITAN_EMBED || 'amazon.titan-embed-text-v1',
      maxTokens: parseInt(process.env.BEDROCK_MAX_TOKENS || '4096'),
      temperature: parseFloat(process.env.BEDROCK_TEMPERATURE || '0.7'),
    });
  }
  return bedrockClient;
}
