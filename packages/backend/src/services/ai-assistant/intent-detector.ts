/**
 * Intent Detection Service
 * Uses Amazon Bedrock for intent classification and entity extraction
 */

import { getBedrockService } from '../bedrock';

export type IntentType = 
  | 'crop_recommendation'
  | 'soil_analysis'
  | 'weather_query'
  | 'market_prices'
  | 'pest_identification'
  | 'symptom_check'
  | 'first_aid'
  | 'remedy_search'
  | 'nutrition_advice'
  | 'course_search'
  | 'learning_progress'
  | 'quiz_request'
  | 'grievance_report'
  | 'project_status'
  | 'poll_participation'
  | 'general_query'
  | 'greeting'
  | 'help';

export type ModuleType = 'agriculture' | 'health' | 'education' | 'infrastructure' | 'general';

export interface DetectedIntent {
  intent: IntentType;
  module: ModuleType;
  confidence: number;
  entities: Record<string, any>;
  requiresAction: boolean;
  actionType?: string;
}

export interface IntentDetectionOptions {
  language: string;
  userId?: string;
  context?: Record<string, any>;
}

export class IntentDetector {
  private bedrock = getBedrockService();

  /**
   * Detect intent from user message
   */
  async detectIntent(
    message: string,
    options: IntentDetectionOptions
  ): Promise<DetectedIntent> {
    const systemPrompt = this.buildIntentDetectionPrompt(options.language);

    const prompt = `User message: "${message}"

Analyze this message and provide:
1. Primary intent
2. Module category
3. Confidence score (0-1)
4. Extracted entities (if any)
5. Whether it requires immediate action

Format your response as JSON:
{
  "intent": "<intent_type>",
  "module": "<module_type>",
  "confidence": <0.0-1.0>,
  "entities": {},
  "requiresAction": <true/false>,
  "actionType": "<action_type or null>"
}`;

    const response = await this.bedrock.generateWithCache(prompt, {
      modelType: 'haiku', // Fast for classification
      systemPrompt,
      useCache: true,
      maxTokens: 500
    });

    return this.parseIntentResponse(response.text, message);
  }

  /**
   * Build intent detection system prompt
   */
  private buildIntentDetectionPrompt(language: string): string {
    return `You are an intent classifier for RuralConnect AI, serving rural communities in India.

MODULES AND INTENTS:

Agriculture Module:
- crop_recommendation: User wants crop suggestions
- soil_analysis: User wants soil health analysis
- weather_query: User asks about weather/forecast
- market_prices: User asks about crop prices
- pest_identification: User describes pest/disease issues

Health Module:
- symptom_check: User describes health symptoms
- first_aid: User needs emergency first aid guidance
- remedy_search: User looks for natural remedies
- nutrition_advice: User asks about diet/nutrition

Education Module:
- course_search: User looks for learning content
- learning_progress: User asks about their progress
- quiz_request: User wants to take a quiz/test

Infrastructure Module:
- grievance_report: User wants to report an issue
- project_status: User asks about community projects
- poll_participation: User wants to participate in polls

General:
- general_query: General questions about the app
- greeting: Greetings, casual conversation
- help: User needs help navigating the app

ENTITY EXTRACTION:
Extract relevant entities like:
- Crop names (rice, wheat, tomato, etc.)
- Locations (village, district, state)
- Symptoms (fever, cough, pain, etc.)
- Time references (today, tomorrow, this week)
- Quantities (5 acres, 10 kg, etc.)

ACTION DETECTION:
Determine if the intent requires immediate action:
- Emergency health situations → requiresAction: true, actionType: "emergency_call"
- Reporting grievances → requiresAction: true, actionType: "open_form"
- Navigation requests → requiresAction: true, actionType: "navigate"

Respond in ${language} if needed, but keep JSON keys in English.`;
  }

