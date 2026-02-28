/**
 * Type definitions for Nutrition and Lifestyle Tracking Module
 * RuralConnect AI - Health Module
 */

// ============================================================================
// Health Profile Types
// ============================================================================

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type OccupationType = 'desk_job' | 'light_physical' | 'moderate_physical' | 'heavy_physical' | 'farming';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type DietaryRestriction = 'vegetarian' | 'vegan' | 'gluten_free' | 'lactose_intolerant' | 'diabetic' | 'none';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

export interface HealthProfile {
  healthProfileId: string;
  userId: string;
  bloodGroup?: BloodGroup;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  activityLevel?: ActivityLevel;
  occupationType?: OccupationType;
  chronicConditions?: string[];
  allergies?: string[];
  currentMedications?: string[];
  dietaryRestrictions?: DietaryRestriction[];
  foodAllergies?: string[];
  emergencyContacts?: EmergencyContact[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHealthProfileInput {
  userId: string;
  bloodGroup?: BloodGroup;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: ActivityLevel;
  occupationType?: OccupationType;
  chronicConditions?: string[];
  allergies?: string[];
  currentMedications?: string[];
  dietaryRestrictions?: DietaryRestriction[];
  foodAllergies?: string[];
  emergencyContacts?: EmergencyContact[];
}

export interface UpdateHealthProfileInput {
  bloodGroup?: BloodGroup;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: ActivityLevel;
  occupationType?: OccupationType;
  chronicConditions?: string[];
  allergies?: string[];
  currentMedications?: string[];
  dietaryRestrictions?: DietaryRestriction[];
  foodAllergies?: string[];
  emergencyContacts?: EmergencyContact[];
}

// ============================================================================
// Calorie and Macronutrient Types
// ============================================================================

export interface CalorieRequirements {
  bmr: number; // Basal Metabolic Rate
  tdee: number; // Total Daily Energy Expenditure
  targetCalories: number;
  activityMultiplier: number;
}

export interface MacronutrientDistribution {
  proteinGrams: number;
  proteinPercentage: number;
  carbsGrams: number;
  carbsPercentage: number;
  fatGrams: number;
  fatPercentage: number;
  fiberGrams: number;
}

export interface NutritionalRequirements {
  calories: CalorieRequirements;
  macros: MacronutrientDistribution;
  adjustments: {
    healthConditions: string[];
    adjustmentFactor: number;
    notes: string;
  }[];
}

// ============================================================================
// Meal Plan Types
// ============================================================================

export type MealType = 'breakfast' | 'mid_morning' | 'lunch' | 'evening_snack' | 'dinner';
export type PlanType = 'weight_loss' | 'weight_gain' | 'maintenance' | 'therapeutic' | 'custom';

export interface FoodItem {
  name: string;
  nameLocal?: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  costInr?: number;
  seasonal: boolean;
  locallyAvailable: boolean;
}

export interface Meal {
  mealPlanId: string;
  nutritionPlanId: string;
  mealDate: Date;
  mealType: MealType;
  mealTime?: string;
  foodItems: FoodItem[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  totalFiberG: number;
  estimatedCostInr: number;
  recipeInstructions?: string;
  preparationTimeMinutes?: number;
  consumed: boolean;
  consumedAt?: Date;
  complianceRating?: number;
  createdAt: Date;
}

export interface DailyMealPlan {
  date: Date;
  meals: Meal[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  totalFiberG: number;
  totalCostInr: number;
  meetsTargets: boolean;
  compliancePercentage: number;
}

export interface NutritionPlan {
  planId: string;
  userId: string;
  planName?: string;
  planType: PlanType;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  targetFiberG: number;
  mealsPerDay: number;
  mealSchedule?: Record<MealType, string>;
  cuisinePreferences?: string[];
  avoidFoods?: string[];
  dailyBudgetInr?: number;
  costOptimized: boolean;
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNutritionPlanInput {
  userId: string;
  planName?: string;
  planType: PlanType;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  targetFiberG: number;
  mealsPerDay?: number;
  mealSchedule?: Record<MealType, string>;
  cuisinePreferences?: string[];
  avoidFoods?: string[];
  dailyBudgetInr?: number;
  costOptimized?: boolean;
  startDate: Date;
  endDate?: Date;
}

// ============================================================================
// Meal Compliance and Tracking Types
// ============================================================================

export interface MealComplianceRecord {
  date: Date;
  plannedMeals: number;
  consumedMeals: number;
  compliancePercentage: number;
  missedMeals: MealType[];
}

export interface WeeklyCompliance {
  weekStartDate: Date;
  weekEndDate: Date;
  dailyCompliance: MealComplianceRecord[];
  averageCompliance: number;
  totalPlannedMeals: number;
  totalConsumedMeals: number;
}

// ============================================================================
// Nutrient Gap Analysis Types
// ============================================================================

export interface NutrientTarget {
  nutrient: string;
  targetAmount: number;
  unit: string;
}

export interface NutrientActual {
  nutrient: string;
  actualAmount: number;
  unit: string;
}

export interface NutrientGap {
  nutrient: string;
  targetAmount: number;
  actualAmount: number;
  gapAmount: number;
  gapPercentage: number;
  unit: string;
  status: 'deficient' | 'adequate' | 'excess';
}

export interface NutrientGapAnalysis {
  userId: string;
  analysisDate: Date;
  period: 'daily' | 'weekly' | 'monthly';
  gaps: NutrientGap[];
  recommendations: {
    nutrient: string;
    suggestedFoods: string[];
    reasoning: string;
  }[];
}

// ============================================================================
// Cost Optimization Types
// ============================================================================

export interface CostOptimizationResult {
  originalCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercentage: number;
  substitutions: {
    original: FoodItem;
    substitute: FoodItem;
    reason: string;
  }[];
}

export interface AffordableAlternative {
  foodItem: string;
  alternatives: {
    name: string;
    costInr: number;
    nutritionalSimilarity: number;
    availability: 'high' | 'medium' | 'low';
  }[];
}

// ============================================================================
// Dietary Restriction Support Types
// ============================================================================

export interface DietaryRestrictionProfile {
  restrictions: DietaryRestriction[];
  allergies: string[];
  religiousRestrictions?: string[];
  medicalRestrictions?: string[];
  customRestrictions?: string[];
}

export interface IngredientSubstitution {
  original: string;
  substitute: string;
  reason: string;
  nutritionalImpact: string;
}

// ============================================================================
// Occupation-Based Calorie Adjustment Types
// ============================================================================

export interface OccupationCalorieRange {
  occupation: OccupationType;
  minCalories: number;
  maxCalories: number;
  description: string;
  activityLevel: ActivityLevel;
}

export const OCCUPATION_CALORIE_RANGES: Record<string, OccupationCalorieRange> = {
  sedentary: {
    occupation: 'desk_job',
    minCalories: 1600,
    maxCalories: 2000,
    description: 'Desk job, minimal physical activity',
    activityLevel: 'sedentary'
  },
  light: {
    occupation: 'light_physical',
    minCalories: 2000,
    maxCalories: 2500,
    description: 'Light physical work, some walking',
    activityLevel: 'light'
  },
  moderate: {
    occupation: 'moderate_physical',
    minCalories: 2500,
    maxCalories: 3000,
    description: 'Moderate physical work, regular movement',
    activityLevel: 'moderate'
  },
  heavy: {
    occupation: 'heavy_physical',
    minCalories: 3000,
    maxCalories: 3500,
    description: 'Heavy labor, intense physical work',
    activityLevel: 'very_active'
  }
};
