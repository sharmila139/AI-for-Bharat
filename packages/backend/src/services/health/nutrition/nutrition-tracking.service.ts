/**
 * Nutrition Tracking Service
 * Handles meal compliance tracking, nutrient gap analysis, and nutrition display
 * Tasks 17.6, 17.8, 17.9: Nutrition display, compliance tracking, nutrient gap analysis
 */

import { Pool } from 'pg';
import {
  MealComplianceRecord,
  WeeklyCompliance,
  NutrientGap,
  NutrientGapAnalysis,
  Meal,
  MealType
} from '../../../types/nutrition';

export class NutritionTrackingService {
  constructor(private db: Pool) {}

  /**
   * Mark a meal as consumed (Task 17.8)
   */
  async markMealConsumed(
    mealPlanId: string,
    complianceRating: number = 5
  ): Promise<Meal> {
    if (complianceRating < 1 || complianceRating > 5) {
      throw new Error('Compliance rating must be between 1 and 5');
    }

    const query = `
      UPDATE meal_plans
      SET 
        consumed = true,
        consumed_at = CURRENT_TIMESTAMP,
        compliance_rating = $2
      WHERE meal_plan_id = $1
      RETURNING 
        meal_plan_id as "mealPlanId",
        nutrition_plan_id as "nutritionPlanId",
        meal_date as "mealDate",
        meal_type as "mealType",
        meal_time as "mealTime",
        food_items as "foodItems",
        total_calories as "totalCalories",
        total_protein_g as "totalProteinG",
        total_carbs_g as "totalCarbsG",
        total_fat_g as "totalFatG",
        total_fiber_g as "totalFiberG",
        estimated_cost_inr as "estimatedCostInr",
        recipe_instructions as "recipeInstructions",
        preparation_time_minutes as "preparationTimeMinutes",
        consumed,
        consumed_at as "consumedAt",
        compliance_rating as "complianceRating",
        created_at as "createdAt"
    `;

    const result = await this.db.query(query, [mealPlanId, complianceRating]);
    
    if (result.rows.length === 0) {
      throw new Error('Meal plan not found');
    }

    return result.rows[0];
  }

  /**
   * Get daily meal compliance (Task 17.8)
   */
  async getDailyCompliance(
    userId: string,
    date: Date
  ): Promise<MealComplianceRecord> {
    const query = `
      SELECT 
        mp.meal_type,
        mp.consumed
      FROM meal_plans mp
      JOIN nutrition_plans np ON mp.nutrition_plan_id = np.plan_id
      WHERE np.user_id = $1 
        AND mp.meal_date = $2
        AND np.is_active = true
    `;

    const result = await this.db.query(query, [userId, date]);
    const meals = result.rows;

    const plannedMeals = meals.length;
    const consumedMeals = meals.filter(m => m.consumed).length;
    const compliancePercentage = plannedMeals > 0 
      ? Math.round((consumedMeals / plannedMeals) * 100)
      : 0;

    const missedMeals: MealType[] = meals
      .filter(m => !m.consumed)
      .map(m => m.meal_type);

    return {
      date,
      plannedMeals,
      consumedMeals,
      compliancePercentage,
      missedMeals
    };
  }

  /**
   * Get weekly compliance (Task 17.8)
   */
  async getWeeklyCompliance(
    userId: string,
    weekStartDate: Date
  ): Promise<WeeklyCompliance> {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    const dailyCompliance: MealComplianceRecord[] = [];
    let totalPlanned = 0;
    let totalConsumed = 0;

    // Get compliance for each day of the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStartDate);
      date.setDate(date.getDate() + i);

      const dayCompliance = await this.getDailyCompliance(userId, date);
      dailyCompliance.push(dayCompliance);
      
      totalPlanned += dayCompliance.plannedMeals;
      totalConsumed += dayCompliance.consumedMeals;
    }

    const averageCompliance = totalPlanned > 0
      ? Math.round((totalConsumed / totalPlanned) * 100)
      : 0;

