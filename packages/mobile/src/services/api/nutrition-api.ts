/**
 * Nutrition API Service
 * Client for nutrition tracking endpoints
 * Task 17.11: API client for nutrition tracking
 */

import { apiConfig } from '../../config/api-config';

export class NutritionApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${apiConfig.baseUrl}/nutrition`;
  }

  /**
   * Health Profile APIs
   */
  async createHealthProfile(profileData: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create health profile');
    }

    return data.data;
  }

  async getHealthProfile(userId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health-profile/${userId}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get health profile');
    }

    return data.data;
  }

  async updateHealthProfile(userId: string, updates: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health-profile/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update health profile');
    }

    return data.data;
  }

  /**
   * Calorie Calculator APIs
   */
  async calculateRequirements(params: {
    weightKg: number;
    heightCm: number;
    age: number;
    gender: string;
    activityLevel: string;
    occupationType: string;
    healthConditions?: string[];
    goal?: string;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/calculate-requirements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to calculate requirements');
    }

    return data.data;
  }

  async getOccupationCalories(occupation: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/occupation-calories/${occupation}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get occupation calories');
    }

    return data.data;
  }

  /**
   * Meal Plan APIs
   */
  async createMealPlan(planData: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/meal-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(planData)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to create meal plan');
    }

    return data.data;
  }

  async getDailyMealPlan(userId: string, date: string): Promise<any> {
    // This would typically get the plan ID from user profile first
    // For now, we'll assume it's stored locally or passed
    const response = await fetch(`${this.baseUrl}/meal-plan/daily/${userId}/${date}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get daily meal plan');
    }

    return data.data;
  }

  async generateDailyMealPlan(
    planId: string,
    date: string,
    dietaryRestrictions?: string[],
    avoidFoods?: string[]
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}/meal-plan/${planId}/generate-daily`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date,
        dietaryRestrictions,
        avoidFoods
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to generate daily meal plan');
    }

    return data.data;
  }

  /**
   * Nutrition Tracking APIs
   */
  async getNutritionInfo(mealPlanId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/meal/${mealPlanId}/info`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get nutrition info');
    }

    return data.data;
  }

  async markMealConsumed(mealPlanId: string, complianceRating: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/meal/${mealPlanId}/consume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ complianceRating })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to mark meal as consumed');
    }

    return data.data;
  }

  async getDailyCompliance(userId: string, date: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/compliance/daily/${userId}/${date}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get daily compliance');
    }

    return data.data;
  }

  async getWeeklyCompliance(userId: string, startDate: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/compliance/weekly/${userId}/${startDate}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get weekly compliance');
    }

    return data.data;
  }

  async getNutrientGaps(userId: string, period: string = 'daily', date?: string): Promise<any> {
    const queryParams = new URLSearchParams({ period });
    if (date) {
      queryParams.append('date', date);
    }

    const response = await fetch(`${this.baseUrl}/nutrient-gaps/${userId}?${queryParams}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get nutrient gaps');
    }

    return data.data;
  }

  async getDailyProgress(userId: string, date: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/progress/daily/${userId}/${date}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get daily progress');
    }

    return data.data;
  }

  /**
   * Dietary Restriction APIs
   */
  async validateFood(food: any, restrictions: string[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/validate-food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ food, restrictions })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to validate food');
    }

    return data.data;
  }

  async getSubstitutions(ingredient: string, restrictions: string[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/substitutions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ingredient, restrictions })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get substitutions');
    }

    return data.data;
  }

  async filterFoodsByRestrictions(foods: any[], restrictions: string[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/filter-foods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ foods, restrictions })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to filter foods');
    }

    return data.data;
  }
}
