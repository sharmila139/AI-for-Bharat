/**
 * Weather Service Property-Based Tests
 * Tests universal properties across all valid inputs
 */

import * as fc from 'fast-check';
import axios from 'axios';
import { WeatherService, WeatherLocation, WeatherServiceConfig } from '../weather-service';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WeatherService - Property Tests', () => {
  // Arbitraries for property testing
  const locationArb = fc.record({
    latitude: fc.double({ min: -90, max: 90 }),
    longitude: fc.double({ min: -180, max: 180 }),
    name: fc.option(fc.string(), { nil: undefined }),
  });

  const temperatureArb = fc.double({ min: -50, max: 60 });
  const humidityArb = fc.integer({ min: 0, max: 100 });
  const pressureArb = fc.integer({ min: 900, max: 1100 });
  const windSpeedArb = fc.double({ min: 0, max: 50 });
  const windDirectionArb = fc.integer({ min: 0, max: 360 });
  const rainfallArb = fc.double({ min: 0, max: 200 });

  const weatherDataArb = fc.record({
    current: fc.record({
      dt: fc.integer({ min: 1600000000, max: 2000000000 }),
      temp: temperatureArb,
      feels_like: temperatureArb,
      humidity: humidityArb,
      pressure: pressureArb,
      wind_speed: windSpeedArb,
      wind_deg: windDirectionArb,
      weather: fc.constant([{ description: 'clear sky', icon: '01d' }]),
    }),
    hourly: fc.array(
      fc.record({
        dt: fc.integer({ min: 1600000000, max: 2000000000 }),
        temp: temperatureArb,
        humidity: humidityArb,
        pressure: pressureArb,
        wind_speed: windSpeedArb,
        wind_deg: windDirectionArb,
        rain: fc.option(fc.record({ '1h': rainfallArb }), { nil: undefined }),
        weather: fc.constant([{ description: 'clear sky', icon: '01d' }]),
      }),
      { minLength: 48, maxLength: 48 }
    ),
    daily: fc.array(
      fc.record({
        dt: fc.integer({ min: 1600000000, max: 2000000000 }),
        temp: fc.record({
          min: temperatureArb,
          max: temperatureArb,
          day: temperatureArb,
        }),
        humidity: humidityArb,
        pressure: pressureArb,
        wind_speed: windSpeedArb,
        wind_deg: windDirectionArb,
        rain: fc.option(rainfallArb, { nil: 0 }),
        weather: fc.constant([{ description: 'clear sky', icon: '01d' }]),
      }),
      { minLength: 14, maxLength: 14 }
    ),
  });

  let mockIMDClient: any;
  let mockOpenWeatherClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockIMDClient = {
      get: jest.fn(),
    };

    mockOpenWeatherClient = {
      get: jest.fn(),
    };

    let createCallCount = 0;
    mockedAxios.create.mockImplementation(() => {
      createCallCount++;
      return createCallCount === 1 ? mockIMDClient : mockOpenWeatherClient;
    });
  });

  /**
   * Property 1: Cache Key Consistency
   * For any location, generating cache key multiple times should produce the same result
   */
  test('cache key should be consistent for same location', () => {
    fc.assert(
      fc.property(locationArb, (location) => {
        const service = new WeatherService({
          openWeatherApiKey: 'test-key',
        });

        // Access private method through type assertion
        const getCacheKey = (service as any).getCacheKey.bind(service);
        const key1 = getCacheKey(location);
        const key2 = getCacheKey(location);

        expect(key1).toBe(key2);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Cache Key Uniqueness
   * For different locations (>0.0001 degree difference), cache keys should be different
   */
  test('cache keys should be unique for different locations', () => {
    fc.assert(
      fc.property(
        locationArb,
        fc.double({ min: 0.001, max: 1 }),
        (location, delta) => {
          const service = new WeatherService({
            openWeatherApiKey: 'test-key',
          });

          const location2 = {
            ...location,
            latitude: location.latitude + delta,
          };

          const getCacheKey = (service as any).getCacheKey.bind(service);
          const key1 = getCacheKey(location);
          const key2 = getCacheKey(location2);

          expect(key1).not.toBe(key2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Forecast Length Consistency
   * For any valid weather data, hourly forecast should have 48 entries and daily should have 14
   */
  test('forecast arrays should have correct lengths', () => {
    fc.assert(
      fc.asyncProperty(locationArb, weatherDataArb, async (location, weatherData) => {
        const service = new WeatherService({
          openWeatherApiKey: 'test-key',
        });

        mockIMDClient.get.mockResolvedValue({ data: weatherData });

        const result = await service.getWeather(location);

        expect(result.hourlyForecast).toHaveLength(48);
        expect(result.dailyForecast).toHaveLength(14);
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 4: Seven Day Forecast Subset
   * For any weather data, 7-day forecast should be first 7 entries of daily forecast
   */
  test('seven day forecast should be subset of daily forecast', () => {
    fc.assert(
      fc.asyncProperty(locationArb, weatherDataArb, async (location, weatherData) => {
        const service = new WeatherService({
          openWeatherApiKey: 'test-key',
        });

        mockIMDClient.get.mockResolvedValue({ data: weatherData });

        const fullData = await service.getWeather(location);
        service.clearCache();
        
        mockIMDClient.get.mockResolvedValue({ data: weatherData });
        const sevenDay = await service.getSevenDayForecast(location);

        expect(sevenDay).toHaveLength(7);
        for (let i = 0; i < 7; i++) {
          expect(sevenDay[i].date.getTime()).toBe(fullData.dailyForecast[i].date.getTime());
        }
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 5: Evapotranspiration Non-Negative
   * For any temperature, humidity, and wind speed, ET should be >= 0
   */
  test('evapotranspiration should always be non-negative', () => {
    fc.assert(
      fc.property(
        temperatureArb,
        humidityArb,
        windSpeedArb,
        (temp, humidity, windSpeed) => {
          const service = new WeatherService({
            openWeatherApiKey: 'test-key',
          });

          const calculateET = (service as any).calculateET.bind(service);
          const et = calculateET(temp, humidity, windSpeed);

          expect(et).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Evapotranspiration Increases with Temperature
   * For any fixed humidity and wind, higher temperature should generally increase ET
   */
  test('evapotranspiration should increase with temperature', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 10, max: 30 }),
        humidityArb,
        windSpeedArb,
        (baseTemp, humidity, windSpeed) => {
          const service = new WeatherService({
            openWeatherApiKey: 'test-key',
          });

          const calculateET = (service as any).calculateET.bind(service);
          const et1 = calculateET(baseTemp, humidity, windSpeed);
          const et2 = calculateET(baseTemp + 10, humidity, windSpeed);

          // Higher temperature should generally produce higher ET
          expect(et2).toBeGreaterThanOrEqual(et1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: Cache Expiry Behavior
   * For any location, cached data should be returned before expiry and not after
   */
  test('cache should respect TTL', () => {
    fc.assert(
      fc.asyncProperty(locationArb, weatherDataArb, async (location, weatherData) => {
        const service = new WeatherService({
          openWeatherApiKey: 'test-key',
          cacheTTL: 1, // 1 second
        });

        mockIMDClient.get.mockResolvedValue({ data: weatherData });

        // First call - fetch from API
        const result1 = await service.getWeather(location);
        expect(result1.source).toBe('imd');

        // Immediate second call - should use cache
        const result2 = await service.getWeather(location);
        expect(result2.source).toBe('cache');

        // Wait for cache to expire
        await new Promise(resolve => setTimeout(resolve, 1100));

        // Third call - should fetch from API again
        mockIMDClient.get.mockResolvedValue({ data: weatherData });
        const result3 = await service.getWeather(location);
        expect(result3.source).toBe('imd');
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property 8: Rainfall Default to Zero
   * For any weather data without rainfall info, rainfall should default to 0
   */
  test('missing rainfall should default to zero', () => {
    fc.assert(
      fc.asyncProperty(locationArb, async (location) => {
        const service = new WeatherService({
          openWeatherApiKey: 'test-key',
        });

        const weatherDataNoRain = {
          current: {
            dt: 1640000000,
            temp: 25,
            feels_like: 24,
            humidity: 60,
            pressure: 1013,
            wind_speed: 3.5,
            wind_deg: 180,
            weather: [{ description: 'clear sky', icon: '01d' }],
          },
          hourly: [{
            dt: 1640000000,
            temp: 25,
            humidity: 60,
            pressure: 1013,
            wind_speed: 3.5,
            wind_deg: 180,
            weather: [{ description: 'clear sky', icon: '01d' }],
            // No rain property
          }],
          daily: [{
            dt: 1640000000,
            temp: { min: 20, max: 30, day: 25 },
            humidity: 60,
            pressure: 1013,
            wind_speed: 3.5,
            wind_deg: 180,
            weather: [{ description: 'clear sky', icon: '01d' }],
            // No rain property
          }],
        };

        mockIMDClient.get.mockResolvedValue({ data: weatherDataNoRain });

        const result = await service.getWeather(location);

        expect(result.hourlyForecast[0].rainfall).toBe(0);
        expect(result.dailyForecast[0].rainfall).toBe(0);
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 9: Rate Limit Counter Monotonic Increase
   * For any sequence of requests, rate limit counter should monotonically increase until reset
   */
  test('rate limit counter should increase monotonically', () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(locationArb, { minLength: 2, maxLength: 5 }),
        weatherDataArb,
        async (locations, weatherData) => {
          const service = new WeatherService({
            openWeatherApiKey: 'test-key',
            rateLimitPerHour: 1000,
          });

          mockIMDClient.get.mockResolvedValue({ data: weatherData });

          let previousCount = 0;
          for (const location of locations) {
            await service.getWeather(location);
            const status = service.getRateLimitStatus();
            
            if (status) {
              expect(status.count).toBeGreaterThan(previousCount);
              previousCount = status.count;
            }
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 10: Temperature Range Preservation
   * For any daily forecast, min temperature should be <= max temperature
   */
  test('daily forecast min temp should be <= max temp', () => {
    fc.assert(
      fc.asyncProperty(locationArb, weatherDataArb, async (location, weatherData) => {
        const service = new WeatherService({
          openWeatherApiKey: 'test-key',
        });

        mockIMDClient.get.mockResolvedValue({ data: weatherData });

        const result = await service.getWeather(location);

        for (const day of result.dailyForecast) {
          expect(day.temperature.min).toBeLessThanOrEqual(day.temperature.max);
        }
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 11: Humidity Bounds
   * For any weather data, humidity should be between 0 and 100
   */
  test('humidity should be within valid range', () => {
    fc.assert(
      fc.asyncProperty(locationArb, weatherDataArb, async (location, weatherData) => {
        const service = new WeatherService({
          openWeatherApiKey: 'test-key',
        });

        mockIMDClient.get.mockResolvedValue({ data: weatherData });

        const result = await service.getWeather(location);

        expect(result.current.humidity).toBeGreaterThanOrEqual(0);
        expect(result.current.humidity).toBeLessThanOrEqual(100);

        for (const hour of result.hourlyForecast) {
          expect(hour.humidity).toBeGreaterThanOrEqual(0);
          expect(hour.humidity).toBeLessThanOrEqual(100);
        }

        for (const day of result.dailyForecast) {
          expect(day.humidity).toBeGreaterThanOrEqual(0);
          expect(day.humidity).toBeLessThanOrEqual(100);
        }
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 12: Wind Direction Bounds
   * For any weather data, wind direction should be between 0 and 360 degrees
   */
  test('wind direction should be within valid range', () => {
    fc.assert(
      fc.asyncProperty(locationArb, weatherDataArb, async (location, weatherData) => {
        const service = new WeatherService({
          openWeatherApiKey: 'test-key',
        });

        mockIMDClient.get.mockResolvedValue({ data: weatherData });

        const result = await service.getWeather(location);

        expect(result.current.windDirection).toBeGreaterThanOrEqual(0);
        expect(result.current.windDirection).toBeLessThanOrEqual(360);
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 13: Timestamp Ordering
   * For any forecast, timestamps should be in chronological order
   */
  test('forecast timestamps should be chronologically ordered', () => {
    fc.assert(
      fc.asyncProperty(locationArb, weatherDataArb, async (location, weatherData) => {
        const service = new WeatherService({
          openWeatherApiKey: 'test-key',
        });

        mockIMDClient.get.mockResolvedValue({ data: weatherData });

        const result = await service.getWeather(location);

        // Check hourly forecast ordering
        for (let i = 1; i < result.hourlyForecast.length; i++) {
          expect(result.hourlyForecast[i].date.getTime())
            .toBeGreaterThanOrEqual(result.hourlyForecast[i - 1].date.getTime());
        }

        // Check daily forecast ordering
        for (let i = 1; i < result.dailyForecast.length; i++) {
          expect(result.dailyForecast[i].date.getTime())
            .toBeGreaterThanOrEqual(result.dailyForecast[i - 1].date.getTime());
        }
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 14: Cache Stats Accuracy
   * For any number of unique locations cached, cache size should match
   */
  test('cache stats should accurately reflect cache size', () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(locationArb, { minLength: 1, maxLength: 10 }),
        weatherDataArb,
        async (locations, weatherData) => {
          const service = new WeatherService({
            openWeatherApiKey: 'test-key',
          });

          mockIMDClient.get.mockResolvedValue({ data: weatherData });

          // Make locations unique by rounding coordinates
          const uniqueLocations = Array.from(
            new Map(
              locations.map(loc => [
                `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`,
                loc
              ])
            ).values()
          );

          for (const location of uniqueLocations) {
            await service.getWeather(location);
          }

          const stats = service.getCacheStats();
          expect(stats.size).toBe(uniqueLocations.length);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 15: Fallback Mechanism
   * For any location, if primary API fails, fallback should be attempted
   */
  test('should attempt fallback when primary API fails', () => {
    fc.assert(
      fc.asyncProperty(locationArb, weatherDataArb, async (location, weatherData) => {
        const service = new WeatherService({
          imdApiKey: 'test-imd-key',
          openWeatherApiKey: 'test-openweather-key',
        });

        mockIMDClient.get.mockRejectedValue(new Error('IMD API error'));
        mockOpenWeatherClient.get
          .mockResolvedValueOnce({
            data: {
              dt: 1640000000,
              main: {
                temp: 25,
                feels_like: 24,
                humidity: 60,
                pressure: 1013,
              },
              wind: { speed: 3.5, deg: 180 },
              weather: [{ description: 'clear sky', icon: '01d' }],
            },
          })
          .mockResolvedValueOnce({ data: weatherData });

        const result = await service.getWeather(location);

        expect(result.source).toBe('openweathermap');
        expect(mockOpenWeatherClient.get).toHaveBeenCalled();
      }),
      { numRuns: 30 }
    );
  });
});
