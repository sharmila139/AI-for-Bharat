/**
 * Soil Health Service
 * Handles API calls for soil health reports and recommendations
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

export interface NutrientLevel {
  value: number;
  unit: string;
  status: 'low' | 'medium' | 'high' | 'optimal';
  recommendation: string;
}

export interface SoilHealthReport {
  reportId: string;
  farmId?: string;
  analysisDate: string;
  overallScore: number; // 0-100
  soilType: string;
  texture: string;
  nutrients: {
    nitrogen: NutrientLevel;
    phosphorus: NutrientLevel;
    potassium: NutrientLevel;
    pH: NutrientLevel;
    organicCarbon: NutrientLevel;
  };
  fertilizerRecommendations: FertilizerRecommendation[];
  improvementSuggestions: string[];
  irrigationScheduleLink?: string;
}

export interface FertilizerRecommendation {
  type: 'organic' | 'chemical' | 'mixed';
  name: string;
  quantity: string;
  applicationMethod: string;
  timing: string;
  costEstimate: number;
  benefits: string[];
}

class SoilHealthService {
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
   * Get soil health report by ID
   */
  async getSoilHealthReport(reportId: string): Promise<SoilHealthReport> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/agriculture/soil/reports/${reportId}`,
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching soil health report:', error);
      throw error;
    }
  }

  /**
   * Get all soil health reports for a farm
   */
  async getFarmSoilReports(farmId: string): Promise<SoilHealthReport[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/agriculture/soil/reports`,
        {
          headers: this.getHeaders(),
          params: { farmId },
        }
      );
      return response.data.reports || [];
    } catch (error) {
      console.error('Error fetching farm soil reports:', error);
      throw error;
    }
  }

  /**
   * Calculate soil health score from nutrient data
   */
  calculateHealthScore(nutrients: any): number {
    // Simplified scoring algorithm
    // In production, this would be more sophisticated
    let score = 0;
    let count = 0;

    const statusScores = {
      optimal: 100,
      high: 80,
      medium: 60,
      low: 40,
    };

    Object.values(nutrients).forEach((nutrient: any) => {
      if (nutrient && nutrient.status) {
        score += statusScores[nutrient.status as keyof typeof statusScores] || 50;
        count++;
      }
    });

    return count > 0 ? Math.round(score / count) : 0;
  }

  /**
   * Get color for health score
   */
  getScoreColor(score: number): string {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#FFC107'; // Yellow
    if (score >= 40) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }

  /**
   * Get status label for health score
   */
  getScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  }
}

export default new SoilHealthService();