    return {
      weekStartDate,
      weekEndDate,
      dailyCompliance,
      averageCompliance,
      totalPlannedMeals: totalPlanned,
      totalConsumedMeals: totalConsumed
    };
  }

  /**
   * Get nutrition information for display (Task 17.6)
   */
  async getNutritionInfo(mealPlanId: string): Promise<{
    meal: Meal;
    nutritionBreakdown: any;
    micronutrients: any;
  }> {
    const query = `
      SELECT 
        meal_plan_id as "mealPlanId",
        nutrition_plan_id as "nutritionPlanId",
        meal_date as "mealDate",
        meal_type as "mealType",
        meal_time as "mealTime",
        food_items as "foodItems",
        total_calories as "totalCalories",
        total_protein_g as "totalProteinG",
        total_carbs_g as "totalCarbsG",
        total_fat_g as "totalFatG",
        total_fiber_g as "totalFiberG",
        estimated_cost_inr as "estimatedCostInr",
        recipe_instructions as "recipeInstructions",
        preparation_time_minutes as "preparationTimeMinutes",
        consumed,
        consumed_at as "consumedAt",
        compliance_rating as "complianceRating",
        created_at as "createdAt"
      FROM meal_plans
      WHERE meal_plan_id = $1
    `;

    const result = await this.db.query(query, [mealPlanId]);
    
    if (result.rows.length === 0) {
      throw new Error('Meal plan not found');
    }

    const meal = result.rows[0];

    // Calculate nutrition breakdown
    const nutritionBreakdown = {
      macronutrients: {
        protein: {
          grams: meal.totalProteinG,
          calories: meal.totalProteinG * 4,
          percentage: Math.round((meal.totalProteinG * 4 / meal.totalCalories) * 100)
        },
        carbohydrates: {
          grams: meal.totalCarbsG,
          calories: meal.totalCarbsG * 4,
          percentage: Math.round((meal.totalCarbsG * 4 / meal.totalCalories) * 100)
        },
        fats: {
          grams: meal.totalFatG,
          calories: meal.totalFatG * 9,
          percentage: Math.round((meal.totalFatG * 9 / meal.totalCalories) * 100)
        },
        fiber: {
          grams: meal.totalFiberG
        }
      },
      totalCalories: meal.totalCalories,
      costPerServing: meal.estimatedCostInr
    };

    // Estimate micronutrients (simplified - would be more detailed in production)
    const micronutrients = this.estimateMicronutrients(meal.foodItems);

    return {
      meal,
      nutritionBreakdown,
      micronutrients
    };
  }

  /**
   * Perform nutrient gap analysis (Task 17.9)
   */
  async analyzeNutrientGaps(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    analysisDate: Date = new Date()
  ): Promise<NutrientGapAnalysis> {
    // Get user's nutrition plan
    const planQuery = `
      SELECT 
        plan_id as "planId",
        target_calories as "targetCalories",
        target_protein_g as "targetProteinG",
        target_carbs_g as "targetCarbsG",
        target_fat_g as "targetFatG",
        target_fiber_g as "targetFiberG"
      FROM nutrition_plans
      WHERE user_id = $1 AND is_active = true
      LIMIT 1
    `;

    const planResult = await this.db.query(planQuery, [userId]);
    
    if (planResult.rows.length === 0) {
      throw new Error('No active nutrition plan found');
    }

    const plan = planResult.rows[0];

    // Get actual consumption
    const actual = await this.getActualConsumption(userId, period, analysisDate);

    // Calculate gaps
    const gaps: NutrientGap[] = [
      this.calculateGap('Calories', plan.targetCalories, actual.calories, 'kcal'),
      this.calculateGap('Protein', plan.targetProteinG, actual.proteinG, 'g'),
      this.calculateGap('Carbohydrates', plan.targetCarbsG, actual.carbsG, 'g'),
      this.calculateGap('Fat', plan.targetFatG, actual.fatG, 'g'),
      this.calculateGap('Fiber', plan.targetFiberG, actual.fiberG, 'g')
    ];

    // Generate recommendations
    const recommendations = this.generateNutrientRecommendations(gaps);

    return {
      userId,
      analysisDate,
      period,
      gaps,
      recommendations
    };
  }

  /**
   * Calculate nutrient gap
   */
  private calculateGap(
    nutrient: string,
    target: number,
    actual: number,
    unit: string
  ): NutrientGap {
    const gap = target - actual;
    const gapPercentage = Math.round((gap / target) * 100);

    let status: 'deficient' | 'adequate' | 'excess';
    if (gapPercentage > 10) {
      status = 'deficient';
    } else if (gapPercentage < -10) {
      status = 'excess';
    } else {
      status = 'adequate';
    }

    return {
      nutrient,
      targetAmount: target,
      actualAmount: actual,
      gapAmount: gap,
      gapPercentage,
      unit,
      status
    };
  }

  /**
   * Get actual nutrient consumption
   */
  private async getActualConsumption(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly',
    date: Date
  ): Promise<any> {
    let startDate = new Date(date);
    let endDate = new Date(date);

    if (period === 'weekly') {
      startDate.setDate(date.getDate() - 6);
    } else if (period === 'monthly') {
      startDate.setDate(date.getDate() - 29);
    }

    const query = `
      SELECT 
        SUM(mp.total_calories) as calories,
        SUM(mp.total_protein_g) as "proteinG",
        SUM(mp.total_carbs_g) as "carbsG",
        SUM(mp.total_fat_g) as "fatG",
        SUM(mp.total_fiber_g) as "fiberG"
      FROM meal_plans mp
      JOIN nutrition_plans np ON mp.nutrition_plan_id = np.plan_id
      WHERE np.user_id = $1 
        AND mp.consumed = true
        AND mp.meal_date BETWEEN $2 AND $3
    `;

    const result = await this.db.query(query, [userId, startDate, endDate]);
    const totals = result.rows[0];

    // Divide by number of days for average
    const days = period === 'daily' ? 1 : (period === 'weekly' ? 7 : 30);

    return {
      calories: Math.round((totals.calories || 0) / days),
      proteinG: Math.round((totals.proteinG || 0) / days),
      carbsG: Math.round((totals.carbsG || 0) / days),
      fatG: Math.round((totals.fatG || 0) / days),
      fiberG: Math.round((totals.fiberG || 0) / days)
    };
  }

  /**
   * Generate recommendations based on nutrient gaps
   */
  private generateNutrientRecommendations(gaps: NutrientGap[]): any[] {
    const recommendations: any[] = [];

    for (const gap of gaps) {
      if (gap.status === 'deficient') {
        const foods = this.getFoodsForNutrient(gap.nutrient);
        recommendations.push({
          nutrient: gap.nutrient,
          suggestedFoods: foods,
          reasoning: `You are ${Math.abs(gap.gapPercentage)}% below your ${gap.nutrient.toLowerCase()} target. Include more ${foods.join(', ')} in your diet.`
        });
      } else if (gap.status === 'excess') {
        recommendations.push({
          nutrient: gap.nutrient,
          suggestedFoods: [],
          reasoning: `You are ${Math.abs(gap.gapPercentage)}% above your ${gap.nutrient.toLowerCase()} target. Consider reducing portion sizes.`
        });
      }
    }

    return recommendations;
  }

  /**
   * Get food suggestions for specific nutrients
   */
  private getFoodsForNutrient(nutrient: string): string[] {
    const foodMap: Record<string, string[]> = {
      'Protein': ['Dal', 'Paneer', 'Chickpeas', 'Soy products', 'Nuts'],
      'Carbohydrates': ['Rice', 'Roti', 'Oats', 'Sweet potato', 'Banana'],
      'Fat': ['Ghee', 'Nuts', 'Seeds', 'Avocado', 'Coconut oil'],
      'Fiber': ['Vegetables', 'Fruits', 'Whole grains', 'Legumes', 'Seeds'],
      'Calories': ['Rice', 'Roti', 'Dal', 'Vegetables', 'Fruits']
    };

    return foodMap[nutrient] || [];
  }

  /**
   * Estimate micronutrients from food items
   */
  private estimateMicronutrients(foodItems: any): any {
    // Simplified estimation - would be more detailed in production
    return {
      vitamins: {
        vitaminA: { amount: 800, unit: 'mcg', dailyValue: 80 },
        vitaminC: { amount: 60, unit: 'mg', dailyValue: 75 },
        vitaminD: { amount: 10, unit: 'mcg', dailyValue: 50 },
        vitaminE: { amount: 12, unit: 'mg', dailyValue: 80 }
      },
      minerals: {
        calcium: { amount: 800, unit: 'mg', dailyValue: 80 },
        iron: { amount: 12, unit: 'mg', dailyValue: 67 },
        magnesium: { amount: 300, unit: 'mg', dailyValue: 80 },
        zinc: { amount: 8, unit: 'mg', dailyValue: 73 }
      }
    };
  }

  /**
   * Get daily progress tracking
   */
  async getDailyProgress(userId: string, date: Date): Promise<any> {
    const compliance = await this.getDailyCompliance(userId, date);
    const gaps = await this.analyzeNutrientGaps(userId, 'daily', date);

    return {
      date,
      compliance,
      nutrientGaps: gaps.gaps,
      recommendations: gaps.recommendations,
      overallScore: this.calculateOverallScore(compliance, gaps.gaps)
    };
  }

  /**
   * Calculate overall nutrition score
   */
  private calculateOverallScore(
    compliance: MealComplianceRecord,
    gaps: NutrientGap[]
  ): number {
    // Compliance score (50% weight)
    const complianceScore = compliance.compliancePercentage * 0.5;

    // Nutrient adequacy score (50% weight)
    const adequateNutrients = gaps.filter(g => g.status === 'adequate').length;
    const nutrientScore = (adequateNutrients / gaps.length) * 100 * 0.5;

    return Math.round(complianceScore + nutrientScore);
  }
}
