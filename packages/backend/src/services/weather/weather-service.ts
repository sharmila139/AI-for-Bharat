/**
 * Weather Service
 * Integrates IMD API and OpenWeatherMap for weather data
 * Features: dual API support, caching, retry logic, rate limiting, fallback mechanisms
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { WeatherForecast } from '../agriculture/irrigation-schedule';

export interface WeatherLocation {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  description: string;
  icon: string;
  timestamp: Date;
}

export interface ExtendedForecast extends WeatherForecast {
  windSpeed?: number;
  windDirection?: number;
  pressure?: number;
  description?: string;
  icon?: string;
}

export interface WeatherData {
  location: WeatherLocation;
  current: CurrentWeather;
  hourlyForecast: ExtendedForecast[]; // 48 hours
  dailyForecast: ExtendedForecast[]; // 14 days
  source: 'imd' | 'openweathermap' | 'cache';
  fetchedAt: Date;
  cacheExpiry?: Date;
}

export interface WeatherServiceConfig {
  imdApiKey?: string;
  imdBaseUrl?: string;
  openWeatherApiKey: string;
  openWeatherBaseUrl?: string;
  cacheEnabled?: boolean;
  cacheTTL?: number; // in seconds
  retryAttempts?: number;
  retryDelay?: number; // in milliseconds
  timeout?: number; // in milliseconds
  rateLimitPerHour?: number;
}

interface CacheEntry {
  data: WeatherData;
  expiresAt: Date;
}

interface RateLimitEntry {
  count: number;
  resetAt: Date;
}

/**
 * Weather Service with dual API support
 */
export class WeatherService {
  private imdClient: AxiosInstance;
  private openWeatherClient: AxiosInstance;
  private cache: Map<string, CacheEntry>;
  private rateLimits: Map<string, RateLimitEntry>;
  private config: Required<WeatherServiceConfig>;

