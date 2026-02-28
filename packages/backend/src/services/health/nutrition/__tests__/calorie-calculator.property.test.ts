/**
 * Property-Based Tests for Calorie Calculator Service
 * Task 17.12: Write property test for calorie requirement calculation (Property 22)
 * 
 * **Validates: Requirements 9.1**
 * 
 * Property 22: Calorie Requirement Calculation
 * For any user profile (age, gender, weight, height, activity level), the calculated
 * daily calorie requirement should be a positive number based on all input factors.
 * 
 * Test Coverage:
 * - Validate Mifflin-St Jeor BMR formula
 * - Test TDEE calculation with activity multipliers
 * - Verify health condition adjustments
 * - Test edge cases (extreme values)
 * - 100 iterations minimum
 */

import * as fc from 'fast-check';
import { CalorieCalculatorService } from '../calorie-calculator.service';
import { ActivityLevel, OccupationType } from '../../../../types/nutrition';

describe('CalorieCalculatorService - Property-Based Tests', () => {
  let service: CalorieCalculatorService;

  beforeEach(() => {
    service = new CalorieCalculatorService();
  });

  describe('Property 22: Calorie Requirement Calculation', () => {
    /**
     * Property: BMR calculation always returns positive number
     */
    test('BMR is always positive for valid inputs', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 30, max: 200, noNaN: true }), // weightKg
          fc.float({ min: 100, max: 250, noNaN: true }), // heightCm
          fc.integer({ min: 18, max: 100 }), // age
          fc.constantFrom('male', 'female'), // gender
          (weightKg, heightCm, age, gender) => {
            const bmr = service.calculateBMR(weightKg, heightCm, age, gender as 'male' | 'female');
            
            // BMR must be positive
            expect(bmr).toBeGreaterThan(0);
            
            // BMR should be less than a reasonable maximum (allowing for extreme cases)
            expect(bmr).toBeLessThanOrEqual(3500);
            
            // BMR should be an integer (rounded)
            expect(Number.isInteger(bmr)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Mifflin-St Jeor formula correctness
     * BMR = (10 × weight) + (6.25 × height) - (5 × age) + s
     * where s = +5 for males and -161 for females
     */
    test('BMR follows Mifflin-St Jeor formula', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 40, max: 150, noNaN: true }),
          fc.float({ min: 120, max: 220, noNaN: true }),
          fc.integer({ min: 18, max: 90 }),
          fc.constantFrom('male', 'female'),
          (weightKg, heightCm, age, gender) => {
            const bmr = service.calculateBMR(weightKg, heightCm, age, gender as 'male' | 'female');
            
            // Calculate expected BMR manually
            const genderConstant = gender === 'male' ? 5 : -161;
            const expectedBMR = Math.round(
              (10 * weightKg) + (6.25 * heightCm) - (5 * age) + genderConstant
            );
            
            // BMR should match the formula
            expect(bmr).toBe(expectedBMR);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Males have higher BMR than females (all else equal)
     */
    test('males have higher BMR than females with same parameters', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 50, max: 120, noNaN: true }),
          fc.float({ min: 140, max: 200, noNaN: true }),
          fc.integer({ min: 20, max: 80 }),
          (weightKg, heightCm, age) => {
            const maleBMR = service.calculateBMR(weightKg, heightCm, age, 'male');
            const femaleBMR = service.calculateBMR(weightKg, heightCm, age, 'female');
            
            // Male BMR should be higher by approximately 166 (5 - (-161))
            expect(maleBMR).toBeGreaterThan(femaleBMR);
            expect(maleBMR - femaleBMR).toBeCloseTo(166, 0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: TDEE is always greater than BMR
     */
    test('TDEE is always greater than or equal to BMR', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 40, max: 150, noNaN: true }),
          fc.float({ min: 120, max: 220, noNaN: true }),
          fc.integer({ min: 18, max: 90 }),
          fc.constantFrom('male', 'female'),
          fc.constantFrom<ActivityLevel>('sedentary', 'light', 'moderate', 'active', 'very_active'),
          (weightKg, heightCm, age, gender, activityLevel) => {
            const bmr = service.calculateBMR(weightKg, heightCm, age, gender as 'male' | 'female');
            const tdee = service.calculateTDEE(bmr, activityLevel);
            
            // TDEE must be >= BMR (minimum multiplier is 1.2)
            expect(tdee).toBeGreaterThanOrEqual(bmr);
            
            // TDEE should be positive
            expect(tdee).toBeGreaterThan(0);
            
            // TDEE should be an integer
            expect(Number.isInteger(tdee)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Activity multipliers are correctly applied
     */
    test('TDEE correctly applies activity multipliers', () => {
      const activityMultipliers: Record<ActivityLevel, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
      };

      fc.assert(
        fc.property(
          fc.float({ min: 1000, max: 2500, noNaN: true }), // BMR range
          fc.constantFrom<ActivityLevel>('sedentary', 'light', 'moderate', 'active', 'very_active'),
          (bmr, activityLevel) => {
            const tdee = service.calculateTDEE(bmr, activityLevel);
            const expectedTDEE = Math.round(bmr * activityMultipliers[activityLevel]);
            
            // TDEE should match BMR * multiplier
            expect(tdee).toBe(expectedTDEE);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Higher activity level results in higher TDEE
     */
    test('higher activity level results in higher TDEE', () => {
      const activityLevels: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];

      fc.assert(
        fc.property(
          fc.float({ min: 1200, max: 2200, noNaN: true }),
          (bmr) => {
            const tdees = activityLevels.map(level => service.calculateTDEE(bmr, level));
            
            // Each TDEE should be greater than the previous
            for (let i = 1; i < tdees.length; i++) {
              expect(tdees[i]).toBeGreaterThan(tdees[i - 1]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Complete calorie requirements are positive and reasonable
     */
    test('complete calorie requirements are positive and reasonable', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 40, max: 150, noNaN: true }),
          fc.float({ min: 120, max: 220, noNaN: true }),
          fc.integer({ min: 18, max: 90 }),
          fc.constantFrom('male', 'female'),
          fc.constantFrom<ActivityLevel>('sedentary', 'light', 'moderate', 'active', 'very_active'),
          fc.constantFrom<'weight_loss' | 'weight_gain' | 'maintenance'>('weight_loss', 'weight_gain', 'maintenance'),
          (weightKg, heightCm, age, gender, activityLevel, goal) => {
            const requirements = service.calculateCalorieRequirements(
              weightKg,
              heightCm,
              age,
              gender as 'male' | 'female',
              activityLevel,
              goal
            );
            
            // All calorie values must be positive
            expect(requirements.bmr).toBeGreaterThan(0);
            expect(requirements.tdee).toBeGreaterThan(0);
            expect(requirements.targetCalories).toBeGreaterThan(0);
            
            // BMR < TDEE
            expect(requirements.tdee).toBeGreaterThanOrEqual(requirements.bmr);
            
            // Target calories relationship to TDEE based on goal
            if (goal === 'weight_loss') {
              expect(requirements.targetCalories).toBeLessThan(requirements.tdee);
            } else if (goal === 'weight_gain') {
              expect(requirements.targetCalories).toBeGreaterThan(requirements.tdee);
            } else {
              expect(requirements.targetCalories).toBe(requirements.tdee);
            }
            
            // Activity multiplier is valid
            expect(requirements.activityMultiplier).toBeGreaterThanOrEqual(1.2);
            expect(requirements.activityMultiplier).toBeLessThanOrEqual(1.9);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Macronutrient percentages always sum to 100
     */
    test('macronutrient percentages sum to 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1500, max: 4000 }), // targetCalories
          fc.integer({ min: 20, max: 40 }), // proteinPct
          fc.integer({ min: 30, max: 50 }), // carbsPct
          (targetCalories, proteinPct, carbsPct) => {
            const fatPct = 100 - proteinPct - carbsPct;
            
            // Only test if fat percentage is valid
            if (fatPct >= 20 && fatPct <= 40) {
              const macros = service.calculateMacronutrients(
                targetCalories,
                proteinPct,
                carbsPct,
                fatPct
              );
              
              // Verify percentages
              expect(macros.proteinPercentage).toBe(proteinPct);
              expect(macros.carbsPercentage).toBe(carbsPct);
              expect(macros.fatPercentage).toBe(fatPct);
              
              // Sum should be 100
              const sum = macros.proteinPercentage + macros.carbsPercentage + macros.fatPercentage;
              expect(sum).toBe(100);
              
              // All gram values should be positive
              expect(macros.proteinGrams).toBeGreaterThan(0);
              expect(macros.carbsGrams).toBeGreaterThan(0);
              expect(macros.fatGrams).toBeGreaterThan(0);
              expect(macros.fiberGrams).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Health condition adjustments maintain valid macros
     */
    test('health condition adjustments maintain valid macronutrient distribution', () => {
      const healthConditions = [
        ['diabetes'],
        ['hypertension'],
        ['kidney disease'],
        ['heart disease'],
        ['diabetes', 'hypertension'],
        []
      ];

      fc.assert(
        fc.property(
          fc.integer({ min: 1500, max: 3500 }),
          fc.constantFrom(...healthConditions),
          (targetCalories, conditions) => {
            const baseMacros = service.calculateMacronutrients(targetCalories);
            const { macros, adjustments } = service.adjustForHealthConditions(baseMacros, conditions);
            
            // Percentages should sum to 100
            const sum = macros.proteinPercentage + macros.carbsPercentage + macros.fatPercentage;
            expect(sum).toBe(100);
            
            // All values should be positive
            expect(macros.proteinGrams).toBeGreaterThan(0);
            expect(macros.carbsGrams).toBeGreaterThan(0);
            expect(macros.fatGrams).toBeGreaterThan(0);
            
            // Adjustments array should match conditions
            expect(adjustments.length).toBeLessThanOrEqual(conditions.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Edge case - minimum valid inputs
     */
    test('handles minimum valid inputs correctly', () => {
      const minWeight = 30;
      const minHeight = 100;
      const minAge = 18;

      const bmr = service.calculateBMR(minWeight, minHeight, minAge, 'female');
      expect(bmr).toBeGreaterThan(0);

      const tdee = service.calculateTDEE(bmr, 'sedentary');
      expect(tdee).toBeGreaterThan(0);
      expect(tdee).toBeGreaterThanOrEqual(bmr);
    });

    /**
     * Property: Edge case - maximum valid inputs
     */
    test('handles maximum valid inputs correctly', () => {
      const maxWeight = 200;
      const maxHeight = 250;
      const maxAge = 100;

      const bmr = service.calculateBMR(maxWeight, maxHeight, maxAge, 'male');
      expect(bmr).toBeGreaterThan(0);

      const tdee = service.calculateTDEE(bmr, 'very_active');
      expect(tdee).toBeGreaterThan(0);
      expect(tdee).toBeGreaterThanOrEqual(bmr);
    });

    /**
     * Property: Invalid inputs throw errors
     */
    test('throws error for invalid inputs', () => {
      // Negative weight
      expect(() => service.calculateBMR(-50, 170, 30, 'male')).toThrow();
      
      // Zero height
      expect(() => service.calculateBMR(70, 0, 30, 'male')).toThrow();
      
      // Invalid age
      expect(() => service.calculateBMR(70, 170, 0, 'male')).toThrow();
      expect(() => service.calculateBMR(70, 170, 150, 'male')).toThrow();
    });

    /**
     * Property: Occupation adjustment keeps calories within valid ranges
     */
    test('occupation adjustment maintains calories within occupation ranges', () => {
      const occupationTypes: OccupationType[] = [
        'desk_job',
        'light_physical',
        'moderate_physical',
        'heavy_physical',
        'farming'
      ];

      fc.assert(
        fc.property(
          fc.integer({ min: 1200, max: 4000 }),
          fc.constantFrom(...occupationTypes),
          (baseCalories, occupationType) => {
            const adjusted = service.adjustCaloriesForOccupation(baseCalories, occupationType);
            
            // Adjusted calories should be positive
            expect(adjusted).toBeGreaterThan(0);
            
            // Should be within reasonable range
            expect(adjusted).toBeGreaterThanOrEqual(1200);
            expect(adjusted).toBeLessThanOrEqual(4000);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Complete nutritional requirements are comprehensive
     */
    test('complete nutritional requirements include all necessary components', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 50, max: 120, noNaN: true }),
          fc.float({ min: 140, max: 200, noNaN: true }),
          fc.integer({ min: 20, max: 70 }),
          fc.constantFrom('male', 'female'),
          fc.constantFrom<ActivityLevel>('sedentary', 'light', 'moderate', 'active', 'very_active'),
          (weightKg, heightCm, age, gender, activityLevel) => {
            const requirements = service.calculateNutritionalRequirements(
              weightKg,
              heightCm,
              age,
              gender as 'male' | 'female',
              activityLevel
            );
            
            // Should have calories object
            expect(requirements.calories).toBeDefined();
            expect(requirements.calories.bmr).toBeGreaterThan(0);
            expect(requirements.calories.tdee).toBeGreaterThan(0);
            expect(requirements.calories.targetCalories).toBeGreaterThan(0);
            
            // Should have macros object
            expect(requirements.macros).toBeDefined();
            expect(requirements.macros.proteinGrams).toBeGreaterThan(0);
            expect(requirements.macros.carbsGrams).toBeGreaterThan(0);
            expect(requirements.macros.fatGrams).toBeGreaterThan(0);
            
            // Should have adjustments array
            expect(Array.isArray(requirements.adjustments)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
