/**
 * Unit tests for Calorie Calculator Service
 */

import { CalorieCalculatorService } from '../calorie-calculator.service';

describe('CalorieCalculatorService', () => {
  let service: CalorieCalculatorService;

  beforeEach(() => {
    service = new CalorieCalculatorService();
  });

  describe('calculateBMR', () => {
    it('should calculate BMR correctly for male', () => {
      const bmr = service.calculateBMR(70, 170, 30, 'male');
      // (10 × 70) + (6.25 × 170) - (5 × 30) + 5 = 700 + 1062.5 - 150 + 5 = 1617.5 ≈ 1618
      expect(bmr).toBe(1618);
    });

    it('should calculate BMR correctly for female', () => {
      const bmr = service.calculateBMR(60, 160, 25, 'female');
      // (10 × 60) + (6.25 × 160) - (5 × 25) - 161 = 600 + 1000 - 125 - 161 = 1314
      expect(bmr).toBe(1314);
    });

    it('should throw error for invalid weight', () => {
      expect(() => service.calculateBMR(0, 170, 30, 'male')).toThrow('Weight, height, and age must be positive numbers');
    });

    it('should throw error for invalid height', () => {
      expect(() => service.calculateBMR(70, 0, 30, 'male')).toThrow('Weight, height, and age must be positive numbers');
    });

    it('should throw error for invalid age', () => {
      expect(() => service.calculateBMR(70, 170, 0, 'male')).toThrow('Weight, height, and age must be positive numbers');
    });

    it('should throw error for age out of range', () => {
      expect(() => service.calculateBMR(70, 170, 150, 'male')).toThrow('Age must be between 1 and 120 years');
    });
  });

  describe('calculateTDEE', () => {
    it('should calculate TDEE for sedentary activity', () => {
      const bmr = 1500;
      const tdee = service.calculateTDEE(bmr, 'sedentary');
      expect(tdee).toBe(1800); // 1500 × 1.2
    });

    it('should calculate TDEE for moderate activity', () => {
      const bmr = 1500;
      const tdee = service.calculateTDEE(bmr, 'moderate');
      expect(tdee).toBe(2325); // 1500 × 1.55
    });

    it('should calculate TDEE for very active', () => {
      const bmr = 1500;
      const tdee = service.calculateTDEE(bmr, 'very_active');
      expect(tdee).toBe(2850); // 1500 × 1.9
    });

    it('should throw error for invalid activity level', () => {
      expect(() => service.calculateTDEE(1500, 'invalid' as any)).toThrow('Invalid activity level');
    });
  });

  describe('calculateCalorieRequirements', () => {
    it('should calculate requirements for maintenance', () => {
      const result = service.calculateCalorieRequirements(70, 170, 30, 'male', 'moderate', 'maintenance');
      
      expect(result.bmr).toBe(1618);
      expect(result.tdee).toBe(2508); // 1618 × 1.55
      expect(result.targetCalories).toBe(2508);
      expect(result.activityMultiplier).toBe(1.55);
    });

    it('should calculate requirements for weight loss', () => {
      const result = service.calculateCalorieRequirements(70, 170, 30, 'male', 'moderate', 'weight_loss');
      
      expect(result.bmr).toBe(1618);
      expect(result.tdee).toBe(2508);
      expect(result.targetCalories).toBe(2006); // 2508 × 0.8 (20% deficit)
    });

    it('should calculate requirements for weight gain', () => {
      const result = service.calculateCalorieRequirements(70, 170, 30, 'male', 'moderate', 'weight_gain');
      
      expect(result.bmr).toBe(1618);
      expect(result.tdee).toBe(2508);
      expect(result.targetCalories).toBe(2759); // 2508 × 1.1 (10% surplus)
    });
  });

  describe('calculateMacronutrients', () => {
    it('should calculate macros with default percentages', () => {
      const result = service.calculateMacronutrients(2000);
      
      expect(result.proteinGrams).toBe(150); // 2000 × 0.3 / 4
      expect(result.proteinPercentage).toBe(30);
      expect(result.carbsGrams).toBe(200); // 2000 × 0.4 / 4
      expect(result.carbsPercentage).toBe(40);
      expect(result.fatGrams).toBe(67); // 2000 × 0.3 / 9
      expect(result.fatPercentage).toBe(30);
      expect(result.fiberGrams).toBe(28); // (2000 / 1000) × 14
    });

    it('should calculate macros with custom percentages', () => {
      const result = service.calculateMacronutrients(2000, 35, 35, 30);
      
      expect(result.proteinGrams).toBe(175); // 2000 × 0.35 / 4
      expect(result.carbsGrams).toBe(175); // 2000 × 0.35 / 4
      expect(result.fatGrams).toBe(67); // 2000 × 0.3 / 9
    });

    it('should throw error if percentages do not sum to 100', () => {
      expect(() => service.calculateMacronutrients(2000, 30, 30, 30)).toThrow('Macronutrient percentages must sum to 100');
    });
  });

  describe('adjustCaloriesForOccupation', () => {
    it('should adjust calories for desk job (sedentary)', () => {
      const result = service.adjustCaloriesForOccupation(1500, 'desk_job');
      expect(result).toBe(1600); // Minimum for sedentary
    });

    it('should adjust calories for heavy physical work', () => {
      const result = service.adjustCaloriesForOccupation(2500, 'heavy_physical');
      expect(result).toBe(3000); // Adjusted to minimum for heavy physical (3000-3500)
    });

    it('should not adjust if within range', () => {
      const result = service.adjustCaloriesForOccupation(2200, 'moderate_physical');
      expect(result).toBeGreaterThanOrEqual(2200);
    });

    it('should cap at maximum for occupation', () => {
      const result = service.adjustCaloriesForOccupation(4000, 'desk_job');
      expect(result).toBe(2000); // Maximum for sedentary
    });
  });

  describe('adjustForHealthConditions', () => {
    it('should adjust macros for diabetes', () => {
      const baseMacros = service.calculateMacronutrients(2000);
      const { macros, adjustments } = service.adjustForHealthConditions(baseMacros, ['diabetes']);
      
      expect(adjustments).toHaveLength(1);
      expect(adjustments[0].condition).toBe('diabetes');
      expect(macros.proteinPercentage).toBe(35);
      expect(macros.carbsPercentage).toBe(30);
      expect(macros.fatPercentage).toBe(35);
    });

    it('should adjust macros for kidney disease', () => {
      const baseMacros = service.calculateMacronutrients(2000);
      const { macros, adjustments } = service.adjustForHealthConditions(baseMacros, ['kidney disease']);
      
      expect(adjustments).toHaveLength(1);
      expect(adjustments[0].condition).toBe('kidney disease');
      expect(macros.proteinPercentage).toBe(20); // Reduced protein
    });

    it('should handle multiple conditions', () => {
      const baseMacros = service.calculateMacronutrients(2000);
      const { adjustments } = service.adjustForHealthConditions(baseMacros, ['diabetes', 'hypertension']);
      
      expect(adjustments.length).toBeGreaterThanOrEqual(1);
    });

    it('should return no adjustments for no conditions', () => {
      const baseMacros = service.calculateMacronutrients(2000);
      const { macros, adjustments } = service.adjustForHealthConditions(baseMacros, []);
      
      expect(adjustments).toHaveLength(0);
      expect(macros).toEqual(baseMacros);
    });
  });

  describe('calculateNutritionalRequirements', () => {
    it('should calculate complete requirements', () => {
      const result = service.calculateNutritionalRequirements(
        70, 170, 30, 'male', 'moderate'
      );
      
      expect(result.calories).toBeDefined();
      expect(result.macros).toBeDefined();
      expect(result.adjustments).toBeDefined();
      expect(result.calories.bmr).toBeGreaterThan(0);
      expect(result.macros.proteinGrams).toBeGreaterThan(0);
    });

    it('should include occupation adjustments', () => {
      const result = service.calculateNutritionalRequirements(
        70, 170, 30, 'male', 'moderate', 'heavy_physical'
      );
      
      expect(result.calories.targetCalories).toBeGreaterThanOrEqual(3000);
    });

    it('should include health condition adjustments', () => {
      const result = service.calculateNutritionalRequirements(
        70, 170, 30, 'male', 'moderate', undefined, ['diabetes']
      );
      
      expect(result.adjustments.length).toBeGreaterThan(0);
      expect(result.macros.carbsPercentage).toBeLessThan(40);
    });
  });

  describe('getActivityLevelFromOccupation', () => {
    it('should map desk job to sedentary', () => {
      expect(service.getActivityLevelFromOccupation('desk_job')).toBe('sedentary');
    });

    it('should map farming to very active', () => {
      expect(service.getActivityLevelFromOccupation('farming')).toBe('very_active');
    });

    it('should map moderate physical to moderate', () => {
      expect(service.getActivityLevelFromOccupation('moderate_physical')).toBe('moderate');
    });
  });

  describe('validateCalorieRequirements', () => {
    it('should validate safe calorie levels for male', () => {
      const result = service.validateCalorieRequirements(2000, 'male');
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate safe calorie levels for female', () => {
      const result = service.validateCalorieRequirements(1500, 'female');
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about too low calories for male', () => {
      const result = service.validateCalorieRequirements(1000, 'male');
      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('below minimum safe level');
    });

    it('should warn about too low calories for female', () => {
      const result = service.validateCalorieRequirements(1000, 'female');
      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn about too high calories', () => {
      const result = service.validateCalorieRequirements(6000, 'male');
      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('exceeds maximum recommended level');
    });
  });
});
