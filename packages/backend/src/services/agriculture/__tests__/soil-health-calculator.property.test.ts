/**
 * Property-Based Tests for Soil Health Calculator
 * 
 * **Validates: Property 11**
 * For any soil analysis data, the overall health score should be between 0-100
 * and be a weighted function of pH balance, organic matter, NPK status,
 * micronutrients, and texture scores.
 */

import fc from 'fast-check';
import { SoilHealthCalculator, SoilData } from '../soil-health-calculator';

describe('SoilHealthCalculator - Property-Based Tests', () => {
  let calculator: SoilHealthCalculator;

  beforeEach(() => {
    calculator = new SoilHealthCalculator();
  });

  /**
   * Property 11: Soil Health Score Range and Composition
   * 
   * For any soil analysis data, the overall health score should:
   * 1. Be between 0 and 100 (inclusive)
   * 2. Be a weighted function of all factor scores
   * 3. Have all individual factor scores between 0 and 100
   */
  describe('Property 11: Soil Health Score Calculation', () => {
    it('should always return overall score between 0-100 for any soil data', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary soil data
          fc.record({
            pH: fc.option(fc.float({ min: 0, max: 14, noNaN: true }), { nil: undefined }),
            organicMatter: fc.option(fc.float({ min: 0, max: 10, noNaN: true }), { nil: undefined }),
            nitrogen: fc.option(fc.float({ min: 0, max: 2000, noNaN: true }), { nil: undefined }),
            phosphorus: fc.option(fc.float({ min: 0, max: 200, noNaN: true }), { nil: undefined }),
            potassium: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: undefined }),
            zinc: fc.option(fc.float({ min: 0, max: 5, noNaN: true }), { nil: undefined }),
            iron: fc.option(fc.float({ min: 0, max: 20, noNaN: true }), { nil: undefined }),
            manganese: fc.option(fc.float({ min: 0, max: 10, noNaN: true }), { nil: undefined }),
            copper: fc.option(fc.float({ min: 0, max: 2, noNaN: true }), { nil: undefined }),
            boron: fc.option(fc.float({ min: 0, max: 3, noNaN: true }), { nil: undefined }),
            texture: fc.option(
              fc.constantFrom('sandy', 'loamy', 'clayey', 'sandy-loam', 'clay-loam', 'silt-loam', 'variable'),
              { nil: undefined }
            ),
          }) as fc.Arbitrary<SoilData>,
          (soilData: SoilData) => {
            const result = calculator.calculateScore(soilData);

            // Property: Overall score must be between 0 and 100
            expect(result.overallScore).toBeGreaterThanOrEqual(0);
            expect(result.overallScore).toBeLessThanOrEqual(100);

            // Property: Overall score must be a number (not NaN or Infinity)
            expect(Number.isFinite(result.overallScore)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have all individual factor scores between 0-100', () => {
      fc.assert(
        fc.property(
          fc.record({
            pH: fc.option(fc.float({ min: 0, max: 14, noNaN: true }), { nil: undefined }),
            organicMatter: fc.option(fc.float({ min: 0, max: 10, noNaN: true }), { nil: undefined }),
            nitrogen: fc.option(fc.float({ min: 0, max: 2000, noNaN: true }), { nil: undefined }),
            phosphorus: fc.option(fc.float({ min: 0, max: 200, noNaN: true }), { nil: undefined }),
            potassium: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: undefined }),
            zinc: fc.option(fc.float({ min: 0, max: 5, noNaN: true }), { nil: undefined }),
            iron: fc.option(fc.float({ min: 0, max: 20, noNaN: true }), { nil: undefined }),
            manganese: fc.option(fc.float({ min: 0, max: 10, noNaN: true }), { nil: undefined }),
            copper: fc.option(fc.float({ min: 0, max: 2, noNaN: true }), { nil: undefined }),
            boron: fc.option(fc.float({ min: 0, max: 3, noNaN: true }), { nil: undefined }),
            texture: fc.option(
              fc.constantFrom('sandy', 'loamy', 'clayey', 'sandy-loam', 'clay-loam', 'silt-loam', 'variable'),
              { nil: undefined }
            ),
          }) as fc.Arbitrary<SoilData>,
          (soilData: SoilData) => {
            const result = calculator.calculateScore(soilData);

            // Property: All factor scores must be between 0 and 100
            expect(result.breakdown.pH.score).toBeGreaterThanOrEqual(0);
            expect(result.breakdown.pH.score).toBeLessThanOrEqual(100);

            expect(result.breakdown.organicMatter.score).toBeGreaterThanOrEqual(0);
            expect(result.breakdown.organicMatter.score).toBeLessThanOrEqual(100);

            expect(result.breakdown.npk.score).toBeGreaterThanOrEqual(0);
            expect(result.breakdown.npk.score).toBeLessThanOrEqual(100);

            expect(result.breakdown.micronutrients.score).toBeGreaterThanOrEqual(0);
            expect(result.breakdown.micronutrients.score).toBeLessThanOrEqual(100);

            expect(result.breakdown.texture.score).toBeGreaterThanOrEqual(0);
            expect(result.breakdown.texture.score).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate overall score as weighted function of factor scores', () => {
      fc.assert(
        fc.property(
          fc.record({
            pH: fc.option(fc.float({ min: 0, max: 14, noNaN: true }), { nil: undefined }),
            organicMatter: fc.option(fc.float({ min: 0, max: 10, noNaN: true }), { nil: undefined }),
            nitrogen: fc.option(fc.float({ min: 0, max: 2000, noNaN: true }), { nil: undefined }),
            phosphorus: fc.option(fc.float({ min: 0, max: 200, noNaN: true }), { nil: undefined }),
            potassium: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: undefined }),
            zinc: fc.option(fc.float({ min: 0, max: 5, noNaN: true }), { nil: undefined }),
            iron: fc.option(fc.float({ min: 0, max: 20, noNaN: true }), { nil: undefined }),
            manganese: fc.option(fc.float({ min: 0, max: 10, noNaN: true }), { nil: undefined }),
            copper: fc.option(fc.float({ min: 0, max: 2, noNaN: true }), { nil: undefined }),
            boron: fc.option(fc.float({ min: 0, max: 3, noNaN: true }), { nil: undefined }),
            texture: fc.option(
              fc.constantFrom('sandy', 'loamy', 'clayey', 'sandy-loam', 'clay-loam', 'silt-loam', 'variable'),
              { nil: undefined }
            ),
          }) as fc.Arbitrary<SoilData>,
          (soilData: SoilData) => {
            const result = calculator.calculateScore(soilData);

            // Property: Overall score should be influenced by all factor scores
            // Calculate expected weighted score manually
            const weights = {
              pH: 0.25,
              organicMatter: 0.20,
              npk: 0.30,
              micronutrients: 0.15,
              texture: 0.10,
            };

            const expectedScore =
              result.breakdown.pH.score * weights.pH +
              result.breakdown.organicMatter.score * weights.organicMatter +
              result.breakdown.npk.score * weights.npk +
              result.breakdown.micronutrients.score * weights.micronutrients +
              result.breakdown.texture.score * weights.texture;

            // Allow small rounding difference (0.1)
            expect(Math.abs(result.overallScore - expectedScore)).toBeLessThanOrEqual(0.1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent overall status based on score', () => {
      fc.assert(
        fc.property(
          fc.record({
            pH: fc.option(fc.float({ min: 0, max: 14, noNaN: true }), { nil: undefined }),
            organicMatter: fc.option(fc.float({ min: 0, max: 10, noNaN: true }), { nil: undefined }),
            nitrogen: fc.option(fc.float({ min: 0, max: 2000, noNaN: true }), { nil: undefined }),
            phosphorus: fc.option(fc.float({ min: 0, max: 200, noNaN: true }), { nil: undefined }),
            potassium: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: undefined }),
            texture: fc.option(
              fc.constantFrom('sandy', 'loamy', 'clayey', 'sandy-loam', 'clay-loam', 'silt-loam', 'variable'),
              { nil: undefined }
            ),
          }) as fc.Arbitrary<SoilData>,
          (soilData: SoilData) => {
            const result = calculator.calculateScore(soilData);

            // Property: Status should match score ranges
            if (result.overallScore >= 85) {
              expect(result.overallStatus).toBe('excellent');
            } else if (result.overallScore >= 70) {
              expect(result.overallStatus).toBe('good');
            } else if (result.overallScore >= 50) {
              expect(result.overallStatus).toBe('fair');
            } else if (result.overallScore >= 30) {
              expect(result.overallStatus).toBe('poor');
            } else {
              expect(result.overallStatus).toBe('very-poor');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have data completeness between 0-100', () => {
      fc.assert(
        fc.property(
          fc.record({
            pH: fc.option(fc.float({ min: 0, max: 14, noNaN: true }), { nil: undefined }),
            organicMatter: fc.option(fc.float({ min: 0, max: 10, noNaN: true }), { nil: undefined }),
            nitrogen: fc.option(fc.float({ min: 0, max: 2000, noNaN: true }), { nil: undefined }),
            phosphorus: fc.option(fc.float({ min: 0, max: 200, noNaN: true }), { nil: undefined }),
            potassium: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: undefined }),
            zinc: fc.option(fc.float({ min: 0, max: 5, noNaN: true }), { nil: undefined }),
            iron: fc.option(fc.float({ min: 0, max: 20, noNaN: true }), { nil: undefined }),
            manganese: fc.option(fc.float({ min: 0, max: 10, noNaN: true }), { nil: undefined }),
            copper: fc.option(fc.float({ min: 0, max: 2, noNaN: true }), { nil: undefined }),
            boron: fc.option(fc.float({ min: 0, max: 3, noNaN: true }), { nil: undefined }),
            texture: fc.option(
              fc.constantFrom('sandy', 'loamy', 'clayey', 'sandy-loam', 'clay-loam', 'silt-loam', 'variable'),
              { nil: undefined }
            ),
          }) as fc.Arbitrary<SoilData>,
          (soilData: SoilData) => {
            const result = calculator.calculateScore(soilData);

            // Property: Data completeness must be between 0 and 100
            expect(result.dataCompleteness).toBeGreaterThanOrEqual(0);
            expect(result.dataCompleteness).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return valid status for each factor', () => {
      fc.assert(
        fc.property(
          fc.record({
            pH: fc.option(fc.float({ min: 0, max: 14, noNaN: true }), { nil: undefined }),
            organicMatter: fc.option(fc.float({ min: 0, max: 10, noNaN: true }), { nil: undefined }),
            nitrogen: fc.option(fc.float({ min: 0, max: 2000, noNaN: true }), { nil: undefined }),
            phosphorus: fc.option(fc.float({ min: 0, max: 200, noNaN: true }), { nil: undefined }),
            potassium: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: undefined }),
            texture: fc.option(
              fc.constantFrom('sandy', 'loamy', 'clayey', 'sandy-loam', 'clay-loam', 'silt-loam', 'variable'),
              { nil: undefined }
            ),
          }) as fc.Arbitrary<SoilData>,
          (soilData: SoilData) => {
            const result = calculator.calculateScore(soilData);

            const validStatuses = ['excellent', 'good', 'fair', 'poor', 'very-poor', 'unknown'];

            // Property: All factor statuses must be valid
            expect(validStatuses).toContain(result.breakdown.pH.status);
            expect(validStatuses).toContain(result.breakdown.organicMatter.status);
            expect(validStatuses).toContain(result.breakdown.npk.status);
            expect(validStatuses).toContain(result.breakdown.micronutrients.status);
            expect(validStatuses).toContain(result.breakdown.texture.status);
            expect(validStatuses).toContain(result.overallStatus);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return recommendations array (may be empty)', () => {
      fc.assert(
        fc.property(
          fc.record({
            pH: fc.option(fc.float({ min: 0, max: 14, noNaN: true }), { nil: undefined }),
            organicMatter: fc.option(fc.float({ min: 0, max: 10, noNaN: true }), { nil: undefined }),
            nitrogen: fc.option(fc.float({ min: 0, max: 2000, noNaN: true }), { nil: undefined }),
            phosphorus: fc.option(fc.float({ min: 0, max: 200, noNaN: true }), { nil: undefined }),
            potassium: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: undefined }),
            texture: fc.option(
              fc.constantFrom('sandy', 'loamy', 'clayey', 'sandy-loam', 'clay-loam', 'silt-loam', 'variable'),
              { nil: undefined }
            ),
          }) as fc.Arbitrary<SoilData>,
          (soilData: SoilData) => {
            const result = calculator.calculateScore(soilData);

            // Property: Recommendations must be an array
            expect(Array.isArray(result.recommendations)).toBe(true);

            // Property: All recommendations must be non-empty strings
            result.recommendations.forEach(rec => {
              expect(typeof rec).toBe('string');
              expect(rec.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same input produces same output', () => {
      fc.assert(
        fc.property(
          fc.record({
            pH: fc.option(fc.float({ min: 0, max: 14, noNaN: true }), { nil: undefined }),
            organicMatter: fc.option(fc.float({ min: 0, max: 10, noNaN: true }), { nil: undefined }),
            nitrogen: fc.option(fc.float({ min: 0, max: 2000, noNaN: true }), { nil: undefined }),
            phosphorus: fc.option(fc.float({ min: 0, max: 200, noNaN: true }), { nil: undefined }),
            potassium: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: undefined }),
            texture: fc.option(
              fc.constantFrom('sandy', 'loamy', 'clayey', 'sandy-loam', 'clay-loam', 'silt-loam', 'variable'),
              { nil: undefined }
            ),
          }) as fc.Arbitrary<SoilData>,
          (soilData: SoilData) => {
            const result1 = calculator.calculateScore(soilData);
            const result2 = calculator.calculateScore(soilData);

            // Property: Same input should produce same output
            expect(result1.overallScore).toBe(result2.overallScore);
            expect(result1.overallStatus).toBe(result2.overallStatus);
            expect(result1.dataCompleteness).toBe(result2.dataCompleteness);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case: all factors at optimal values', () => {
      // Edge case: All factors at optimal values should produce high score
      const optimalSoilData: SoilData = {
        pH: 6.5, // Optimal range
        organicMatter: 2.5, // Excellent
        nitrogen: 600, // High
        phosphorus: 30, // High
        potassium: 300, // High
        zinc: 1.0, // Sufficient
        iron: 5.0, // Sufficient
        manganese: 1.5, // Sufficient
        copper: 0.3, // Sufficient
        boron: 0.6, // Sufficient
        texture: 'loamy', // Best texture
      };

      const result = calculator.calculateScore(optimalSoilData);

      // Property: Optimal values should produce excellent score (>85)
      expect(result.overallScore).toBeGreaterThan(85);
      expect(result.overallStatus).toBe('excellent');
      expect(result.dataCompleteness).toBe(100);
    });

    it('should handle edge case: all factors at poor values', () => {
      // Edge case: All factors at poor values should produce low score
      const poorSoilData: SoilData = {
        pH: 3.5, // Extremely acidic
        organicMatter: 0.1, // Very low
        nitrogen: 50, // Very low
        phosphorus: 2, // Very low
        potassium: 30, // Very low
        zinc: 0.1, // Deficient
        iron: 1.0, // Deficient
        manganese: 0.2, // Deficient
        copper: 0.05, // Deficient
        boron: 0.1, // Deficient
        texture: 'sandy', // Poor texture
      };

      const result = calculator.calculateScore(poorSoilData);

      // Property: Poor values should produce low score (<50)
      expect(result.overallScore).toBeLessThan(50);
      expect(['poor', 'very-poor']).toContain(result.overallStatus);
      expect(result.dataCompleteness).toBe(100);
    });

    it('should handle edge case: no data provided', () => {
      // Edge case: Empty soil data
      const emptySoilData: SoilData = {};

      const result = calculator.calculateScore(emptySoilData);

      // Property: With no data, should return neutral scores (50)
      expect(result.overallScore).toBe(50);
      expect(result.overallStatus).toBe('fair');
      expect(result.dataCompleteness).toBe(0);

      // All factors should have 'unknown' status
      expect(result.breakdown.pH.status).toBe('unknown');
      expect(result.breakdown.organicMatter.status).toBe('unknown');
      expect(result.breakdown.npk.status).toBe('unknown');
      expect(result.breakdown.micronutrients.status).toBe('unknown');
      expect(result.breakdown.texture.status).toBe('unknown');
    });

    it('should handle edge case: partial data provided', () => {
      // Edge case: Only some factors provided
      const partialSoilData: SoilData = {
        pH: 6.8,
        organicMatter: 1.5,
        // No NPK data
        // No micronutrient data
        texture: 'loamy',
      };

      const result = calculator.calculateScore(partialSoilData);

      // Property: Should still calculate valid score with partial data
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.dataCompleteness).toBeGreaterThan(0);
      expect(result.dataCompleteness).toBeLessThan(100);

      // Known factors should not be 'unknown'
      expect(result.breakdown.pH.status).not.toBe('unknown');
      expect(result.breakdown.organicMatter.status).not.toBe('unknown');
      expect(result.breakdown.texture.status).not.toBe('unknown');

      // Unknown factors should be 'unknown'
      expect(result.breakdown.npk.status).toBe('unknown');
      expect(result.breakdown.micronutrients.status).toBe('unknown');
    });

    it('should verify weights sum to 100%', () => {
      // Property: The weights used in calculation should sum to 1.0 (100%)
      // This is verified indirectly through the weighted calculation test,
      // but we can also verify with a specific case
      const testSoilData: SoilData = {
        pH: 7.0,
        organicMatter: 1.0,
        nitrogen: 400,
        phosphorus: 20,
        potassium: 200,
        zinc: 0.5,
        iron: 3.0,
        manganese: 0.8,
        copper: 0.15,
        boron: 0.4,
        texture: 'loamy',
      };

      const result = calculator.calculateScore(testSoilData);

      // Calculate expected score with known weights
      const weights = {
        pH: 0.25,
        organicMatter: 0.20,
        npk: 0.30,
        micronutrients: 0.15,
        texture: 0.10,
      };

      // Verify weights sum to 1.0
      const weightSum = Object.values(weights).reduce((sum, w) => sum + w, 0);
      expect(weightSum).toBeCloseTo(1.0, 10);

      // Verify the calculation uses these weights correctly
      const expectedScore =
        result.breakdown.pH.score * weights.pH +
        result.breakdown.organicMatter.score * weights.organicMatter +
        result.breakdown.npk.score * weights.npk +
        result.breakdown.micronutrients.score * weights.micronutrients +
        result.breakdown.texture.score * weights.texture;

      expect(result.overallScore).toBeCloseTo(expectedScore, 1);
    });

    it('should handle extreme pH values correctly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 14, noNaN: true }),
          (pH: number) => {
            const soilData: SoilData = { pH };
            const result = calculator.calculateScore(soilData);

            // Property: pH score should be highest in optimal range (6.0-7.5)
            if (pH >= 6.0 && pH <= 7.5) {
              expect(result.breakdown.pH.score).toBe(100);
              expect(result.breakdown.pH.status).toBe('excellent');
            }

            // Property: Extreme pH values should have lower scores
            if (pH < 4.0 || pH > 9.0) {
              expect(result.breakdown.pH.score).toBeLessThan(30);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle extreme organic matter values correctly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10, noNaN: true }),
          (organicMatter: number) => {
            const soilData: SoilData = { organicMatter };
            const result = calculator.calculateScore(soilData);

            // Property: Higher organic matter should generally produce higher scores
            if (organicMatter > 2.0) {
              expect(result.breakdown.organicMatter.score).toBeGreaterThanOrEqual(80);
              expect(result.breakdown.organicMatter.status).toBe('excellent');
            }

            // Property: Very low organic matter should have low scores
            if (organicMatter < 0.25) {
              expect(result.breakdown.organicMatter.score).toBeLessThan(50);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
