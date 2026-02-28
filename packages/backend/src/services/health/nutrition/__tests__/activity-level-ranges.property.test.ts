/**
 * Property-Based Tests for Activity Level Calorie Ranges
 * Task 17.13: Write property test for activity level calorie ranges (Property 23)
 * 
 * **Validates: Requirements 9.5**
 * 
 * Property 23: Activity Level Calorie Ranges
 * For any user with specified activity level, the calorie requirement should fall
 * within the defined range:
 * - Sedentary: 1600-2000 kcal
 * - Light: 2000-2500 kcal
 * - Moderate: 2500-3000 kcal
 * - Heavy labor: 3000-3500 kcal
 * 
 * Test Coverage:
 * - Validate occupation-based calorie ranges
 * - Test boundary conditions
 * - Verify no overlap between ranges
 * - 100 iterations minimum
 */

import * as fc from 'fast-check';
import { CalorieCalculatorService } from '../calorie-calculator.service';
import { DietaryRestrictionService } from '../dietary-restriction.service';
import { OccupationType } from '../../../../types/nutrition';

describe('Activity Level Calorie Ranges - Property-Based Tests', () => {
  let calorieService: CalorieCalculatorService;
  let dietaryService: DietaryRestrictionService;

  beforeEach(() => {
    calorieService = new CalorieCalculatorService();
    dietaryService = new DietaryRestrictionService();
  });

  describe('Property 23: Activity Level Calorie Ranges', () => {
    /**
     * Property: Sedentary occupation calorie range (1600-2000 kcal)
     */
    test('sedentary occupation calories fall within 1600-2000 kcal range', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 50, max: 120, noNaN: true }), // weightKg
          fc.float({ min: 140, max: 200, noNaN: true }), // heightCm
          fc.integer({ min: 20, max: 70 }), // age
          fc.constantFrom('male', 'female'),
          (weightKg, heightCm, age, gender) => {
            const requirements = calorieService.calculateNutritionalRequirements(
              weightKg,
              heightCm,
              age,
              gender as 'male' | 'female',
              'sedentary',
              'desk_job'
            );

            const calories = requirements.calories.targetCalories;

            // Sedentary range: 1600-2000 kcal
            expect(calories).toBeGreaterThanOrEqual(1600);
            expect(calories).toBeLessThanOrEqual(2000);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Light activity occupation calorie range (2000-2500 kcal)
     */
    test('light activity occupation calories fall within 2000-2500 kcal range', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 60, max: 100, noNaN: true }),
          fc.float({ min: 150, max: 190, noNaN: true }),
          fc.integer({ min: 25, max: 60 }),
          fc.constantFrom('male', 'female'),
          (weightKg, heightCm, age, gender) => {
            const requirements = calorieService.calculateNutritionalRequirements(
              weightKg,
              heightCm,
              age,
              gender as 'male' | 'female',
              'light',
              'light_physical'
            );

            const calories = requirements.calories.targetCalories;

            // Light range: 2000-2500 kcal
            expect(calories).toBeGreaterThanOrEqual(2000);
            expect(calories).toBeLessThanOrEqual(2500);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Moderate activity occupation calorie range (2500-3000 kcal)
     */
    test('moderate activity occupation calories fall within 2500-3000 kcal range', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 65, max: 110, noNaN: true }),
          fc.float({ min: 155, max: 195, noNaN: true }),
          fc.integer({ min: 25, max: 55 }),
          fc.constantFrom('male', 'female'),
          (weightKg, heightCm, age, gender) => {
            const requirements = calorieService.calculateNutritionalRequirements(
              weightKg,
              heightCm,
              age,
              gender as 'male' | 'female',
              'moderate',
              'moderate_physical'
            );

            const calories = requirements.calories.targetCalories;

            // Moderate range: 2500-3000 kcal
            expect(calories).toBeGreaterThanOrEqual(2500);
            expect(calories).toBeLessThanOrEqual(3000);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Heavy labor occupation calorie range (3000-3500 kcal)
     */
    test('heavy labor occupation calories fall within 3000-3500 kcal range', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 70, max: 120, noNaN: true }),
          fc.float({ min: 160, max: 200, noNaN: true }),
          fc.integer({ min: 20, max: 50 }),
          fc.constantFrom('male', 'female'),
          (weightKg, heightCm, age, gender) => {
            const requirements = calorieService.calculateNutritionalRequirements(
              weightKg,
              heightCm,
              age,
              gender as 'male' | 'female',
              'very_active',
              'heavy_physical'
            );

            const calories = requirements.calories.targetCalories;

            // Heavy labor range: 3000-3500 kcal
            expect(calories).toBeGreaterThanOrEqual(3000);
            expect(calories).toBeLessThanOrEqual(3500);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Occupation calorie ranges are correctly defined
     */
    test('occupation calorie ranges match specification', () => {
      const expectedRanges: Record<OccupationType, { min: number; max: number }> = {
        desk_job: { min: 1600, max: 2000 },
        light_physical: { min: 2000, max: 2500 },
        moderate_physical: { min: 2500, max: 3000 },
        heavy_physical: { min: 3000, max: 3500 },
        farming: { min: 3000, max: 3500 }
      };

      // Test each occupation type
      Object.entries(expectedRanges).forEach(([occupation, range]) => {
        const result = dietaryService.getOccupationCalorieRange(occupation as OccupationType);
        
        expect(result.minCalories).toBe(range.min);
        expect(result.maxCalories).toBe(range.max);
      });
    });

    /**
     * Property: Ranges have no gaps (adjacent ranges touch at boundaries)
     */
    test('calorie ranges are contiguous with no gaps', () => {
      const occupations: OccupationType[] = [
        'desk_job',
        'light_physical',
        'moderate_physical',
        'heavy_physical'
      ];

      const ranges = occupations.map(occ => 
        dietaryService.getOccupationCalorieRange(occ)
      );

      // Check that each range's max equals the next range's min
      for (let i = 0; i < ranges.length - 1; i++) {
        expect(ranges[i].maxCalories).toBe(ranges[i + 1].minCalories);
      }
    });

    /**
     * Property: Higher activity level results in higher calorie range
     */
    test('higher activity levels have higher calorie ranges', () => {
      const occupations: OccupationType[] = [
        'desk_job',
        'light_physical',
        'moderate_physical',
        'heavy_physical'
      ];

      const ranges = occupations.map(occ => 
        dietaryService.getOccupationCalorieRange(occ)
      );

      // Each range should have higher min and max than the previous
      for (let i = 1; i < ranges.length; i++) {
        expect(ranges[i].minCalories).toBeGreaterThan(ranges[i - 1].minCalories);
        expect(ranges[i].maxCalories).toBeGreaterThan(ranges[i - 1].maxCalories);
      }
    });

    /**
     * Property: Boundary conditions - minimum values
     */
    test('handles minimum boundary values correctly', () => {
      // Test sedentary minimum (1600 kcal)
      const sedentaryRange = dietaryService.getOccupationCalorieRange('desk_job');
      expect(sedentaryRange.minCalories).toBe(1600);

      // Calories at or above minimum should be valid
      const adjusted = calorieService.adjustCaloriesForOccupation(1600, 'desk_job');
      expect(adjusted).toBeGreaterThanOrEqual(1600);
    });

    /**
     * Property: Boundary conditions - maximum values
     */
    test('handles maximum boundary values correctly', () => {
      // Test heavy labor maximum (3500 kcal)
      const heavyRange = dietaryService.getOccupationCalorieRange('heavy_physical');
      expect(heavyRange.maxCalories).toBe(3500);

      // Calories at or below maximum should be valid
      const adjusted = calorieService.adjustCaloriesForOccupation(3500, 'heavy_physical');
      expect(adjusted).toBeLessThanOrEqual(3500);
    });

    /**
     * Property: Calories below minimum are adjusted upward
     */
    test('calories below occupation minimum are adjusted upward', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 1599 }), // Below sedentary minimum
          (lowCalories) => {
            const adjusted = calorieService.adjustCaloriesForOccupation(lowCalories, 'desk_job');
            
            // Should be adjusted to at least the minimum
            expect(adjusted).toBeGreaterThanOrEqual(1600);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Calories above maximum are adjusted downward
     */
    test('calories above occupation maximum are adjusted downward', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3501, max: 5000 }), // Above heavy labor maximum
          (highCalories) => {
            const adjusted = calorieService.adjustCaloriesForOccupation(highCalories, 'heavy_physical');
            
            // Should be adjusted to at most the maximum
            expect(adjusted).toBeLessThanOrEqual(3500);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Calories within range remain unchanged
     */
    test('calories within occupation range remain unchanged', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2500, max: 3000 }), // Within moderate range
          (calories) => {
            const adjusted = calorieService.adjustCaloriesForOccupation(calories, 'moderate_physical');
            
            // Should remain the same
            expect(adjusted).toBe(calories);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: All occupation types have valid ranges
     */
    test('all occupation types have valid calorie ranges', () => {
      const occupationTypes: OccupationType[] = [
        'desk_job',
        'light_physical',
        'moderate_physical',
        'heavy_physical',
        'farming'
      ];

      occupationTypes.forEach(occupation => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1500, max: 4000 }),
            (calories) => {
              const adjusted = calorieService.adjustCaloriesForOccupation(calories, occupation);
              
              // Adjusted calories should be positive
              expect(adjusted).toBeGreaterThan(0);
              
              // Should be within reasonable range
              expect(adjusted).toBeGreaterThanOrEqual(1600);
              expect(adjusted).toBeLessThanOrEqual(3500);
            }
          ),
          { numRuns: 20 } // 20 runs per occupation type = 100 total
        );
      });
    });

    /**
     * Property: Range widths are consistent (500 kcal each)
     */
    test('all calorie ranges have consistent width of 400-500 kcal', () => {
      const occupations: OccupationType[] = [
        'desk_job',
        'light_physical',
        'moderate_physical',
        'heavy_physical'
      ];

      occupations.forEach(occupation => {
        const range = dietaryService.getOccupationCalorieRange(occupation);
        const width = range.maxCalories - range.minCalories;
        
        // All ranges should be 400-500 kcal wide
        expect(width).toBeGreaterThanOrEqual(400);
        expect(width).toBeLessThanOrEqual(500);
      });
    });

    /**
     * Property: Occupation type mapping is consistent
     */
    test('occupation types map to correct activity levels', () => {
      const mappings = [
        { occupation: 'desk_job' as OccupationType, minCal: 1600, maxCal: 2000 },
        { occupation: 'light_physical' as OccupationType, minCal: 2000, maxCal: 2500 },
        { occupation: 'moderate_physical' as OccupationType, minCal: 2500, maxCal: 3000 },
        { occupation: 'heavy_physical' as OccupationType, minCal: 3000, maxCal: 3500 },
        { occupation: 'farming' as OccupationType, minCal: 3000, maxCal: 3500 }
      ];

      mappings.forEach(({ occupation, minCal, maxCal }) => {
        const range = dietaryService.getOccupationCalorieRange(occupation);
        
        // Range should match expected values
        expect(range.minCalories).toBe(minCal);
        expect(range.maxCalories).toBe(maxCal);
      });
    });

    /**
     * Property: Edge case - exact boundary values
     */
    test('handles exact boundary values correctly', () => {
      const boundaries = [1600, 2000, 2500, 3000, 3500];
      const occupations: OccupationType[] = [
        'desk_job',
        'light_physical',
        'moderate_physical',
        'heavy_physical'
      ];

      boundaries.forEach(boundary => {
        occupations.forEach(occupation => {
          const adjusted = calorieService.adjustCaloriesForOccupation(boundary, occupation);
          
          // Should not throw error
          expect(adjusted).toBeGreaterThan(0);
          expect(adjusted).toBeGreaterThanOrEqual(1600);
          expect(adjusted).toBeLessThanOrEqual(3500);
        });
      });
    });
  });
});
