/**
 * Meal Plan Generator Service
 * Generates daily meal plans with local and seasonal foods
 * Tasks 17.3, 17.4, 17.5: Meal plan generation, cost optimization, daily structure
 */

import { Pool } from 'pg';
import {
  FoodItem,
  Meal,
  DailyMealPlan,
  MealType,
  NutritionPlan,
  CreateNutritionPlanInput,
  CostOptimizationResult,
  DietaryRestriction
} from '../../../types/nutrition';

export class MealPlanGeneratorService {
  constructor(private db: Pool) {}

  /**
   * Meal timing schedule (5 meals per day)
   */
  private readonly DEFAULT_MEAL_SCHEDULE: Record<MealType, string> = {
    breakfast: '07:00',
    mid_morning: '10:00',
    lunch: '13:00',
    evening_snack: '16:00',
    dinner: '19:00'
  };

  /**
   * Calorie distribution across meals (percentage)
   */
  private readonly MEAL_CALORIE_DISTRIBUTION: Record<MealType, number> = {
    breakfast: 0.25,      // 25%
    mid_morning: 0.10,    // 10%
    lunch: 0.35,          // 35%
    evening_snack: 0.10,  // 10%
    dinner: 0.20          // 20%
  };

  /**
   * Create a nutrition plan
   */
  async createNutritionPlan(input: CreateNutritionPlanInput): Promise<NutritionPlan> {
    const {
      userId,
      planName,
      planType,
      targetCalories,
      targetProteinG,
      targetCarbsG,
      targetFatG,
      targetFiberG,
      mealsPerDay = 5,
      mealSchedule = this.DEFAULT_MEAL_SCHEDULE,
      cuisinePreferences = [],
      avoidFoods = [],
      dailyBudgetInr,
      costOptimized = true,
      startDate,
      endDate
    } = input;

    const query = `
      INSERT INTO nutrition_plans (
        user_id, plan_name, plan_type, target_calories,
        target_protein_g, target_carbs_g, target_fat_g, target_fiber_g,
        meals_per_day, meal_schedule, cuisine_preferences, avoid_foods,
        daily_budget_inr, cost_optimized, is_active, start_date, end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING 
        plan_id as "planId",
        user_id as "userId",
        plan_name as "planName",
        plan_type as "planType",
        target_calories as "targetCalories",
        target_protein_g as "targetProteinG",
        target_carbs_g as "targetCarbsG",
        target_fat_g as "targetFatG",
        target_fiber_g as "targetFiberG",
        meals_per_day as "mealsPerDay",
        meal_schedule as "mealSchedule",
        cuisine_preferences as "cuisinePreferences",
        avoid_foods as "avoidFoods",
        daily_budget_inr as "dailyBudgetInr",
        cost_optimized as "costOptimized",
        is_active as "isActive",
        start_date as "startDate",
        end_date as "endDate",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const values = [
      userId, planName, planType, targetCalories,
      targetProteinG, targetCarbsG, targetFatG, targetFiberG,
      mealsPerDay, JSON.stringify(mealSchedule), cuisinePreferences, avoidFoods,
      dailyBudgetInr, costOptimized, true, startDate, endDate
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Generate daily meal plan with 5 meals
   * Task 17.3: Local and seasonal foods
   * Task 17.5: Daily meal plan structure
   */
  async generateDailyMealPlan(
    nutritionPlanId: string,
    date: Date,
    dietaryRestrictions: DietaryRestriction[] = [],
    avoidFoods: string[] = []
  ): Promise<DailyMealPlan> {
    // Get nutrition plan details
    const plan = await this.getNutritionPlan(nutritionPlanId);
    if (!plan) {
      throw new Error('Nutrition plan not found');
    }

    const meals: Meal[] = [];
    const mealTypes: MealType[] = ['breakfast', 'mid_morning', 'lunch', 'evening_snack', 'dinner'];

    for (const mealType of mealTypes) {
      const targetCalories = Math.round(
        plan.targetCalories * this.MEAL_CALORIE_DISTRIBUTION[mealType]
      );

      const meal = await this.generateMeal(
        nutritionPlanId,
        date,
        mealType,
        targetCalories,
        plan,
        dietaryRestrictions,
        avoidFoods
      );

      meals.push(meal);
    }

    // Calculate totals
    const totals = this.calculateDailyTotals(meals);

    return {
      date,
      meals,
      ...totals,
      meetsTargets: this.checkIfMeetsTargets(totals, plan),
      compliancePercentage: 0 // Will be updated as meals are consumed
    };
  }

  /**
   * Generate a single meal
   */
  private async generateMeal(
    nutritionPlanId: string,
    date: Date,
    mealType: MealType,
    targetCalories: number,
    plan: NutritionPlan,
    dietaryRestrictions: DietaryRestriction[],
    avoidFoods: string[]
  ): Promise<Meal> {
    // Get food items based on meal type and restrictions
    const foodItems = await this.selectFoodItems(
      mealType,
      targetCalories,
      plan,
      dietaryRestrictions,
      avoidFoods
    );

    // Calculate nutritional totals
    const totals = this.calculateMealNutrition(foodItems);

    // Generate recipe instructions
    const recipeInstructions = this.generateRecipeInstructions(mealType, foodItems);

    // Save meal to database
    const meal = await this.saveMeal({
      nutritionPlanId,
      mealDate: date,
      mealType,
      mealTime: plan.mealSchedule?.[mealType],
      foodItems,
      ...totals,
      recipeInstructions,
      preparationTimeMinutes: this.estimatePreparationTime(foodItems)
    });

    return meal;
  }

  /**
   * Select food items for a meal based on constraints
   * Prioritizes local and seasonal foods
   */
  private async selectFoodItems(
    mealType: MealType,
    targetCalories: number,
    plan: NutritionPlan,
    dietaryRestrictions: DietaryRestriction[],
    avoidFoods: string[]
  ): Promise<FoodItem[]> {
    // Get current month for seasonal filtering
    const currentMonth = new Date().getMonth() + 1;

    // Sample food database (in production, this would query a real database)
    const foodDatabase = this.getFoodDatabase(mealType, currentMonth);

    // Filter based on dietary restrictions
    let availableFoods = foodDatabase.filter(food => 
      this.matchesDietaryRestrictions(food, dietaryRestrictions) &&
      !avoidFoods.includes(food.name.toLowerCase())
    );

    // Prioritize local and seasonal foods
    availableFoods.sort((a, b) => {
      const aScore = (a.seasonal ? 2 : 0) + (a.locallyAvailable ? 2 : 0);
      const bScore = (b.seasonal ? 2 : 0) + (b.locallyAvailable ? 2 : 0);
      return bScore - aScore;
    });

    // Select foods to meet calorie target
    const selectedFoods: FoodItem[] = [];
    let currentCalories = 0;
    const calorieMargin = targetCalories * 0.1; // 10% margin

    for (const food of availableFoods) {
      if (currentCalories >= targetCalories - calorieMargin) break;
      
      selectedFoods.push(food);
      currentCalories += food.calories;
    }

    // Optimize for cost if needed
    if (plan.costOptimized && plan.dailyBudgetInr) {
      return this.optimizeFoodSelectionForCost(
        selectedFoods,
        targetCalories,
        plan.dailyBudgetInr / 5 // Budget per meal
      );
    }

    return selectedFoods;
  }

  /**
   * Optimize food selection for cost (Task 17.4)
   */
  private optimizeFoodSelectionForCost(
    foods: FoodItem[],
    targetCalories: number,
    budgetPerMeal: number
  ): FoodItem[] {
    // Calculate cost per calorie for each food
    const foodsWithCostRatio = foods.map(food => ({
      ...food,
      costPerCalorie: (food.costInr || 0) / food.calories
    }));

    // Sort by cost efficiency (lowest cost per calorie first)
    foodsWithCostRatio.sort((a, b) => a.costPerCalorie - b.costPerCalorie);

    // Select foods within budget
    const optimized: FoodItem[] = [];
    let totalCost = 0;
    let totalCalories = 0;

    for (const food of foodsWithCostRatio) {
      if (totalCost + (food.costInr || 0) <= budgetPerMeal && 
          totalCalories < targetCalories) {
        optimized.push(food);
        totalCost += food.costInr || 0;
        totalCalories += food.calories;
      }
    }

    return optimized;
  }

  /**
   * Calculate cost optimization results (Task 17.4)
   */
  calculateCostOptimization(
    originalFoods: FoodItem[],
    optimizedFoods: FoodItem[]
  ): CostOptimizationResult {
    const originalCost = originalFoods.reduce((sum, f) => sum + (f.costInr || 0), 0);
    const optimizedCost = optimizedFoods.reduce((sum, f) => sum + (f.costInr || 0), 0);
    const savings = originalCost - optimizedCost;

    const substitutions = [];
    for (let i = 0; i < Math.min(originalFoods.length, optimizedFoods.length); i++) {
      if (originalFoods[i].name !== optimizedFoods[i].name) {
        substitutions.push({
          original: originalFoods[i],
          substitute: optimizedFoods[i],
          reason: 'Cost optimization while maintaining nutritional value'
        });
      }
    }

    return {
      originalCost,
      optimizedCost,
      savings,
      savingsPercentage: (savings / originalCost) * 100,
      substitutions
    };
  }

  /**
   * Check if food matches dietary restrictions
   */
  private matchesDietaryRestrictions(
    food: FoodItem,
    restrictions: DietaryRestriction[]
  ): boolean {
    // This would be more sophisticated in production
    // For now, simple keyword matching
    const foodNameLower = food.name.toLowerCase();

    for (const restriction of restrictions) {
      if (restriction === 'vegetarian' && 
          (foodNameLower.includes('meat') || foodNameLower.includes('fish') || 
           foodNameLower.includes('chicken') || foodNameLower.includes('egg'))) {
        return false;
      }
      if (restriction === 'vegan' && 
          (foodNameLower.includes('meat') || foodNameLower.includes('fish') || 
           foodNameLower.includes('chicken') || foodNameLower.includes('egg') ||
           foodNameLower.includes('milk') || foodNameLower.includes('cheese') ||
           foodNameLower.includes('yogurt'))) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate meal nutrition totals
   */
  private calculateMealNutrition(foods: FoodItem[]) {
    return {
      totalCalories: foods.reduce((sum, f) => sum + f.calories, 0),
      totalProteinG: foods.reduce((sum, f) => sum + f.proteinG, 0),
      totalCarbsG: foods.reduce((sum, f) => sum + f.carbsG, 0),
      totalFatG: foods.reduce((sum, f) => sum + f.fatG, 0),
      totalFiberG: foods.reduce((sum, f) => sum + (f.fiberG || 0), 0),
      estimatedCostInr: foods.reduce((sum, f) => sum + (f.costInr || 0), 0)
    };
  }

  /**
   * Calculate daily totals from meals
   */
  private calculateDailyTotals(meals: Meal[]) {
    return {
      totalCalories: meals.reduce((sum, m) => sum + m.totalCalories, 0),
      totalProteinG: meals.reduce((sum, m) => sum + m.totalProteinG, 0),
      totalCarbsG: meals.reduce((sum, m) => sum + m.totalCarbsG, 0),
      totalFatG: meals.reduce((sum, m) => sum + m.totalFatG, 0),
      totalFiberG: meals.reduce((sum, m) => sum + m.totalFiberG, 0),
      totalCostInr: meals.reduce((sum, m) => sum + m.estimatedCostInr, 0)
    };
  }

  /**
   * Check if daily totals meet targets
   */
  private checkIfMeetsTargets(totals: any, plan: NutritionPlan): boolean {
    const margin = 0.1; // 10% margin
    
    const caloriesMatch = Math.abs(totals.totalCalories - plan.targetCalories) <= plan.targetCalories * margin;
    const proteinMatch = Math.abs(totals.totalProteinG - plan.targetProteinG) <= plan.targetProteinG * margin;
    const carbsMatch = Math.abs(totals.totalCarbsG - plan.targetCarbsG) <= plan.targetCarbsG * margin;
    const fatMatch = Math.abs(totals.totalFatG - plan.targetFatG) <= plan.targetFatG * margin;

    return caloriesMatch && proteinMatch && carbsMatch && fatMatch;
  }

  /**
   * Generate recipe instructions
   */
  private generateRecipeInstructions(mealType: MealType, foods: FoodItem[]): string {
    const foodNames = foods.map(f => f.name).join(', ');
    
    const templates: Record<MealType, string> = {
      breakfast: `Prepare a nutritious breakfast with ${foodNames}. Cook as per traditional methods.`,
      mid_morning: `Enjoy a light snack with ${foodNames}.`,
      lunch: `Prepare a balanced lunch with ${foodNames}. Include vegetables and whole grains.`,
      evening_snack: `Have a healthy evening snack with ${foodNames}.`,
      dinner: `Prepare a light dinner with ${foodNames}. Keep it easy to digest.`
    };

    return templates[mealType];
  }

  /**
   * Estimate preparation time
   */
  private estimatePreparationTime(foods: FoodItem[]): number {
    // Simple estimation: 10 minutes per food item
    return foods.length * 10;
  }

  /**
   * Save meal to database
   */
  private async saveMeal(mealData: any): Promise<Meal> {
    const query = `
      INSERT INTO meal_plans (
        nutrition_plan_id, meal_date, meal_type, meal_time,
        food_items, total_calories, total_protein_g, total_carbs_g,
        total_fat_g, total_fiber_g, estimated_cost_inr,
        recipe_instructions, preparation_time_minutes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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

    const values = [
      mealData.nutritionPlanId,
      mealData.mealDate,
      mealData.mealType,
      mealData.mealTime,
      JSON.stringify(mealData.foodItems),
      mealData.totalCalories,
      mealData.totalProteinG,
      mealData.totalCarbsG,
      mealData.totalFatG,
      mealData.totalFiberG,
      mealData.estimatedCostInr,
      mealData.recipeInstructions,
      mealData.preparationTimeMinutes
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Get nutrition plan by ID
   */
  private async getNutritionPlan(planId: string): Promise<NutritionPlan | null> {
    const query = `
      SELECT 
        plan_id as "planId",
        user_id as "userId",
        plan_name as "planName",
        plan_type as "planType",
        target_calories as "targetCalories",
        target_protein_g as "targetProteinG",
        target_carbs_g as "targetCarbsG",
        target_fat_g as "targetFatG",
        target_fiber_g as "targetFiberG",
        meals_per_day as "mealsPerDay",
        meal_schedule as "mealSchedule",
        cuisine_preferences as "cuisinePreferences",
        avoid_foods as "avoidFoods",
        daily_budget_inr as "dailyBudgetInr",
        cost_optimized as "costOptimized",
        is_active as "isActive",
        start_date as "startDate",
        end_date as "endDate",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM nutrition_plans
      WHERE plan_id = $1
    `;

    const result = await this.db.query(query, [planId]);
    return result.rows[0] || null;
  }

  /**
   * Sample food database (would be a real database in production)
   */
  private getFoodDatabase(mealType: MealType, currentMonth: number): FoodItem[] {
    // This is a simplified sample - production would query a comprehensive food database
    const commonFoods: Record<MealType, FoodItem[]> = {
      breakfast: [
        { name: 'Idli', nameLocal: 'इडली', quantity: 2, unit: 'pieces', calories: 150, proteinG: 4, carbsG: 30, fatG: 1, fiberG: 2, costInr: 20, seasonal: true, locallyAvailable: true },
        { name: 'Dosa', nameLocal: 'डोसा', quantity: 1, unit: 'piece', calories: 200, proteinG: 5, carbsG: 35, fatG: 3, fiberG: 2, costInr: 25, seasonal: true, locallyAvailable: true },
        { name: 'Poha', nameLocal: 'पोहा', quantity: 1, unit: 'bowl', calories: 180, proteinG: 3, carbsG: 35, fatG: 2, fiberG: 3, costInr: 15, seasonal: true, locallyAvailable: true }
      ],
      mid_morning: [
        { name: 'Banana', nameLocal: 'केला', quantity: 1, unit: 'piece', calories: 105, proteinG: 1, carbsG: 27, fatG: 0, fiberG: 3, costInr: 5, seasonal: true, locallyAvailable: true },
        { name: 'Apple', nameLocal: 'सेब', quantity: 1, unit: 'piece', calories: 95, proteinG: 0, carbsG: 25, fatG: 0, fiberG: 4, costInr: 20, seasonal: false, locallyAvailable: true }
      ],
      lunch: [
        { name: 'Rice', nameLocal: 'चावल', quantity: 1, unit: 'cup', calories: 200, proteinG: 4, carbsG: 45, fatG: 0, fiberG: 1, costInr: 15, seasonal: true, locallyAvailable: true },
        { name: 'Dal', nameLocal: 'दाल', quantity: 1, unit: 'cup', calories: 180, proteinG: 12, carbsG: 30, fatG: 1, fiberG: 8, costInr: 20, seasonal: true, locallyAvailable: true },
        { name: 'Vegetable Curry', nameLocal: 'सब्जी', quantity: 1, unit: 'cup', calories: 150, proteinG: 3, carbsG: 20, fatG: 6, fiberG: 5, costInr: 30, seasonal: true, locallyAvailable: true }
      ],
      evening_snack: [
        { name: 'Tea', nameLocal: 'चाय', quantity: 1, unit: 'cup', calories: 50, proteinG: 1, carbsG: 10, fatG: 1, fiberG: 0, costInr: 5, seasonal: true, locallyAvailable: true },
        { name: 'Biscuits', nameLocal: 'बिस्कुट', quantity: 3, unit: 'pieces', calories: 120, proteinG: 2, carbsG: 20, fatG: 4, fiberG: 1, costInr: 10, seasonal: true, locallyAvailable: true }
      ],
      dinner: [
        { name: 'Roti', nameLocal: 'रोटी', quantity: 2, unit: 'pieces', calories: 150, proteinG: 5, carbsG: 30, fatG: 2, fiberG: 3, costInr: 10, seasonal: true, locallyAvailable: true },
        { name: 'Vegetable Curry', nameLocal: 'सब्जी', quantity: 1, unit: 'cup', calories: 150, proteinG: 3, carbsG: 20, fatG: 6, fiberG: 5, costInr: 30, seasonal: true, locallyAvailable: true }
      ]
    };

    return commonFoods[mealType] || [];
  }
}
