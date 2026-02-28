import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

export interface TokenUsage {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: Date;
  userId?: string;
  module?: string;
}

export interface UsageStats {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  requestCount: number;
  byModel: Record<string, { tokens: number; cost: number; requests: number }>;
  byModule: Record<string, { tokens: number; cost: number; requests: number }>;
  byUser: Record<string, { tokens: number; cost: number; requests: number }>;
}

export class TokenTracker {
  private cloudwatch: CloudWatchClient;
  private usageLog: TokenUsage[] = [];
  private readonly PRICING = {
    // Claude 3 Sonnet pricing per 1M tokens
    'anthropic.claude-3-sonnet-20240229-v1:0': {
      input: 3.0,
      output: 15.0,
    },
    // Claude 3 Haiku pricing per 1M tokens
    'anthropic.claude-3-haiku-20240307-v1:0': {
      input: 0.25,
      output: 1.25,
    },
    // Titan Text Express pricing per 1M tokens
    'amazon.titan-text-express-v1': {
      input: 0.2,
      output: 0.6,
    },
    // Titan Embeddings pricing per 1M tokens
    'amazon.titan-embed-text-v1': {
      input: 0.1,
      output: 0.0,
    },
  };

  constructor(region: string = 'us-east-1') {
    this.cloudwatch = new CloudWatchClient({ region });
  }

  /**
   * Track token usage
   */
  async track(usage: Omit<TokenUsage, 'totalTokens' | 'cost' | 'timestamp'>): Promise<void> {
    const totalTokens = usage.inputTokens + usage.outputTokens;
    const cost = this.calculateCost(usage.modelId, usage.inputTokens, usage.outputTokens);

    const fullUsage: TokenUsage = {
      ...usage,
      totalTokens,
      cost,
      timestamp: new Date(),
    };

    // Store in memory
    this.usageLog.push(fullUsage);

    // Send to CloudWatch
    await this.sendToCloudWatch(fullUsage);

    // Log to console
    console.log(
      `Token usage: ${usage.modelId} - Input: ${usage.inputTokens}, Output: ${usage.outputTokens}, Cost: $${cost.toFixed(4)}`
    );
  }

  /**
   * Calculate cost based on model pricing
   */
  private calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
    const pricing = this.PRICING[modelId as keyof typeof this.PRICING];
    if (!pricing) {
      console.warn(`Unknown model pricing: ${modelId}`);
      return 0;
    }

    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;

