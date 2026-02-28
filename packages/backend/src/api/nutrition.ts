/**
 * Nutrition API Endpoints
 * RuralConnect AI - Health Module
 * Section 17: Lifestyle and Nutrition Tracking
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import {
  HealthProfileService,
  CalorieCalculatorService,
  MealPlanGeneratorService,
  NutritionTrackingService,
  DietaryRestrictionService
} from '../services/health/nutrition';

export function createNutritionRouter(db: Pool): Router {
  const router = Router();

  // Initialize services
  const healthProfileService = new HealthProfileService(db);
  const calorieCalculator = new CalorieCalculatorService();
  const mealPlanGenerator = new MealPlanGeneratorService(db);
  const nutritionTracking = new NutritionTrackingService(db);
  const dietaryRestriction = new DietaryRestrictionService();

  // ============================================================================
  // Health Profile Endpoints (Task 17.1)
  // ============================================================================

  /**
   * POST /api/nutrition/health-profile
   * Create a new health profile
   */
  router.post('/health-profile', async (req: Request, res: Response) => {
    try {
      const profile = await healthProfileService.createHealthProfile(req.body);
      res.status(201).json({
        success: true,
        data: profile
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/nutrition/health-profile/:userId
   * Get health profile by user ID
   */
  router.get('/health-profile/:userId', async (req: Request, res: Response) => {
    try {
      const profile = await healthProfileService.getHealthProfileByUserId(req.params.userId);
      
      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Health profile not found'
        });
      }

      res.json({
        success: true,
        data: profile
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * PUT /api/nutrition/health-profile/:userId
   * Update health profile
   */
  router.put('/health-profile/:userId', async (req: Request, res: Response) => {
    try {
      const profile = await healthProfileService.updateHealthProfile(
        req.params.userId,
        req.body
      );
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * DELETE /api/nutrition/health-profile/:userId
   * Delete health profile
   */
  router.delete('/health-profile/:userId', async (req: Request, res: Response) => {
    try {
      await healthProfileService.deleteHealthProfile(req.params.userId);
      
      res.json({
        success: true,
        message: 'Health profile deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================================================
  // Calorie Calculator Endpoints (Task 17.2, 17.7)
  // ============================================================================

  /**
   * POST /api/nutrition/calculate-requirements
   * Calculate nutritional requirements
   */
  router.post('/calculate-requirements', async (req: Request, res: Response) => {
    try {
      const {
        weightKg,
        heightCm,
        age,
        gender,
        activityLevel,
        occupationType,
        healthConditions,
        goal
      } = req.body;

      const requirements = calorieCalculator.calculateNutritionalRequirements(
        weightKg,
        heightCm,
        age,
        gender,
        activityLevel,
        occupationType,
        healthConditions || [],
        goal || 'maintenance'
      );

      // Validate calorie requirements
      const validation = calorieCalculator.validateCalorieRequirements(
        requirements.calories.targetCalories,
        gender
      );

      res.json({
        success: true,
        data: {
          requirements,
          validation
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/nutrition/occupation-calories/:occupation
   * Get calorie range for occupation (Task 17.7)
   */
  router.get('/occupation-calories/:occupation', async (req: Request, res: Response) => {
    try {
      const range = dietaryRestriction.getOccupationCalorieRange(
        req.params.occupation as any
      );

      res.json({
        success: true,
        data: range
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================================================
  // Meal Plan Endpoints (Tasks 17.3, 17.4, 17.5)
  // ============================================================================

  /**
   * POST /api/nutrition/meal-plan
   * Create a nutrition plan
   */
  router.post('/meal-plan', async (req: Request, res: Response) => {
    try {
      const plan = await mealPlanGenerator.createNutritionPlan(req.body);
      
      res.status(201).json({
        success: true,
        data: plan
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/nutrition/meal-plan/:planId/generate-daily
   * Generate daily meal plan (Tasks 17.3, 17.5)
   */
  router.post('/meal-plan/:planId/generate-daily', async (req: Request, res: Response) => {
    try {
      const { date, dietaryRestrictions, avoidFoods } = req.body;
      
      const dailyPlan = await mealPlanGenerator.generateDailyMealPlan(
        req.params.planId,
        new Date(date),
        dietaryRestrictions || [],
        avoidFoods || []
      );

      res.json({
        success: true,
        data: dailyPlan
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/nutrition/optimize-cost
   * Calculate cost optimization (Task 17.4)
   */
  router.post('/optimize-cost', async (req: Request, res: Response) => {
    try {
      const { originalFoods, optimizedFoods } = req.body;
      
      const optimization = mealPlanGenerator.calculateCostOptimization(
        originalFoods,
        optimizedFoods
      );

      res.json({
        success: true,
        data: optimization
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================================================
  // Nutrition Tracking Endpoints (Tasks 17.6, 17.8, 17.9)
  // ============================================================================

  /**
   * GET /api/nutrition/meal/:mealPlanId/info
   * Get nutrition information display (Task 17.6)
   */
  router.get('/meal/:mealPlanId/info', async (req: Request, res: Response) => {
    try {
      const info = await nutritionTracking.getNutritionInfo(req.params.mealPlanId);
      
      res.json({
        success: true,
        data: info
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/nutrition/meal/:mealPlanId/consume
   * Mark meal as consumed (Task 17.8)
   */
  router.post('/meal/:mealPlanId/consume', async (req: Request, res: Response) => {
    try {
      const { complianceRating } = req.body;
      
      const meal = await nutritionTracking.markMealConsumed(
        req.params.mealPlanId,
        complianceRating
      );

      res.json({
        success: true,
        data: meal
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/nutrition/compliance/daily/:userId/:date
   * Get daily compliance (Task 17.8)
   */
  router.get('/compliance/daily/:userId/:date', async (req: Request, res: Response) => {
    try {
      const compliance = await nutritionTracking.getDailyCompliance(
        req.params.userId,
        new Date(req.params.date)
      );

      res.json({
        success: true,
        data: compliance
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/nutrition/compliance/weekly/:userId/:startDate
   * Get weekly compliance (Task 17.8)
   */
  router.get('/compliance/weekly/:userId/:startDate', async (req: Request, res: Response) => {
    try {
      const compliance = await nutritionTracking.getWeeklyCompliance(
        req.params.userId,
        new Date(req.params.startDate)
      );

      res.json({
        success: true,
        data: compliance
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/nutrition/nutrient-gaps/:userId
   * Analyze nutrient gaps (Task 17.9)
   */
  router.get('/nutrient-gaps/:userId', async (req: Request, res: Response) => {
    try {
      const { period, date } = req.query;
      
      const analysis = await nutritionTracking.analyzeNutrientGaps(
        req.params.userId,
        (period as any) || 'daily',
        date ? new Date(date as string) : new Date()
      );

      res.json({
        success: true,
        data: analysis
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/nutrition/progress/daily/:userId/:date
   * Get daily progress tracking
   */
  router.get('/progress/daily/:userId/:date', async (req: Request, res: Response) => {
    try {
      const progress = await nutritionTracking.getDailyProgress(
        req.params.userId,
        new Date(req.params.date)
      );

      res.json({
        success: true,
        data: progress
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================================================
  // Dietary Restriction Endpoints (Task 17.10)
  // ============================================================================

  /**
   * POST /api/nutrition/validate-food
   * Validate food against dietary restrictions
   */
  router.post('/validate-food', async (req: Request, res: Response) => {
    try {
      const { food, restrictions } = req.body;
      
      const validation = dietaryRestriction.validateFoodItem(food, restrictions);

      res.json({
        success: true,
        data: validation
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/nutrition/substitutions
   * Get ingredient substitutions
   */
  router.post('/substitutions', async (req: Request, res: Response) => {
    try {
      const { ingredient, restrictions } = req.body;
      
      const substitutions = dietaryRestriction.getIngredientSubstitutions(
        ingredient,
        restrictions
      );

      res.json({
        success: true,
        data: substitutions
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/nutrition/filter-foods
   * Filter foods by dietary restrictions
   */
  router.post('/filter-foods', async (req: Request, res: Response) => {
    try {
      const { foods, restrictions } = req.body;
      
      const filtered = dietaryRestriction.filterFoodsByRestrictions(foods, restrictions);

      res.json({
        success: true,
        data: filtered
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/nutrition/restriction-summary
   * Get dietary restriction summary
   */
  router.post('/restriction-summary', async (req: Request, res: Response) => {
    try {
      const summary = dietaryRestriction.getDietaryRestrictionSummary(req.body);

      res.json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}
