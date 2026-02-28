/**
 * Unit tests for Water Usage Tracker
 */

import { WaterUsageTracker } from '../water-usage-tracker';

describe('WaterUsageTracker', () => {
  let tracker: WaterUsageTracker;

  beforeEach(() => {
    tracker = new WaterUsageTracker();
  });

  describe('recordWaterUsage', () => {
    it('should record water usage with generated ID and timestamp', () => {
      const record = tracker.recordWaterUsage({
        scheduleId: 'SCH-001',
        eventId: 'EVT-001',
        cropId: 'CROP-001',
        cropName: 'Rice',
        date: new Date('2024-01-15'),
        plannedAmount: 50,
        actualAmount: 48,
        irrigationType: 'drip',
        landArea: 2,
        duration: 120,
      });

      expect(record.id).toMatch(/^WU-SCH-001-EVT-001-\d+$/);
      expect(record.recordedAt).toBeInstanceOf(Date);
      expect(record.cropName).toBe('Rice');
      expect(record.actualAmount).toBe(48);
    });

    it('should record weather conditions when provided', () => {
      const record = tracker.recordWaterUsage({
        scheduleId: 'SCH-001',
        eventId: 'EVT-001',
        cropId: 'CROP-001',
        cropName: 'Wheat',
        date: new Date('2024-01-15'),
        plannedAmount: 40,
        actualAmount: 40,
        irrigationType: 'sprinkler',
        landArea: 1.5,
        duration: 90,
        weatherConditions: {
          rainfall: 5,
          temperature: 28,
          humidity: 65,
          evapotranspiration: 6,
        },
      });

      expect(record.weatherConditions).toBeDefined();
      expect(record.weatherConditions?.rainfall).toBe(5);
      expect(record.weatherConditions?.temperature).toBe(28);
    });
  });

  describe('calculateEfficiencyMetrics', () => {
    beforeEach(() => {
      // Add sample records
      tracker.recordWaterUsage({
        scheduleId: 'SCH-001',
        eventId: 'EVT-001',
        cropId: 'CROP-001',
        cropName: 'Rice',
        date: new Date('2024-01-10'),
        plannedAmount: 50,
        actualAmount: 48,
        irrigationType: 'drip',
        landArea: 2,
        duration: 120,
      });

      tracker.recordWaterUsage({
        scheduleId: 'SCH-001',
        eventId: 'EVT-002',
        cropId: 'CROP-001',
        cropName: 'Rice',
        date: new Date('2024-01-15'),
        plannedAmount: 50,
        actualAmount: 52,
        irrigationType: 'drip',
        landArea: 2,
        duration: 130,
      });

      tracker.recordWaterUsage({
        scheduleId: 'SCH-001',
        eventId: 'EVT-003',
        cropId: 'CROP-001',
        cropName: 'Rice',
        date: new Date('2024-01-20'),
        plannedAmount: 50,
        actualAmount: 0, // Skipped due to rain
        irrigationType: 'drip',
        landArea: 2,
        duration: 0,
      });
    });

    it('should calculate basic metrics correctly', () => {
      const metrics = tracker.calculateEfficiencyMetrics(
        'SCH-001',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(metrics.totalPlanned).toBe(150); // 50 + 50 + 50
      expect(metrics.totalActual).toBe(100); // 48 + 52 + 0
      expect(metrics.totalSaved).toBe(50); // One event skipped
      expect(metrics.variance).toBeCloseTo(-33.3, 1); // (100-150)/150 * 100
    });

    it('should calculate irrigation efficiency based on method', () => {
      const metrics = tracker.calculateEfficiencyMetrics(
        'SCH-001',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(metrics.irrigationEfficiency).toBe(90); // Drip irrigation: 90%
    });

    it('should calculate application efficiency', () => {
      const metrics = tracker.calculateEfficiencyMetrics(
        'SCH-001',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(metrics.applicationEfficiency).toBeCloseTo(66.7, 1); // 100/150 * 100
    });

    it('should calculate cost metrics', () => {
      const metrics = tracker.calculateEfficiencyMetrics(
        'SCH-001',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      // 100mm * 2 hectares * 10 m³/mm/ha * ₹2/m³ = ₹4000
      expect(metrics.totalCost).toBe(4000);
      expect(metrics.costPerHectare).toBe(2000);
      
      // 50mm saved * 2 hectares * 10 m³/mm/ha * ₹2/m³ = ₹2000
      expect(metrics.costSavings).toBe(2000);
    });

    it('should return empty metrics when no records exist', () => {
      const metrics = tracker.calculateEfficiencyMetrics(
        'SCH-999',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(metrics.totalPlanned).toBe(0);
      expect(metrics.totalActual).toBe(0);
      expect(metrics.totalSaved).toBe(0);
      expect(metrics.irrigationEfficiency).toBe(0);
    });
  });

  describe('calculateCropWaterProductivity', () => {
    it('should calculate productivity correctly', () => {
      const productivity = tracker.calculateCropWaterProductivity(
        'Rice',
        200, // 200mm water used
        2, // 2 hectares
        8000 // 8000 kg yield
      );

      // 200mm * 2ha * 10 m³/mm/ha = 4000 m³
      // 8000 kg / 4000 m³ = 2 kg/m³
      expect(productivity.totalWaterUsed).toBe(4000);
      expect(productivity.totalYield).toBe(8000);
      expect(productivity.productivity).toBe(2);
    });

    it('should compare against benchmark and rate performance', () => {
      // Excellent performance (above benchmark)
      const excellent = tracker.calculateCropWaterProductivity(
        'Rice',
        100,
        1,
        800 // 800kg / 1000m³ = 0.8 kg/m³ (benchmark is 0.6)
      );
      expect(excellent.performanceRating).toBe('excellent');

      // Poor performance (below benchmark)
      const poor = tracker.calculateCropWaterProductivity(
        'Rice',
        200,
        1,
        800 // 800kg / 2000m³ = 0.4 kg/m³ (benchmark is 0.6)
      );
      expect(poor.performanceRating).toBe('poor');
    });

    it('should calculate improvement potential', () => {
      const productivity = tracker.calculateCropWaterProductivity(
        'Wheat',
        150,
        1,
        1200 // 1200kg / 1500m³ = 0.8 kg/m³ (benchmark is 1.0)
      );

      // (1.0 - 0.8) / 0.8 * 100 = 25%
      expect(productivity.improvementPotential).toBeCloseTo(25, 1);
    });
  });

  describe('generateInsights', () => {
    it('should generate warning for low irrigation efficiency', () => {
      const metrics = {
        totalPlanned: 100,
        totalActual: 100,
        totalSaved: 0,
        variance: 0,
        waterUseEfficiency: 1.0,
        irrigationEfficiency: 60, // Low efficiency
        applicationEfficiency: 100,
        complianceRate: 90,
        overIrrigationRate: 5,
        underIrrigationRate: 5,
        totalCost: 2000,
        costPerHectare: 1000,
        costSavings: 0,
        waterSavedFromWeather: 0,
        carbonFootprint: 50,
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
          days: 30,
        },
      };

      const insights = tracker.generateInsights(metrics, 'flood');

      const efficiencyWarning = insights.find(
        (i) => i.category === 'efficiency' && i.type === 'warning'
      );
      expect(efficiencyWarning).toBeDefined();
      expect(efficiencyWarning?.title).toContain('Low Irrigation Efficiency');
    });

    it('should generate success insight for high efficiency', () => {
      const metrics = {
        totalPlanned: 100,
        totalActual: 100,
        totalSaved: 0,
        variance: 0,
        waterUseEfficiency: 1.0,
        irrigationEfficiency: 90, // High efficiency
        applicationEfficiency: 100,
        complianceRate: 95,
        overIrrigationRate: 2,
        underIrrigationRate: 3,
        totalCost: 2000,
        costPerHectare: 1000,
        costSavings: 0,
        waterSavedFromWeather: 0,
        carbonFootprint: 30,
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
          days: 30,
        },
      };

      const insights = tracker.generateInsights(metrics, 'drip');

      const efficiencySuccess = insights.find(
        (i) => i.category === 'efficiency' && i.type === 'success'
      );
      expect(efficiencySuccess).toBeDefined();
      expect(efficiencySuccess?.title).toContain('Excellent');
    });

    it('should generate warning for over-irrigation', () => {
      const metrics = {
        totalPlanned: 100,
        totalActual: 130,
        totalSaved: 0,
        variance: 30,
        waterUseEfficiency: 1.0,
        irrigationEfficiency: 75,
        applicationEfficiency: 130,
        complianceRate: 80,
        overIrrigationRate: 25, // High over-irrigation
        underIrrigationRate: 5,
        totalCost: 2600,
        costPerHectare: 1300,
        costSavings: 0,
        waterSavedFromWeather: 0,
        carbonFootprint: 65,
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
          days: 30,
        },
      };

      const insights = tracker.generateInsights(metrics, 'sprinkler');

      const overIrrigationWarning = insights.find(
        (i) => i.title.includes('Over-Irrigation')
      );
      expect(overIrrigationWarning).toBeDefined();
      expect(overIrrigationWarning?.type).toBe('warning');
    });

    it('should generate success insight for cost savings', () => {
      const metrics = {
        totalPlanned: 150,
        totalActual: 100,
        totalSaved: 50,
        variance: -33.3,
        waterUseEfficiency: 1.0,
        irrigationEfficiency: 90,
        applicationEfficiency: 66.7,
        complianceRate: 90,
        overIrrigationRate: 5,
        underIrrigationRate: 5,
        totalCost: 2000,
        costPerHectare: 1000,
        costSavings: 1500, // Significant savings
        waterSavedFromWeather: 50,
        carbonFootprint: 40,
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
          days: 30,
        },
      };

      const insights = tracker.generateInsights(metrics, 'drip');

      const costSavingsInsight = insights.find(
        (i) => i.category === 'cost' && i.type === 'success'
      );
      expect(costSavingsInsight).toBeDefined();
      expect(costSavingsInsight?.description).toContain('1500');
    });
  });

  describe('compareIrrigationMethods', () => {
    it('should compare flood irrigation with alternatives', () => {
      const comparison = tracker.compareIrrigationMethods(
        'flood',
        200, // 200mm water used
        2, // 2 hectares
        30 // 30 days
      );

      expect(comparison.currentMethod).toBe('flood');
      expect(comparison.currentEfficiency).toBe(60);
      expect(comparison.alternativeMethods).toHaveLength(2); // drip and sprinkler

      // Drip should show highest efficiency
      const dripMethod = comparison.alternativeMethods.find((m) => m.method === 'drip');
      expect(dripMethod).toBeDefined();
      expect(dripMethod?.efficiency).toBe(90);
      expect(dripMethod?.waterSavings).toBeGreaterThan(0);
    });

    it('should calculate payback period for method upgrades', () => {
      const comparison = tracker.compareIrrigationMethods(
        'flood',
        300,
        5,
        90
      );

      const dripMethod = comparison.alternativeMethods.find((m) => m.method === 'drip');
      expect(dripMethod?.paybackPeriod).toBeGreaterThan(0);
      expect(dripMethod?.implementationCost).toBeGreaterThan(0);
    });

    it('should provide recommendations based on efficiency gains', () => {
      const comparison = tracker.compareIrrigationMethods(
        'flood',
        200,
        2,
        30
      );

      const dripMethod = comparison.alternativeMethods.find((m) => m.method === 'drip');
      expect(dripMethod?.recommendation).toBeTruthy();
      expect(dripMethod?.recommendation).toContain('efficiency gain');
    });
  });

  describe('analyzeSeasonalUsage', () => {
    beforeEach(() => {
      // Add records for different seasons
      // Kharif (Monsoon) - June to September
      tracker.recordWaterUsage({
        scheduleId: 'SCH-001',
        eventId: 'EVT-001',
        cropId: 'CROP-001',
        cropName: 'Rice',
        date: new Date('2024-07-15'),
        plannedAmount: 60,
        actualAmount: 55,
        irrigationType: 'flood',
        landArea: 2,
        duration: 180,
      });

      tracker.recordWaterUsage({
        scheduleId: 'SCH-001',
        eventId: 'EVT-002',
        cropId: 'CROP-001',
        cropName: 'Rice',
        date: new Date('2024-08-15'),
        plannedAmount: 60,
        actualAmount: 50,
        irrigationType: 'flood',
        landArea: 2,
        duration: 170,
      });

      // Rabi (Winter) - October to February
      tracker.recordWaterUsage({
        scheduleId: 'SCH-001',
        eventId: 'EVT-003',
        cropId: 'CROP-001',
        cropName: 'Wheat',
        date: new Date('2024-11-15'),
        plannedAmount: 40,
        actualAmount: 40,
        irrigationType: 'sprinkler',
        landArea: 2,
        duration: 120,
      });
    });

    it('should analyze water usage by season', () => {
      const analysis = tracker.analyzeSeasonalUsage('SCH-001', 2024);

      expect(analysis.length).toBeGreaterThan(0);

      const kharifSeason = analysis.find((s) => s.season.includes('Kharif'));
      expect(kharifSeason).toBeDefined();
      expect(kharifSeason?.totalWaterUsed).toBe(105); // 55 + 50
      expect(kharifSeason?.eventsCount).toBe(2);
    });

    it('should calculate average water per event', () => {
      const analysis = tracker.analyzeSeasonalUsage('SCH-001', 2024);

      const kharifSeason = analysis.find((s) => s.season.includes('Kharif'));
      expect(kharifSeason?.averagePerEvent).toBeCloseTo(52.5, 1); // 105 / 2
    });

    it('should calculate cost per season', () => {
      const analysis = tracker.analyzeSeasonalUsage('SCH-001', 2024);

      const kharifSeason = analysis.find((s) => s.season.includes('Kharif'));
      // 105mm * 2ha * 10 m³/mm/ha * ₹2/m³ = ₹4200
      expect(kharifSeason?.costPerSeason).toBe(4200);
    });
  });

  describe('getUsageRecords', () => {
    beforeEach(() => {
      tracker.recordWaterUsage({
        scheduleId: 'SCH-001',
        eventId: 'EVT-001',
        cropId: 'CROP-001',
        cropName: 'Rice',
        date: new Date('2024-01-15'),
        plannedAmount: 50,
        actualAmount: 48,
        irrigationType: 'drip',
        landArea: 2,
        duration: 120,
      });

      tracker.recordWaterUsage({
        scheduleId: 'SCH-002',
        eventId: 'EVT-002',
        cropId: 'CROP-002',
        cropName: 'Wheat',
        date: new Date('2024-01-20'),
        plannedAmount: 40,
        actualAmount: 40,
        irrigationType: 'sprinkler',
        landArea: 1.5,
        duration: 90,
      });
    });

    it('should retrieve records for a specific schedule', () => {
      const records = tracker.getUsageRecords('SCH-001');

      expect(records).toHaveLength(1);
      expect(records[0].scheduleId).toBe('SCH-001');
      expect(records[0].cropName).toBe('Rice');
    });

    it('should retrieve records by date range', () => {
      const records = tracker.getUsageRecordsByDateRange(
        'SCH-001',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(records).toHaveLength(1);
      expect(records[0].date).toBeInstanceOf(Date);
    });

    it('should return empty array for non-existent schedule', () => {
      const records = tracker.getUsageRecords('SCH-999');
      expect(records).toHaveLength(0);
    });
  });

  describe('clearRecords', () => {
    it('should clear all usage records', () => {
      tracker.recordWaterUsage({
        scheduleId: 'SCH-001',
        eventId: 'EVT-001',
        cropId: 'CROP-001',
        cropName: 'Rice',
        date: new Date('2024-01-15'),
        plannedAmount: 50,
        actualAmount: 48,
        irrigationType: 'drip',
        landArea: 2,
        duration: 120,
      });

      expect(tracker.getUsageRecords('SCH-001')).toHaveLength(1);

      tracker.clearRecords();

      expect(tracker.getUsageRecords('SCH-001')).toHaveLength(0);
    });
  });
});
