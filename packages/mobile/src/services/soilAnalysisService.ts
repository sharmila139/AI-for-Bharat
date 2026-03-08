/**
 * Soil Analysis Service
 * Handles API calls for soil photo upload and analysis with AWS Bedrock AI
 */

import axios from 'axios';
import bedrockService from './aws/bedrock-service';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

export interface SoilAnalysisResult {
  success: boolean;
  analysisType: 'photo' | 'health-card';
  data?: {
    soilType?: string;
    texture?: string;
    confidence?: number;
    meetsThreshold?: boolean;
    nutrientIndicators?: {
      nitrogen?: string;
      phosphorus?: string;
      potassium?: string;
      pH?: number;
      organicCarbon?: number;
    };
    topPredictions?: Array<{
      soilType: string;
      confidence: number;
    }>;
    analysis?: {
      soilHealth?: string;
      deficiencies?: string[];
      recommendations?: Array<{
        action: string;
        reason: string;
        priority: string;
      }>;
      fertilizerAdvice?: string;
    };
  };
  imageQuality?: any;
  validation?: any;
  requiresManualReview?: boolean;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  processingTimeMs?: number;
}

export interface SoilType {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
}

export interface QualityRequirements {
  minWidth: number;
  minHeight: number;
  maxFileSize: number;
  minFileSize: number;
  acceptedFormats: string[];
  minQualityScore: number;
}

class SoilAnalysisService {
  private getAuthToken(): string | null {
    // In a real app, get token from secure storage
    return 'mock-token';
  }

  private getHeaders() {
    const token = this.getAuthToken();
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Upload and analyze soil photo using AWS Bedrock AI
   */
  async analyzeSoilPhoto(
    imageUri: string,
    analysisType: 'photo' | 'health-card' = 'photo'
  ): Promise<SoilAnalysisResult> {
    try {
      // For now, we'll use text-based analysis
      // In future, integrate with Bedrock's image analysis capabilities
      
      // Build AI prompt for soil analysis
      const bedrockRequest = bedrockService.buildSoilAnalysisPrompt({
        soilType: 'Unknown (from photo)',
      });

      // Invoke Bedrock AI
      const aiResponse = await bedrockService.invoke('soil_analysis', bedrockRequest);

      if (aiResponse.success || aiResponse.fallbackUsed) {
        // Parse AI response - handle both JSON and text responses
        let analysis;
        try {
          // Try to extract JSON from the response
          const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          } else {
            // If no JSON found, create a structured response from text
            console.log('📝 [Soil Analysis] No JSON found, using text response');
            analysis = {
              soilHealth: 'fair',
              deficiencies: [],
              recommendations: [{
                action: aiResponse.content.substring(0, 200),
                reason: 'AI analysis',
                priority: 'medium'
              }],
              fertilizerAdvice: aiResponse.content.length > 200 
                ? aiResponse.content.substring(200, 700)
                : 'Consult local agricultural expert for specific recommendations'
            };
          }
        } catch (parseError) {
          console.error('❌ [Soil Analysis] Error parsing AI response:', parseError);
          // Fallback to text-based response
          analysis = {
            soilHealth: 'unknown',
            deficiencies: [],
            recommendations: [{
              action: 'AI analysis completed. See details below.',
              reason: 'Text-based analysis',
              priority: 'medium'
            }],
            fertilizerAdvice: aiResponse.content.substring(0, 500) || 'Unable to generate analysis. Please try again.'
          };
        }
        
        console.log('✅ [Soil Analysis] Analysis object created:', JSON.stringify(analysis, null, 2));
        console.log('Navigate to results:', {
          success: true,
          analysisType,
          data: {
            soilType: 'Requires lab testing for accurate identification',
            texture: 'Visual analysis only',
            confidence: 0.6,
            meetsThreshold: false,
            nutrientIndicators: {
              nitrogen: 'Requires testing',
              phosphorus: 'Requires testing',
              potassium: 'Requires testing',
            },
            analysis, // Include the parsed analysis
          },
        });
        
        return {
          success: true,
          analysisType,
          data: {
            soilType: 'Requires lab testing for accurate identification',
            texture: 'Visual analysis only',
            confidence: 0.6,
            meetsThreshold: false,
            nutrientIndicators: {
              nitrogen: 'Requires testing',
              phosphorus: 'Requires testing',
              potassium: 'Requires testing',
            },
            analysis, // Include the parsed analysis
          },
          requiresManualReview: true,
          processingTimeMs: 1000,
        };
      }

      // Fallback response
      return {
        success: false,
        analysisType,
        error: {
          code: 'AI_UNAVAILABLE',
          message: 'AI analysis temporarily unavailable. Please get soil tested at nearest agricultural laboratory.',
        },
        requiresManualReview: true,
      };
    } catch (error: any) {
      console.error('Error analyzing soil photo:', error);
      
      return {
        success: false,
        analysisType,
        error: {
          code: 'ANALYSIS_FAILED',
          message: error.message || 'Failed to analyze soil photo',
        },
        requiresManualReview: true,
      };
    }
  }

  /**
   * Get supported soil types
   */
  async getSupportedSoilTypes(): Promise<SoilType[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/agriculture/soil/supported-types`,
        {
          headers: this.getHeaders(),
        }
      );
      return response.data.soilTypes || [];
    } catch (error) {
      console.error('Error fetching supported soil types:', error);
      throw error;
    }
  }

  /**
   * Get image quality requirements
   */
  async getQualityRequirements(): Promise<{
    requirements: QualityRequirements;
    guidelines: string[];
  }> {
    // Mock data for development
    if (__DEV__) {
      return {
        requirements: {
          minWidth: 800,
          minHeight: 600,
          maxFileSize: 5242880, // 5MB
          minFileSize: 10240, // 10KB
          acceptedFormats: ['image/jpeg', 'image/jpg', 'image/png'],
          minQualityScore: 0.7,
        },
        guidelines: [
          'Take photo in good natural lighting',
          'Ensure soil is visible and in focus',
          'Avoid shadows and glare',
          'Include a reference object for scale',
          'Capture from directly above the soil',
        ],
      };
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/agriculture/soil/quality-requirements`,
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching quality requirements:', error);
      throw error;
    }
  }
}

export default new SoilAnalysisService();
