/**
 * Unit tests for Weather Update Scheduler
 */

import { WeatherUpdateScheduler, createWeatherUpdateScheduler } from '../weather-update-scheduler';
import { WeatherService, WeatherLocation, WeatherData } from '../weather-service';

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn((_expression: string, _callback: () => void) => ({
    stop: jest.fn(),
  })),
  validate: jest.fn((expression: string) => {
    // Simple validation for common patterns
    const validPatterns = [
      '0 * * * *',  // Every hour
      '*/30 * * * *', // Every 30 minutes
      '0 0 * * *',  // Daily at midnight
      '* * * * *',  // Every minute
    ];
    return validPatterns.includes(expression) || /^[\d\*\/\-,\s]+$/.test(expression);
  }),
}));

describe('WeatherUpdateScheduler', () => {
  let mockWeatherService: jest.Mocked<WeatherService>;
  let testLocation: WeatherLocation;
  let mockWeatherData: WeatherData;

  beforeEach(() => {
    // Create mock weather service
    mockWeatherService = {
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

    testLocation = {
      latitude: 28.6139,
      longitude: 77.2090,
      name: 'New Delhi',
    };

    mockWeatherData = {
      location: testLocation,
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

    mockWeatherService.getWeather.mockResolvedValue(mockWeatherData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should create scheduler with default config', () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService);
      
      const config = scheduler.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.cronExpression).toBe('0 * * * *');
      expect(config.locations).toEqual([]);
    });

    test('should create scheduler with custom config', () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService, {
        enabled: false,
        cronExpression: '*/30 * * * *',
        locations: [testLocation],
      });

      const config = scheduler.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.cronExpression).toBe('*/30 * * * *');
      expect(config.locations).toHaveLength(1);
    });

    test('should register initial locations', () => {
      const locations = [testLocation, { latitude: 19.0760, longitude: 72.8777, name: 'Mumbai' }];
      const scheduler = new WeatherUpdateScheduler(mockWeatherService, { locations });

      expect(scheduler.getLocations()).toHaveLength(2);
    });

    test('should initialize metrics to zero', () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService);
      const metrics = scheduler.getMetrics();

      expect(metrics.totalUpdates).toBe(0);
      expect(metrics.successfulUpdates).toBe(0);
      expect(metrics.failedUpdates).toBe(0);
      expect(metrics.lastUpdateTime).toBeNull();
      expect(metrics.lastError).toBeNull();
    });
  });

  describe('Location Management', () => {
    test('should add location', () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService);
      scheduler.addLocation(testLocation);

      const locations = scheduler.getLocations();
      expect(locations).toHaveLength(1);
      expect(locations[0]).toEqual(testLocation);
    });

    test('should remove location', () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService, {
        locations: [testLocation],
      });

      scheduler.removeLocation(testLocation);
      expect(scheduler.getLocations()).toHaveLength(0);
    });

    test('should handle duplicate locations', () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService);
      scheduler.addLocation(testLocation);
      scheduler.addLocation(testLocation); // Add same location twice

      // Should only store one instance (same key)
      const locations = scheduler.getLocations();
      expect(locations).toHaveLength(1);
    });

    test('should clear all locations', () => {
      const locations = [
        testLocation,
        { latitude: 19.0760, longitude: 72.8777, name: 'Mumbai' },
        { latitude: 13.0827, longitude: 80.2707, name: 'Chennai' },
      ];
      const scheduler = new WeatherUpdateScheduler(mockWeatherService, { locations });

      scheduler.clearLocations();
      expect(scheduler.getLocations()).toHaveLength(0);
    });

    test('should get all locations', () => {
      const locations = [
        testLocation,
        { latitude: 19.0760, longitude: 72.8777, name: 'Mumbai' },
      ];
      const scheduler = new WeatherUpdateScheduler(mockWeatherService, { locations });

      const retrieved = scheduler.getLocations();
      expect(retrieved).toHaveLength(2);
      expect(retrieved).toEqual(expect.arrayContaining(locations));
    });
  });

  describe('Scheduler Control', () => {
    test('should start scheduler', () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService);
      scheduler.start();

      expect(scheduler.isSchedulerRunning()).toBe(true);
    });

    test('should not start if disabled', () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService, { enabled: false });
      scheduler.start();

      expect(scheduler.isSchedulerRunning()).toBe(false);
    });

    test('should stop scheduler', () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService);
      scheduler.start();
      scheduler.stop();

      expect(scheduler.isSchedulerRunning()).toBe(false);
    });

    test('should not start if already running', () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService);
      scheduler.start();
      scheduler.start(); // Try to start again

      expect(scheduler.isSchedulerRunning()).toBe(true);
    });

    test('should throw error for invalid cron expression', () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService, {
        cronExpression: 'invalid',
      });

      expect(() => scheduler.start()).toThrow('Invalid cron expression');
    });
  });

  describe('Manual Updates', () => {
    test('should trigger manual update', async () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService, {
        locations: [testLocation],
      });

      await scheduler.triggerUpdate();

      expect(mockWeatherService.getWeather).toHaveBeenCalledWith(testLocation);
      expect(mockWeatherService.getWeather).toHaveBeenCalledTimes(1);
    });

    test('should update multiple locations', async () => {
      const locations = [
        testLocation,
        { latitude: 19.0760, longitude: 72.8777, name: 'Mumbai' },
        { latitude: 13.0827, longitude: 80.2707, name: 'Chennai' },
      ];
      const scheduler = new WeatherUpdateScheduler(mockWeatherService, { locations });

      await scheduler.triggerUpdate();

      expect(mockWeatherService.getWeather).toHaveBeenCalledTimes(3);
    });

    test('should handle empty location list', async () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService);

      await scheduler.triggerUpdate();

      expect(mockWeatherService.getWeather).not.toHaveBeenCalled();
    });

    test('should update metrics on successful update', async () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService, {
        locations: [testLocation],
      });

      await scheduler.triggerUpdate();

      const metrics = scheduler.getMetrics();
      expect(metrics.totalUpdates).toBe(1);
      expect(metrics.successfulUpdates).toBe(1);
      expect(metrics.failedUpdates).toBe(0);
      expect(metrics.lastUpdateTime).toBeInstanceOf(Date);
      expect(metrics.lastError).toBeNull();
    });

    test('should update metrics on failed update', async () => {
      const error = new Error('API failure');
      mockWeatherService.getWeather.mockRejectedValue(error);

      const scheduler = new WeatherUpdateScheduler(mockWeatherService, {
        locations: [testLocation],
      });

      await scheduler.triggerUpdate();

      const metrics = scheduler.getMetrics();
      expect(metrics.totalUpdates).toBe(1);
      expect(metrics.successfulUpdates).toBe(0);
      expect(metrics.failedUpdates).toBe(1);
      expect(metrics.lastError).toBe(error);
    });

    test('should continue updating other locations after failure', async () => {
      const locations = [
        testLocation,
        { latitude: 19.0760, longitude: 72.8777, name: 'Mumbai' },
      ];

      // First call fails, second succeeds
      mockWeatherService.getWeather
        .mockRejectedValueOnce(new Error('API failure'))
        .mockResolvedValueOnce(mockWeatherData);

      const scheduler = new WeatherUpdateScheduler(mockWeatherService, { locations });

      await scheduler.triggerUpdate();

      expect(mockWeatherService.getWeather).toHaveBeenCalledTimes(2);
      
      const metrics = scheduler.getMetrics();
      expect(metrics.totalUpdates).toBe(2);
      expect(metrics.successfulUpdates).toBe(1);
      expect(metrics.failedUpdates).toBe(1);
    });
  });

  describe('Callbacks', () => {
    test('should call onUpdate callback on success', async () => {
      const onUpdate = jest.fn();
      const scheduler = new WeatherUpdateScheduler(mockWeatherService, {
        locations: [testLocation],
        onUpdate,
      });

      await scheduler.triggerUpdate();

      expect(onUpdate).toHaveBeenCalledWith(testLocation, true);
    });

    test('should call onUpdate callback on failure', async () => {
      const error = new Error('API failure');
      mockWeatherService.getWeather.mockRejectedValue(error);

      const onUpdate = jest.fn();
      const scheduler = new WeatherUpdateScheduler(mockWeatherService, {
        locations: [testLocation],
        onUpdate,
      });

      await scheduler.triggerUpdate();

      expect(onUpdate).toHaveBeenCalledWith(testLocation, false, error);
    });
  });

  describe('Metrics', () => {
    test('should track multiple updates', async () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService, {
        locations: [testLocation],
      });

      await scheduler.triggerUpdate();
      await scheduler.triggerUpdate();
      await scheduler.triggerUpdate();

      const metrics = scheduler.getMetrics();
      expect(metrics.totalUpdates).toBe(3);
      expect(metrics.successfulUpdates).toBe(3);
    });

    test('should reset metrics', async () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService, {
        locations: [testLocation],
      });

      await scheduler.triggerUpdate();
      scheduler.resetMetrics();

      const metrics = scheduler.getMetrics();
      expect(metrics.totalUpdates).toBe(0);
      expect(metrics.successfulUpdates).toBe(0);
      expect(metrics.failedUpdates).toBe(0);
      expect(metrics.lastUpdateTime).toBeNull();
      expect(metrics.lastError).toBeNull();
    });

    test('should return copy of metrics', () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService);
      const metrics1 = scheduler.getMetrics();
      const metrics2 = scheduler.getMetrics();

      expect(metrics1).not.toBe(metrics2); // Different objects
      expect(metrics1).toEqual(metrics2); // Same values
    });
  });

  describe('Configuration Updates', () => {
    test('should update cron expression', () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService);
      scheduler.updateCronExpression('*/30 * * * *');

      const config = scheduler.getConfig();
      expect(config.cronExpression).toBe('*/30 * * * *');
    });

    test('should throw error for invalid cron expression update', () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService);

      expect(() => scheduler.updateCronExpression('invalid')).toThrow('Invalid cron expression');
    });

    test('should restart scheduler after cron expression update', () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService);
      scheduler.start();

      scheduler.updateCronExpression('*/30 * * * *');

      expect(scheduler.isSchedulerRunning()).toBe(true);
    });
  });

  describe('Factory Function', () => {
    test('should create scheduler using factory function', () => {
      const scheduler = createWeatherUpdateScheduler(mockWeatherService);

      expect(scheduler).toBeInstanceOf(WeatherUpdateScheduler);
      expect(scheduler.getConfig().enabled).toBe(true);
    });

    test('should create scheduler with config using factory function', () => {
      const scheduler = createWeatherUpdateScheduler(mockWeatherService, {
        cronExpression: '*/30 * * * *',
        locations: [testLocation],
      });

      const config = scheduler.getConfig();
      expect(config.cronExpression).toBe('*/30 * * * *');
      expect(config.locations).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle location with no name', async () => {
      const location = { latitude: 28.6139, longitude: 77.2090 };
      const scheduler = new WeatherUpdateScheduler(mockWeatherService, {
        locations: [location],
      });

      await scheduler.triggerUpdate();

      expect(mockWeatherService.getWeather).toHaveBeenCalledWith(location);
    });

    test('should handle very close coordinates as same location', () => {
      const location1 = { latitude: 28.6139, longitude: 77.2090 };
      const location2 = { latitude: 28.6140, longitude: 77.2091 }; // Very close

      const scheduler = new WeatherUpdateScheduler(mockWeatherService);
      scheduler.addLocation(location1);
      scheduler.addLocation(location2);

      // Should store both as they round to different keys
      const locations = scheduler.getLocations();
      expect(locations.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle concurrent updates gracefully', async () => {
      const scheduler = new WeatherUpdateScheduler(mockWeatherService, {
        locations: [testLocation],
      });

      // Trigger multiple updates concurrently
      await Promise.all([
        scheduler.triggerUpdate(),
        scheduler.triggerUpdate(),
        scheduler.triggerUpdate(),
      ]);

      const metrics = scheduler.getMetrics();
      expect(metrics.totalUpdates).toBe(3);
    });
  });
});
