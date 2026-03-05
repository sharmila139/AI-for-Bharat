/**
 * Crop Recommendation Service
 * Handles API calls for crop recommendations
 */

import apiClient from './api/client';
import { CropRecommendationInput, CropRecommendationResponse } from '../types/cropRecommendation';

class CropRecommendationService {
  /**
   * Get crop recommendations based on farm conditions
   */
  async getCropRecommendations(
    input: CropRecommendationInput
  ): Promise<CropRecommendationResponse> {
    try {
      const response = await apiClient.post<CropRecommendationResponse>(
        '/api/agriculture/crop-recommendations',
        input
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Failed to get crop recommendations');
    } catch (error: any) {
      console.error('Error getting crop recommendations:', error);
      throw new Error(error.message || 'Failed to get crop recommendations');
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
