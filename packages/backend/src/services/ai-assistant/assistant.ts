import { getBedrockService } from '../bedrock';
import { BedrockMessage } from '../bedrock/client';

export type ModuleType = 'agriculture' | 'health' | 'education' | 'infrastructure' | 'general';

export interface AssistantQuery {
  message: string;
  userId: string;
  language: string;
  conversationHistory?: BedrockMessage[];
}

export interface AssistantResponse {
  text: string;
  module: ModuleType;
  confidence: number;
  suggestions?: string[];
  actions?: Array<{ type: string; data: any }>;
}

export class AIAssistant {
  private bedrock = getBedrockService();

  /**
   * Process user query and route to appropriate module
   */
  async processQuery(query: AssistantQuery): Promise<AssistantResponse> {
    // Step 1: Detect intent and module
    const intent = await this.detectIntent(query.message, query.language);

    // Step 2: Generate response based on module
    const response = await this.generateResponse(query, intent.module);

    return {
      text: response.text,
      module: intent.module,
      confidence: intent.confidence,
      suggestions: this.generateSuggestions(intent.module),
      actions: this.generateActions(intent.module, response.text),
    };
  }

  /**
   * Detect user intent and route to module
   */
  private async detectIntent(
    message: string,
    language: string
  ): Promise<{ module: ModuleType; confidence: number }> {
    const systemPrompt = `You are an intent classifier for RuralConnect AI, an app serving rural communities in India.
Analyze the user's message and determine which module it belongs to:
- agriculture: Farming, crops, soil, weather, irrigation, pests
- health: Medical symptoms, first aid, remedies, nutrition, wellness
- education: Learning, courses, exams, skills, tutoring
- infrastructure: Roads, water supply, electricity, grievances, civic issues
- general: Greetings, app navigation, general questions

Respond with ONLY the module name and confidence (0-1) in this format:
module: <module_name>
confidence: <0.0-1.0>`;

    const prompt = `User message (in ${language}): "${message}"

Classify this message:`;

    const response = await this.bedrock.generateWithCache(prompt, {
      modelType: 'haiku', // Fast classification
      systemPrompt,
      useCache: true,
    });

    // Parse response
    const moduleMatch = response.text.match(/module:\s*(\w+)/i);
    const confidenceMatch = response.text.match(/confidence:\s*([\d.]+)/i);

    const module = (moduleMatch?.[1] || 'general') as ModuleType;
    const confidence = parseFloat(confidenceMatch?.[1] || '0.5');

    return { module, confidence };
  }

  /**
   * Generate response based on module and context
   */
  private async generateResponse(
    query: AssistantQuery,
    module: ModuleType
  ): Promise<{ text: string }> {
    const systemPrompt = this.getSystemPrompt(module, query.language);

    // Build conversation history
    const messages: BedrockMessage[] = [
      ...(query.conversationHistory || []),
      {
        role: 'user',
        content: query.message,
      },
    ];

    // Use appropriate model based on complexity
    const modelType = messages.length > 2 ? 'sonnet' : 'haiku';

    if (query.conversationHistory && query.conversationHistory.length > 0) {
      // Multi-turn conversation
      const response = await this.bedrock.chat(messages);
      return { text: response.text };
    } else {
      // Single query
      const response = await this.bedrock.generateWithCache(query.message, {
        modelType,
        systemPrompt,
        useCache: true,
      });
      return { text: response.text };
    }
  }

  /**
   * Get system prompt for specific module
   */
  private getSystemPrompt(module: ModuleType, language: string): string {
    const basePrompt = `You are RuralConnect AI Assistant, helping rural communities in India.
Respond in ${language} language.
Be concise, practical, and culturally sensitive.
Provide actionable advice suitable for rural context.`;

    const modulePrompts: Record<ModuleType, string> = {
      agriculture: `${basePrompt}
You specialize in agriculture and farming.
Topics: crop selection, soil health, irrigation, weather, pests, sustainable practices.
Provide practical farming advice based on Indian agricultural practices.`,

      health: `${basePrompt}
You specialize in primary healthcare and wellness.
Topics: first aid, symptoms, natural remedies, nutrition, preventive care.
IMPORTANT: Always advise consulting a doctor for serious conditions.
Focus on home remedies and preventive care.`,

      education: `${basePrompt}
You specialize in education and skill development.
Topics: learning resources, exam preparation, skill training, career guidance.
Provide guidance aligned with Indian education system (NCERT, CBSE, state boards).`,

      infrastructure: `${basePrompt}
You specialize in civic infrastructure and community issues.
Topics: reporting issues, tracking projects, community participation.
Help users navigate government services and civic processes.`,

      general: `${basePrompt}
You provide general assistance and app navigation.
Help users understand app features and direct them to appropriate modules.`,
    };

    return modulePrompts[module];
  }

  /**
   * Generate follow-up suggestions
   */
  private generateSuggestions(module: ModuleType): string[] {
    const suggestions: Record<ModuleType, string[]> = {
      agriculture: [
        'Get crop recommendations',
        'Analyze soil health',
        'Check weather forecast',
        'Learn sustainable practices',
      ],
      health: [
        'Check symptoms',
        'Find natural remedies',
        'Get nutrition advice',
        'View first aid guides',
      ],
      education: [
        'Browse courses',
        'Take practice quiz',
        'View learning progress',
        'Get study tips',
      ],
      infrastructure: [
        'Report an issue',
        'Track my grievances',
        'View community projects',
        'Participate in polls',
      ],
      general: [
        'Explore agriculture module',
        'Explore health module',
        'Explore education module',
        'Explore infrastructure module',
      ],
    };

    return suggestions[module];
  }

  /**
   * Generate actionable items from response
   */
  private generateActions(module: ModuleType, responseText: string): Array<{ type: string; data: any }> {
    const actions: Array<{ type: string; data: any }> = [];

    // Extract actions based on keywords in response
    if (module === 'agriculture') {
      if (responseText.toLowerCase().includes('crop recommendation')) {
        actions.push({ type: 'navigate', data: { screen: 'CropRecommendation' } });
      }
      if (responseText.toLowerCase().includes('soil analysis')) {
        actions.push({ type: 'navigate', data: { screen: 'SoilAnalysis' } });
      }
    }

    if (module === 'health') {
      if (responseText.toLowerCase().includes('emergency') || responseText.toLowerCase().includes('doctor')) {
        actions.push({ type: 'call', data: { number: 'emergency' } });
      }
    }

    if (module === 'infrastructure') {
      if (responseText.toLowerCase().includes('report') || responseText.toLowerCase().includes('grievance')) {
        actions.push({ type: 'navigate', data: { screen: 'ReportGrievance' } });
      }
    }

    return actions;
  }

  /**
   * Stream response for real-time interaction
   */
  async *streamResponse(query: AssistantQuery): AsyncGenerator<string> {
    const intent = await this.detectIntent(query.message, query.language);
    const systemPrompt = this.getSystemPrompt(intent.module, query.language);

    // Stream the response
    yield* this.bedrock.streamGenerate(query.message, {
      modelType: 'sonnet',
    });
  }
}

// Singleton instance
let assistantInstance: AIAssistant | null = null;

export function getAIAssistant(): AIAssistant {
  if (!assistantInstance) {
    assistantInstance = new AIAssistant();
  }
  return assistantInstance;
}