  constructor(config: WeatherServiceConfig) {
    this.config = {
      imdApiKey: config.imdApiKey || '',
      imdBaseUrl: config.imdBaseUrl || 'https://api.imd.gov.in/v1',
      openWeatherApiKey: config.openWeatherApiKey,
      openWeatherBaseUrl: config.openWeatherBaseUrl || 'https://api.openweathermap.org/data/2.5',
      cacheEnabled: config.cacheEnabled ?? true,
      cacheTTL: config.cacheTTL ?? 3600, // 1 hour default
      retryAttempts: config.retryAttempts ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      timeout: config.timeout ?? 10000,
      rateLimitPerHour: config.rateLimitPerHour ?? 1000,
    };

    this.imdClient = axios.create({
      baseURL: this.config.imdBaseUrl,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.imdApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    this.openWeatherClient = axios.create({
      baseURL: this.config.openWeatherBaseUrl,
      timeout: this.config.timeout,
    });

    this.cache = new Map();
    this.rateLimits = new Map();
  }

  /**
   * Get weather data for a location
   * Tries IMD first, falls back to OpenWeatherMap
   */
  async getWeather(location: WeatherLocation): Promise<WeatherData> {
    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.getFromCache(location);
      if (cached) {
        return cached;
      }
    }

    // Check rate limit
    this.checkRateLimit('weather');

    // Try IMD API first (primary)
    if (this.config.imdApiKey) {
      try {
        const weatherData = await this.fetchFromIMD(location);
        this.saveToCache(location, weatherData);
        this.incrementRateLimit('weather');
        return weatherData;
      } catch (error) {
        console.warn('IMD API failed, falling back to OpenWeatherMap:', error);
      }
    }

    // Fallback to OpenWeatherMap
    try {
      const weatherData = await this.fetchFromOpenWeather(location);
      this.saveToCache(location, weatherData);
      this.incrementRateLimit('weather');
      return weatherData;
    } catch (error) {
      // If both APIs fail, try to return stale cache
      const staleCache = this.getFromCache(location, true);
      if (staleCache) {
        console.warn('Using stale cache data due to API failures');
        return staleCache;
      }
      throw new Error(`Failed to fetch weather data: ${error}`);
    }
  }

  /**
   * Get current weather only
   */
  async getCurrentWeather(location: WeatherLocation): Promise<CurrentWeather> {
    const weatherData = await this.getWeather(location);
    return weatherData.current;
  }

  /**
   * Get 7-day forecast
   */
  async getSevenDayForecast(location: WeatherLocation): Promise<WeatherForecast[]> {
    const weatherData = await this.getWeather(location);
    return weatherData.dailyForecast.slice(0, 7);
  }

  /**
   * Get 14-day extended forecast
   */
  async getFourteenDayForecast(location: WeatherLocation): Promise<WeatherForecast[]> {
    const weatherData = await this.getWeather(location);
    return weatherData.dailyForecast;
  }

  /**
   * Get hourly forecast for next 48 hours
   */
  async getHourlyForecast(location: WeatherLocation): Promise<ExtendedForecast[]> {
    const weatherData = await this.getWeather(location);
    return weatherData.hourlyForecast;
  }

  /**
   * Fetch weather data from IMD API
   */
  private async fetchFromIMD(location: WeatherLocation): Promise<WeatherData> {
    const response = await this.retryRequest(async () => {
      return await this.imdClient.get('/weather', {
        params: {
          lat: location.latitude,
          lon: location.longitude,
        },
      });
    });

    return this.normalizeIMDData(response.data, location);
  }

  /**
   * Fetch weather data from OpenWeatherMap API
   */
  private async fetchFromOpenWeather(location: WeatherLocation): Promise<WeatherData> {
    // Fetch current weather
    const currentResponse = await this.retryRequest(async () => {
      return await this.openWeatherClient.get('/weather', {
        params: {
          lat: location.latitude,
          lon: location.longitude,
          appid: this.config.openWeatherApiKey,
          units: 'metric',
        },
      });
    });

    // Fetch forecast (hourly + daily)
    const forecastResponse = await this.retryRequest(async () => {
      return await this.openWeatherClient.get('/onecall', {
        params: {
          lat: location.latitude,
          lon: location.longitude,
          appid: this.config.openWeatherApiKey,
          units: 'metric',
          exclude: 'minutely,alerts',
        },
      });
    });

    return this.normalizeOpenWeatherData(
      currentResponse.data,
      forecastResponse.data,
      location
    );
  }

  /**
   * Normalize IMD API response to standard format
   */
  private normalizeIMDData(data: any, location: WeatherLocation): WeatherData {
    const now = new Date();
    const cacheExpiry = new Date(now.getTime() + this.config.cacheTTL * 1000);

    return {
      location,
      current: {
        temperature: data.current.temp,
        feelsLike: data.current.feels_like,
        humidity: data.current.humidity,
        pressure: data.current.pressure,
        windSpeed: data.current.wind_speed,
        windDirection: data.current.wind_deg,
        description: data.current.weather[0].description,
        icon: data.current.weather[0].icon,
        timestamp: new Date(data.current.dt * 1000),
      },
      hourlyForecast: (data.hourly || []).slice(0, 48).map((hour: any) => ({
        date: new Date(hour.dt * 1000),
        rainfall: hour.rain?.['1h'] || 0,
        temperature: {
          min: hour.temp - 2, // Approximate
          max: hour.temp + 2,
        },
        humidity: hour.humidity,
        evapotranspiration: this.calculateET(hour.temp, hour.humidity, hour.wind_speed),
        windSpeed: hour.wind_speed,
        windDirection: hour.wind_deg,
        pressure: hour.pressure,
        description: hour.weather[0].description,
        icon: hour.weather[0].icon,
      })),
      dailyForecast: (data.daily || []).slice(0, 14).map((day: any) => ({
        date: new Date(day.dt * 1000),
        rainfall: day.rain || 0,
        temperature: {
          min: day.temp.min,
          max: day.temp.max,
        },
        humidity: day.humidity,
        evapotranspiration: this.calculateET(day.temp.day, day.humidity, day.wind_speed),
        windSpeed: day.wind_speed,
        windDirection: day.wind_deg,
        pressure: day.pressure,
        description: day.weather[0].description,
        icon: day.weather[0].icon,
      })),
      source: 'imd',
      fetchedAt: now,
      cacheExpiry,
    };
  }

  /**
   * Normalize OpenWeatherMap API response to standard format
   */
  private normalizeOpenWeatherData(
    current: any,
    forecast: any,
    location: WeatherLocation
  ): WeatherData {
    const now = new Date();
    const cacheExpiry = new Date(now.getTime() + this.config.cacheTTL * 1000);

    return {
      location,
      current: {
        temperature: current.main.temp,
        feelsLike: current.main.feels_like,
        humidity: current.main.humidity,
        pressure: current.main.pressure,
        windSpeed: current.wind.speed,
        windDirection: current.wind.deg,
        description: current.weather[0].description,
        icon: current.weather[0].icon,
        timestamp: new Date(current.dt * 1000),
      },
      hourlyForecast: (forecast.hourly || []).slice(0, 48).map((hour: any) => ({
        date: new Date(hour.dt * 1000),
        rainfall: hour.rain?.['1h'] || 0,
        temperature: {
          min: hour.temp - 2, // Approximate
          max: hour.temp + 2,
        },
        humidity: hour.humidity,
        evapotranspiration: this.calculateET(hour.temp, hour.humidity, hour.wind_speed),
        windSpeed: hour.wind_speed,
        windDirection: hour.wind_deg,
        pressure: hour.pressure,
        description: hour.weather[0].description,
        icon: hour.weather[0].icon,
      })),
      dailyForecast: (forecast.daily || []).slice(0, 14).map((day: any) => ({
        date: new Date(day.dt * 1000),
        rainfall: day.rain || 0,
        temperature: {
          min: day.temp.min,
          max: day.temp.max,
        },
        humidity: day.humidity,
        evapotranspiration: this.calculateET(day.temp.day, day.humidity, day.wind_speed),
        windSpeed: day.wind_speed,
        windDirection: day.wind_deg,
        pressure: day.pressure,
        description: day.weather[0].description,
        icon: day.weather[0].icon,
      })),
      source: 'openweathermap',
      fetchedAt: now,
      cacheExpiry,
    };
  }

  /**
   * Calculate evapotranspiration (simplified Penman-Monteith)
   */
  private calculateET(temp: number, humidity: number, windSpeed: number): number {
    // Simplified ET calculation (mm/day)
    // Real implementation would use full Penman-Monteith equation
    const saturationVaporPressure = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
    const actualVaporPressure = (humidity / 100) * saturationVaporPressure;
    const vaporPressureDeficit = saturationVaporPressure - actualVaporPressure;
    
    // Simplified ET0 (reference evapotranspiration)
    const et0 = 0.408 * vaporPressureDeficit * (1 + 0.34 * windSpeed);
    
    return Math.max(0, et0);
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt >= this.config.retryAttempts) {
        throw error;
      }

      // Check if error is retryable
      if (!this.isRetryableError(error)) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
      console.log(`Retry attempt ${attempt} after ${delay}ms`);
      
      await this.sleep(delay);
      return this.retryRequest(requestFn, attempt + 1);
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      // Retry on network errors or 5xx server errors
      return (
        !axiosError.response ||
        (axiosError.response.status >= 500 && axiosError.response.status < 600) ||
        axiosError.code === 'ECONNABORTED' ||
        axiosError.code === 'ETIMEDOUT'
      );
    }
    return false;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get cache key for location
   */
  private getCacheKey(location: WeatherLocation): string {
    return `weather:${location.latitude.toFixed(4)}:${location.longitude.toFixed(4)}`;
  }

