/**
 * Unit tests for Fertilizer Recommendation Engine
 */

import {
  FertilizerRecommendationEngine,
  getFertilizerRecommendationEngine,
  FertilizerInput
} from '../fertilizer-recommendation';
import { SoilData, SoilHealthScore } from '../soil-health-calculator';
import { CropTimeline, TimelineStage } from '../crop-timeline';

describe('FertilizerRecommendationEngine', () => {
  let engine: FertilizerRecommendationEngine;
  
  beforeEach(() => {
    engine = new FertilizerRecommendationEngine();
  });

  // Helper function to create mock soil data
  const createMockSoilData = (): SoilData => ({
    pH: 6.5,
    organicMatter: 1.2,
    nitrogen: 200,
    phosphorus: 15,
    potassium: 150,
    zinc: 0.4,
    texture: 'loamy'
  });

  // Helper function to create mock soil health score
  const createMockSoilHealthScore = (): SoilHealthScore => ({
    overallScore: 65,
    overallStatus: 'good',
    breakdown: {
      pH: { score: 100, status: 'excellent', details: 'pH optimal' },
      organicMatter: { score: 80, status: 'good', details: 'Good organic matter' },
      npk: { score: 60, status: 'fair', details: 'NPK adequate' },
      micronutrients: { score: 50, status: 'fair', details: 'Some deficiencies' },
      texture: { score: 100, status: 'excellent', details: 'Loamy soil' }
    },
    recommendations: [],
    dataCompleteness: 85
  });

  // Helper function to create mock crop timeline
  const createMockCropTimeline = (): CropTimeline => {
    const now = new Date();
    const stages: TimelineStage[] = [
      {
        stage: 'Land Preparation',
        startDate: new Date(now.getTime()),
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        durationDays: 7,
        activities: ['Plowing', 'Leveling'],
        inputs: {},
        expectedConditions: {},
        alerts: []
      },
      {
        stage: 'Sowing',
        startDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        durationDays: 3,
        activities: ['Seed treatment', 'Sowing'],
        inputs: { water: 'Pre-sowing irrigation', fertilizer: 'Basal dose' },
        expectedConditions: {},
        alerts: []
      }
    ];

    return {
      cropId: 'rice-001',
      cropName: 'Rice',
      sowingDate: now,
      harvestDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
      totalDurationDays: 120,
      stages,
      criticalDates: [],
      seasonalRecommendations: [],
      generatedAt: now
    };
  };

  describe('generateRecommendations', () => {
    it('should generate all three types of recommendations', () => {
      const input: FertilizerInput = {
        soilData: createMockSoilData(),
        soilHealthScore: createMockSoilHealthScore(),
        cropName: 'rice',
        cropTimeline: createMockCropTimeline(),
        landArea: 1
      };

      const result = engine.generateRecommendations(input);

      expect(result).toBeDefined();
      expect(result.organic).toBeDefined();
      expect(result.chemical).toBeDefined();
      expect(result.mixed).toBeDefined();
      expect(result.recommended).toMatch(/^(organic|chemical|mixed)$/);
      expect(result.comparisonSummary).toBeTruthy();
    });

    it('should include products in each recommendation type', () => {
      const input: FertilizerInput = {
        soilData: createMockSoilData(),
        soilHealthScore: createMockSoilHealthScore(),
        cropName: 'wheat',
        cropTimeline: createMockCropTimeline(),
        landArea: 2
      };

      const result = engine.generateRecommendations(input);

      expect(result.organic.products.length).toBeGreaterThan(0);
      expect(result.chemical.products.length).toBeGreaterThan(0);
      expect(result.mixed.products.length).toBeGreaterThan(0);
    });

    it('should generate application schedules for each type', () => {
      const input: FertilizerInput = {
        soilData: createMockSoilData(),
        soilHealthScore: createMockSoilHealthScore(),
        cropName: 'maize',
        cropTimeline: createMockCropTimeline(),
        landArea: 1
      };

      const result = engine.generateRecommendations(input);

      expect(result.organic.applicationSchedule.length).toBeGreaterThan(0);
      expect(result.chemical.applicationSchedule.length).toBeGreaterThan(0);
      expect(result.mixed.applicationSchedule.length).toBeGreaterThan(0);
    });

    it('should include cost-benefit analysis for each type', () => {
      const input: FertilizerInput = {
        soilData: createMockSoilData(),
        soilHealthScore: createMockSoilHealthScore(),
        cropName: 'cotton',
        cropTimeline: createMockCropTimeline(),
        landArea: 1
      };

      const result = engine.generateRecommendations(input);

      expect(result.organic.costBenefitAnalysis).toBeDefined();
      expect(result.organic.costBenefitAnalysis.totalCost).toBeGreaterThan(0);
      expect(result.organic.costBenefitAnalysis.expectedYieldIncrease).toBeGreaterThan(0);
      
      expect(result.chemical.costBenefitAnalysis).toBeDefined();
      expect(result.chemical.costBenefitAnalysis.totalCost).toBeGreaterThan(0);
      
      expect(result.mixed.costBenefitAnalysis).toBeDefined();
      expect(result.mixed.costBenefitAnalysis.totalCost).toBeGreaterThan(0);
    });

    it('should scale quantities based on land area', () => {
      const input1: FertilizerInput = {
        soilData: createMockSoilData(),
        soilHealthScore: createMockSoilHealthScore(),
        cropName: 'rice',
        cropTimeline: createMockCropTimeline(),
        landArea: 1
      };

      const input2: FertilizerInput = {
        ...input1,
        landArea: 2
      };

      const result1 = engine.generateRecommendations(input1);
      const result2 = engine.generateRecommendations(input2);

      // Cost should scale with land area
      expect(result2.organic.costBenefitAnalysis.totalCost).toBeGreaterThan(
        result1.organic.costBenefitAnalysis.totalCost
      );
    });
  });

  describe('Organic Recommendations', () => {
    it('should include organic fertilizer products', () => {
      const input: FertilizerInput = {
        soilData: createMockSoilData(),
        soilHealthScore: createMockSoilHealthScore(),
        cropName: 'rice',
        cropTimeline: createMockCropTimeline(),
        landArea: 1
      };

      const result = engine.generateRecommendations(input);
      const organicProducts = result.organic.products;

      expect(organicProducts.some(p => p.type === 'organic')).toBe(true);
      expect(organicProducts.some(p => p.name.includes('FYM') || p.name.includes('Compost'))).toBe(true);
    });

    it('should have high sustainability score for organic', () => {
      const input: FertilizerInput = {
        soilData: createMockSoilData(),
        soilHealthScore: createMockSoilHealthScore(),
        cropName: 'wheat',
        cropTimeline: createMockCropTimeline(),
        landArea: 1
      };

      const result = engine.generateRecommendations(input);

      expect(result.organic.costBenefitAnalysis.sustainability).toBeGreaterThanOrEqual(80);
      expect(result.organic.costBenefitAnalysis.environmentalImpact).toBe('low');
      expect(result.organic.costBenefitAnalysis.soilHealthImprovement).toBe('high');
    });
  });

  describe('Chemical Recommendations', () => {
    it('should include chemical fertilizer products', () => {
      const input: FertilizerInput = {
        soilData: createMockSoilData(),
        soilHealthScore: createMockSoilHealthScore(),
        cropName: 'maize',
        cropTimeline: createMockCropTimeline(),
        landArea: 1
      };

      const result = engine.generateRecommendations(input);
      const chemicalProducts = result.chemical.products;

      expect(chemicalProducts.some(p => p.type === 'chemical')).toBe(true);
      expect(chemicalProducts.some(p => p.name.includes('Urea') || p.name.includes('DAP'))).toBe(true);
    });

    it('should include NPK fertilizers', () => {
      const input: FertilizerInput = {
        soilData: createMockSoilData(),
        soilHealthScore: createMockSoilHealthScore(),
        cropName: 'cotton',
        cropTimeline: createMockCropTimeline(),
        landArea: 1
      };

      const result = engine.generateRecommendations(input);

      expect(result.chemical.totalNPK.nitrogen).toBeGreaterThan(0);
      expect(result.chemical.totalNPK.phosphorus).toBeGreaterThan(0);
      expect(result.chemical.totalNPK.potassium).toBeGreaterThan(0);
    });
  });

  describe('Mixed Recommendations', () => {
    it('should include both organic and chemical products', () => {
      const input: FertilizerInput = {
        soilData: createMockSoilData(),
        soilHealthScore: createMockSoilHealthScore(),
        cropName: 'rice',
        cropTimeline: createMockCropTimeline(),
        landArea: 1
      };

      const result = engine.generateRecommendations(input);
      const mixedProducts = result.mixed.products;

      const hasOrganic = mixedProducts.some(p => p.type === 'organic');
      const hasChemical = mixedProducts.some(p => p.type === 'chemical');

      expect(hasOrganic).toBe(true);
      expect(hasChemical).toBe(true);
    });

    it('should have balanced sustainability score', () => {
      const input: FertilizerInput = {
        soilData: createMockSoilData(),
        soilHealthScore: createMockSoilHealthScore(),
        cropName: 'wheat',
        cropTimeline: createMockCropTimeline(),
        landArea: 1
      };

      const result = engine.generateRecommendations(input);

      expect(result.mixed.costBenefitAnalysis.sustainability).toBeGreaterThan(50);
      expect(result.mixed.costBenefitAnalysis.sustainability).toBeLessThan(90);
      expect(result.mixed.costBenefitAnalysis.environmentalImpact).toBe('medium');
    });
  });

  describe('Application Schedules', () => {
    it('should align with crop growth stages', () => {
      const input: FertilizerInput = {
        soilData: createMockSoilData(),
        soilHealthScore: createMockSoilHealthScore(),
        cropName: 'rice',
        cropTimeline: createMockCropTimeline(),
        landArea: 1
      };

      const result = engine.generateRecommendations(input);

      result.organic.applicationSchedule.forEach(schedule => {
        expect(schedule.stage).toBeTruthy();
        expect(schedule.growthStage).toBeTruthy();
        expect(schedule.timing).toBeInstanceOf(Date);
        expect(schedule.instructions.length).toBeGreaterThan(0);
      });
    });

    it('should include application instructions', () => {
      const input: FertilizerInput = {
        soilData: createMockSoilData(),
        soilHealthScore: createMockSoilHealthScore(),
        cropName: 'maize',
        cropTimeline: createMockCropTimeline(),
        landArea: 1
      };

      const result = engine.generateRecommendations(input);

      result.chemical.applicationSchedule.forEach(schedule => {
        expect(schedule.instructions).toBeDefined();
        expect(Array.isArray(schedule.instructions)).toBe(true);
        expect(schedule.instructions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = getFertilizerRecommendationEngine();
      const instance2 = getFertilizerRecommendationEngine();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown crop types', () => {
      const input: FertilizerInput = {
        soilData: createMockSoilData(),
        soilHealthScore: createMockSoilHealthScore(),
        cropName: 'unknown-crop',
        cropTimeline: createMockCropTimeline(),
        landArea: 1
      };

      const result = engine.generateRecommendations(input);

      expect(result).toBeDefined();
      expect(result.organic.products.length).toBeGreaterThan(0);
    });

    it('should handle poor soil health', () => {
      const poorSoilScore: SoilHealthScore = {
        ...createMockSoilHealthScore(),
        overallScore: 35,
        overallStatus: 'poor'
      };

      const input: FertilizerInput = {
        soilData: createMockSoilData(),
        soilHealthScore: poorSoilScore,
        cropName: 'rice',
        cropTimeline: createMockCropTimeline(),
        landArea: 1
      };

      const result = engine.generateRecommendations(input);

      // Should recommend mixed or organic for poor soil
      expect(['organic', 'mixed']).toContain(result.recommended);
    });

    it('should handle budget constraints', () => {
      const input: FertilizerInput = {
        soilData: createMockSoilData(),
        soilHealthScore: createMockSoilHealthScore(),
        cropName: 'rice',
        cropTimeline: createMockCropTimeline(),
        landArea: 1,
        budget: 5000
      };

      const result = engine.generateRecommendations(input);

      expect(result).toBeDefined();
      expect(result.recommended).toBeTruthy();
    });
  });
});
