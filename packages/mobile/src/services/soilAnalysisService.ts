/**
 * Soil Analysis Service
 * Handles API calls for soil photo upload and analysis
 */

import axios from 'axios';

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
   * Upload and analyze soil photo
   */
  async analyzeSoilPhoto(
    imageUri: string,
    analysisType: 'photo' | 'health-card' = 'photo'
  ): Promise<SoilAnalysisResult> {
    try {
      const formData = new FormData();
      
      // Add image file
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'soil-photo.jpg',
      } as any);
      
      // Add analysis type
      formData.append('type', analysisType);

      const response = await axios.post(
        `${API_BASE_URL}/agriculture/soil/analyze`,
        formData,
        {
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error analyzing soil photo:', error);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      throw error;
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
