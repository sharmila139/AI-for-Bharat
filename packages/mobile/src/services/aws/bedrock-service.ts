/**
 * AWS Bedrock Service
 * Handles AI model invocations with fallback logic
 */

import AWS_CONFIG from '../../config/aws-config';

// ============================================================================
// TYPES
// ============================================================================

export interface BedrockRequest {
  prompt: string;
  context?: Record<string, any>;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface BedrockResponse {
  success: boolean;
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  error?: string;
  fallbackUsed?: boolean;
}

export type AIUseCase = 
  | 'crop_recommendation'
  | 'soil_analysis'
  | 'health_assessment'
  | 'education_recommendation'
  | 'grievance_classification';

// ============================================================================
// BEDROCK SERVICE CLASS
// ============================================================================

class BedrockService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = AWS_CONFIG.apiGateway.baseUrl;
  }

  /**
   * Invoke AI model with automatic fallback
   */
  async invoke(
    useCase: AIUseCase,
    request: BedrockRequest
  ): Promise<BedrockResponse> {
    // Get temperature based on use case
    const temperature = request.temperature ?? this.getTemperatureForUseCase(useCase);

    console.log(`🤖 [Bedrock] Invoking AI for use case: ${useCase}`);
    console.log(`🤖 [Bedrock] Temperature: ${temperature}`);

    try {
      // Try primary model first
      console.log(`🤖 [Bedrock] Attempting PRIMARY model: ${AWS_CONFIG.bedrock.primaryModel}`);
      const response = await this.invokePrimaryModel(request, temperature);
      console.log(`✅ [Bedrock] PRIMARY model succeeded!`);
      console.log(`✅ [Bedrock] Response length: ${response.content.length} characters`);
      return response;
    } catch (primaryError) {
      console.warn('⚠️ [Bedrock] Primary model failed, trying fallback:', primaryError);
      
      try {
        // Try fallback model
        console.log(`🤖 [Bedrock] Attempting FALLBACK model: ${AWS_CONFIG.bedrock.fallbackModel}`);
        const response = await this.invokeFallbackModel(request, temperature);
        console.log(`✅ [Bedrock] FALLBACK model succeeded!`);
        console.log(`✅ [Bedrock] Response length: ${response.content.length} characters`);
        return {
          ...response,
          fallbackUsed: true,
        };
      } catch (fallbackError) {
        console.error('❌ [Bedrock] All AI models failed!');
        console.error('❌ [Bedrock] Primary error:', primaryError);
        console.error('❌ [Bedrock] Fallback error:', fallbackError);
        console.log('🔄 [Bedrock] Using STATIC fallback response');
        
        // Return static fallback
        return this.getStaticFallback(useCase, request);
      }
    }
  }

  /**
   * Invoke primary model (Claude 3 Sonnet)
   */
  private async invokePrimaryModel(
    request: BedrockRequest,
    temperature: number
  ): Promise<BedrockResponse> {
    return this.invokeModel(
      AWS_CONFIG.bedrock.primaryModel,
      request,
      temperature
    );
  }

  /**
   * Invoke fallback model (Claude 3 Haiku)
   */
  private async invokeFallbackModel(
    request: BedrockRequest,
    temperature: number
  ): Promise<BedrockResponse> {
    return this.invokeModel(
      AWS_CONFIG.bedrock.fallbackModel,
      request,
      temperature
    );
  }

  /**
   * Invoke specific Bedrock model via API Gateway
   */
  private async invokeModel(
    modelId: string,
    request: BedrockRequest,
    temperature: number
  ): Promise<BedrockResponse> {
    const endpoint = `${this.apiBaseUrl}/api/v1/ai/invoke`;
    
    console.log(`📡 [Bedrock] Calling API: ${endpoint}`);
    console.log(`📡 [Bedrock] Model: ${modelId}`);
    
    const payload = {
      modelId,
      prompt: request.prompt,
      systemPrompt: request.systemPrompt,
      context: request.context,
      temperature,
      maxTokens: request.maxTokens || AWS_CONFIG.bedrock.maxTokens,
    };

    // Create AbortController for timeout (React Native compatible)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, AWS_CONFIG.bedrock.timeout);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`📡 [Bedrock] API Response Status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [Bedrock] API Error Response: ${errorText}`);
        throw new Error(`Bedrock API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        content: data.content || data.response || '',
        model: modelId,
        usage: data.usage,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get temperature setting for specific use case
   */
  private getTemperatureForUseCase(useCase: AIUseCase): number {
    switch (useCase) {
      case 'crop_recommendation':
      case 'education_recommendation':
        return AWS_CONFIG.bedrock.temperature.recommendations;
      
      case 'soil_analysis':
      case 'health_assessment':
        return AWS_CONFIG.bedrock.temperature.analysis;
      
      case 'grievance_classification':
        return AWS_CONFIG.bedrock.temperature.classification;
      
      default:
        return 0.5;
    }
  }

  /**
   * Get static fallback response when all AI models fail
   */
  private getStaticFallback(
    useCase: AIUseCase,
    request: BedrockRequest
  ): BedrockResponse {
    console.log(`🔄 [Bedrock] Generating static fallback for: ${useCase}`);
    
    let content = '';

    switch (useCase) {
      case 'crop_recommendation':
        content = this.getCropRecommendationFallback(request.context);
        break;
      
      case 'soil_analysis':
        content = this.getSoilAnalysisFallback(request.context);
        break;
      
      case 'health_assessment':
        content = this.getHealthAssessmentFallback(request.context);
        break;
      
      case 'education_recommendation':
        content = this.getEducationRecommendationFallback(request.context);
        break;
      
      case 'grievance_classification':
        content = this.getGrievanceClassificationFallback(request.context);
        break;
      
      default:
        content = 'AI service is temporarily unavailable. Please try again later.';
    }

    console.log(`🔄 [Bedrock] Static fallback generated (${content.length} characters)`);

    return {
      success: false,
      content,
      model: 'static_fallback',
      error: 'All AI models unavailable',
      fallbackUsed: true,
    };
  }

  /**
   * Static fallback for crop recommendations
   */
  private getCropRecommendationFallback(context?: Record<string, any>): string {
    const season = context?.season?.toLowerCase() || 'unknown';
    
    // Simple rule-based recommendations
    if (season.includes('monsoon') || season.includes('kharif')) {
      return JSON.stringify({
        recommendations: [
          {
            crop: 'Rice',
            reason: 'Suitable for monsoon season with high water availability',
            confidence: 0.7,
          },
          {
            crop: 'Cotton',
            reason: 'Good monsoon crop with moderate water requirements',
            confidence: 0.65,
          },
          {
            crop: 'Maize',
            reason: 'Versatile crop suitable for various soil types',
            confidence: 0.6,
          },
        ],
        note: 'These are general recommendations. Consult local agricultural experts for specific advice.',
      });
    } else if (season.includes('winter') || season.includes('rabi')) {
      return JSON.stringify({
        recommendations: [
          {
            crop: 'Wheat',
            reason: 'Ideal winter crop with good market demand',
            confidence: 0.7,
          },
          {
            crop: 'Mustard',
            reason: 'Suitable for winter season with good oil content',
            confidence: 0.65,
          },
          {
            crop: 'Chickpea',
            reason: 'Nitrogen-fixing legume good for soil health',
            confidence: 0.6,
          },
        ],
        note: 'These are general recommendations. Consult local agricultural experts for specific advice.',
      });
    }

    return JSON.stringify({
      recommendations: [
        {
          crop: 'Consult Local Expert',
          reason: 'Unable to provide specific recommendations without AI service',
          confidence: 0.5,
        },
      ],
      note: 'AI service is temporarily unavailable. Please consult local agricultural extension officers.',
    });
  }

  /**
   * Static fallback for soil analysis
   */
  private getSoilAnalysisFallback(context?: Record<string, any>): string {
    return JSON.stringify({
      analysis: 'Unable to analyze soil without AI service',
      recommendations: [
        'Get soil tested at nearest agricultural laboratory',
        'Consult local agricultural extension officer',
        'Follow general soil health practices: crop rotation, organic matter addition',
      ],
      note: 'AI service is temporarily unavailable. Professional soil testing is recommended.',
    });
  }

  /**
   * Static fallback for health assessment
   */
  private getHealthAssessmentFallback(context?: Record<string, any>): string {
    return JSON.stringify({
      severity: 'Unknown',
      advice: [
        'AI health assessment is temporarily unavailable',
        'If symptoms are severe, seek immediate medical attention',
        'Call emergency services (108) if needed',
        'Consult a healthcare professional for proper diagnosis',
      ],
      disclaimer: 'This is not medical advice. Always consult qualified healthcare professionals.',
    });
  }

  /**
   * Static fallback for education recommendations
   */
  private getEducationRecommendationFallback(context?: Record<string, any>): string {
    return JSON.stringify({
      recommendations: [
        {
          title: 'Basic Mathematics',
          reason: 'Fundamental subject for all students',
          priority: 'high',
        },
        {
          title: 'Science Fundamentals',
          reason: 'Essential for understanding the world',
          priority: 'high',
        },
        {
          title: 'Language Skills',
          reason: 'Important for communication',
          priority: 'medium',
        },
      ],
      note: 'AI recommendations are temporarily unavailable. These are general suggestions.',
    });
  }

  /**
   * Static fallback for grievance classification
   */
  private getGrievanceClassificationFallback(context?: Record<string, any>): string {
    return JSON.stringify({
      category: 'general',
      severity: 'medium',
      confidence: 0.5,
      note: 'AI classification is temporarily unavailable. Manual review required.',
    });
  }

  /**
   * Build prompt for crop recommendation
   */
  buildCropRecommendationPrompt(input: {
    location?: string;
    soilType?: string;
    season?: string;
    previousCrops?: string[];
    farmSize?: number;
    irrigationAvailable?: boolean;
  }): BedrockRequest {
    const prompt = `You are an agricultural expert helping farmers in rural India. Based on the following information, recommend the top 3 most suitable crops:

Location: ${input.location || 'Not specified'}
Soil Type: ${input.soilType || 'Not specified'}
Season: ${input.season || 'Not specified'}
Previous Crops: ${input.previousCrops?.join(', ') || 'Not specified'}
Farm Size: ${input.farmSize ? `${input.farmSize} acres` : 'Not specified'}
Irrigation: ${input.irrigationAvailable ? 'Available' : 'Not available'}

Provide recommendations in JSON format with the following structure:
{
  "recommendations": [
    {
      "crop": "Crop name",
      "reason": "Why this crop is suitable",
      "expectedYield": "Estimated yield per acre",
      "marketDemand": "Current market demand (high/medium/low)",
      "waterRequirement": "Water needs (high/medium/low)",
      "confidence": 0.85
    }
  ],
  "additionalAdvice": "Any additional farming advice"
}`;

    return {
      prompt,
      systemPrompt: 'You are an expert agricultural advisor with deep knowledge of Indian farming practices, crop rotation, soil management, and local market conditions.',
      context: input,
    };
  }

  /**
   * Build prompt for soil analysis
   */
  buildSoilAnalysisPrompt(input: {
    soilType?: string;
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
    pH?: number;
    organicMatter?: number;
  }): BedrockRequest {
    const prompt = `Analyze the following soil test results and provide recommendations:

Soil Type: ${input.soilType || 'Not specified'}
Nitrogen (N): ${input.nitrogen !== undefined ? `${input.nitrogen} kg/ha` : 'Not tested'}
Phosphorus (P): ${input.phosphorus !== undefined ? `${input.phosphorus} kg/ha` : 'Not tested'}
Potassium (K): ${input.potassium !== undefined ? `${input.potassium} kg/ha` : 'Not tested'}
pH Level: ${input.pH !== undefined ? input.pH : 'Not tested'}
Organic Matter: ${input.organicMatter !== undefined ? `${input.organicMatter}%` : 'Not tested'}

Provide analysis in JSON format:
{
  "soilHealth": "Overall assessment (excellent/good/fair/poor)",
  "deficiencies": ["List of nutrient deficiencies"],
  "recommendations": [
    {
      "action": "Specific recommendation",
      "reason": "Why this is needed",
      "priority": "high/medium/low"
    }
  ],
  "fertilizerAdvice": "Specific fertilizer recommendations with quantities"
}`;

    return {
      prompt,
      systemPrompt: 'You are a soil science expert specializing in Indian agricultural soils. Provide practical, actionable advice for farmers. IMPORTANT: Return ONLY valid JSON with no additional text before or after the JSON object.',
      context: input,
    };
  }

  /**
   * Build prompt for health symptom assessment
   */
  buildHealthAssessmentPrompt(input: {
    symptoms: string;
    duration?: string;
    age?: number;
    gender?: string;
  }): BedrockRequest {
    const prompt = `Assess the following symptoms and provide first aid guidance:

Symptoms: ${input.symptoms}
Duration: ${input.duration || 'Not specified'}
Age: ${input.age || 'Not specified'}
Gender: ${input.gender || 'Not specified'}

IMPORTANT: This is for first aid guidance only, not medical diagnosis.

Provide assessment in JSON format:
{
  "severity": "mild/moderate/severe/critical",
  "possibleConditions": ["List of possible conditions"],
  "firstAidSteps": ["Step-by-step first aid instructions"],
  "seekHelpIf": "When to seek immediate medical attention",
  "recommendedRemedies": ["Home remedies if applicable"],
  "disclaimer": "Always include medical disclaimer"
}`;

    return {
      prompt,
      systemPrompt: 'You are a healthcare advisor providing first aid guidance. Always emphasize seeking professional medical help for serious conditions. Include appropriate disclaimers.',
      context: input,
    };
  }

  /**
   * Build prompt for education content recommendation
   */
  buildEducationRecommendationPrompt(input: {
    studentId: string;
    gradeLevel?: string;
    subject?: string;
    currentProficiency?: number;
    learningStyle?: string;
    interests?: string[];
  }): BedrockRequest {
    const prompt = `Recommend educational content for a student with the following profile:

Grade Level: ${input.gradeLevel || 'Not specified'}
Subject: ${input.subject || 'General'}
Current Proficiency: ${input.currentProficiency !== undefined ? `${input.currentProficiency}%` : 'Not assessed'}
Learning Style: ${input.learningStyle || 'Not specified'}
Interests: ${input.interests?.join(', ') || 'Not specified'}

Provide recommendations in JSON format:
{
  "recommendations": [
    {
      "title": "Content title",
      "type": "video/interactive/reading",
      "difficulty": "easy/medium/hard",
      "reason": "Why this is recommended",
      "estimatedTime": "Time to complete",
      "priority": "high/medium/low"
    }
  ],
  "learningPath": "Suggested learning sequence",
  "motivationalTip": "Encouraging message for the student"
}`;

    return {
      prompt,
      systemPrompt: 'You are an educational advisor specializing in personalized learning. Consider the student\'s current level and provide appropriate, engaging content recommendations.',
      context: input,
    };
  }

  /**
   * Build prompt for grievance classification
   */
  buildGrievanceClassificationPrompt(input: {
    title: string;
    description: string;
    location?: string;
  }): BedrockRequest {
    const prompt = `Classify the following infrastructure grievance:

Title: ${input.title}
Description: ${input.description}
Location: ${input.location || 'Not specified'}

Classify into one of these categories:
- road (potholes, damaged roads, street lights)
- water (supply issues, leaks, quality)
- electricity (power cuts, line issues)
- sanitation (garbage, drainage, cleanliness)
- healthcare (hospital facilities, ambulance)
- education (school facilities, resources)
- public_safety (crime, safety concerns)
- other (anything else)

Provide classification in JSON format:
{
  "category": "Category name",
  "severity": "low/medium/high/critical",
  "confidence": 0.85,
  "keywords": ["extracted", "keywords"],
  "suggestedDepartment": "Which department should handle this",
  "estimatedResolutionTime": "Estimated time to resolve (in days)"
}`;

    return {
      prompt,
      systemPrompt: 'You are an expert in municipal governance and infrastructure management. Classify grievances accurately to ensure proper routing.',
      context: input,
    };
  }
}

export default new BedrockService();
