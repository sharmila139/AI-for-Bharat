import { getBedrockService } from '../bedrock';
import { getRAGService } from '../rag';

export interface FallbackResponse {
  text: string;
  source: 'bedrock' | 'rag' | 'rule-based' | 'cached';
  confidence: number;
}

export class FallbackService {
  private bedrock = getBedrockService();
  private rag = getRAGService();
  private maxRetries = 3;
  private retryDelay = 1000; // ms

  /**
   * Generate response with automatic fallback
   */
  async generateWithFallback(
    prompt: string,
    options?: {
      module?: string;
      language?: string;
      useRAG?: boolean;
    }
  ): Promise<FallbackResponse> {
    // Try 1: Bedrock with retries
    try {
      const response = await this.tryBedrockWithRetry(prompt, options);
      return {
        text: response,
        source: 'bedrock',
        confidence: 0.9,
      };
    } catch (error) {
      console.warn('Bedrock failed, trying fallback:', error);
    }

    // Try 2: RAG if enabled
    if (options?.useRAG) {
      try {
        const ragResponse = await this.rag.query({
          question: prompt,
          category: options.module,
          language: options.language,
        });

        if (ragResponse.confidence > 0.5) {
          return {
            text: ragResponse.answer,
            source: 'rag',
            confidence: ragResponse.confidence,
          };
        }
      } catch (error) {
        console.warn('RAG failed, trying rule-based:', error);
      }
    }

    // Try 3: Rule-based responses
    const ruleBasedResponse = this.getRuleBasedResponse(prompt, options?.module);
    if (ruleBasedResponse) {
      return {
        text: ruleBasedResponse,
        source: 'rule-based',
        confidence: 0.6,
      };
    }

    // Final fallback: Generic error message
    return {
      text: this.getGenericFallback(options?.language),
      source: 'rule-based',
      confidence: 0.3,
    };
  }

