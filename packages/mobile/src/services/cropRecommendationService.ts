/**
 * Crop Recommendation Service
 * Handles API calls for crop recommendations with AWS Bedrock AI
 */

import apiClient from './api/client';
import bedrockService from './aws/bedrock-service';
import { CropRecommendationInput, CropRecommendationResponse } from '../types/cropRecommendation';

class CropRecommendationService {
  /**
   * Get crop recommendations based on farm conditions using AWS Bedrock AI
   */
  async getCropRecommendations(
    input: CropRecommendationInput
  ): Promise<CropRecommendationResponse> {
    try {
      // Build AI prompt
      const bedrockRequest = bedrockService.buildCropRecommendationPrompt({
        location: input.location,
        soilType: input.soilType,
        season: input.season,
        previousCrops: input.previousCrops,
        farmSize: input.farmSize,
        irrigationAvailable: input.irrigationAvailable,
      });

      // Invoke Bedrock AI
      const aiResponse = await bedrockService.invoke('crop_recommendation', bedrockRequest);

      if (aiResponse.success) {
        // Parse AI response
        const recommendations = JSON.parse(aiResponse.content);
        
        return {
          success: true,
          recommendations: recommendations.recommendations || [],
          additionalAdvice: recommendations.additionalAdvice,
          aiModel: aiResponse.model,
          fallbackUsed: aiResponse.fallbackUsed,
        };
      }

      // If AI failed, return fallback response
      const fallbackData = JSON.parse(aiResponse.content);
      return {
        success: false,
        recommendations: fallbackData.recommendations || [],
        error: aiResponse.error,
        note: fallbackData.note,
      };
    } catch (error: any) {
      console.error('Error getting crop recommendations:', error);
      
      // Return basic fallback
      return {
        success: false,
        recommendations: [],
        error: error.message || 'Failed to get crop recommendations',
        note: 'Please consult local agricultural extension officers for recommendations.',
      };
    }
  }

  /**
   * Get list of supported crops
   */
  async getSupportedCrops(): Promise<any[]> {
    try {
      const response = await apiClient.get<{ crops: any[] }>(
        '/api/agriculture/crops'
      );

      if (response.success && response.data) {
        return response.data.crops || [];
      }

      return [];
    } catch (error) {
      console.error('Error fetching supported crops:', error);
      return [];
    }
  }
}

export default new CropRecommendationService();
