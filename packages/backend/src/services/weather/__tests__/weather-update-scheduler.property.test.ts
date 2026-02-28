/**
 * Property-based tests for Weather Update Scheduler
 * Uses fast-check for comprehensive testing across input space
 */

import * as fc from 'fast-check';
import { WeatherUpdateScheduler } from '../weather-update-scheduler';
import { WeatherService, WeatherLocation, WeatherData } from '../weather-service';

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn((_expression: string, _callback: () => void) => ({
    stop: jest.fn(),
  })),
  validate: jest.fn((expression: string) => {
    return /^[\d\*\/\-,\s]+$/.test(expression);
  }),
}));

describe('WeatherUpdateScheduler - Property Tests', () => {
  // Arbitraries for generating test data
  const locationArb = fc.record({
    latitude: fc.double({ min: -90, max: 90 }),
    longitude: fc.double({ min: -180, max: 180 }),
    name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  });

  const locationsArb = fc.array(locationArb, { minLength: 0, maxLength: 10 });

  const cronExpressionArb = fc.constantFrom(
    '0 * * * *',      // Every hour
    '*/30 * * * *',   // Every 30 minutes
    '0 0 * * *',      // Daily at midnight
    '*/15 * * * *',   // Every 15 minutes
    '0 */2 * * *',    // Every 2 hours
  );

  function createMockWeatherService(): jest.Mocked<WeatherService> {
    return {
      getWeather: jest.fn(),
      getCurrentWeather: jest.fn(),
      getSevenDayForecast: jest.fn(),
      getFourteenDayForecast: jest.fn(),
      getHourlyForecast: jest.fn(),
      clearCache: jest.fn(),
      clearExpiredCache: jest.fn(),
      getCacheStats: jest.fn(),
      getRateLimitStatus: jest.fn(),
    } as any;
  }

  function createMockWeatherData(location: WeatherLocation): WeatherData {
    return {
      location,
      current: {
        temperature: 25,
        feelsLike: 26,
        humidity: 60,
        pressure: 1013,
        windSpeed: 5,
        windDirection: 180,
        description: 'Clear sky',
        icon: '01d',
        timestamp: new Date(),
      },
      hourlyForecast: [],
      dailyForecast: [],
      source: 'openweathermap',
      fetchedAt: new Date(),
    };
  }

  describe('Property: Location Management Consistency', () => {
    test('adding and removing same location should result in empty list', () => {
      fc.assert(
        fc.property(locationArb, (location) => {
          const mockService = createMockWeatherService();
          const scheduler = new WeatherUpdateScheduler(mockService);

          scheduler.addLocation(location);
          scheduler.removeLocation(location);

          expect(scheduler.getLocations()).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    test('adding N locations should result in at most N locations', () => {
      fc.assert(
        fc.property(locationsArb, (locations) => {
          const mockService = createMockWeatherService();
          const scheduler = new WeatherUpdateScheduler(mockService);

          locations.forEach(loc => scheduler.addLocation(loc));

          const stored = scheduler.getLocations();
          expect(stored.length).toBeLessThanOrEqual(locations.length);
        }),
        { numRuns: 100 }
      );
    });

    test('clearing locations should always result in empty list', () => {
      fc.assert(
        fc.property(locationsArb, (locations) => {
          const mockService = createMockWeatherService();
          const scheduler = new WeatherUpdateScheduler(mockService, { locations });

          scheduler.clearLocations();

          expect(scheduler.getLocations()).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    test('getLocations should return array with valid coordinates', () => {
      fc.assert(
        fc.property(locationsArb, (locations) => {
          const mockService = createMockWeatherService();
          const scheduler = new WeatherUpdateScheduler(mockService, { locations });

          const retrieved = scheduler.getLocations();

          retrieved.forEach(loc => {
            expect(loc.latitude).toBeGreaterThanOrEqual(-90);
            expect(loc.latitude).toBeLessThanOrEqual(90);
            expect(loc.longitude).toBeGreaterThanOrEqual(-180);
            expect(loc.longitude).toBeLessThanOrEqual(180);
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Metrics Consistency', () => {
    test('total updates should equal successful + failed updates', async () => {
      await fc.assert(
        fc.asyncProperty(
          locationsArb,
          fc.array(fc.boolean(), { minLength: 0, maxLength: 10 }),
          async (locations, successFlags) => {
            const mockService = createMockWeatherService();
            
            // Set up mock to succeed or fail based on flags
            let callIndex = 0;
            mockService.getWeather.mockImplementation(async (loc) => {
              const shouldSucceed = successFlags[callIndex % successFlags.length] ?? true;
              callIndex++;
              
              if (shouldSucceed) {
                return createMockWeatherData(loc);
              } else {
                throw new Error('Mock failure');
              }
            });

            const scheduler = new WeatherUpdateScheduler(mockService, { locations });

            if (locations.length > 0) {
              await scheduler.triggerUpdate();

              const metrics = scheduler.getMetrics();
              expect(metrics.totalUpdates).toBe(
                metrics.successfulUpdates + metrics.failedUpdates
              );
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('metrics should never be negative', async () => {
      await fc.assert(
        fc.asyncProperty(locationsArb, async (locations) => {
          const mockService = createMockWeatherService();
          mockService.getWeather.mockResolvedValue(createMockWeatherData(locations[0] || { latitude: 0, longitude: 0 }));

          const scheduler = new WeatherUpdateScheduler(mockService, { locations });

          await scheduler.triggerUpdate();

          const metrics = scheduler.getMetrics();
          expect(metrics.totalUpdates).toBeGreaterThanOrEqual(0);
          expect(metrics.successfulUpdates).toBeGreaterThanOrEqual(0);
          expect(metrics.failedUpdates).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    test('reset metrics should always return to zero state', async () => {
      await fc.assert(
        fc.asyncProperty(locationsArb, async (locations) => {
          const mockService = createMockWeatherService();
          mockService.getWeather.mockResolvedValue(createMockWeatherData(locations[0] || { latitude: 0, longitude: 0 }));

          const scheduler = new WeatherUpdateScheduler(mockService, { locations });

          if (locations.length > 0) {
            await scheduler.triggerUpdate();
          }

          scheduler.resetMetrics();

          const metrics = scheduler.getMetrics();
          expect(metrics.totalUpdates).toBe(0);
          expect(metrics.successfulUpdates).toBe(0);
          expect(metrics.failedUpdates).toBe(0);
          expect(metrics.lastUpdateTime).toBeNull();
          expect(metrics.lastError).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    test('successful updates should never exceed total updates', async () => {
      await fc.assert(
        fc.asyncProperty(locationsArb, async (locations) => {
          const mockService = createMockWeatherService();
          mockService.getWeather.mockResolvedValue(createMockWeatherData(locations[0] || { latitude: 0, longitude: 0 }));

          const scheduler = new WeatherUpdateScheduler(mockService, { locations });

          await scheduler.triggerUpdate();

          const metrics = scheduler.getMetrics();
          expect(metrics.successfulUpdates).toBeLessThanOrEqual(metrics.totalUpdates);
        }),
        { numRuns: 100 }
      );
    });

    test('failed updates should never exceed total updates', async () => {
      await fc.assert(
        fc.asyncProperty(locationsArb, async (locations) => {
          const mockService = createMockWeatherService();
          mockService.getWeather.mockRejectedValue(new Error('Mock failure'));

          const scheduler = new WeatherUpdateScheduler(mockService, { locations });

          await scheduler.triggerUpdate();

          const metrics = scheduler.getMetrics();
          expect(metrics.failedUpdates).toBeLessThanOrEqual(metrics.totalUpdates);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Update Behavior', () => {
    test('update should call getWeather for each location exactly once', async () => {
      await fc.assert(
        fc.asyncProperty(locationsArb, async (locations) => {
          const mockService = createMockWeatherService();
          mockService.getWeather.mockResolvedValue(createMockWeatherData(locations[0] || { latitude: 0, longitude: 0 }));

          const scheduler = new WeatherUpdateScheduler(mockService, { locations });

          await scheduler.triggerUpdate();

          const uniqueLocations = scheduler.getLocations();
          expect(mockService.getWeather).toHaveBeenCalledTimes(uniqueLocations.length);
        }),
        { numRuns: 100 }
      );
    });

    test('update with no locations should not call getWeather', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(undefined), async () => {
          const mockService = createMockWeatherService();
          const scheduler = new WeatherUpdateScheduler(mockService);

          await scheduler.triggerUpdate();

          expect(mockService.getWeather).not.toHaveBeenCalled();
        }),
        { numRuns: 50 }
      );
    });

    test('multiple updates should accumulate metrics correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          locationsArb,
          fc.integer({ min: 1, max: 5 }),
          async (locations, updateCount) => {
            const mockService = createMockWeatherService();
            mockService.getWeather.mockResolvedValue(createMockWeatherData(locations[0] || { latitude: 0, longitude: 0 }));

            const scheduler = new WeatherUpdateScheduler(mockService, { locations });

            for (let i = 0; i < updateCount; i++) {
              await scheduler.triggerUpdate();
            }

            const metrics = scheduler.getMetrics();
            const expectedTotal = scheduler.getLocations().length * updateCount;
            expect(metrics.totalUpdates).toBe(expectedTotal);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property: Scheduler State', () => {
    test('start followed by stop should result in not running', () => {
      fc.assert(
        fc.property(fc.constant(undefined), () => {
          const mockService = createMockWeatherService();
          const scheduler = new WeatherUpdateScheduler(mockService);

          scheduler.start();
          scheduler.stop();

          expect(scheduler.isSchedulerRunning()).toBe(false);
        }),
        { numRuns: 50 }
      );
    });

    test('scheduler state should be consistent with operations', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom('start', 'stop'), { minLength: 1, maxLength: 10 }),
          (operations) => {
            const mockService = createMockWeatherService();
            const scheduler = new WeatherUpdateScheduler(mockService);

            let expectedRunning = false;
            operations.forEach(op => {
              if (op === 'start') {
                scheduler.start();
                expectedRunning = true;
              } else {
                scheduler.stop();
                expectedRunning = false;
              }
            });

            expect(scheduler.isSchedulerRunning()).toBe(expectedRunning);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('disabled scheduler should never be running after start', () => {
      fc.assert(
        fc.property(fc.constant(undefined), () => {
          const mockService = createMockWeatherService();
          const scheduler = new WeatherUpdateScheduler(mockService, { enabled: false });

          scheduler.start();

          expect(scheduler.isSchedulerRunning()).toBe(false);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Property: Configuration Updates', () => {
    test('updating cron expression should preserve scheduler state', () => {
      fc.assert(
        fc.property(cronExpressionArb, cronExpressionArb, (expr1, expr2) => {
          const mockService = createMockWeatherService();
          const scheduler = new WeatherUpdateScheduler(mockService, { cronExpression: expr1 });

          scheduler.start();
          const wasRunning = scheduler.isSchedulerRunning();

          scheduler.updateCronExpression(expr2);

          expect(scheduler.isSchedulerRunning()).toBe(wasRunning);
          expect(scheduler.getConfig().cronExpression).toBe(expr2);
        }),
        { numRuns: 50 }
      );
    });

    test('config should always reflect current state', () => {
      fc.assert(
        fc.property(locationsArb, cronExpressionArb, (locations, cronExpr) => {
          const mockService = createMockWeatherService();
          const scheduler = new WeatherUpdateScheduler(mockService, {
            locations,
            cronExpression: cronExpr,
          });

          const config = scheduler.getConfig();
          expect(config.cronExpression).toBe(cronExpr);
          expect(config.locations?.length).toBeLessThanOrEqual(locations.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Callback Invocation', () => {
    test('onUpdate callback should be called for each location', async () => {
      await fc.assert(
        fc.asyncProperty(locationsArb, async (locations) => {
          const mockService = createMockWeatherService();
          mockService.getWeather.mockResolvedValue(createMockWeatherData(locations[0] || { latitude: 0, longitude: 0 }));

          const onUpdate = jest.fn();
          const scheduler = new WeatherUpdateScheduler(mockService, {
            locations,
            onUpdate,
          });

          await scheduler.triggerUpdate();

          const uniqueLocations = scheduler.getLocations();
          expect(onUpdate).toHaveBeenCalledTimes(uniqueLocations.length);
        }),
        { numRuns: 100 }
      );
    });

    test('onUpdate should receive correct success status', async () => {
      await fc.assert(
        fc.asyncProperty(locationArb, fc.boolean(), async (location, shouldSucceed) => {
          const mockService = createMockWeatherService();
          
          if (shouldSucceed) {
            mockService.getWeather.mockResolvedValue(createMockWeatherData(location));
          } else {
            mockService.getWeather.mockRejectedValue(new Error('Mock failure'));
          }

          const onUpdate = jest.fn();
          const scheduler = new WeatherUpdateScheduler(mockService, {
            locations: [location],
            onUpdate,
          });

          await scheduler.triggerUpdate();

          if (shouldSucceed) {
            expect(onUpdate).toHaveBeenCalledWith(
              expect.objectContaining({
                latitude: expect.any(Number),
                longitude: expect.any(Number),
              }),
              true
            );
          } else {
            expect(onUpdate).toHaveBeenCalledWith(
              expect.objectContaining({
                latitude: expect.any(Number),
                longitude: expect.any(Number),
              }),
              false,
              expect.any(Error)
            );
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Idempotency', () => {
    test('getting metrics multiple times should return same values', async () => {
      await fc.assert(
        fc.asyncProperty(locationsArb, async (locations) => {
          const mockService = createMockWeatherService();
          mockService.getWeather.mockResolvedValue(createMockWeatherData(locations[0] || { latitude: 0, longitude: 0 }));

          const scheduler = new WeatherUpdateScheduler(mockService, { locations });

          await scheduler.triggerUpdate();

          const metrics1 = scheduler.getMetrics();
          const metrics2 = scheduler.getMetrics();

          expect(metrics1).toEqual(metrics2);
        }),
        { numRuns: 100 }
      );
    });

    test('getting config multiple times should return same values', () => {
      fc.assert(
        fc.property(locationsArb, cronExpressionArb, (locations, cronExpr) => {
          const mockService = createMockWeatherService();
          const scheduler = new WeatherUpdateScheduler(mockService, {
            locations,
            cronExpression: cronExpr,
          });

          const config1 = scheduler.getConfig();
          const config2 = scheduler.getConfig();

          expect(config1).toEqual(config2);
        }),
        { numRuns: 100 }
      );
    });
  });
});
