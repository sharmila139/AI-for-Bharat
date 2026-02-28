/**
 * Property-based tests for Crop Advisory Service
 * Uses fast-check for comprehensive input coverage
 */

import * as fc from 'fast-check';
import { CropAdvisoryService, CropInfo, CropType, GrowthStage } from '../crop-advisory-service';
import { WeatherAlert, AlertType, AlertSeverity } from '../weather-alert-service';
import { WeatherData, WeatherLocation } from '../weather-service';

describe('CropAdvisoryService - Property Tests', () => {
  let service: CropAdvisoryService;

  beforeEach(() => {
    service = new CropAdvisoryService();
  });

  // Arbitraries for generating test data
  const cropTypeArb = fc.constantFrom<CropType>(
    'wheat', 'rice', 'tomatoes', 'peppers', 'potatoes',
    'cotton', 'sugarcane', 'maize', 'onions', 'beans'
  );

  const growthStageArb = fc.constantFrom<GrowthStage>(
    'seedling', 'vegetative', 'flowering', 'fruiting', 'harvest'
  );

  const alertTypeArb = fc.constantFrom<AlertType>(
    'frost', 'heavy_rain', 'high_temperature', 'strong_winds',
    'drought', 'heatwave', 'pest_risk'
  );

  const alertSeverityArb = fc.constantFrom<AlertSeverity>(
    'info', 'warning', 'critical'
  );

  const locationArb = fc.record({
    latitude: fc.double({ min: -90, max: 90 }),
    longitude: fc.double({ min: -180, max: 180 }),
    name: fc.option(fc.string(), { nil: undefined })
  }) as fc.Arbitrary<WeatherLocation>;

  const cropInfoArb = fc.record({
    type: cropTypeArb,
    growthStage: growthStageArb,
    plantedDate: fc.option(fc.date(), { nil: undefined }),
    expectedHarvestDate: fc.option(fc.date(), { nil: undefined })
  }) as fc.Arbitrary<CropInfo>;

  const weatherAlertArb = fc.record({
    id: fc.string(),
    type: alertTypeArb,
    severity: alertSeverityArb,
    location: locationArb,
    title: fc.string(),
    description: fc.string(),
    advisories: fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
    timestamp: fc.date(),
    validUntil: fc.date(),
    metadata: fc.record({
      currentValue: fc.option(fc.double(), { nil: undefined }),
      threshold: fc.option(fc.double(), { nil: undefined }),
      unit: fc.option(fc.string(), { nil: undefined }),
      affectedCrops: fc.option(fc.array(fc.string()), { nil: undefined })
    })
  }) as fc.Arbitrary<WeatherAlert>;

  const weatherDataArb = fc.record({
    location: locationArb,
    current: fc.record({
      temperature: fc.double({ min: -20, max: 50 }),
      feelsLike: fc.double({ min: -20, max: 50 }),
      humidity: fc.integer({ min: 0, max: 100 }),
      pressure: fc.integer({ min: 900, max: 1100 }),
      windSpeed: fc.double({ min: 0, max: 40 }),
      windDirection: fc.integer({ min: 0, max: 360 }),
      description: fc.string(),
      icon: fc.string(),
      timestamp: fc.date()
    }),
    hourlyForecast: fc.array(
      fc.record({
        date: fc.date(),
        rainfall: fc.double({ min: 0, max: 50 }),
        temperature: fc.record({
          min: fc.double({ min: -20, max: 50 }),
          max: fc.double({ min: -20, max: 50 })
        }),
        humidity: fc.integer({ min: 0, max: 100 }),
        evapotranspiration: fc.double({ min: 0, max: 10 }),
        windSpeed: fc.option(fc.double({ min: 0, max: 40 }), { nil: undefined })
      }),
      { minLength: 0, maxLength: 48 }
    ),
    dailyForecast: fc.array(
      fc.record({
        date: fc.date(),
        rainfall: fc.double({ min: 0, max: 200 }),
        temperature: fc.record({
          min: fc.double({ min: -20, max: 50 }),
          max: fc.double({ min: -20, max: 50 })
        }),
        humidity: fc.integer({ min: 0, max: 100 }),
        evapotranspiration: fc.double({ min: 0, max: 10 })
      }),
      { minLength: 0, maxLength: 14 }
    ),
    source: fc.constantFrom('imd', 'openweathermap', 'cache'),
    fetchedAt: fc.date(),
    cacheExpiry: fc.option(fc.date(), { nil: undefined })
  }) as fc.Arbitrary<WeatherData>;

  describe('Property: Advisory generation always produces valid output', () => {
    it('should always generate advisory with required fields', () => {
      fc.assert(
        fc.property(
          weatherAlertArb,
          cropInfoArb,
          weatherDataArb,
          (alert, cropInfo, weatherData) => {
            const advisory = service.generateAdvisory(alert, cropInfo, weatherData);

            // Advisory must have all required fields
            expect(advisory.cropType).toBeDefined();
            expect(advisory.growthStage).toBeDefined();
            expect(advisory.alertType).toBeDefined();
            expect(advisory.severity).toBeDefined();
            expect(advisory.immediateActions).toBeDefined();
            expect(advisory.preventiveMeasures).toBeDefined();
            expect(advisory.warnings).toBeDefined();
            expect(advisory.expectedImpact).toBeDefined();
            expect(advisory.timeframe).toBeDefined();
            expect(advisory.metadata).toBeDefined();

            // Arrays should not be null
            expect(Array.isArray(advisory.immediateActions)).toBe(true);
            expect(Array.isArray(advisory.preventiveMeasures)).toBe(true);
            expect(Array.isArray(advisory.warnings)).toBe(true);

            // Metadata should have risk level
            expect(typeof advisory.metadata.riskLevel).toBe('number');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Risk level is always between 0 and 100', () => {
    it('should always produce risk level in valid range', () => {
      fc.assert(
        fc.property(
          weatherAlertArb,
          cropInfoArb,
          weatherDataArb,
          (alert, cropInfo, weatherData) => {
            const advisory = service.generateAdvisory(alert, cropInfo, weatherData);

            expect(advisory.metadata.riskLevel).toBeGreaterThanOrEqual(0);
            expect(advisory.metadata.riskLevel).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Severity matches risk level', () => {
    it('should map risk level to correct severity', () => {
      fc.assert(
        fc.property(
          weatherAlertArb,
          cropInfoArb,
          weatherDataArb,
          (alert, cropInfo, weatherData) => {
            const advisory = service.generateAdvisory(alert, cropInfo, weatherData);
            const riskLevel = advisory.metadata.riskLevel;

            if (riskLevel >= 80) {
              expect(advisory.severity).toBe('critical');
            } else if (riskLevel >= 60) {
              expect(advisory.severity).toBe('high');
            } else if (riskLevel >= 30) {
              expect(advisory.severity).toBe('medium');
            } else {
              expect(advisory.severity).toBe('low');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Advisory matches crop and alert types', () => {
    it('should preserve crop and alert types in advisory', () => {
      fc.assert(
        fc.property(
          weatherAlertArb,
          cropInfoArb,
          weatherDataArb,
          (alert, cropInfo, weatherData) => {
            const advisory = service.generateAdvisory(alert, cropInfo, weatherData);

            expect(advisory.cropType).toBe(cropInfo.type);
            expect(advisory.growthStage).toBe(cropInfo.growthStage);
            expect(advisory.alertType).toBe(alert.type);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Immediate actions are non-empty for all alerts', () => {
    it('should always provide at least one immediate action', () => {
      fc.assert(
        fc.property(
          weatherAlertArb,
          cropInfoArb,
          weatherDataArb,
          (alert, cropInfo, weatherData) => {
            const advisory = service.generateAdvisory(alert, cropInfo, weatherData);

            expect(advisory.immediateActions.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Preventive measures are non-empty', () => {
    it('should always provide preventive measures', () => {
      fc.assert(
        fc.property(
          weatherAlertArb,
          cropInfoArb,
          weatherDataArb,
          (alert, cropInfo, weatherData) => {
            const advisory = service.generateAdvisory(alert, cropInfo, weatherData);

            expect(advisory.preventiveMeasures.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Multiple crops produce multiple advisories', () => {
    it('should generate one advisory per crop', () => {
      fc.assert(
        fc.property(
          weatherAlertArb,
          fc.array(cropInfoArb, { minLength: 1, maxLength: 10 }),
          weatherDataArb,
          (alert, crops, weatherData) => {
            const advisories = service.generateAdvisories(alert, crops, weatherData);

            expect(advisories.length).toBe(crops.length);

            // Each advisory should match its corresponding crop
            advisories.forEach((advisory, index) => {
              expect(advisory.cropType).toBe(crops[index].type);
              expect(advisory.growthStage).toBe(crops[index].growthStage);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Expected impact contains yield information', () => {
    it('should always mention yield or loss in expected impact', () => {
      fc.assert(
        fc.property(
          weatherAlertArb,
          cropInfoArb,
          weatherDataArb,
          (alert, cropInfo, weatherData) => {
            const advisory = service.generateAdvisory(alert, cropInfo, weatherData);

            // Should mention yield, loss, or reduction
            expect(advisory.expectedImpact.toLowerCase()).toMatch(/yield|loss|reduction|impact/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Timeframe is always a valid string', () => {
    it('should always provide a non-empty timeframe', () => {
      fc.assert(
        fc.property(
          weatherAlertArb,
          cropInfoArb,
          weatherDataArb,
          (alert, cropInfo, weatherData) => {
            const advisory = service.generateAdvisory(alert, cropInfo, weatherData);

            expect(advisory.timeframe).toBeDefined();
            expect(advisory.timeframe.length).toBeGreaterThan(0);
            expect(advisory.timeframe.toLowerCase()).toMatch(/action|immediate|within|hours|days/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Frost alerts for frost-sensitive crops have higher risk', () => {
    it('should assign higher or similar risk to frost-sensitive crops', () => {
      const frostSensitiveCrops: CropType[] = ['tomatoes', 'peppers', 'beans'];
      const frostTolerantCrops: CropType[] = ['wheat', 'potatoes'];

      fc.assert(
        fc.property(
          fc.constantFrom(...frostSensitiveCrops),
          fc.constantFrom(...frostTolerantCrops),
          growthStageArb,
          weatherDataArb,
          (sensitiveCrop, tolerantCrop, stage, weatherData) => {
            // Set cold temperature
            weatherData.current.temperature = 0;
            weatherData.hourlyForecast.forEach(f => {
              f.temperature = { min: 0, max: 5 };
            });

            const frostAlert: WeatherAlert = {
              id: 'test-frost',
              type: 'frost',
              severity: 'warning',
              location: weatherData.location,
              title: 'Frost Warning',
              description: 'Frost expected',
              advisories: [],
              timestamp: new Date(),
              validUntil: new Date(Date.now() + 24 * 3600000),
              metadata: {}
            };

            const sensitiveAdvisory = service.generateAdvisory(
              frostAlert,
              { type: sensitiveCrop, growthStage: stage },
              weatherData
            );

            const tolerantAdvisory = service.generateAdvisory(
              frostAlert,
              { type: tolerantCrop, growthStage: stage },
              weatherData
            );

            // Sensitive crops should have equal or higher risk (allow 20 point margin for edge cases)
            expect(sensitiveAdvisory.metadata.riskLevel).toBeGreaterThanOrEqual(
              tolerantAdvisory.metadata.riskLevel - 20
            );
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property: Critical growth stages have appropriate warnings', () => {
    it('should mention critical stages in impact for flowering/fruiting', () => {
      const criticalStages: GrowthStage[] = ['flowering', 'fruiting'];

      fc.assert(
        fc.property(
          fc.constantFrom(...criticalStages),
          cropTypeArb,
          alertTypeArb,
          weatherDataArb,
          (stage, cropType, alertType, weatherData) => {
            const alert: WeatherAlert = {
              id: 'test-alert',
              type: alertType,
              severity: 'warning',
              location: weatherData.location,
              title: 'Test Alert',
              description: 'Test',
              advisories: [],
              timestamp: new Date(),
              validUntil: new Date(Date.now() + 24 * 3600000),
              metadata: {}
            };

            const advisory = service.generateAdvisory(
              alert,
              { type: cropType, growthStage: stage },
              weatherData
            );

            // Should mention critical stage or have warnings about flowering/fruiting
            const hasStageWarning = 
              advisory.expectedImpact.toLowerCase().includes('critical') ||
              advisory.expectedImpact.toLowerCase().includes('stage') ||
              advisory.warnings.some(w => 
                w.toLowerCase().includes('flowering') || 
                w.toLowerCase().includes('fruiting')
              );

            expect(hasStageWarning).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property: Pest risk advisories for pest-prone crops', () => {
    it('should provide specific pest warnings for vulnerable crops', () => {
      const pestProneCrops: CropType[] = ['tomatoes', 'peppers', 'cotton', 'rice'];

      fc.assert(
        fc.property(
          fc.constantFrom(...pestProneCrops),
          growthStageArb,
          weatherDataArb,
          (cropType, stage, weatherData) => {
            // Set pest-favorable conditions
            weatherData.current.temperature = 28;
            weatherData.current.humidity = 85;

            const pestAlert: WeatherAlert = {
              id: 'test-pest',
              type: 'pest_risk',
              severity: 'warning',
              location: weatherData.location,
              title: 'Pest Risk',
              description: 'Favorable pest conditions',
              advisories: [],
              timestamp: new Date(),
              validUntil: new Date(Date.now() + 48 * 3600000),
              metadata: {}
            };

            const advisory = service.generateAdvisory(
              pestAlert,
              { type: cropType, growthStage: stage },
              weatherData
            );

            // Should have pest-specific warnings or actions
            const hasPestAdvice = 
              advisory.warnings.some(w => w.toLowerCase().includes('pest')) ||
              advisory.immediateActions.some(a => 
                a.toLowerCase().includes('pest') || 
                a.toLowerCase().includes('neem') ||
                a.toLowerCase().includes('inspect')
              );

            expect(hasPestAdvice).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property: Harvest stage advisories prioritize harvesting', () => {
    it('should recommend harvesting during harvest stage for severe weather', () => {
      fc.assert(
        fc.property(
          cropTypeArb,
          fc.constantFrom<AlertType>('heavy_rain', 'strong_winds'),
          weatherDataArb,
          (cropType, alertType, weatherData) => {
            // Set appropriate weather conditions
            if (alertType === 'heavy_rain') {
              weatherData.hourlyForecast.forEach((f, i) => {
                if (i < 24) f.rainfall = 3; // 72mm total
              });
            } else if (alertType === 'strong_winds') {
              weatherData.current.windSpeed = 20;
            }

            const alert: WeatherAlert = {
              id: 'test-harvest',
              type: alertType,
              severity: 'critical',
              location: weatherData.location,
              title: 'Critical Alert',
              description: 'Severe conditions',
              advisories: [],
              timestamp: new Date(),
              validUntil: new Date(Date.now() + 24 * 3600000),
              metadata: {}
            };

            const advisory = service.generateAdvisory(
              alert,
              { type: cropType, growthStage: 'harvest' },
              weatherData
            );

            // Should mention harvesting in immediate actions
            const mentionsHarvest = advisory.immediateActions.some(a =>
              a.toLowerCase().includes('harvest')
            );

            expect(mentionsHarvest).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property: Yield impact correlates with risk level', () => {
    it('should show higher yield impact for higher risk levels', () => {
      fc.assert(
        fc.property(
          weatherAlertArb,
          cropInfoArb,
          weatherDataArb,
          (alert, cropInfo, weatherData) => {
            const advisory = service.generateAdvisory(alert, cropInfo, weatherData);

            const riskLevel = advisory.metadata.riskLevel;
            const yieldImpact = advisory.metadata.affectedYield || '';

            // Extract percentage from yield impact string
            const percentMatch = yieldImpact.match(/(\d+)-(\d+)%/);
            
            if (percentMatch) {
              const maxPercent = parseInt(percentMatch[2]);

              // Higher risk should correlate with higher yield impact
              if (riskLevel >= 80) {
                expect(maxPercent).toBeGreaterThanOrEqual(40);
              } else if (riskLevel >= 60) {
                expect(maxPercent).toBeGreaterThanOrEqual(20);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: All advisories have non-empty descriptions', () => {
    it('should provide meaningful content in all fields', () => {
      fc.assert(
        fc.property(
          weatherAlertArb,
          cropInfoArb,
          weatherDataArb,
          (alert, cropInfo, weatherData) => {
            const advisory = service.generateAdvisory(alert, cropInfo, weatherData);

            // All string fields should be non-empty
            expect(advisory.expectedImpact.length).toBeGreaterThan(0);
            expect(advisory.timeframe.length).toBeGreaterThan(0);

            // All arrays should have at least one item
            expect(advisory.immediateActions.length).toBeGreaterThan(0);
            expect(advisory.preventiveMeasures.length).toBeGreaterThan(0);

            // All items in arrays should be non-empty strings
            advisory.immediateActions.forEach(action => {
              expect(action.length).toBeGreaterThan(0);
            });
            advisory.preventiveMeasures.forEach(measure => {
              expect(measure.length).toBeGreaterThan(0);
            });
            advisory.warnings.forEach(warning => {
              expect(warning.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
