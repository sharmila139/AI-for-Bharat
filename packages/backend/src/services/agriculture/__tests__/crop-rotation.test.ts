/**
 * Unit Tests for Crop Rotation Plan Generator
 * Tests rotation plan generation, validation, and nutrient balance calculations
 */

import { Pool } from 'pg';
import { KnowledgeBaseService } from '../knowledge-base-service';
import { RotationSequenceItem } from '../knowledge-base-types';

// Mock pg Pool
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('Crop Rotation Plan Generator', () => {
  let service: KnowledgeBaseService;
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    mockPool = new Pool() as jest.Mocked<Pool>;
    service = new KnowledgeBaseService(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateRotationPlan', () => {
    it('should generate a valid 2-year rotation plan (4 seasons)', async () => {
      const input = {
        district: 'Pune',
        state: 'Maharashtra',
        soil_type: 'loam',
        land_area: 5,
        farmer_goals: ['profit', 'sustainability'] as ('yield' | 'sustainability' | 'profit')[],
        num_seasons: 4,
        language: 'en' as const,
      };

      const plan = await service.generateRotationPlan(input);

      expect(plan).toBeDefined();
      expect(plan.rotation_sequence).toHaveLength(4);
      expect(plan.suitable_soil_types).toContain('loam');
      expect(plan.suitable_regions).toContain('Maharashtra');
      expect(plan.soil_health_improvement).toBeDefined();
      expect(plan.financial_benefits).toBeDefined();
      expect(plan.plan_name.en).toContain('2-Year');
      expect(plan.plan_name.hi).toBeDefined();
    });

    it('should generate a valid 4-year rotation plan (8 seasons)', async () => {
      const input = {
        district: 'Ludhiana',
        state: 'Punjab',
        soil_type: 'clay-loam',
        land_area: 10,
        farmer_goals: ['yield'] as ('yield' | 'sustainability' | 'profit')[],
        num_seasons: 8,
        language: 'en' as const,
      };

      const plan = await service.generateRotationPlan(input);

      expect(plan).toBeDefined();
      expect(plan.rotation_sequence).toHaveLength(8);
      expect(plan.rotation_sequence[0].year).toBe(1);
      expect(plan.rotation_sequence[7].year).toBe(4);
    });

    it('should alternate between kharif and rabi seasons', async () => {
      const input = {
        district: 'Pune',
        state: 'Maharashtra',
        soil_type: 'loam',
        land_area: 5,
        farmer_goals: ['sustainability'] as ('yield' | 'sustainability' | 'profit')[],
        num_seasons: 6,
        language: 'en' as const,
      };

      const plan = await service.generateRotationPlan(input);

      expect(plan.rotation_sequence[0].season).toBe('kharif');
      expect(plan.rotation_sequence[1].season).toBe('rabi');
      expect(plan.rotation_sequence[2].season).toBe('kharif');
      expect(plan.rotation_sequence[3].season).toBe('rabi');
    });

    it('should include nitrogen-fixing crops in rotation', async () => {
      const input = {
        district: 'Pune',
        state: 'Maharashtra',
        soil_type: 'loam',
        land_area: 5,
        farmer_goals: ['sustainability'] as ('yield' | 'sustainability' | 'profit')[],
        num_seasons: 8,
        language: 'en' as const,
      };

      const plan = await service.generateRotationPlan(input);

      const nitrogenFixers = plan.rotation_sequence.filter(
        (item: RotationSequenceItem) => item.crop === 'pulses' || item.crop === 'soybean'
      );

      expect(nitrogenFixers.length).toBeGreaterThan(0);
    });

    it('should throw error for invalid num_seasons (too few)', async () => {
      const input = {
        district: 'Pune',
        state: 'Maharashtra',
        soil_type: 'loam',
        land_area: 5,
        farmer_goals: ['profit'] as ('yield' | 'sustainability' | 'profit')[],
        num_seasons: 2,
        language: 'en' as const,
      };

      await expect(service.generateRotationPlan(input)).rejects.toThrow(
        'Number of seasons must be between 4 and 16'
      );
    });

    it('should throw error for invalid num_seasons (too many)', async () => {
      const input = {
        district: 'Pune',
        state: 'Maharashtra',
        soil_type: 'loam',
        land_area: 5,
        farmer_goals: ['profit'] as ('yield' | 'sustainability' | 'profit')[],
        num_seasons: 20,
        language: 'en' as const,
      };

      await expect(service.generateRotationPlan(input)).rejects.toThrow(
        'Number of seasons must be between 4 and 16'
      );
    });

    it('should include expected yield for each crop', async () => {
      const input = {
        district: 'Pune',
        state: 'Maharashtra',
        soil_type: 'loam',
        land_area: 5,
        farmer_goals: ['yield'] as ('yield' | 'sustainability' | 'profit')[],
        num_seasons: 4,
        language: 'en' as const,
      };

      const plan = await service.generateRotationPlan(input);

      plan.rotation_sequence.forEach((item: RotationSequenceItem) => {
        expect(item.expected_yield).toBeDefined();
        expect(item.expected_yield).toMatch(/\d+ kg\/acre/);
      });
    });

    it('should include benefits in both English and Hindi', async () => {
      const input = {
        district: 'Pune',
        state: 'Maharashtra',
        soil_type: 'loam',
        land_area: 5,
        farmer_goals: ['sustainability'] as ('yield' | 'sustainability' | 'profit')[],
        num_seasons: 4,
        language: 'en' as const,
      };

      const plan = await service.generateRotationPlan(input);

      plan.rotation_sequence.forEach((item: RotationSequenceItem) => {
        expect(item.benefits.en).toBeDefined();
        expect(item.benefits.hi).toBeDefined();
        expect(item.benefits.en.length).toBeGreaterThan(0);
        expect(item.benefits.hi.length).toBeGreaterThan(0);
      });
    });

    it('should consider current crop when generating plan', async () => {
      const input = {
        district: 'Pune',
        state: 'Maharashtra',
        soil_type: 'loam',
        land_area: 5,
        current_crop: 'rice',
        farmer_goals: ['sustainability'] as ('yield' | 'sustainability' | 'profit')[],
        num_seasons: 4,
        language: 'en' as const,
      };

      const plan = await service.generateRotationPlan(input);

      // First crop should ideally be from a different family than rice (Grasses)
      expect(plan.rotation_sequence).toBeDefined();
      expect(plan.rotation_sequence.length).toBe(4);
    });
  });

  describe('validateRotationSequence', () => {
    it('should validate a good rotation sequence', () => {
      const sequence: RotationSequenceItem[] = [
        { year: 1, season: 'kharif', crop: 'soybean', benefits: { en: 'test', hi: 'test' } },
        { year: 1, season: 'rabi', crop: 'mustard', benefits: { en: 'test', hi: 'test' } },
        { year: 2, season: 'kharif', crop: 'maize', benefits: { en: 'test', hi: 'test' } },
        { year: 2, season: 'rabi', crop: 'pulses', benefits: { en: 'test', hi: 'test' } },
      ];

      const validation = service.validateRotationSequence(sequence);

      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect same crop family in consecutive seasons', () => {
      const sequence: RotationSequenceItem[] = [
        { year: 1, season: 'kharif', crop: 'rice', benefits: { en: 'test', hi: 'test' } },
        { year: 1, season: 'rabi', crop: 'wheat', benefits: { en: 'test', hi: 'test' } },
        { year: 2, season: 'kharif', crop: 'maize', benefits: { en: 'test', hi: 'test' } },
      ];

      const validation = service.validateRotationSequence(sequence);

      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues[0]).toContain('Same crop family');
      expect(validation.issues[0]).toContain('Grasses');
    });

    it('should recommend adding nitrogen-fixing crops if too few', () => {
      const sequence: RotationSequenceItem[] = [
        { year: 1, season: 'kharif', crop: 'rice', benefits: { en: 'test', hi: 'test' } },
        { year: 1, season: 'rabi', crop: 'wheat', benefits: { en: 'test', hi: 'test' } },
        { year: 2, season: 'kharif', crop: 'cotton', benefits: { en: 'test', hi: 'test' } },
        { year: 2, season: 'rabi', crop: 'mustard', benefits: { en: 'test', hi: 'test' } },
        { year: 3, season: 'kharif', crop: 'maize', benefits: { en: 'test', hi: 'test' } },
      ];

      const validation = service.validateRotationSequence(sequence);

      expect(validation.recommendations.length).toBeGreaterThan(0);
      expect(validation.recommendations.some(r => r.includes('nitrogen-fixing'))).toBe(true);
    });

    it('should recommend balancing heavy feeders', () => {
      const sequence: RotationSequenceItem[] = [
        { year: 1, season: 'kharif', crop: 'rice', benefits: { en: 'test', hi: 'test' } },
        { year: 1, season: 'rabi', crop: 'wheat', benefits: { en: 'test', hi: 'test' } },
        { year: 2, season: 'kharif', crop: 'maize', benefits: { en: 'test', hi: 'test' } },
        { year: 2, season: 'rabi', crop: 'wheat', benefits: { en: 'test', hi: 'test' } },
        { year: 3, season: 'kharif', crop: 'cotton', benefits: { en: 'test', hi: 'test' } },
      ];

      const validation = service.validateRotationSequence(sequence);

      expect(validation.recommendations.length).toBeGreaterThan(0);
      expect(validation.recommendations.some(r => r.includes('heavy feeders'))).toBe(true);
    });

    it('should recommend varying root depths', () => {
      const sequence: RotationSequenceItem[] = [
        { year: 1, season: 'kharif', crop: 'rice', benefits: { en: 'test', hi: 'test' } },
        { year: 1, season: 'rabi', crop: 'vegetables', benefits: { en: 'test', hi: 'test' } },
        { year: 2, season: 'kharif', crop: 'rice', benefits: { en: 'test', hi: 'test' } },
      ];

      const validation = service.validateRotationSequence(sequence);

      expect(validation.recommendations.length).toBeGreaterThan(0);
      expect(validation.recommendations.some(r => r.includes('root depths'))).toBe(true);
    });
  });

  describe('getRotationRecommendationsByCropFamily', () => {
    it('should return recommendations for Legumes', () => {
      const recommendations = service.getRotationRecommendationsByCropFamily('Legumes');

      expect(recommendations.follow_with).toContain('Brassicas');
      expect(recommendations.follow_with).toContain('Solanaceae');
      expect(recommendations.avoid_after).toContain('Legumes');
      expect(recommendations.rationale.en).toContain('nitrogen');
      expect(recommendations.rationale.hi).toBeDefined();
    });

    it('should return recommendations for Brassicas', () => {
      const recommendations = service.getRotationRecommendationsByCropFamily('Brassicas');

      expect(recommendations.follow_with).toContain('Legumes');
      expect(recommendations.avoid_after).toContain('Brassicas');
      expect(recommendations.rationale.en).toContain('heavy feeders');
    });

    it('should return recommendations for Grasses', () => {
      const recommendations = service.getRotationRecommendationsByCropFamily('Grasses');

      expect(recommendations.follow_with).toContain('Legumes');
      expect(recommendations.avoid_after).toContain('Grasses');
      expect(recommendations.rationale.en).toBeDefined();
      expect(recommendations.rationale.hi).toBeDefined();
    });

    it('should return empty recommendations for unknown family', () => {
      const recommendations = service.getRotationRecommendationsByCropFamily('UnknownFamily');

      expect(recommendations.follow_with).toHaveLength(0);
      expect(recommendations.avoid_after).toHaveLength(0);
      expect(recommendations.rationale.en).toContain('No specific recommendations');
    });
  });

  describe('calculateSoilNutrientBalance', () => {
    it('should calculate positive nitrogen balance with legumes', () => {
      const sequence: RotationSequenceItem[] = [
        { year: 1, season: 'kharif', crop: 'soybean', benefits: { en: 'test', hi: 'test' } },
        { year: 1, season: 'rabi', crop: 'pulses', benefits: { en: 'test', hi: 'test' } },
        { year: 2, season: 'kharif', crop: 'rice', benefits: { en: 'test', hi: 'test' } },
        { year: 2, season: 'rabi', crop: 'wheat', benefits: { en: 'test', hi: 'test' } },
      ];

      const balance = service.calculateSoilNutrientBalance(sequence);

      expect(balance.nitrogen_balance).toBeGreaterThan(0);
      expect(balance.overall_health_score).toBeGreaterThanOrEqual(45);
    });

    it('should calculate negative nitrogen balance without legumes', () => {
      const sequence: RotationSequenceItem[] = [
        { year: 1, season: 'kharif', crop: 'rice', benefits: { en: 'test', hi: 'test' } },
        { year: 1, season: 'rabi', crop: 'wheat', benefits: { en: 'test', hi: 'test' } },
        { year: 2, season: 'kharif', crop: 'maize', benefits: { en: 'test', hi: 'test' } },
        { year: 2, season: 'rabi', crop: 'wheat', benefits: { en: 'test', hi: 'test' } },
      ];

      const balance = service.calculateSoilNutrientBalance(sequence);

      expect(balance.nitrogen_balance).toBeLessThan(0);
    });

    it('should calculate organic matter change', () => {
      const sequence: RotationSequenceItem[] = [
        { year: 1, season: 'kharif', crop: 'maize', benefits: { en: 'test', hi: 'test' } },
        { year: 1, season: 'rabi', crop: 'pulses', benefits: { en: 'test', hi: 'test' } },
        { year: 2, season: 'kharif', crop: 'cotton', benefits: { en: 'test', hi: 'test' } },
      ];

      const balance = service.calculateSoilNutrientBalance(sequence);

      expect(balance.organic_matter_change).toBeGreaterThan(0);
    });

    it('should calculate overall health score between 0 and 100', () => {
      const sequence: RotationSequenceItem[] = [
        { year: 1, season: 'kharif', crop: 'rice', benefits: { en: 'test', hi: 'test' } },
        { year: 1, season: 'rabi', crop: 'pulses', benefits: { en: 'test', hi: 'test' } },
        { year: 2, season: 'kharif', crop: 'maize', benefits: { en: 'test', hi: 'test' } },
        { year: 2, season: 'rabi', crop: 'wheat', benefits: { en: 'test', hi: 'test' } },
      ];

      const balance = service.calculateSoilNutrientBalance(sequence);

      expect(balance.overall_health_score).toBeGreaterThanOrEqual(0);
      expect(balance.overall_health_score).toBeLessThanOrEqual(100);
    });

    it('should handle empty sequence gracefully', () => {
      const sequence: RotationSequenceItem[] = [];

      const balance = service.calculateSoilNutrientBalance(sequence);

      expect(balance.nitrogen_balance).toBe(0);
      expect(balance.phosphorus_balance).toBe(0);
      expect(balance.potassium_balance).toBe(0);
      expect(balance.organic_matter_change).toBe(0);
    });
  });

  describe('Financial Benefits Calculation', () => {
    it('should calculate financial benefits for rotation plan', async () => {
      const input = {
        district: 'Pune',
        state: 'Maharashtra',
        soil_type: 'loam',
        land_area: 5,
        farmer_goals: ['profit'] as ('yield' | 'sustainability' | 'profit')[],
        num_seasons: 4,
        language: 'en' as const,
      };

      const plan = await service.generateRotationPlan(input);

      expect(plan.financial_benefits).toBeDefined();
      expect(plan.financial_benefits?.total_investment).toBeGreaterThan(0);
      expect(plan.financial_benefits?.expected_revenue).toBeGreaterThan(0);
      expect(plan.financial_benefits?.profit_margin).toMatch(/\d+\.\d+%/);
      expect(plan.financial_benefits?.year_wise_breakdown).toHaveLength(2);
    });

    it('should have year-wise breakdown with correct structure', async () => {
      const input = {
        district: 'Pune',
        state: 'Maharashtra',
        soil_type: 'loam',
        land_area: 5,
        farmer_goals: ['profit'] as ('yield' | 'sustainability' | 'profit')[],
        num_seasons: 6,
        language: 'en' as const,
      };

      const plan = await service.generateRotationPlan(input);

      expect(plan.financial_benefits?.year_wise_breakdown).toHaveLength(3);
      
      plan.financial_benefits?.year_wise_breakdown.forEach((yearData: any, index: number) => {
        expect(yearData.year).toBe(index + 1);
        expect(yearData.investment).toBeGreaterThan(0);
        expect(yearData.revenue).toBeGreaterThan(0);
        expect(yearData.profit).toBe(yearData.revenue - yearData.investment);
      });
    });
  });

  describe('Soil Health Improvement Calculation', () => {
    it('should calculate soil health improvement', async () => {
      const input = {
        district: 'Pune',
        state: 'Maharashtra',
        soil_type: 'loam',
        land_area: 5,
        farmer_goals: ['sustainability'] as ('yield' | 'sustainability' | 'profit')[],
        num_seasons: 4,
        language: 'en' as const,
      };

      const plan = await service.generateRotationPlan(input);

      expect(plan.soil_health_improvement).toBeDefined();
      expect(plan.soil_health_improvement?.nitrogen_gain).toMatch(/[+-]?\d+%/);
      expect(plan.soil_health_improvement?.phosphorus_gain).toMatch(/[+-]?\d+%/);
      expect(plan.soil_health_improvement?.potassium_gain).toMatch(/[+-]?\d+%/);
      expect(plan.soil_health_improvement?.organic_matter).toMatch(/[+-]?\d+%/);
      expect(plan.soil_health_improvement?.description.en).toBeDefined();
      expect(plan.soil_health_improvement?.description.hi).toBeDefined();
    });

    it('should include overall health score in description', async () => {
      const input = {
        district: 'Pune',
        state: 'Maharashtra',
        soil_type: 'loam',
        land_area: 5,
        farmer_goals: ['sustainability'] as ('yield' | 'sustainability' | 'profit')[],
        num_seasons: 4,
        language: 'en' as const,
      };

      const plan = await service.generateRotationPlan(input);

      expect(plan.soil_health_improvement?.description.en).toMatch(/\d+\/100/);
    });
  });

  describe('Multi-language Support', () => {
    it('should generate plan with Hindi language', async () => {
      const input = {
        district: 'Pune',
        state: 'Maharashtra',
        soil_type: 'loam',
        land_area: 5,
        farmer_goals: ['sustainability'] as ('yield' | 'sustainability' | 'profit')[],
        num_seasons: 4,
        language: 'hi' as const,
      };

      const plan = await service.generateRotationPlan(input);

      expect(plan.plan_name.hi).toBeDefined();
      expect(plan.description?.hi).toBeDefined();
      plan.rotation_sequence.forEach((item: RotationSequenceItem) => {
        expect(item.benefits.hi).toBeDefined();
      });
    });
  });
});
