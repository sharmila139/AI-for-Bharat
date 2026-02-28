/**
 * Property-Based Tests for Crop Recommendation
 * Tests correctness properties using fast-check
 */

import fc from 'fast-check';
import { offlineCropRecommendation, FarmConditions } from '../../../mobile/src/services/ml/crop-recommendation-offline';

describe('Crop Recommendation - Property-Based Tests', () => {
  // Arbitraries for generating test data
  const soilTypeArb = fc.constantFrom(
    'alluvial',
    'black',
    'red',
    'laterite',
    'sandy',
    'clayey',
    'loamy'
  );

  const regionArb = fc.constantFrom('north', 'south', 'east', 'west', 'central');

  const seasonArb = fc.constantFrom('kharif', 'rabi', 'zaid');

  const farmConditionsArb = fc.record({
    soilType: soilTypeArb,
    nitrogen: fc.float({ min: 0, max: 200 }),
    phosphorus: fc.float({ min: 0, max: 100 }),
    potassium: fc.float({ min: 0, max: 150 }),
    ph: fc.float({ min: 3.0, max: 10.0 }),
    temperature: fc.float({ min: -10, max: 50 }),
    humidity: fc.float({ min: 0, max: 100 }),
    rainfall: fc.float({ min: 0, max: 500 }),
    region: regionArb,
    season: seasonArb,
  });

  /**
   * Property 9: Crop Recommendation Count
   * 
   * For any valid farm conditions and requested count N:
   * - The number of recommendations returned should be ≤ N
   * - If there are crops with score ≥ min_score, at least 1 should be returned
   * - All returned recommendations should have score ≥ min_score
   */
  describe('Property 9: Crop Recommendation Count', () => {
    it('should return at most N recommendations', () => {
      fc.assert(
        fc.property(
          farmConditionsArb,
          fc.integer({ min: 1, max: 10 }),
          (conditions, topN) => {
            const recommendations = offlineCropRecommendation.recommendCrops(
              conditions,
              topN,
              0.0 // No minimum score to test count property
            );

            // Property: recommendations.length <= topN
            expect(recommendations.length).toBeLessThanOrEqual(topN);
          }
        ),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should return recommendations in descending order by score', () => {
      fc.assert(
        fc.property(farmConditionsArb, fc.integer({ min: 1, max: 10 }), (conditions, topN) => {
          const recommendations = offlineCropRecommendation.recommendCrops(
            conditions,
            topN,
            0.0
          );

          // Property: recommendations are sorted by overallScore (descending)
          for (let i = 0; i < recommendations.length - 1; i++) {
            expect(recommendations[i].overallScore).toBeGreaterThanOrEqual(
              recommendations[i + 1].overallScore
            );
          }
        }),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should respect minimum score threshold', () => {
      fc.assert(
        fc.property(
          farmConditionsArb,
          fc.integer({ min: 1, max: 10 }),
          fc.float({ min: 0.0, max: 1.0 }),
          (conditions, topN, minScore) => {
            const recommendations = offlineCropRecommendation.recommendCrops(
              conditions,
              topN,
              minScore
            );

            // Property: all recommendations have score >= minScore
            for (const rec of recommendations) {
              expect(rec.overallScore).toBeGreaterThanOrEqual(minScore - 0.001); // Small tolerance for floating point
            }
          }
        ),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should return at least 1 recommendation for reasonable conditions', () => {
      // Generate "reasonable" farm conditions (not extreme values)
      const reasonableConditionsArb = fc.record({
        soilType: soilTypeArb,
        nitrogen: fc.float({ min: 40, max: 150 }),
        phosphorus: fc.float({ min: 20, max: 80 }),
        potassium: fc.float({ min: 20, max: 100 }),
        ph: fc.float({ min: 5.0, max: 8.0 }),
        temperature: fc.float({ min: 10, max: 40 }),
        humidity: fc.float({ min: 40, max: 90 }),
        rainfall: fc.float({ min: 30, max: 300 }),
        region: regionArb,
        season: seasonArb,
      });

      fc.assert(
        fc.property(reasonableConditionsArb, (conditions) => {
          const recommendations = offlineCropRecommendation.recommendCrops(
            conditions,
            5,
            0.2 // Reasonable minimum score
          );

          // Property: at least 1 recommendation for reasonable conditions
          expect(recommendations.length).toBeGreaterThanOrEqual(1);
        }),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should return empty array when minScore is too high', () => {
      fc.assert(
        fc.property(farmConditionsArb, (conditions) => {
          const recommendations = offlineCropRecommendation.recommendCrops(
            conditions,
            5,
            1.5 // Impossible score
          );

          // Property: no recommendations when threshold is impossible
          expect(recommendations.length).toBe(0);
        }),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should handle topN = 0 gracefully', () => {
      fc.assert(
        fc.property(farmConditionsArb, (conditions) => {
          const recommendations = offlineCropRecommendation.recommendCrops(conditions, 0, 0.0);

          // Property: topN = 0 returns empty array
          expect(recommendations.length).toBe(0);
        }),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should return consistent results for same input', () => {
      fc.assert(
        fc.property(farmConditionsArb, fc.integer({ min: 1, max: 10 }), (conditions, topN) => {
          const recommendations1 = offlineCropRecommendation.recommendCrops(
            conditions,
            topN,
            0.3
          );
          const recommendations2 = offlineCropRecommendation.recommendCrops(
            conditions,
            topN,
            0.3
          );

          // Property: deterministic - same input produces same output
          expect(recommendations1.length).toBe(recommendations2.length);
          for (let i = 0; i < recommendations1.length; i++) {
            expect(recommendations1[i].crop).toBe(recommendations2[i].crop);
            expect(recommendations1[i].overallScore).toBe(recommendations2[i].overallScore);
          }
        }),
        { numRuns: 100, seed: 42 }
      );
    });
  });

  /**
   * Property 10: Suitability Score Range
   * 
   * For any valid farm conditions:
   * - All component scores (soil, climate, seasonal, market) should be in [0, 1]
   * - Overall score should be in [0, 1]
   * - Suitability level should match the score range
   */
  describe('Property 10: Suitability Score Range', () => {
    it('should have all scores in valid range [0, 1]', () => {
      fc.assert(
        fc.property(farmConditionsArb, fc.integer({ min: 1, max: 10 }), (conditions, topN) => {
          const recommendations = offlineCropRecommendation.recommendCrops(
            conditions,
            topN,
            0.0
          );

          for (const rec of recommendations) {
            // Property: all scores are in [0, 1]
            expect(rec.overallScore).toBeGreaterThanOrEqual(0);
            expect(rec.overallScore).toBeLessThanOrEqual(1);

            expect(rec.soilScore).toBeGreaterThanOrEqual(0);
            expect(rec.soilScore).toBeLessThanOrEqual(1);

            expect(rec.climateScore).toBeGreaterThanOrEqual(0);
            expect(rec.climateScore).toBeLessThanOrEqual(1);

            expect(rec.seasonalScore).toBeGreaterThanOrEqual(0);
            expect(rec.seasonalScore).toBeLessThanOrEqual(1);

            expect(rec.marketScore).toBeGreaterThanOrEqual(0);
            expect(rec.marketScore).toBeLessThanOrEqual(1);
          }
        }),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should have suitability level matching score range', () => {
      fc.assert(
        fc.property(farmConditionsArb, fc.integer({ min: 1, max: 10 }), (conditions, topN) => {
          const recommendations = offlineCropRecommendation.recommendCrops(
            conditions,
            topN,
            0.0
          );

          for (const rec of recommendations) {
            const score = rec.overallScore;
            const level = rec.suitabilityLevel;

            // Property: suitability level matches score range
            if (score >= 0.8) {
              expect(level).toBe('Highly Suitable');
            } else if (score >= 0.6) {
              expect(level).toBe('Suitable');
            } else if (score >= 0.4) {
              expect(level).toBe('Moderately Suitable');
            } else if (score >= 0.2) {
              expect(level).toBe('Marginally Suitable');
            } else {
              expect(level).toBe('Not Suitable');
            }
          }
        }),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should have overall score as weighted combination of component scores', () => {
      fc.assert(
        fc.property(farmConditionsArb, fc.integer({ min: 1, max: 10 }), (conditions, topN) => {
          const recommendations = offlineCropRecommendation.recommendCrops(
            conditions,
            topN,
            0.0
          );

          for (const rec of recommendations) {
            // Property: overall score is weighted average (with default weights)
            // weights: soil=0.3, climate=0.35, seasonal=0.15, market=0.2
            const expectedScore =
              rec.soilScore * 0.3 +
              rec.climateScore * 0.35 +
              rec.seasonalScore * 0.15 +
              rec.marketScore * 0.2;

            // Allow small tolerance for floating point arithmetic
            expect(Math.abs(rec.overallScore - expectedScore)).toBeLessThan(0.01);
          }
        }),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should have non-negative scores for all components', () => {
      fc.assert(
        fc.property(farmConditionsArb, fc.integer({ min: 1, max: 10 }), (conditions, topN) => {
          const recommendations = offlineCropRecommendation.recommendCrops(
            conditions,
            topN,
            0.0
          );

          for (const rec of recommendations) {
            // Property: no negative scores
            expect(rec.overallScore).toBeGreaterThanOrEqual(0);
            expect(rec.soilScore).toBeGreaterThanOrEqual(0);
            expect(rec.climateScore).toBeGreaterThanOrEqual(0);
            expect(rec.seasonalScore).toBeGreaterThanOrEqual(0);
            expect(rec.marketScore).toBeGreaterThanOrEqual(0);
          }
        }),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should have reasons array for high-scoring recommendations', () => {
      fc.assert(
        fc.property(farmConditionsArb, fc.integer({ min: 1, max: 10 }), (conditions, topN) => {
          const recommendations = offlineCropRecommendation.recommendCrops(
            conditions,
            topN,
            0.0
          );

          for (const rec of recommendations) {
            // Property: recommendations have reasons and warnings arrays
            expect(Array.isArray(rec.reasons)).toBe(true);
            expect(Array.isArray(rec.warnings)).toBe(true);

            // High-scoring recommendations should have at least some reasons
            if (rec.overallScore >= 0.7) {
              expect(rec.reasons.length).toBeGreaterThan(0);
            }
          }
        }),
        { numRuns: 100, seed: 42 }
      );
    });
  });

  /**
   * Additional Property: Score Monotonicity
   * 
   * Improving conditions should not decrease suitability scores
   */
  describe('Property: Score Monotonicity', () => {
    it('should not decrease score when improving NPK levels', () => {
      fc.assert(
        fc.property(farmConditionsArb, (baseConditions) => {
          const recommendations1 = offlineCropRecommendation.recommendCrops(
            baseConditions,
            5,
            0.0
          );

          // Improve NPK levels (move towards ideal range)
          const improvedConditions = {
            ...baseConditions,
            nitrogen: Math.min(baseConditions.nitrogen + 10, 100),
            phosphorus: Math.min(baseConditions.phosphorus + 5, 50),
            potassium: Math.min(baseConditions.potassium + 5, 50),
          };

          const recommendations2 = offlineCropRecommendation.recommendCrops(
            improvedConditions,
            5,
            0.0
          );

          // Property: improving conditions should not decrease average score
          if (recommendations1.length > 0 && recommendations2.length > 0) {
            const avgScore1 =
              recommendations1.reduce((sum, r) => sum + r.overallScore, 0) /
              recommendations1.length;
            const avgScore2 =
              recommendations2.reduce((sum, r) => sum + r.overallScore, 0) /
              recommendations2.length;

            // Allow small tolerance for different crop selections
            expect(avgScore2).toBeGreaterThanOrEqual(avgScore1 - 0.1);
          }
        }),
        { numRuns: 50, seed: 42 }
      );
    });
  });

  /**
   * Additional Property: Crop Diversity
   * 
   * Different conditions should produce different recommendations
   */
  describe('Property: Crop Diversity', () => {
    it('should recommend different crops for significantly different conditions', () => {
      const condition1: FarmConditions = {
        soilType: 'alluvial',
        nitrogen: 100,
        phosphorus: 50,
        potassium: 50,
        ph: 6.5,
        temperature: 30,
        humidity: 80,
        rainfall: 200,
        region: 'east',
        season: 'kharif',
      };

      const condition2: FarmConditions = {
        soilType: 'loamy',
        nitrogen: 80,
        phosphorus: 40,
        potassium: 40,
        ph: 6.0,
        temperature: 20,
        humidity: 60,
        rainfall: 70,
        region: 'north',
        season: 'rabi',
      };

      const recs1 = offlineCropRecommendation.recommendCrops(condition1, 3, 0.3);
      const recs2 = offlineCropRecommendation.recommendCrops(condition2, 3, 0.3);

      // Property: different conditions should produce at least some different recommendations
      const crops1 = recs1.map((r) => r.crop);
      const crops2 = recs2.map((r) => r.crop);

      const intersection = crops1.filter((c) => crops2.includes(c));

      // At least one crop should be different
      expect(intersection.length).toBeLessThan(Math.max(crops1.length, crops2.length));
    });
  });
});
