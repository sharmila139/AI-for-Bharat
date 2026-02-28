/**
 * Calorie and Macronutrient Calculator Service
 * Implements Mifflin-St Jeor equation for BMR calculation
 * Task 17.2: Implement calorie and macronutrient calculator
 */

import {
  CalorieRequirements,
  MacronutrientDistribution,
  NutritionalRequirements,
  ActivityLevel,
  OccupationType,
  OCCUPATION_CALORIE_RANGES
} from '../../../types/nutrition';

export class CalorieCalculatorService {
  /**
   * Activity level multipliers for TDEE calculation
   */
  private readonly ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
    sedentary: 1.2,      // Little or no exercise
    light: 1.375,        // Light exercise 1-3 days/week
    moderate: 1.55,      // Moderate exercise 3-5 days/week
    active: 1.725,       // Hard exercise 6-7 days/week
    very_active: 1.9     // Very hard exercise, physical job
  };

  /**
   * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
   * BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + s
   * where s = +5 for males and -161 for females
   */
  calculateBMR(
    weightKg: number,
    heightCm: number,
    age: number,
    gender: 'male' | 'female'
  ): number {
    if (weightKg <= 0 || heightCm <= 0 || age <= 0) {
      throw new Error('Weight, height, and age must be positive numbers');
    }

    if (age < 1 || age > 120) {
      throw new Error('Age must be between 1 and 120 years');
    }

    const genderConstant = gender === 'male' ? 5 : -161;
    const bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + genderConstant;

    return Math.round(bmr);
  }

  /**
   * Calculate Total Daily Energy Expenditure (TDEE)
   * TDEE = BMR × Activity Multiplier
   */
  calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
    const multiplier = this.ACTIVITY_MULTIPLIERS[activityLevel];
    if (!multiplier) {
      throw new Error(`Invalid activity level: ${activityLevel}`);
    }

    return Math.round(bmr * multiplier);
  }

  /**
   * Calculate complete calorie requirements
   */
  calculateCalorieRequirements(
    weightKg: number,
    heightCm: number,
    age: number,
    gender: 'male' | 'female',
    activityLevel: ActivityLevel,
    goal: 'weight_loss' | 'weight_gain' | 'maintenance' = 'maintenance'
  ): CalorieRequirements {
    const bmr = this.calculateBMR(weightKg, heightCm, age, gender);
    const tdee = this.calculateTDEE(bmr, activityLevel);
    
    // Adjust calories based on goal
    let targetCalories = tdee;
    if (goal === 'weight_loss') {
      targetCalories = Math.round(tdee * 0.8); // 20% deficit
    } else if (goal === 'weight_gain') {
      targetCalories = Math.round(tdee * 1.1); // 10% surplus
    }

    return {
      bmr,
      tdee,
      targetCalories,
      activityMultiplier: this.ACTIVITY_MULTIPLIERS[activityLevel]
    };
  }

  /**
   * Calculate macronutrient distribution
   * Default ratios: 30% protein, 40% carbs, 30% fat
   * Can be adjusted based on health conditions
   */
  calculateMacronutrients(
    targetCalories: number,
    proteinPercentage: number = 30,
    carbsPercentage: number = 40,
    fatPercentage: number = 30
  ): MacronutrientDistribution {
    // Validate percentages sum to 100
    const total = proteinPercentage + carbsPercentage + fatPercentage;
    if (Math.abs(total - 100) > 0.01) {
      throw new Error('Macronutrient percentages must sum to 100');
    }

    // Calories per gram: Protein = 4, Carbs = 4, Fat = 9
    const proteinCalories = targetCalories * (proteinPercentage / 100);
    const carbsCalories = targetCalories * (carbsPercentage / 100);
    const fatCalories = targetCalories * (fatPercentage / 100);

    const proteinGrams = Math.round(proteinCalories / 4);
    const carbsGrams = Math.round(carbsCalories / 4);
    const fatGrams = Math.round(fatCalories / 9);

    // Calculate fiber recommendation (14g per 1000 calories)
    const fiberGrams = Math.round((targetCalories / 1000) * 14);

    return {
      proteinGrams,
      proteinPercentage,
      carbsGrams,
      carbsPercentage,
      fatGrams,
      fatPercentage,
      fiberGrams
    };
  }

  /**
   * Adjust calorie requirements based on occupation
   * Validates against occupation-specific ranges
   */
  adjustCaloriesForOccupation(
    baseCalories: number,
    occupationType: OccupationType
  ): number {
    let adjustedCalories = baseCalories;

    // Map occupation to calorie range
    const rangeKey = this.getOccupationRangeKey(occupationType);
    const range = OCCUPATION_CALORIE_RANGES[rangeKey];

    if (!range) {
      return adjustedCalories;
    }

    // Ensure calories fall within occupation range
    if (adjustedCalories < range.minCalories) {
      adjustedCalories = range.minCalories;
    } else if (adjustedCalories > range.maxCalories) {
      adjustedCalories = range.maxCalories;
    }

    return adjustedCalories;
  }

  /**
   * Get occupation range key from occupation type
   */
  private getOccupationRangeKey(occupationType: OccupationType): string {
    const mapping: Record<OccupationType, string> = {
      desk_job: 'sedentary',
      light_physical: 'light',
      moderate_physical: 'moderate',
      heavy_physical: 'heavy',
      farming: 'heavy'
    };

    return mapping[occupationType] || 'moderate';
  }

  /**
   * Adjust macronutrients for health conditions
   */
  adjustForHealthConditions(
    baseMacros: MacronutrientDistribution,
    healthConditions: string[]
  ): { macros: MacronutrientDistribution; adjustments: any[] } {
    let adjustedMacros = { ...baseMacros };
    const adjustments: any[] = [];

    for (const condition of healthConditions) {
      const lowerCondition = condition.toLowerCase();

      if (lowerCondition.includes('diabetes') || lowerCondition.includes('diabetic')) {
        // Lower carbs, increase protein and fat
        adjustedMacros = this.adjustMacroPercentages(
          adjustedMacros,
          35, // protein
          30, // carbs
          35  // fat
        );
        adjustments.push({
          condition: 'diabetes',
          adjustmentFactor: 1.0,
          notes: 'Reduced carbohydrates, increased protein and healthy fats'
        });
      }

      if (lowerCondition.includes('hypertension') || lowerCondition.includes('blood pressure')) {
        adjustments.push({
          condition: 'hypertension',
          adjustmentFactor: 1.0,
          notes: 'Recommend low sodium diet, increase potassium-rich foods'
        });
      }

      if (lowerCondition.includes('kidney') || lowerCondition.includes('renal')) {
        // Moderate protein restriction
        adjustedMacros = this.adjustMacroPercentages(
          adjustedMacros,
          20, // protein (reduced)
          50, // carbs (increased)
          30  // fat
        );
        adjustments.push({
          condition: 'kidney disease',
          adjustmentFactor: 0.9,
          notes: 'Reduced protein intake, monitor potassium and phosphorus'
        });
      }

      if (lowerCondition.includes('heart') || lowerCondition.includes('cardiovascular')) {
        adjustments.push({
          condition: 'cardiovascular disease',
          adjustmentFactor: 1.0,
          notes: 'Emphasize healthy fats (omega-3), limit saturated fats'
        });
      }
    }

    return { macros: adjustedMacros, adjustments };
  }

  /**
   * Recalculate macro grams based on new percentages
   */
  private adjustMacroPercentages(
    currentMacros: MacronutrientDistribution,
    proteinPct: number,
    carbsPct: number,
    fatPct: number
  ): MacronutrientDistribution {
    // Calculate total calories from current macros
    const totalCalories = 
      (currentMacros.proteinGrams * 4) +
      (currentMacros.carbsGrams * 4) +
      (currentMacros.fatGrams * 9);

    return this.calculateMacronutrients(totalCalories, proteinPct, carbsPct, fatPct);
  }

  /**
   * Calculate complete nutritional requirements with all adjustments
   */
  calculateNutritionalRequirements(
    weightKg: number,
    heightCm: number,
    age: number,
    gender: 'male' | 'female',
    activityLevel: ActivityLevel,
    occupationType?: OccupationType,
    healthConditions: string[] = [],
    goal: 'weight_loss' | 'weight_gain' | 'maintenance' = 'maintenance'
  ): NutritionalRequirements {
    // Calculate base calorie requirements
    let calories = this.calculateCalorieRequirements(
      weightKg,
      heightCm,
      age,
      gender,
      activityLevel,
      goal
    );

    // Adjust for occupation if provided
    if (occupationType) {
      calories.targetCalories = this.adjustCaloriesForOccupation(
        calories.targetCalories,
        occupationType
      );
    }

    // Calculate base macronutrients
    let baseMacros = this.calculateMacronutrients(calories.targetCalories);

    // Adjust for health conditions
    const { macros, adjustments } = this.adjustForHealthConditions(
      baseMacros,
      healthConditions
    );

    return {
      calories,
      macros,
      adjustments
    };
  }

  /**
   * Get activity level from occupation type
   */
  getActivityLevelFromOccupation(occupationType: OccupationType): ActivityLevel {
    const mapping: Record<OccupationType, ActivityLevel> = {
      desk_job: 'sedentary',
      light_physical: 'light',
      moderate_physical: 'moderate',
      heavy_physical: 'very_active',
      farming: 'very_active'
    };

    return mapping[occupationType] || 'moderate';
  }

  /**
   * Validate calorie requirements are within safe ranges
   */
  validateCalorieRequirements(calories: number, gender: 'male' | 'female'): {
    valid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    // Minimum safe calorie levels
    const minCalories = gender === 'male' ? 1500 : 1200;
    const maxCalories = 5000;

    if (calories < minCalories) {
      warnings.push(`Calorie target (${calories}) is below minimum safe level (${minCalories})`);
    }

    if (calories > maxCalories) {
      warnings.push(`Calorie target (${calories}) exceeds maximum recommended level (${maxCalories})`);
    }

    return {
      valid: warnings.length === 0,
      warnings
    };
  }
}
