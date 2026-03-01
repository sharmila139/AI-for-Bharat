/**
 * Crop Recommendation Service
 * Handles API calls for crop recommendations
 */

import axios from 'axios';
import { CropRecommendationInput, CropRecommendationResponse } from '../types/cropRecommendation';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

class CropRecommendationService {
  private getAuthToken(): string | null {
    // In a real app, get token from secure storage
    // For now, return a placeholder
    return 'mock-token';
  }

  private getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Get crop recommendations based on farm conditions
   */
  async getCropRecommendations(
    input: CropRecommendationInput
  ): Promise<CropRecommendationResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/crop-recommendation`,
        input,
        {
          headers: this.getHeaders(),
          timeout: 15000, // 15 seconds
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting crop recommendations:', error);
      throw error;
    }
  }

  /**
   * Get list of supported crops
   */
  async getSupportedCrops(): Promise<any[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/crop-recommendation/crops`, {
        headers: this.getHeaders(),
      });
      return response.data.crops || [];
    } catch (error) {
      console.error('Error fetching supported crops:', error);
      throw error;
    }
  }
}

export default new CropRecommendationService();