  /**
   * Try Bedrock with exponential backoff retry
   */
  private async tryBedrockWithRetry(
    prompt: string,
    options?: { module?: string; language?: string }
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.bedrock.generateWithCache(prompt, {
          modelType: 'haiku',
          useCache: true,
        });
        return response.text;
      } catch (error: any) {
        lastError = error;

        // Don't retry on certain errors
        if (error.name === 'ValidationException' || error.name === 'ModelNotReadyException') {
          throw error;
        }

        // Exponential backoff
        if (attempt < this.maxRetries - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Bedrock request failed after retries');
  }

  /**
   * Get rule-based response for common queries
   */
  private getRuleBasedResponse(prompt: string, module?: string): string | null {
    const lowerPrompt = prompt.toLowerCase();

    // Agriculture module rules
    if (module === 'agriculture' || lowerPrompt.includes('crop') || lowerPrompt.includes('farm')) {
      if (lowerPrompt.includes('weather')) {
        return 'For current weather information, please check the Weather section in the Agriculture module. You can also enable weather alerts for your location.';
      }
      if (lowerPrompt.includes('soil')) {
        return 'To analyze your soil health, go to Agriculture > Soil Analysis. You can upload a photo of your soil or enter soil test results manually.';
      }
      if (lowerPrompt.includes('recommend') || lowerPrompt.includes('suggest')) {
        return 'For crop recommendations, visit Agriculture > Crop Selection. Provide your farm details including location, soil type, and budget for personalized suggestions.';
      }
    }

    // Health module rules
    if (module === 'health' || lowerPrompt.includes('health') || lowerPrompt.includes('symptom')) {
      if (lowerPrompt.includes('emergency') || lowerPrompt.includes('urgent')) {
        return 'For medical emergencies, please call emergency services immediately at 108 or visit the nearest hospital. The app provides first aid guidance but is not a substitute for professional medical care.';
      }
      if (lowerPrompt.includes('remedy') || lowerPrompt.includes('medicine')) {
        return 'To find natural remedies, go to Health > Natural Medicine. Search for your ailment to see traditional remedies with preparation instructions and safety information.';
      }
    }

    // Education module rules
    if (module === 'education' || lowerPrompt.includes('learn') || lowerPrompt.includes('study')) {
      if (lowerPrompt.includes('course') || lowerPrompt.includes('lesson')) {
        return 'Browse available courses in Education > Content Library. Filter by subject, grade level, and topic to find relevant learning materials.';
      }
      if (lowerPrompt.includes('quiz') || lowerPrompt.includes('test')) {
        return 'Practice quizzes are available after completing video lessons. Your progress is tracked automatically to help you master each topic.';
      }
    }

    // Infrastructure module rules
    if (
      module === 'infrastructure' ||
      lowerPrompt.includes('report') ||
      lowerPrompt.includes('issue')
    ) {
      if (lowerPrompt.includes('report') || lowerPrompt.includes('complaint')) {
        return 'To report an infrastructure issue, go to Infrastructure > Report Issue. Take a photo of the problem, and it will be automatically categorized and sent to the appropriate authority.';
      }
      if (lowerPrompt.includes('track') || lowerPrompt.includes('status')) {
        return 'Track your reported issues in Infrastructure > My Grievances. You will receive notifications when the status changes.';
      }
    }

    // General navigation
    if (lowerPrompt.includes('how to') || lowerPrompt.includes('help')) {
      return 'I can help you with:\n• Agriculture: Crop recommendations, soil analysis, weather alerts\n• Health: First aid, natural remedies, nutrition plans\n• Education: Learning content, quizzes, progress tracking\n• Infrastructure: Report issues, track projects, community polls\n\nWhat would you like to know more about?';
    }

    return null;
  }

  /**
   * Get generic fallback message
   */
  private getGenericFallback(language?: string): string {
    const messages: Record<string, string> = {
      en: "I'm currently experiencing technical difficulties. Please try again in a moment, or navigate to the specific module for your needs.",
      hi: 'मुझे तकनीकी समस्या हो रही है। कृपया कुछ देर बाद पुनः प्रयास करें, या अपनी आवश्यकताओं के लिए विशिष्ट मॉड्यूल पर जाएं।',
      ta: 'நான் தற்போது தொழில்நுட்ப சிக்கல்களை எதிர்கொள்கிறேன். சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும், அல்லது உங்கள் தேவைகளுக்கான குறிப்பிட்ட தொகுதிக்கு செல்லவும்.',
      te: 'నేను ప్రస్తుతం సాంకేతిక సమస్యలను ఎదుర్కొంటున్నాను. దయచేసి కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి, లేదా మీ అవసరాల కోసం నిర్దిష్ట మాడ్యూల్‌కు వెళ్లండి.',
    };

    return messages[language || 'en'] || messages.en;
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<{
    bedrock: boolean;
    rag: boolean;
    cache: boolean;
  }> {
    const health = {
      bedrock: false,
      rag: false,
      cache: false,
    };

    // Check Bedrock
    try {
      await this.bedrock.generateWithCache('test', {
        modelType: 'haiku',
        useCache: false,
      });
      health.bedrock = true;
    } catch (error) {
      console.error('Bedrock health check failed:', error);
    }

    // Check RAG
    try {
      const stats = this.rag.getStats();
      health.rag = stats.totalDocuments > 0;
    } catch (error) {
      console.error('RAG health check failed:', error);
    }

    // Check cache
    try {
      const stats = await this.bedrock.getCacheStats();
      health.cache = true;
    } catch (error) {
      console.error('Cache health check failed:', error);
    }

    return health;
  }
}

// Singleton instance
let fallbackServiceInstance: FallbackService | null = null;

export function getFallbackService(): FallbackService {
  if (!fallbackServiceInstance) {
    fallbackServiceInstance = new FallbackService();
  }
  return fallbackServiceInstance;
}
