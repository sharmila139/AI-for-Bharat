/**
 * Property-based tests for Weather Alert Service
 * Feature: ruralconnect-ai, Property 14: Weather Alert Generation
 */

import * as fc from 'fast-check';
import { WeatherAlertService } from '../weather-alert-service';
import { WeatherService, WeatherLocation, WeatherData } from '../weather-service';

describe('WeatherAlertService - Property Tests', () => {
  let weatherService: WeatherService;
  let alertService: WeatherAlertService;

  beforeEach(() => {
    weatherService = new WeatherService({
      openWeatherApiKey: 'test-key',
      cacheEnabled: false
    });
    alertService = new WeatherAlertService(weatherService);
  });

  afterEach(() => {
    alertService.clear();
  });

  /**
   * Property 14: Weather Alert Generation
   * For any weather conditions meeting critical thresholds (frost < -2°C, heavy rain > 50mm,
   * drought conditions), appropriate weather alerts should be generated with correct severity level.
   */
  describe('Property 14: Weather Alert Generation', () => {
    it('should generate frost alert when temperature is below -2°C', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            latitude: fc.double({ min: -90, max: 90 }),
            longitude: fc.double({ min: -180, max: 180 }),
            temperature: fc.double({ min: -10, max: -2 })
          }),
          async ({ latitude, longitude, temperature }) => {
            const location: WeatherLocation = { latitude, longitude };
            const mockWeatherData = createMockWeatherData(location, {
              currentTemp: temperature,
              hourlyTemps: Array(24).fill(temperature)
            });

            jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

            const alerts = await alertService.checkAndGenerateAlerts(location);
            const frostAlerts = alerts.filter(a => a.type === 'frost');

            // Should generate at least one frost alert
            expect(frostAlerts.length).toBeGreaterThan(0);
            
            // Alert should have correct severity
            const alert = frostAlerts[0];
            expect(alert.severity).toBe('critical');
            expect(alert.type).toBe('frost');
            
            // Alert should have required fields
            expect(alert.id).toBeDefined();
            expect(alert.title).toBeDefined();
            expect(alert.description).toBeDefined();
            expect(alert.advisories.length).toBeGreaterThan(0);
            expect(alert.timestamp).toBeInstanceOf(Date);
            expect(alert.validUntil).toBeInstanceOf(Date);
            
            // Valid until should be after timestamp
            expect(alert.validUntil.getTime()).toBeGreaterThan(alert.timestamp.getTime());
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should generate heavy rain alert when rainfall exceeds 50mm in 24 hours', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            latitude: fc.double({ min: -90, max: 90 }),
            longitude: fc.double({ min: -180, max: 180 }),
            rainfall: fc.double({ min: 50, max: 200 })
          }),
          async ({ latitude, longitude, rainfall }) => {
            const location: WeatherLocation = { latitude, longitude };
            const hourlyRainfall = rainfall / 24; // Distribute evenly
            const mockWeatherData = createMockWeatherData(location, {
              currentTemp: 25,
              hourlyRainfall: Array(24).fill(hourlyRainfall)
            });

            jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

            const alerts = await alertService.checkAndGenerateAlerts(location);
            const rainAlerts = alerts.filter(a => a.type === 'heavy_rain');

            // Should generate at least one heavy rain alert
            expect(rainAlerts.length).toBeGreaterThan(0);
            
            const alert = rainAlerts[0];
            expect(alert.severity).toBe('critical');
            expect(alert.type).toBe('heavy_rain');
            expect(alert.advisories.length).toBeGreaterThan(0);
            
            // Metadata should contain rainfall information
            expect(alert.metadata.currentValue).toBeGreaterThanOrEqual(50);
            expect(alert.metadata.unit).toBe('mm');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should generate drought alert when rainfall is insufficient', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            latitude: fc.double({ min: -90, max: 90 }),
            longitude: fc.double({ min: -180, max: 180 }),
            totalRainfall: fc.double({ min: 0, max: 5 })
          }),
          async ({ latitude, longitude, totalRainfall }) => {
            const location: WeatherLocation = { latitude, longitude };
            // Distribute minimal rainfall over 7 days
            const dailyRainfall = Array(7).fill(totalRainfall / 7);
            const mockWeatherData = createMockWeatherData(location, {
              currentTemp: 30,
              dailyRainfall
            });

            jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

            const alerts = await alertService.checkAndGenerateAlerts(location);
            const droughtAlerts = alerts.filter(a => a.type === 'drought');

            // Should generate drought alert
            expect(droughtAlerts.length).toBeGreaterThan(0);
            
            const alert = droughtAlerts[0];
            expect(alert.type).toBe('drought');
            expect(['warning', 'critical']).toContain(alert.severity);
            expect(alert.advisories.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Alert Severity Consistency
   * For any alert generated, the severity level should be consistent with the threshold values
   */
  describe('Property: Alert Severity Consistency', () => {
    it('should assign correct severity based on threshold values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            latitude: fc.double({ min: -90, max: 90 }),
            longitude: fc.double({ min: -180, max: 180 }),
            temperature: fc.double({ min: -10, max: 50 })
          }),
          async ({ latitude, longitude, temperature }) => {
            const location: WeatherLocation = { latitude, longitude };
            const mockWeatherData = createMockWeatherData(location, {
              currentTemp: temperature,
              hourlyTemps: Array(24).fill(temperature),
              dailyMaxTemps: Array(14).fill(temperature),
              dailyRainfall: Array(14).fill(5) // Prevent drought alerts
            });

            jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

            const alerts = await alertService.checkAndGenerateAlerts(location);
            const thresholds = alertService.getThresholds();

            // Check frost alerts
            const frostAlerts = alerts.filter(a => a.type === 'frost');
            if (temperature <= thresholds.frost.critical) {
              expect(frostAlerts.length).toBeGreaterThan(0);
              expect(frostAlerts[0].severity).toBe('critical');
            } else if (temperature > thresholds.frost.critical && temperature <= thresholds.frost.warning) {
              expect(frostAlerts.length).toBeGreaterThan(0);
              expect(frostAlerts[0].severity).toBe('warning');
            }

            // Check high temperature alerts
            const tempAlerts = alerts.filter(a => a.type === 'high_temperature');
            if (temperature >= thresholds.highTemperature.critical) {
              expect(tempAlerts.length).toBeGreaterThan(0);
              expect(tempAlerts[0].severity).toBe('critical');
            } else if (temperature >= thresholds.highTemperature.warning && temperature < thresholds.highTemperature.critical) {
              expect(tempAlerts.length).toBeGreaterThan(0);
              expect(tempAlerts[0].severity).toBe('warning');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Alert Uniqueness
   * For any location, each alert should have a unique ID
   */
  describe('Property: Alert Uniqueness', () => {
    it('should generate unique IDs for all alerts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            latitude: fc.double({ min: -90, max: 90 }),
            longitude: fc.double({ min: -180, max: 180 })
          }),
          async ({ latitude, longitude }) => {
            const location: WeatherLocation = { latitude, longitude };
            // Create conditions that trigger multiple alerts
            const mockWeatherData = createMockWeatherData(location, {
              currentTemp: -3, // Frost
              windSpeed: 16,   // Strong winds
              humidity: 85,    // Pest risk
              hourlyTemps: Array(24).fill(-3),
              hourlyRainfall: Array(24).fill(3) // Heavy rain
            });

            jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

            const alerts = await alertService.checkAndGenerateAlerts(location);

            // Extract all alert IDs
            const alertIds = alerts.map(a => a.id);

            // All IDs should be unique
            const uniqueIds = new Set(alertIds);
            expect(uniqueIds.size).toBe(alertIds.length);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Alert Validity Period
   * For any alert, validUntil should always be after timestamp
   */
  describe('Property: Alert Validity Period', () => {
    it('should have validUntil after timestamp for all alerts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            latitude: fc.double({ min: -90, max: 90 }),
            longitude: fc.double({ min: -180, max: 180 }),
            temperature: fc.double({ min: -10, max: 50 }),
            rainfall: fc.double({ min: 0, max: 100 }),
            windSpeed: fc.double({ min: 0, max: 30 })
          }),
          async ({ latitude, longitude, temperature, rainfall, windSpeed }) => {
            const location: WeatherLocation = { latitude, longitude };
            const mockWeatherData = createMockWeatherData(location, {
              currentTemp: temperature,
              windSpeed,
              hourlyTemps: Array(24).fill(temperature),
              hourlyRainfall: Array(24).fill(rainfall / 24)
            });

            jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

            const alerts = await alertService.checkAndGenerateAlerts(location);

            // All alerts should have valid time periods
            alerts.forEach(alert => {
              expect(alert.timestamp).toBeInstanceOf(Date);
              expect(alert.validUntil).toBeInstanceOf(Date);
              expect(alert.validUntil.getTime()).toBeGreaterThan(alert.timestamp.getTime());
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Alert Metadata Completeness
   * For any alert, metadata should contain required fields
   */
  describe('Property: Alert Metadata Completeness', () => {
    it('should include complete metadata for all alerts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            latitude: fc.double({ min: -90, max: 90 }),
            longitude: fc.double({ min: -180, max: 180 }),
            temperature: fc.double({ min: -10, max: 50 })
          }),
          async ({ latitude, longitude, temperature }) => {
            const location: WeatherLocation = { latitude, longitude };
            const mockWeatherData = createMockWeatherData(location, {
              currentTemp: temperature,
              hourlyTemps: Array(24).fill(temperature),
              dailyMaxTemps: Array(14).fill(temperature)
            });

            jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

            const alerts = await alertService.checkAndGenerateAlerts(location);

            // All alerts should have complete metadata
            alerts.forEach(alert => {
              expect(alert.metadata).toBeDefined();
              expect(alert.metadata.unit).toBeDefined();
              
              // Should have either currentValue or threshold
              const hasValue = alert.metadata.currentValue !== undefined;
              const hasThreshold = alert.metadata.threshold !== undefined;
              expect(hasValue || hasThreshold).toBe(true);
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Advisory Presence
   * For any alert, there should be at least one advisory
   */
  describe('Property: Advisory Presence', () => {
    it('should include at least one advisory for all alerts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            latitude: fc.double({ min: -90, max: 90 }),
            longitude: fc.double({ min: -180, max: 180 }),
            temperature: fc.double({ min: -10, max: 50 }),
            rainfall: fc.double({ min: 0, max: 100 })
          }),
          async ({ latitude, longitude, temperature, rainfall }) => {
            const location: WeatherLocation = { latitude, longitude };
            const mockWeatherData = createMockWeatherData(location, {
              currentTemp: temperature,
              hourlyTemps: Array(24).fill(temperature),
              hourlyRainfall: Array(24).fill(rainfall / 24)
            });

            jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

            const alerts = await alertService.checkAndGenerateAlerts(location);

            // All alerts should have advisories
            alerts.forEach(alert => {
              expect(alert.advisories).toBeDefined();
              expect(Array.isArray(alert.advisories)).toBe(true);
              expect(alert.advisories.length).toBeGreaterThan(0);
              
              // All advisories should be non-empty strings
              alert.advisories.forEach(advisory => {
                expect(typeof advisory).toBe('string');
                expect(advisory.length).toBeGreaterThan(0);
              });
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Threshold Configuration
   * For any threshold update, the new thresholds should be applied correctly
   */
  describe('Property: Threshold Configuration', () => {
    it('should apply updated thresholds correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            frostCritical: fc.double({ min: -10, max: -1 }),
            frostWarning: fc.double({ min: 0, max: 5 }),
            latitude: fc.double({ min: -90, max: 90 }),
            longitude: fc.double({ min: -180, max: 180 })
          }),
          async ({ frostCritical, frostWarning, latitude, longitude }) => {
            // Ensure warning is greater than critical
            if (frostWarning <= frostCritical) {
              return; // Skip invalid threshold combinations
            }

            // Update thresholds
            alertService.updateThresholds({
              frost: {
                critical: frostCritical,
                warning: frostWarning,
                leadTimeHours: 24
              }
            });

            const thresholds = alertService.getThresholds();
            expect(thresholds.frost.critical).toBe(frostCritical);
            expect(thresholds.frost.warning).toBe(frostWarning);

            // Test with temperature between thresholds
            const testTemp = (frostCritical + frostWarning) / 2;
            const location: WeatherLocation = { latitude, longitude };
            const mockWeatherData = createMockWeatherData(location, {
              currentTemp: testTemp,
              hourlyTemps: Array(24).fill(testTemp),
              dailyRainfall: Array(14).fill(5) // Prevent drought alerts
            });

            jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

            const alerts = await alertService.checkAndGenerateAlerts(location);
            const frostAlerts = alerts.filter(a => a.type === 'frost');

            if (testTemp <= frostCritical) {
              expect(frostAlerts.length).toBeGreaterThan(0);
              expect(frostAlerts[0].severity).toBe('critical');
            } else if (testTemp > frostCritical && testTemp <= frostWarning) {
              expect(frostAlerts.length).toBeGreaterThan(0);
              expect(frostAlerts[0].severity).toBe('warning');
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});

// Helper function to create mock weather data
function createMockWeatherData(
  location: WeatherLocation,
  options: {
    currentTemp?: number;
    humidity?: number;
    windSpeed?: number;
    hourlyTemps?: number[];
    hourlyRainfall?: number[];
    dailyMaxTemps?: number[];
    dailyRainfall?: number[];
  }
): WeatherData {
  const {
    currentTemp = 25,
    humidity = 60,
    windSpeed = 5,
    hourlyTemps = Array(48).fill(25),
    hourlyRainfall = Array(48).fill(0),
    dailyMaxTemps = Array(14).fill(30),
    dailyRainfall = Array(14).fill(0)
  } = options;

  return {
    location,
    current: {
      temperature: currentTemp,
      feelsLike: currentTemp,
      humidity,
      pressure: 1013,
      windSpeed,
      windDirection: 180,
      description: 'clear sky',
      icon: '01d',
      timestamp: new Date()
    },
    hourlyForecast: hourlyTemps.map((temp, i) => ({
      date: new Date(Date.now() + i * 60 * 60 * 1000),
      rainfall: hourlyRainfall[i] || 0,
      temperature: {
        min: temp,
        max: temp + 2
      },
      humidity,
      evapotranspiration: 3,
      windSpeed,
      windDirection: 180,
      pressure: 1013,
      description: 'clear sky',
      icon: '01d'
    })),
    dailyForecast: dailyMaxTemps.map((maxTemp, i) => ({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
      rainfall: dailyRainfall[i] || 0,
      temperature: {
        min: maxTemp - 10,
        max: maxTemp
      },
      humidity,
      evapotranspiration: 5,
      windSpeed,
      windDirection: 180,
      pressure: 1013,
      description: 'clear sky',
      icon: '01d'
    })),
    source: 'openweathermap',
    fetchedAt: new Date(),
    cacheExpiry: new Date(Date.now() + 3600000)
  };
}