  /**
   * Parse intent detection response
   */
  private parseIntentResponse(responseText: string, originalMessage: string): DetectedIntent {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          intent: parsed.intent || 'general_query',
          module: parsed.module || 'general',
          confidence: parsed.confidence || 0.5,
          entities: parsed.entities || {},
          requiresAction: parsed.requiresAction || false,
          actionType: parsed.actionType
        };
      }
    } catch (error) {
      console.error('Failed to parse intent response:', error);
    }

    // Fallback: Use keyword-based detection
    return this.fallbackIntentDetection(originalMessage);
  }

  /**
   * Fallback intent detection using keywords
   */
  private fallbackIntentDetection(message: string): DetectedIntent {
    const lowerMessage = message.toLowerCase();

    // Agriculture keywords
    if (lowerMessage.match(/crop|farm|soil|plant|seed|harvest|irrigation/)) {
      if (lowerMessage.match(/recommend|suggest|which crop|what crop/)) {
        return {
          intent: 'crop_recommendation',
          module: 'agriculture',
          confidence: 0.7,
          entities: {},
          requiresAction: true,
          actionType: 'navigate'
        };
      }
      if (lowerMessage.match(/soil|health|test|analysis/)) {
        return {
          intent: 'soil_analysis',
          module: 'agriculture',
          confidence: 0.7,
          entities: {},
          requiresAction: true,
          actionType: 'navigate'
        };
      }
      if (lowerMessage.match(/weather|rain|temperature|forecast/)) {
        return {
          intent: 'weather_query',
          module: 'agriculture',
          confidence: 0.7,
          entities: {},
          requiresAction: false
        };
      }
      if (lowerMessage.match(/price|market|sell|buy/)) {
        return {
          intent: 'market_prices',
          module: 'agriculture',
          confidence: 0.7,
          entities: {},
          requiresAction: false
        };
      }
    }

    // Health keywords
    if (lowerMessage.match(/symptom|pain|fever|sick|ill|disease|health/)) {
      if (lowerMessage.match(/emergency|urgent|serious|critical|ambulance/)) {
        return {
          intent: 'first_aid',
          module: 'health',
          confidence: 0.8,
          entities: {},
          requiresAction: true,
          actionType: 'emergency_call'
        };
      }
      return {
        intent: 'symptom_check',
        module: 'health',
        confidence: 0.7,
        entities: {},
        requiresAction: true,
        actionType: 'navigate'
      };
    }

    if (lowerMessage.match(/remedy|cure|treatment|medicine|ayurvedic/)) {
      return {
        intent: 'remedy_search',
        module: 'health',
        confidence: 0.7,
        entities: {},
        requiresAction: false
      };
    }

    // Education keywords
    if (lowerMessage.match(/learn|study|course|lesson|education|exam|quiz/)) {
      if (lowerMessage.match(/quiz|test|exam|assessment/)) {
        return {
          intent: 'quiz_request',
          module: 'education',
          confidence: 0.7,
          entities: {},
          requiresAction: true,
          actionType: 'navigate'
        };
      }
      return {
        intent: 'course_search',
        module: 'education',
        confidence: 0.7,
        entities: {},
        requiresAction: false
      };
    }

    // Infrastructure keywords
    if (lowerMessage.match(/report|complaint|issue|problem|grievance|road|water|electricity/)) {
      return {
        intent: 'grievance_report',
        module: 'infrastructure',
        confidence: 0.7,
        entities: {},
        requiresAction: true,
        actionType: 'open_form'
      };
    }

    if (lowerMessage.match(/poll|vote|survey|opinion/)) {
      return {
        intent: 'poll_participation',
        module: 'infrastructure',
        confidence: 0.7,
        entities: {},
        requiresAction: true,
        actionType: 'navigate'
      };
    }

    // Greetings
    if (lowerMessage.match(/hello|hi|hey|namaste|good morning|good evening/)) {
      return {
        intent: 'greeting',
        module: 'general',
        confidence: 0.9,
        entities: {},
        requiresAction: false
      };
    }

    // Help
    if (lowerMessage.match(/help|how to|guide|tutorial/)) {
      return {
        intent: 'help',
        module: 'general',
        confidence: 0.8,
        entities: {},
        requiresAction: false
      };
    }

    // Default
    return {
      intent: 'general_query',
      module: 'general',
      confidence: 0.5,
      entities: {},
      requiresAction: false
    };
  }

  /**
   * Detect multiple intents in a complex message
   */
  async detectMultipleIntents(
    message: string,
    options: IntentDetectionOptions
  ): Promise<DetectedIntent[]> {
    const systemPrompt = `${this.buildIntentDetectionPrompt(options.language)}

For complex messages with multiple intents, identify all intents and return an array of intent objects.`;

    const prompt = `User message: "${message}"

This message may contain multiple intents. Identify all of them.

Format your response as JSON array:
[
  {
    "intent": "<intent_type>",
    "module": "<module_type>",
    "confidence": <0.0-1.0>,
    "entities": {},
    "requiresAction": <true/false>,
    "actionType": "<action_type or null>"
  }
]`;

    const response = await this.bedrock.generateWithCache(prompt, {
      modelType: 'sonnet', // More complex task
      systemPrompt,
      useCache: false,
      maxTokens: 1000
    });

    try {
      const jsonMatch = response.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((item: any) => ({
          intent: item.intent || 'general_query',
          module: item.module || 'general',
          confidence: item.confidence || 0.5,
          entities: item.entities || {},
          requiresAction: item.requiresAction || false,
          actionType: item.actionType
        }));
      }
    } catch (error) {
      console.error('Failed to parse multiple intents:', error);
    }

    // Fallback to single intent
    return [await this.detectIntent(message, options)];
  }

  /**
   * Get intent description for user
   */
  getIntentDescription(intent: IntentType, language: string = 'en'): string {
    const descriptions: Record<IntentType, string> = {
      crop_recommendation: 'Get personalized crop recommendations',
      soil_analysis: 'Analyze soil health and get fertilizer advice',
      weather_query: 'Check weather forecast and alerts',
      market_prices: 'View current market prices for crops',
      pest_identification: 'Identify and manage pests and diseases',
      symptom_check: 'Check symptoms and get health advice',
      first_aid: 'Get emergency first aid instructions',
      remedy_search: 'Find natural remedies and treatments',
      nutrition_advice: 'Get nutrition and diet recommendations',
      course_search: 'Find educational courses and content',
      learning_progress: 'View your learning progress',
      quiz_request: 'Take a quiz or assessment',
      grievance_report: 'Report a community issue',
      project_status: 'Check status of community projects',
      poll_participation: 'Participate in community polls',
      general_query: 'General question or inquiry',
      greeting: 'Greeting or casual conversation',
      help: 'Get help using the app'
    };

    return descriptions[intent] || 'General query';
  }
}

// Singleton instance
let detectorInstance: IntentDetector | null = null;

export function getIntentDetector(): IntentDetector {
  if (!detectorInstance) {
    detectorInstance = new IntentDetector();
  }
  return detectorInstance;
}

export default IntentDetector;