    return inputCost + outputCost;
  }

  /**
   * Send metrics to CloudWatch
   */
  private async sendToCloudWatch(usage: TokenUsage): Promise<void> {
    try {
      const dimensions = [
        { Name: 'ModelId', Value: usage.modelId },
        ...(usage.module ? [{ Name: 'Module', Value: usage.module }] : []),
      ];

      await this.cloudwatch.send(
        new PutMetricDataCommand({
          Namespace: 'RuralConnect/Bedrock/Usage',
          MetricData: [
            {
              MetricName: 'InputTokens',
              Value: usage.inputTokens,
              Unit: 'Count',
              Timestamp: usage.timestamp,
              Dimensions: dimensions,
            },
            {
              MetricName: 'OutputTokens',
              Value: usage.outputTokens,
              Unit: 'Count',
              Timestamp: usage.timestamp,
              Dimensions: dimensions,
            },
            {
              MetricName: 'Cost',
              Value: usage.cost,
              Unit: 'None',
              Timestamp: usage.timestamp,
              Dimensions: dimensions,
            },
          ],
        })
      );
    } catch (error) {
      console.error('Failed to send metrics to CloudWatch:', error);
    }
  }

  /**
   * Get usage statistics
   */
  getStats(options?: { since?: Date; userId?: string; module?: string }): UsageStats {
    let filtered = this.usageLog;

    if (options?.since) {
      filtered = filtered.filter((u) => u.timestamp >= options.since!);
    }
    if (options?.userId) {
      filtered = filtered.filter((u) => u.userId === options.userId);
    }
    if (options?.module) {
      filtered = filtered.filter((u) => u.module === options.module);
    }

    const stats: UsageStats = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      requestCount: filtered.length,
      byModel: {},
      byModule: {},
      byUser: {},
    };

    for (const usage of filtered) {
      stats.totalInputTokens += usage.inputTokens;
      stats.totalOutputTokens += usage.outputTokens;
      stats.totalCost += usage.cost;

      // By model
      if (!stats.byModel[usage.modelId]) {
        stats.byModel[usage.modelId] = { tokens: 0, cost: 0, requests: 0 };
      }
      stats.byModel[usage.modelId].tokens += usage.totalTokens;
      stats.byModel[usage.modelId].cost += usage.cost;
      stats.byModel[usage.modelId].requests += 1;

      // By module
      if (usage.module) {
        if (!stats.byModule[usage.module]) {
          stats.byModule[usage.module] = { tokens: 0, cost: 0, requests: 0 };
        }
        stats.byModule[usage.module].tokens += usage.totalTokens;
        stats.byModule[usage.module].cost += usage.cost;
        stats.byModule[usage.module].requests += 1;
      }

      // By user
      if (usage.userId) {
        if (!stats.byUser[usage.userId]) {
          stats.byUser[usage.userId] = { tokens: 0, cost: 0, requests: 0 };
        }
        stats.byUser[usage.userId].tokens += usage.totalTokens;
        stats.byUser[usage.userId].cost += usage.cost;
        stats.byUser[usage.userId].requests += 1;
      }
    }

    return stats;
  }

  /**
   * Get cost estimate for a request
   */
  estimateCost(modelId: string, estimatedInputTokens: number, estimatedOutputTokens: number): number {
    return this.calculateCost(modelId, estimatedInputTokens, estimatedOutputTokens);
  }

  /**
   * Check if user is within budget
   */
  isWithinBudget(userId: string, monthlyBudget: number): boolean {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const stats = this.getStats({ since: startOfMonth, userId });
    return stats.totalCost <= monthlyBudget;
  }

  /**
   * Get usage report
   */
  getReport(period: 'day' | 'week' | 'month' = 'day'): string {
    const now = new Date();
    const since = new Date();

    switch (period) {
      case 'day':
        since.setDate(now.getDate() - 1);
        break;
      case 'week':
        since.setDate(now.getDate() - 7);
        break;
      case 'month':
        since.setMonth(now.getMonth() - 1);
        break;
    }

    const stats = this.getStats({ since });

    return `
Token Usage Report (Last ${period})
=====================================
Total Requests: ${stats.requestCount}
Total Input Tokens: ${stats.totalInputTokens.toLocaleString()}
Total Output Tokens: ${stats.totalOutputTokens.toLocaleString()}
Total Cost: $${stats.totalCost.toFixed(2)}

By Model:
${Object.entries(stats.byModel)
  .map(
    ([model, data]) =>
      `  ${model}: ${data.tokens.toLocaleString()} tokens, $${data.cost.toFixed(2)} (${data.requests} requests)`
  )
  .join('\n')}

By Module:
${Object.entries(stats.byModule)
  .map(
    ([module, data]) =>
      `  ${module}: ${data.tokens.toLocaleString()} tokens, $${data.cost.toFixed(2)} (${data.requests} requests)`
  )
  .join('\n')}
`;
  }

  /**
   * Clear old logs (keep last 30 days)
   */
  clearOldLogs(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.usageLog = this.usageLog.filter((u) => u.timestamp >= thirtyDaysAgo);
  }
}

// Singleton instance
let trackerInstance: TokenTracker | null = null;

export function getTokenTracker(): TokenTracker {
  if (!trackerInstance) {
    trackerInstance = new TokenTracker(process.env.AWS_REGION || 'us-east-1');
  }
  return trackerInstance;
}
