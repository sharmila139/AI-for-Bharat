import { getTokenTracker } from './tracker';

export interface OptimizationStrategy {
  useCache: boolean;
  modelSelection: 'haiku' | 'sonnet' | 'auto';
  maxTokens: number;
  temperature: number;
}

export class CostOptimizer {
  private tracker = getTokenTracker();

  /**
   * Select optimal model based on query complexity
   */
  selectModel(query: string, context?: string): 'haiku' | 'sonnet' {
    const totalLength = query.length + (context?.length || 0);

    // Simple heuristics for model selection
    if (totalLength < 500) {
      return 'haiku'; // Fast and cheap for simple queries
    }

    // Check for complexity indicators
    const complexityIndicators = [
      'explain',
      'analyze',
      'compare',
      'evaluate',
      'recommend',
      'detailed',
      'comprehensive',
    ];

    const hasComplexity = complexityIndicators.some((indicator) =>
      query.toLowerCase().includes(indicator)
    );

    return hasComplexity ? 'sonnet' : 'haiku';
  }

  /**
   * Get optimization strategy for a request
   */
  getStrategy(options: {
    query: string;
    userId?: string;
    module?: string;
    requiresAccuracy?: boolean;
  }): OptimizationStrategy {
    const { query, userId, requiresAccuracy } = options;

    // Check user budget
    const withinBudget = userId ? this.tracker.isWithinBudget(userId, 10.0) : true;

    // Base strategy
    const strategy: OptimizationStrategy = {
      useCache: true,
      modelSelection: 'auto',
      maxTokens: 2048,
      temperature: 0.7,
    };

    // Adjust based on budget
    if (!withinBudget) {
      strategy.modelSelection = 'haiku';
      strategy.maxTokens = 1024;
      strategy.useCache = true;
    }

    // Adjust based on accuracy requirements
    if (requiresAccuracy) {
      strategy.modelSelection = 'sonnet';
      strategy.maxTokens = 4096;
      strategy.temperature = 0.5;
    }

    // Auto model selection
    if (strategy.modelSelection === 'auto') {
      const selectedModel = this.selectModel(query);
      strategy.modelSelection = selectedModel;
    }

    return strategy;
  }

  /**
   * Estimate cost before making request
   */
  estimateRequestCost(query: string, modelType: 'haiku' | 'sonnet'): number {
    // Rough estimate: 1 token ≈ 4 characters
    const estimatedInputTokens = Math.ceil(query.length / 4);
    const estimatedOutputTokens = 500; // Average response

    const modelId =
      modelType === 'haiku'
        ? 'anthropic.claude-3-haiku-20240307-v1:0'
        : 'anthropic.claude-3-sonnet-20240229-v1:0';

    return this.tracker.estimateCost(modelId, estimatedInputTokens, estimatedOutputTokens);
  }

  /**
   * Suggest cost-saving measures
   */
  getSavingsSuggestions(userId?: string): string[] {
    const suggestions: string[] = [];

    if (userId) {
      const stats = this.tracker.getStats({ userId });

      // Check model usage
      const haikuUsage = stats.byModel['anthropic.claude-3-haiku-20240307-v1:0'];
      const sonnetUsage = stats.byModel['anthropic.claude-3-sonnet-20240229-v1:0'];

      if (sonnetUsage && haikuUsage) {
        const sonnetRatio = sonnetUsage.requests / stats.requestCount;
        if (sonnetRatio > 0.7) {
          suggestions.push(
            'Consider using Haiku model for simple queries to reduce costs by up to 90%'
          );
        }
      }

      // Check cache effectiveness
      if (stats.requestCount > 100) {
        suggestions.push('Enable response caching for frequently asked questions');
      }

      // Check token usage
      const avgTokens = (stats.totalInputTokens + stats.totalOutputTokens) / stats.requestCount;
      if (avgTokens > 3000) {
        suggestions.push('Reduce prompt length and set lower max_tokens limits');
      }
    }

    return suggestions;
  }

  /**
   * Get cost breakdown
   */
  getCostBreakdown(period: 'day' | 'week' | 'month' = 'month'): {
    total: number;
    byModel: Record<string, number>;
    byModule: Record<string, number>;
    projectedMonthly: number;
  } {
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

    const stats = this.tracker.getStats({ since });

    const byModel: Record<string, number> = {};
    for (const [model, data] of Object.entries(stats.byModel)) {
      byModel[model] = data.cost;
    }

    const byModule: Record<string, number> = {};
    for (const [module, data] of Object.entries(stats.byModule)) {
      byModule[module] = data.cost;
    }

    // Project monthly cost
    const daysInPeriod = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    const projectedMonthly = (stats.totalCost / daysInPeriod) * 30;

    return {
      total: stats.totalCost,
      byModel,
      byModule,
      projectedMonthly,
    };
  }
}

// Singleton instance
let optimizerInstance: CostOptimizer | null = null;

export function getCostOptimizer(): CostOptimizer {
  if (!optimizerInstance) {
    optimizerInstance = new CostOptimizer();
  }
  return optimizerInstance;
}