  /**
   * Get data from cache
   */
  private getFromCache(location: WeatherLocation, allowStale: boolean = false): WeatherData | null {
    const key = this.getCacheKey(location);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = new Date();
    if (!allowStale && entry.expiresAt < now) {
      this.cache.delete(key);
      return null;
    }

    // Mark as cache source
    return {
      ...entry.data,
      source: 'cache' as const,
    };
  }

  /**
   * Save data to cache
   */
  private saveToCache(location: WeatherLocation, data: WeatherData): void {
    if (!this.config.cacheEnabled) {
      return;
    }

    const key = this.getCacheKey(location);
    const expiresAt = new Date(Date.now() + this.config.cacheTTL * 1000);

    this.cache.set(key, {
      data,
      expiresAt,
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = new Date();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(key: string): void {
    const entry = this.rateLimits.get(key);
    const now = new Date();

    if (!entry || entry.resetAt < now) {
      // Reset rate limit
      this.rateLimits.set(key, {
        count: 0,
        resetAt: new Date(now.getTime() + 3600000), // 1 hour
      });
      return;
    }

    if (entry.count >= this.config.rateLimitPerHour) {
      const resetIn = Math.ceil((entry.resetAt.getTime() - now.getTime()) / 1000);
      throw new Error(`Rate limit exceeded. Resets in ${resetIn} seconds`);
    }
  }

  /**
   * Increment rate limit counter
   */
  private incrementRateLimit(key: string): void {
    const entry = this.rateLimits.get(key);
    if (entry) {
      entry.count++;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: this.cache.size,
    };
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(key: string = 'weather'): { count: number; limit: number; resetAt: Date } | null {
    const entry = this.rateLimits.get(key);
    if (!entry) {
      return null;
    }

    return {
      count: entry.count,
      limit: this.config.rateLimitPerHour,
      resetAt: entry.resetAt,
    };
  }
}

/**
 * Create weather service instance
 */
export function createWeatherService(config: WeatherServiceConfig): WeatherService {
  return new WeatherService(config);
}
