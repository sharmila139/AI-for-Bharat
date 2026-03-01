/**
 * Crop Rotation Service
 * Handles API calls for crop rotation plans and recommendations
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

export interface CropRotationCycle {
  season: 'kharif' | 'rabi' | 'zaid';
  year: number;
  cropName: string;
  cropType: string;
  sowingMonth: string;
  harvestMonth: string;
  duration: number; // days
  expectedYield: number;
  soilHealthImpact: {
    nitrogen: number; // -100 to +100
    phosphorus: number;
    potassium: number;
    organicMatter: number;
  };
  companionCrops?: string[];
}

export interface CropRotationPlan {
  planId: string;
  farmId: string;
  farmName: string;
  startYear: number;
  duration: number; // years
  cycles: CropRotationCycle[];
  benefits: {
    soilHealthImprovement: number; // percentage
    pestReduction: number;
    yieldIncrease: number;
    economicBenefit: number; // rupees
  };
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CompanionCropSuggestion {
  mainCrop: string;
  companionCrops: Array<{
    name: string;
    benefits: string[];
    plantingRatio: string;
  }>;
}

class CropRotationService {
  private getAuthToken(): string | null {
    return 'mock-token';
  }

  private getHeaders() {
    const token = this.getAuthToken();
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Get crop rotation plan for a farm
   */
  async getCropRotationPlan(farmId: string): Promise<CropRotationPlan> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/agriculture/crop-rotation/${farmId}`,
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching crop rotation plan:', error);
      throw error;
    }
  }

  /**
   * Generate new crop rotation plan
   */
  async generateRotationPlan(
    farmId: string,
    preferences: {
      duration: number; // years
      currentCrop?: string;
      soilType: string;
      objectives: ('soil_health' | 'yield' | 'pest_control' | 'economic')[];
    }
  ): Promise<CropRotationPlan> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/agriculture/crop-rotation/generate`,
        {
          farmId,
          ...preferences,
        },
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating crop rotation plan:', error);
      throw error;
    }
  }

  /**
   * Get companion crop suggestions
   */
  async getCompanionCropSuggestions(cropName: string): Promise<CompanionCropSuggestion> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/agriculture/crop-rotation/companion-crops`,
        {
          headers: this.getHeaders(),
          params: { crop: cropName },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching companion crop suggestions:', error);
      throw error;
    }
  }

  /**
   * Export rotation plan
   */
  async exportRotationPlan(planId: string, format: 'pdf' | 'image'): Promise<string> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/agriculture/crop-rotation/export/${planId}`,
        {
          headers: this.getHeaders(),
          params: { format },
        }
      );
      return response.data.url;
    } catch (error) {
      console.error('Error exporting rotation plan:', error);
      throw error;
    }
  }

  /**
   * Get season color
   */
  getSeasonColor(season: string): string {
    const colors: Record<string, string> = {
      kharif: '#4CAF50', // Green - Monsoon season
      rabi: '#FF9800', // Orange - Winter season
      zaid: '#2196F3', // Blue - Summer season
    };
    return colors[season] || '#9E9E9E';
  }

  /**
   * Get season name
   */
  getSeasonName(season: string): string {
    const names: Record<string, string> = {
      kharif: 'Kharif (Monsoon)',
      rabi: 'Rabi (Winter)',
      zaid: 'Zaid (Summer)',
    };
    return names[season] || season;
  }

  /**
   * Calculate soil health impact
   */
  calculateOverallSoilImpact(cycles: CropRotationCycle[]): number {
    if (cycles.length === 0) return 0;
    
    const totalImpact = cycles.reduce((sum, cycle) => {
      const impact = (
        cycle.soilHealthImpact.nitrogen +
        cycle.soilHealthImpact.phosphorus +
        cycle.soilHealthImpact.potassium +
        cycle.soilHealthImpact.organicMatter
      ) / 4;
      return sum + impact;
    }, 0);
    
    return Math.round(totalImpact / cycles.length);
  }
}

export default new CropRotationService();
