/**
 * Unit tests for Soil Health Calculator
 * 
 * Tests the soil health score calculation logic including:
 * - Individual factor scoring (pH, organic matter, NPK, micronutrients, texture)
 * - Weighted overall score calculation
 * - Score range validation (0-100)
 * - Recommendation generation
 */

import { SoilHealthCalculator, SoilData } from '../soil-health-calculator';

describe('SoilHealthCalculator', () => {
  let calculator: SoilHealthCalculator;

  beforeEach(() => {
    calculator = new SoilHealthCalculator();
  });

  describe('Overall Score Calculation', () => {
    it('should calculate score for complete soil data', () => {
      const soilData: SoilData = {
        pH: 6.5,
        organicMatter: 1.5,
        nitrogen: 400,
        phosphorus: 20,
        potassium: 200,
        zinc: 0.8,
        iron: 5.0,
        manganese: 1.2,
        copper: 0.3,
        boron: 0.6,
        texture: 'loamy',
      };

      const result = calculator.calculateScore(soilData);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.overallStatus).toBeDefined();
      expect(result.dataCompleteness).toBe(100);
    });

    it('should calculate score with partial data', () => {
      const soilData: SoilData = {
        pH: 6.5,
        organicMatter: 1.0,
        texture: 'loamy',
      };

      const result = calculator.calculateScore(soilData);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.dataCompleteness).toBeLessThan(100);
    });

    it('should handle empty soil data', () => {
      const soilData: SoilData = {};

      const result = calculator.calculateScore(soilData);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.dataCompleteness).toBe(0);
    });

    it('should return score between 0 and 100', () => {
      const testCases: SoilData[] = [
        { pH: 3.0, organicMatter: 0.1, nitrogen: 50, phosphorus: 2, potassium: 30 },
        { pH: 7.0, organicMatter: 2.0, nitrogen: 600, phosphorus: 30, potassium: 300 },
        { pH: 10.0, organicMatter: 0.05, nitrogen: 10, phosphorus: 1, potassium: 10 },
      ];

      testCases.forEach(soilData => {
        const result = calculator.calculateScore(soilData);
        expect(result.overallScore).toBeGreaterThanOrEqual(0);
        expect(result.overallScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('pH Score Calculation', () => {
    it('should give excellent score for optimal pH (6.0-7.5)', () => {
      const testCases = [6.0, 6.5, 7.0, 7.5];

      testCases.forEach(pH => {
        const result = calculator.calculateScore({ pH });
        expect(result.breakdown.pH.score).toBe(100);
        expect(result.breakdown.pH.status).toBe('excellent');
      });
    });

    it('should give good score for slightly acidic/alkaline pH', () => {
      const testCases = [5.5, 5.8, 7.6, 8.0];

      testCases.forEach(pH => {
        const result = calculator.calculateScore({ pH });
        expect(result.breakdown.pH.score).toBe(75);
        expect(result.breakdown.pH.status).toBe('good');
      });
    });

    it('should give poor score for extreme pH', () => {
      const testCases = [4.0, 4.5, 8.6, 9.0];

      testCases.forEach(pH => {
        const result = calculator.calculateScore({ pH });
        expect(result.breakdown.pH.score).toBeLessThanOrEqual(25);
        expect(['poor', 'very-poor']).toContain(result.breakdown.pH.status);
      });
    });

    it('should handle missing pH data', () => {
      const result = calculator.calculateScore({});
      expect(result.breakdown.pH.status).toBe('unknown');
      expect(result.breakdown.pH.score).toBe(50);
    });
  });

  describe('Organic Matter Score Calculation', () => {
    it('should give excellent score for high organic matter (>2.0%)', () => {
      const result = calculator.calculateScore({ organicMatter: 2.5 });
      expect(result.breakdown.organicMatter.score).toBe(100);
      expect(result.breakdown.organicMatter.status).toBe('excellent');
    });

    it('should give good score for adequate organic matter (1.0-2.0%)', () => {
      const result = calculator.calculateScore({ organicMatter: 1.5 });
      expect(result.breakdown.organicMatter.score).toBe(80);
      expect(result.breakdown.organicMatter.status).toBe('good');
    });

    it('should give fair score for minimum organic matter (0.5-1.0%)', () => {
      const result = calculator.calculateScore({ organicMatter: 0.7 });
      expect(result.breakdown.organicMatter.score).toBe(60);
      expect(result.breakdown.organicMatter.status).toBe('fair');
    });

    it('should give poor score for low organic matter (<0.5%)', () => {
      const result = calculator.calculateScore({ organicMatter: 0.3 });
      expect(result.breakdown.organicMatter.score).toBeLessThanOrEqual(35);
      expect(['poor', 'very-poor']).toContain(result.breakdown.organicMatter.status);
    });

    it('should handle missing organic matter data', () => {
      const result = calculator.calculateScore({});
      expect(result.breakdown.organicMatter.status).toBe('unknown');
      expect(result.breakdown.organicMatter.score).toBe(50);
    });
  });

  describe('NPK Score Calculation', () => {
    it('should give high score for optimal NPK levels', () => {
      const result = calculator.calculateScore({
        nitrogen: 600,
        phosphorus: 30,
        potassium: 300,
      });

      expect(result.breakdown.npk.score).toBeGreaterThanOrEqual(85);
      expect(['excellent', 'good']).toContain(result.breakdown.npk.status);
    });

    it('should give low score for deficient NPK levels', () => {
      const result = calculator.calculateScore({
        nitrogen: 100,
        phosphorus: 5,
        potassium: 50,
      });

      expect(result.breakdown.npk.score).toBeLessThanOrEqual(50);
    });

    it('should calculate score with partial NPK data', () => {
      const result = calculator.calculateScore({
        nitrogen: 400,
      });

      expect(result.breakdown.npk.score).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.npk.score).toBeLessThanOrEqual(100);
      expect(result.breakdown.npk.details).toContain('N:');
    });

    it('should handle missing NPK data', () => {
      const result = calculator.calculateScore({});
      expect(result.breakdown.npk.status).toBe('unknown');
      expect(result.breakdown.npk.score).toBe(50);
    });
  });

  describe('Micronutrient Score Calculation', () => {
    it('should give high score for optimal micronutrient levels', () => {
      const result = calculator.calculateScore({
        zinc: 0.8,
        iron: 5.0,
        manganese: 1.2,
        copper: 0.3,
        boron: 0.6,
      });

      expect(result.breakdown.micronutrients.score).toBeGreaterThanOrEqual(85);
      expect(['excellent', 'good']).toContain(result.breakdown.micronutrients.status);
    });

    it('should give low score for deficient micronutrients', () => {
      const result = calculator.calculateScore({
        zinc: 0.2,
        iron: 1.0,
        manganese: 0.3,
      });

      expect(result.breakdown.micronutrients.score).toBeLessThanOrEqual(60);
    });

    it('should handle partial micronutrient data', () => {
      const result = calculator.calculateScore({
        zinc: 0.8,
        iron: 5.0,
      });

      expect(result.breakdown.micronutrients.score).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.micronutrients.score).toBeLessThanOrEqual(100);
    });

    it('should handle missing micronutrient data', () => {
      const result = calculator.calculateScore({});
      expect(result.breakdown.micronutrients.status).toBe('unknown');
      expect(result.breakdown.micronutrients.score).toBe(50);
    });
  });

  describe('Texture Score Calculation', () => {
    it('should give high score for loamy texture', () => {
      const result = calculator.calculateScore({ texture: 'loamy' });
      expect(result.breakdown.texture.score).toBe(100);
      expect(result.breakdown.texture.status).toBe('excellent');
    });

    it('should give moderate score for sandy texture', () => {
      const result = calculator.calculateScore({ texture: 'sandy' });
      expect(result.breakdown.texture.score).toBe(50);
      expect(result.breakdown.texture.status).toBe('fair');
    });

    it('should give good score for clay-loam texture', () => {
      const result = calculator.calculateScore({ texture: 'clay-loam' });
      expect(result.breakdown.texture.score).toBe(85);
      expect(['excellent', 'good']).toContain(result.breakdown.texture.status);
    });

    it('should handle missing texture data', () => {
      const result = calculator.calculateScore({});
      expect(result.breakdown.texture.status).toBe('unknown');
      expect(result.breakdown.texture.score).toBe(50);
    });
  });

  describe('Recommendations', () => {
    it('should provide recommendations for poor soil health', () => {
      const result = calculator.calculateScore({
        pH: 4.5,
        organicMatter: 0.2,
        nitrogen: 100,
      });

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.toLowerCase().includes('lime') || 
                                              r.toLowerCase().includes('organic'))).toBe(true);
    });

    it('should provide fewer recommendations for good soil health', () => {
      const result = calculator.calculateScore({
        pH: 6.5,
        organicMatter: 2.0,
        nitrogen: 500,
        phosphorus: 25,
        potassium: 250,
        texture: 'loamy',
      });

      // Good soil should have fewer or no recommendations
      expect(result.recommendations.length).toBeLessThanOrEqual(3);
    });

    it('should recommend testing when data is incomplete', () => {
      const result = calculator.calculateScore({
        pH: 6.5,
      });

      expect(result.recommendations.some(r => 
        r.toLowerCase().includes('test')
      )).toBe(true);
    });
  });

  describe('Data Completeness', () => {
    it('should calculate 100% completeness for full data', () => {
      const result = calculator.calculateScore({
        pH: 6.5,
        organicMatter: 1.5,
        nitrogen: 400,
        phosphorus: 20,
        potassium: 200,
        zinc: 0.8,
        iron: 5.0,
        manganese: 1.2,
        copper: 0.3,
        boron: 0.6,
        texture: 'loamy',
      });

      expect(result.dataCompleteness).toBe(100);
    });

    it('should calculate 0% completeness for empty data', () => {
      const result = calculator.calculateScore({});
      expect(result.dataCompleteness).toBe(0);
    });

    it('should calculate partial completeness correctly', () => {
      const result = calculator.calculateScore({
        pH: 6.5,
        organicMatter: 1.5,
        texture: 'loamy',
      });

      expect(result.dataCompleteness).toBeGreaterThan(0);
      expect(result.dataCompleteness).toBeLessThan(100);
    });
  });

  describe('Weighted Score Calculation', () => {
    it('should weight pH and NPK more heavily than texture', () => {
      // Test with excellent pH/NPK but poor texture
      const result1 = calculator.calculateScore({
        pH: 6.5,
        organicMatter: 2.0,
        nitrogen: 600,
        phosphorus: 30,
        potassium: 300,
        texture: 'sandy',
      });

      // Test with poor pH/NPK but excellent texture
      const result2 = calculator.calculateScore({
        pH: 4.5,
        organicMatter: 0.2,
        nitrogen: 100,
        phosphorus: 5,
        potassium: 50,
        texture: 'loamy',
      });

      // Result1 should have higher overall score due to heavier weights on pH and NPK
      expect(result1.overallScore).toBeGreaterThan(result2.overallScore);
    });

    it('should produce consistent scores for same input', () => {
      const soilData: SoilData = {
        pH: 6.5,
        organicMatter: 1.5,
        nitrogen: 400,
        phosphorus: 20,
        potassium: 200,
        texture: 'loamy',
      };

      const result1 = calculator.calculateScore(soilData);
      const result2 = calculator.calculateScore(soilData);

      expect(result1.overallScore).toBe(result2.overallScore);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      const result = calculator.calculateScore({
        pH: 0,
        organicMatter: 0,
        nitrogen: 0,
        phosphorus: 0,
        potassium: 0,
      });

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should handle very high values', () => {
      const result = calculator.calculateScore({
        pH: 14,
        organicMatter: 10,
        nitrogen: 10000,
        phosphorus: 1000,
        potassium: 10000,
      });

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should handle negative values gracefully', () => {
      const result = calculator.calculateScore({
        pH: -1,
        organicMatter: -0.5,
      });

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });
});
