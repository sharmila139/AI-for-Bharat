/**
 * Weather Service Unit Tests
 * Tests specific examples, edge cases, and error conditions
 */

import axios from 'axios';
import { WeatherService, WeatherLocation, WeatherServiceConfig } from '../weather-service';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WeatherService', () => {
  let service: WeatherService;
  let mockIMDClient: any;
  let mockOpenWeatherClient: any;

  const testLocation: WeatherLocation = {
    latitude: 28.6139,
    longitude: 77.209,
    name: 'New Delhi',
  };

  const mockOpenWeatherCurrentResponse = {
    data: {
      dt: 1640000000,
      main: {
        temp: 25,
        feels_like: 24,
        humidity: 60,
        pressure: 1013,
      },
      wind: {
        speed: 3.5,
        deg: 180,
      },
      weather: [
        {
          description: 'clear sky',
          icon: '01d',
        },
      ],
    },
  };

  const mockOpenWeatherForecastResponse = {
    data: {
      hourly: Array.from({ length: 48 }, (_, i) => ({
        dt: 1640000000 + i * 3600,
        temp: 25 + Math.sin(i / 4) * 5,
        humidity: 60,
        pressure: 1013,
        wind_speed: 3.5,
        wind_deg: 180,
        rain: { '1h': i % 10 === 0 ? 2.5 : 0 },
        weather: [{ description: 'clear sky', icon: '01d' }],
      })),
      daily: Array.from({ length: 14 }, (_, i) => ({
        dt: 1640000000 + i * 86400,
        temp: {
          min: 20,
          max: 30,
          day: 25,
        },
        humidity: 60,
        pressure: 1013,
        wind_speed: 3.5,
        wind_deg: 180,
        rain: i % 3 === 0 ? 5 : 0,
        weather: [{ description: 'clear sky', icon: '01d' }],
      })),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock axios.create to return mock clients
    mockIMDClient = {
      get: jest.fn(),
    };

    mockOpenWeatherClient = {
      get: jest.fn(),
    };

    let createCallCount = 0;
    mockedAxios.create.mockImplementation(() => {
      createCallCount++;
      // First call is IMD client, second is OpenWeather client
      return createCallCount === 1 ? mockIMDClient : mockOpenWeatherClient;
    });

    const config: WeatherServiceConfig = {
      imdApiKey: 'test-imd-key',
      openWeatherApiKey: 'test-openweather-key',
      cacheEnabled: true,
      cacheTTL: 3600,
      retryAttempts: 3,
      retryDelay: 100,
      timeout: 10000,
      rateLimitPerHour: 1000,
    };

    service = new WeatherService(config);
  });

  describe('getWeather', () => {
    it('should fetch weather from IMD API when available', async () => {
      const mockIMDResponse = {
        data: {
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
          hourly: mockOpenWeatherForecastResponse.data.hourly,
          daily: mockOpenWeatherForecastResponse.data.daily,
        },
      };

      mockIMDClient.get.mockResolvedValue(mockIMDResponse);

      const result = await service.getWeather(testLocation);

      expect(result.source).toBe('imd');
      expect(result.current.temperature).toBe(25);
      expect(result.current.humidity).toBe(60);
      expect(result.hourlyForecast).toHaveLength(48);
      expect(result.dailyForecast).toHaveLength(14);
      expect(mockIMDClient.get).toHaveBeenCalledWith('/weather', {
        params: {
          lat: testLocation.latitude,
          lon: testLocation.longitude,
        },
      });
    });

    it('should fallback to OpenWeatherMap when IMD fails', async () => {
      mockIMDClient.get.mockRejectedValue(new Error('IMD API error'));
      mockOpenWeatherClient.get
        .mockResolvedValueOnce(mockOpenWeatherCurrentResponse)
        .mockResolvedValueOnce(mockOpenWeatherForecastResponse);

      const result = await service.getWeather(testLocation);

      expect(result.source).toBe('openweathermap');
      expect(result.current.temperature).toBe(25);
      expect(mockOpenWeatherClient.get).toHaveBeenCalledTimes(2);
    });

    it('should return cached data on subsequent calls', async () => {
      mockIMDClient.get.mockResolvedValue({
        data: {
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
          hourly: mockOpenWeatherForecastResponse.data.hourly,
          daily: mockOpenWeatherForecastResponse.data.daily,
        },
      });

      // First call - should fetch from API
      const result1 = await service.getWeather(testLocation);
      expect(result1.source).toBe('imd');

      // Second call - should return from cache
      const result2 = await service.getWeather(testLocation);
      expect(result2.source).toBe('cache');
      expect(mockIMDClient.get).toHaveBeenCalledTimes(1);
    });

    it('should throw error when both APIs fail and no cache available', async () => {
      mockIMDClient.get.mockRejectedValue(new Error('IMD API error'));
      mockOpenWeatherClient.get.mockRejectedValue(new Error('OpenWeather API error'));

      await expect(service.getWeather(testLocation)).rejects.toThrow('Failed to fetch weather data');
    });
  });

  describe('getCurrentWeather', () => {
    it('should return only current weather data', async () => {
      mockIMDClient.get.mockResolvedValue({
        data: {
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
          hourly: [],
          daily: [],
        },
      });

      const result = await service.getCurrentWeather(testLocation);

      expect(result.temperature).toBe(25);
      expect(result.humidity).toBe(60);
      expect(result.description).toBe('clear sky');
    });
  });

  describe('getSevenDayForecast', () => {
    it('should return exactly 7 days of forecast', async () => {
      mockIMDClient.get.mockResolvedValue({
        data: {
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
          hourly: [],
          daily: mockOpenWeatherForecastResponse.data.daily,
        },
      });

      const result = await service.getSevenDayForecast(testLocation);

      expect(result).toHaveLength(7);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('rainfall');
      expect(result[0]).toHaveProperty('temperature');
      expect(result[0]).toHaveProperty('humidity');
    });
  });

  describe('getFourteenDayForecast', () => {
    it('should return 14 days of forecast', async () => {
      mockIMDClient.get.mockResolvedValue({
        data: {
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
          hourly: [],
          daily: mockOpenWeatherForecastResponse.data.daily,
        },
      });

      const result = await service.getFourteenDayForecast(testLocation);

      expect(result).toHaveLength(14);
    });
  });

  describe('getHourlyForecast', () => {
    it('should return 48 hours of forecast', async () => {
      mockIMDClient.get.mockResolvedValue({
        data: {
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
          hourly: mockOpenWeatherForecastResponse.data.hourly,
          daily: [],
        },
      });

      const result = await service.getHourlyForecast(testLocation);

      expect(result).toHaveLength(48);
      expect(result[0]).toHaveProperty('windSpeed');
      expect(result[0]).toHaveProperty('pressure');
    });
  });

  describe('retry logic', () => {
    it('should retry on network errors with exponential backoff', async () => {
      mockIMDClient.get
        .mockRejectedValueOnce({ code: 'ETIMEDOUT' })
        .mockRejectedValueOnce({ code: 'ETIMEDOUT' })
        .mockResolvedValueOnce({
          data: {
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
            hourly: [],
            daily: [],
          },
        });

      const result = await service.getWeather(testLocation);

      expect(result.source).toBe('imd');
      expect(mockIMDClient.get).toHaveBeenCalledTimes(3);
    });

    it('should not retry on 4xx client errors', async () => {
      const error = {
        response: { status: 400 },
        isAxiosError: true,
      };
      mockIMDClient.get.mockRejectedValue(error);
      mockOpenWeatherClient.get.mockRejectedValue(error);

      await expect(service.getWeather(testLocation)).rejects.toThrow();
      expect(mockIMDClient.get).toHaveBeenCalledTimes(1);
    });

    it('should retry on 5xx server errors', async () => {
      const error = {
        response: { status: 503 },
        isAxiosError: true,
      };
      mockIMDClient.get
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          data: {
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
            hourly: [],
            daily: [],
          },
        });

      const result = await service.getWeather(testLocation);

      expect(result.source).toBe('imd');
      expect(mockIMDClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('caching', () => {
    it('should clear cache when clearCache is called', async () => {
      mockIMDClient.get.mockResolvedValue({
        data: {
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
          hourly: [],
          daily: [],
        },
      });

      await service.getWeather(testLocation);
      service.clearCache();

      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should clear only expired cache entries', async () => {
      // Create service with very short TTL
      const shortTTLService = new WeatherService({
        openWeatherApiKey: 'test-key',
        cacheTTL: 0.1, // 100ms
      });

      mockIMDClient.get.mockResolvedValue({
        data: {
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
          hourly: [],
          daily: [],
        },
      });

      await shortTTLService.getWeather(testLocation);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      shortTTLService.clearExpiredCache();
      const stats = shortTTLService.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('rate limiting', () => {
    it('should track rate limit usage', async () => {
      mockIMDClient.get.mockResolvedValue({
        data: {
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
          hourly: [],
          daily: [],
        },
      });

      await service.getWeather(testLocation);

      const status = service.getRateLimitStatus();
      expect(status).not.toBeNull();
      expect(status!.count).toBe(1);
      expect(status!.limit).toBe(1000);
    });

    it('should throw error when rate limit exceeded', async () => {
      // Create service with low rate limit
      const limitedService = new WeatherService({
        openWeatherApiKey: 'test-key',
        rateLimitPerHour: 1,
      });

      mockIMDClient.get.mockResolvedValue({
        data: {
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
          hourly: [],
          daily: [],
        },
      });

      // First call should succeed
      await limitedService.getWeather(testLocation);

      // Second call should fail due to rate limit
      await expect(limitedService.getWeather({
        latitude: 28.7,
        longitude: 77.2,
      })).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('evapotranspiration calculation', () => {
    it('should calculate ET for forecast data', async () => {
      mockIMDClient.get.mockResolvedValue({
        data: {
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
          hourly: [],
          daily: [{
            dt: 1640000000,
            temp: { min: 20, max: 30, day: 25 },
            humidity: 60,
            pressure: 1013,
            wind_speed: 3.5,
            wind_deg: 180,
            rain: 0,
            weather: [{ description: 'clear sky', icon: '01d' }],
          }],
        },
      });

      const result = await service.getWeather(testLocation);

      expect(result.dailyForecast[0].evapotranspiration).toBeGreaterThanOrEqual(0);
      expect(typeof result.dailyForecast[0].evapotranspiration).toBe('number');
    });
  });

  describe('edge cases', () => {
    it('should handle missing rainfall data', async () => {
      mockIMDClient.get.mockResolvedValue({
        data: {
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
          daily: [],
        },
      });

      const result = await service.getWeather(testLocation);

      expect(result.hourlyForecast[0].rainfall).toBe(0);
    });

    it('should handle location with extreme coordinates', async () => {
      const extremeLocation: WeatherLocation = {
        latitude: 89.9,
        longitude: 179.9,
      };

      mockIMDClient.get.mockResolvedValue({
        data: {
          current: {
            dt: 1640000000,
            temp: -30,
            feels_like: -35,
            humidity: 80,
            pressure: 1013,
            wind_speed: 10,
            wind_deg: 180,
            weather: [{ description: 'snow', icon: '13d' }],
          },
          hourly: [],
          daily: [],
        },
      });

      const result = await service.getWeather(extremeLocation);

      expect(result.current.temperature).toBe(-30);
      expect(result.location.latitude).toBe(89.9);
    });
  });
});
