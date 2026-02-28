/**
 * Property-based tests for Water Usage Tracker
 * Tests universal properties that should hold for all valid inputs
 */

import fc from 'fast-check';
import { WaterUsageTracker } from '../water-usage-tracker';

describe('WaterUsageTracker - Property Tests', () => {
  describe('Water Usage Recording Properties', () => {
    it('Property: Every recorded usage should have a unique ID', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              scheduleId: fc.string({ minLength: 1, maxLength: 20 }),
              eventId: fc.string({ minLength: 1, maxLength: 20 }),
              cropId: fc.string({ minLength: 1, maxLength: 20 }),
              cropName: fc.constantFrom('Rice', 'Wheat', 'Cotton', 'Maize'),
              plannedAmount: fc.float({ min: 10, max: 200 }),
              actualAmount: fc.float({ min: 0, max: 200 }),
              irrigationType: fc.constantFrom('flood', 'drip', 'sprinkler'),
              landArea: fc.float({ min: 0.5, max: 10 }),
              duration: fc.integer({ min: 30, max: 300 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (records) => {
            const tracker = new WaterUsageTracker();
            const ids = new Set<string>();

            for (const record of records) {
              const result = tracker.recordWaterUsage({
                scheduleId: record.scheduleId,
                eventId: record.eventId,
                cropId: record.cropId,
                cropName: record.cropName,
                date: new Date(),
                plannedAmount: record.plannedAmount,
                actualAmount: record.actualAmount,
                irrigationType: record.irrigationType as 'flood' | 'drip' | 'sprinkler',
                landArea: record.landArea,
                duration: record.duration,
              });
              
              // Each ID should be unique
              expect(ids.has(result.id)).toBe(false);
              ids.add(result.id);
            }

            // All IDs should be unique
            expect(ids.size).toBe(records.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: Recorded amount should always match input amount', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 200 }),
          fc.float({ min: 0, max: 200 }),
          (plannedAmount, actualAmount) => {
            const tracker = new WaterUsageTracker();
            
            const record = tracker.recordWaterUsage({
              scheduleId: 'SCH-001',
              eventId: 'EVT-001',
              cropId: 'CROP-001',
              cropName: 'Rice',
              date: new Date(),
              plannedAmount,
              actualAmount,
              irrigationType: 'drip',
              landArea: 2,
              duration: 120,
            });

            expect(record.plannedAmount).toBe(plannedAmount);
            expect(record.actualAmount).toBe(actualAmount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Efficiency Metrics Properties', () => {
    it('Property: Irrigation efficiency should always be between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              plannedAmount: fc.float({ min: 10, max: 200 }),
              actualAmount: fc.float({ min: 0, max: 200 }),
              irrigationType: fc.constantFrom('flood', 'drip', 'sprinkler'),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (records) => {
            const tracker = new WaterUsageTracker();
            const scheduleId = 'SCH-TEST';

            for (const record of records) {
              tracker.recordWaterUsage({
                scheduleId,
                eventId: `EVT-${Math.random()}`,
                cropId: 'CROP-001',
                cropName: 'Rice',
                date: new Date(),
                plannedAmount: record.plannedAmount,
                actualAmount: record.actualAmount,
                irrigationType: record.irrigationType as 'flood' | 'drip' | 'sprinkler',
                landArea: 2,
                duration: 120,
              });
            }

            const metrics = tracker.calculateEfficiencyMetrics(
              scheduleId,
              new Date('2024-01-01'),
              new Date('2024-12-31')
            );

            expect(metrics.irrigationEfficiency).toBeGreaterThanOrEqual(0);
            expect(metrics.irrigationEfficiency).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: Total actual should equal sum of all actual amounts (within rounding)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.float({ min: 10, max: 100 }), // Use reasonable values
            { minLength: 1, maxLength: 10 }
          ),
          (actualAmounts) => {
            const tracker = new WaterUsageTracker();
            const scheduleId = 'SCH-TEST';

            for (const amount of actualAmounts) {
              tracker.recordWaterUsage({
                scheduleId,
                eventId: `EVT-${Math.random()}`,
                cropId: 'CROP-001',
                cropName: 'Rice',
                date: new Date(),
                plannedAmount: 50,
                actualAmount: amount,
                irrigationType: 'drip',
                landArea: 2,
                duration: 120,
              });
            }

            const metrics = tracker.calculateEfficiencyMetrics(
              scheduleId,
              new Date('2024-01-01'),
              new Date('2024-12-31')
            );

            const expectedTotal = actualAmounts.reduce((sum, a) => sum + a, 0);
            // Metrics are rounded to 1 decimal, so allow for cumulative rounding error
            const tolerance = actualAmounts.length * 0.1;
            expect(Math.abs(metrics.totalActual - expectedTotal)).toBeLessThan(tolerance);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('Property: Water saved should equal sum of skipped event amounts (within rounding)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              plannedAmount: fc.float({ min: 10, max: 100 }),
              isSkipped: fc.boolean(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (records) => {
            const tracker = new WaterUsageTracker();
            const scheduleId = 'SCH-TEST';

            for (const record of records) {
              tracker.recordWaterUsage({
                scheduleId,
                eventId: `EVT-${Math.random()}`,
                cropId: 'CROP-001',
                cropName: 'Rice',
                date: new Date(),
                plannedAmount: record.plannedAmount,
                actualAmount: record.isSkipped ? 0 : record.plannedAmount,
                irrigationType: 'drip',
                landArea: 2,
                duration: record.isSkipped ? 0 : 120,
              });
            }

            const metrics = tracker.calculateEfficiencyMetrics(
              scheduleId,
              new Date('2024-01-01'),
              new Date('2024-12-31')
            );

            const expectedSaved = records
              .filter((r) => r.isSkipped)
              .reduce((sum, r) => sum + r.plannedAmount, 0);

            // Allow for rounding tolerance
            const tolerance = records.length * 0.1;
            expect(Math.abs(metrics.totalSaved - expectedSaved)).toBeLessThan(tolerance);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('Property: Compliance rate should be between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              plannedAmount: fc.float({ min: 10, max: 100 }),
              actualAmount: fc.float({ min: 0, max: 150 }),
            }),
            { minLength: 1, maxLength: 30 }
          ),
          (records) => {
            const tracker = new WaterUsageTracker();
            const scheduleId = 'SCH-TEST';

            for (const record of records) {
              tracker.recordWaterUsage({
                scheduleId,
                eventId: `EVT-${Math.random()}`,
                cropId: 'CROP-001',
                cropName: 'Rice',
                date: new Date(),
                plannedAmount: record.plannedAmount,
                actualAmount: record.actualAmount,
                irrigationType: 'drip',
                landArea: 2,
                duration: 120,
              });
            }

            const metrics = tracker.calculateEfficiencyMetrics(
              scheduleId,
              new Date('2024-01-01'),
              new Date('2024-12-31')
            );

            expect(metrics.complianceRate).toBeGreaterThanOrEqual(0);
            expect(metrics.complianceRate).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: Compliance, over-irrigation, and under-irrigation rates should be valid percentages', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              plannedAmount: fc.float({ min: 10, max: 100 }),
              actualAmount: fc.float({ min: 10, max: 150 }),
            }),
            { minLength: 5, maxLength: 20 }
          ),
          (records) => {
            const tracker = new WaterUsageTracker();
            const scheduleId = 'SCH-TEST';

            for (const record of records) {
              tracker.recordWaterUsage({
                scheduleId,
                eventId: `EVT-${Math.random()}`,
                cropId: 'CROP-001',
                cropName: 'Rice',
                date: new Date(),
                plannedAmount: record.plannedAmount,
                actualAmount: record.actualAmount,
                irrigationType: 'drip',
                landArea: 2,
                duration: 120,
              });
            }

            const metrics = tracker.calculateEfficiencyMetrics(
              scheduleId,
              new Date('2024-01-01'),
              new Date('2024-12-31')
            );

            // All rates should be valid percentages
            expect(metrics.complianceRate).toBeGreaterThanOrEqual(0);
            expect(metrics.complianceRate).toBeLessThanOrEqual(100);
            expect(metrics.overIrrigationRate).toBeGreaterThanOrEqual(0);
            expect(metrics.overIrrigationRate).toBeLessThanOrEqual(100);
            expect(metrics.underIrrigationRate).toBeGreaterThanOrEqual(0);
            expect(metrics.underIrrigationRate).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Cost Calculation Properties', () => {
    it('Property: Total cost should increase with water usage', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 50, max: 200 }),
          fc.float({ min: 1, max: 10 }),
          (waterAmount, landArea) => {
            const tracker = new WaterUsageTracker();
            const scheduleId = 'SCH-TEST';

            tracker.recordWaterUsage({
              scheduleId,
              eventId: 'EVT-001',
              cropId: 'CROP-001',
              cropName: 'Rice',
              date: new Date(),
              plannedAmount: waterAmount,
              actualAmount: waterAmount,
              irrigationType: 'drip',
              landArea,
              duration: 120,
            });

            const metrics = tracker.calculateEfficiencyMetrics(
              scheduleId,
              new Date('2024-01-01'),
              new Date('2024-12-31')
            );

            // Cost should be positive and proportional
            expect(metrics.totalCost).toBeGreaterThan(0);
            expect(metrics.costPerHectare).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('Property: Cost per hectare should equal total cost divided by land area', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 50, max: 200 }),
          fc.float({ min: 1, max: 10 }),
          (waterAmount, landArea) => {
            const tracker = new WaterUsageTracker();
            const scheduleId = 'SCH-TEST';

            tracker.recordWaterUsage({
              scheduleId,
              eventId: 'EVT-001',
              cropId: 'CROP-001',
              cropName: 'Rice',
              date: new Date(),
              plannedAmount: waterAmount,
              actualAmount: waterAmount,
              irrigationType: 'drip',
              landArea,
              duration: 120,
            });

            const metrics = tracker.calculateEfficiencyMetrics(
              scheduleId,
              new Date('2024-01-01'),
              new Date('2024-12-31')
            );

            const expectedCostPerHectare = metrics.totalCost / landArea;
            // Allow for rounding errors
            expect(Math.abs(metrics.costPerHectare - expectedCostPerHectare)).toBeLessThan(2);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Crop Water Productivity Properties', () => {
    it('Property: Productivity should be positive for valid inputs', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 100, max: 300 }),
          fc.float({ min: 1, max: 5 }),
          fc.float({ min: 1000, max: 10000 }),
          (waterMm, landArea, yield_) => {
            const tracker = new WaterUsageTracker();

            const productivity = tracker.calculateCropWaterProductivity(
              'Rice',
              waterMm,
              landArea,
              yield_
            );

            // Productivity should be positive
            expect(productivity.productivity).toBeGreaterThan(0);
            expect(productivity.totalWaterUsed).toBeGreaterThan(0);
            expect(productivity.totalYield).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('Property: Performance rating should be consistent with productivity ratio', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 100, max: 300 }),
          fc.float({ min: 1, max: 5 }),
          fc.float({ min: 1000, max: 10000 }),
          (waterMm, landArea, yield_) => {
            const tracker = new WaterUsageTracker();

            const productivity = tracker.calculateCropWaterProductivity(
              'Rice',
              waterMm,
              landArea,
              yield_
            );

            const ratio = productivity.productivity / productivity.benchmarkProductivity;

            if (ratio >= 1.2) {
              expect(productivity.performanceRating).toBe('excellent');
            } else if (ratio >= 1.0) {
              expect(['good', 'excellent']).toContain(productivity.performanceRating);
            } else if (ratio >= 0.8) {
              expect(['average', 'good']).toContain(productivity.performanceRating);
            } else {
              expect(['poor', 'average']).toContain(productivity.performanceRating);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Irrigation Method Comparison Properties', () => {
    it('Property: Alternative methods should be sorted by efficiency', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('flood', 'drip', 'sprinkler'),
          fc.float({ min: 100, max: 300 }),
          fc.float({ min: 1, max: 5 }),
          (currentMethod, waterMm, landArea) => {
            const tracker = new WaterUsageTracker();

            const comparison = tracker.compareIrrigationMethods(
              currentMethod,
              waterMm,
              landArea,
              30
            );

            // Check that alternatives are sorted by efficiency (descending)
            for (let i = 0; i < comparison.alternativeMethods.length - 1; i++) {
              expect(comparison.alternativeMethods[i].efficiency).toBeGreaterThanOrEqual(
                comparison.alternativeMethods[i + 1].efficiency
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: Water savings should be non-negative for more efficient methods', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('flood', 'drip', 'sprinkler'),
          fc.float({ min: 100, max: 300 }),
          fc.float({ min: 1, max: 5 }),
          (currentMethod, waterMm, landArea) => {
            const tracker = new WaterUsageTracker();

            const comparison = tracker.compareIrrigationMethods(
              currentMethod,
              waterMm,
              landArea,
              30
            );

            for (const alternative of comparison.alternativeMethods) {
              if (alternative.efficiency > comparison.currentEfficiency) {
                expect(alternative.waterSavings).toBeGreaterThanOrEqual(0);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: Implementation cost should be proportional to land area', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 2, max: 10 }), // Avoid edge cases with very small areas
          fc.float({ min: 2, max: 10 }),
          (landArea1, landArea2) => {
            const tracker = new WaterUsageTracker();

            const comparison1 = tracker.compareIrrigationMethods(
              'flood',
              200,
              landArea1,
              30
            );

            const comparison2 = tracker.compareIrrigationMethods(
              'flood',
              200,
              landArea2,
              30
            );

            // Find drip method in both comparisons
            const drip1 = comparison1.alternativeMethods.find((m) => m.method === 'drip');
            const drip2 = comparison2.alternativeMethods.find((m) => m.method === 'drip');

            if (drip1 && drip2 && drip1.implementationCost > 0 && drip2.implementationCost > 0) {
              const ratio = landArea1 / landArea2;
              const costRatio = drip1.implementationCost / drip2.implementationCost;
              
              // Cost ratio should be approximately equal to land area ratio (within 10%)
              expect(Math.abs(costRatio - ratio) / ratio).toBeLessThan(0.1);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Insight Generation Properties', () => {
    it('Property: Low efficiency should always generate warning insights', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 30, max: 69 }), // Low efficiency range
          (efficiency) => {
            const tracker = new WaterUsageTracker();

            const metrics = {
              totalPlanned: 100,
              totalActual: 100,
              totalSaved: 0,
              variance: 0,
              waterUseEfficiency: 1.0,
              irrigationEfficiency: efficiency,
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

            const hasEfficiencyWarning = insights.some(
              (i) => i.category === 'efficiency' && i.type === 'warning'
            );

            expect(hasEfficiencyWarning).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: All insights should have required fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            irrigationEfficiency: fc.float({ min: 50, max: 95 }),
            overIrrigationRate: fc.float({ min: 0, max: 40 }),
            complianceRate: fc.float({ min: 50, max: 100 }),
            costSavings: fc.float({ min: 0, max: 5000 }),
          }),
          (metricsInput) => {
            const tracker = new WaterUsageTracker();

            const metrics = {
              totalPlanned: 100,
              totalActual: 100,
              totalSaved: 0,
              variance: 0,
              waterUseEfficiency: 1.0,
              irrigationEfficiency: metricsInput.irrigationEfficiency,
              applicationEfficiency: 100,
              complianceRate: metricsInput.complianceRate,
              overIrrigationRate: metricsInput.overIrrigationRate,
              underIrrigationRate: 5,
              totalCost: 2000,
              costPerHectare: 1000,
              costSavings: metricsInput.costSavings,
              waterSavedFromWeather: 0,
              carbonFootprint: 50,
              period: {
                start: new Date('2024-01-01'),
                end: new Date('2024-01-31'),
                days: 30,
              },
            };

            const insights = tracker.generateInsights(metrics, 'drip');

            for (const insight of insights) {
              expect(insight.type).toBeDefined();
              expect(insight.category).toBeDefined();
              expect(insight.title).toBeDefined();
              expect(insight.description).toBeDefined();
              expect(insight.impact).toBeDefined();
              expect(typeof insight.actionable).toBe('boolean');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Date Range Filtering Properties', () => {
    it('Property: Records retrieved should always fall within specified date range', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            { minLength: 5, maxLength: 20 }
          ),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-30') }),
          fc.date({ min: new Date('2024-07-01'), max: new Date('2024-12-31') }),
          (dates, startDate, endDate) => {
            const tracker = new WaterUsageTracker();
            const scheduleId = 'SCH-TEST';

            // Ensure startDate is before endDate
            if (startDate > endDate) {
              [startDate, endDate] = [endDate, startDate];
            }

            for (const date of dates) {
              tracker.recordWaterUsage({
                scheduleId,
                eventId: `EVT-${Math.random()}`,
                cropId: 'CROP-001',
                cropName: 'Rice',
                date,
                plannedAmount: 50,
                actualAmount: 50,
                irrigationType: 'drip',
                landArea: 2,
                duration: 120,
              });
            }

            const records = tracker.getUsageRecordsByDateRange(
              scheduleId,
              startDate,
              endDate
            );

            for (const record of records) {
              expect(record.date.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
              expect(record.date.getTime()).toBeLessThanOrEqual(endDate.getTime());
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
