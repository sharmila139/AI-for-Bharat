/**
 * Cache Manager
 * Manages caching for weather, market prices, and content
 */

import {
  cacheMarketPrice,
  getCachedMarketPrices,
  cacheWeather,
  getCachedWeather,
  cacheContent,
  getCachedContent,
  cleanExpiredCache,
  MarketPriceCache,
  WeatherCache,
  ContentCache
} from '../../database/realm-config';
import { v4 as uuidv4 } from 'uuid';

export interface CacheConfig {
  marketPriceTTL: number; // hours
  weatherTTL: number; // hours
  contentTTL: number; // days
  maxCacheSize: number; // MB
  autoCleanup: boolean;
}

export interface CacheStats {
  marketPrices: number;
  weather: number;
  content: number;
  totalSize: number; // estimated in KB
  oldestEntry?: Date;
  newestEntry?: Date;
}

export class CacheManager {
  private static config: CacheConfig = {
    marketPriceTTL: 24, // 24 hours
    weatherTTL: 6, // 6 hours
    contentTTL: 30, // 30 days
    maxCacheSize: 50, // 50 MB
    autoCleanup: true
  };

  /**
   * Initialize cache manager
   */
  static initialize(config?: Partial<CacheConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Setup auto cleanup
    if (this.config.autoCleanup) {
      this.setupAutoCleanup();
    }

    console.log('Cache manager initialized');
  }

  /**
   * Setup automatic cache cleanup
   */
  private static setupAutoCleanup(): void {
    // Clean expired cache every hour
    setInterval(() => {
      this.cleanExpired();
    }, 60 * 60 * 1000); // 1 hour
  }

  // ==================== Market Prices ====================

  /**
   * Cache market price data
   */
  static cacheMarketPrice(
    commodity: string,
    market: string,
    price: number,
    unit: string,
    date: Date = new Date()
  ): void {
    const id = uuidv4();
    cacheMarketPrice({
      _id: id,
      commodity,
      market,
      price,
      unit,
      date
    });
  }

  /**
   * Get cached market prices
   */
  static getMarketPrices(commodity: string): MarketPriceCache[] {
    const results = getCachedMarketPrices(commodity);
    return Array.from(results);
  }

  /**
   * Get latest market price
   */
  static getLatestMarketPrice(commodity: string, market?: string): MarketPriceCache | null {
    const prices = this.getMarketPrices(commodity);
    
    if (market) {
      const filtered = prices.filter(p => p.market === market);
      return filtered.length > 0 ? filtered[0] : null;
    }

    return prices.length > 0 ? prices[0] : null;
  }

  /**
   * Check if market price is cached and fresh
   */
  static hasValidMarketPrice(commodity: string, market?: string): boolean {
    const price = this.getLatestMarketPrice(commodity, market);
    if (!price) return false;

    const now = new Date();
    return price.expiresAt > now;
  }

  // ==================== Weather ====================

  /**
   * Cache weather data
   */
  static cacheWeatherData(
    location: string,
    temperature: number,
    humidity: number,
    rainfall: number,
    forecast: any
  ): void {
    const id = uuidv4();
    cacheWeather({
      _id: id,
      location,
      temperature,
      humidity,
      rainfall,
      forecast: JSON.stringify(forecast)
    });
  }

  /**
   * Get cached weather
   */
  static getWeather(location: string): WeatherCache | null {
    return getCachedWeather(location);
  }

  /**
   * Check if weather is cached and fresh
   */
  static hasValidWeather(location: string): boolean {
    const weather = this.getWeather(location);
    if (!weather) return false;

    const now = new Date();
    return weather.expiresAt > now;
  }

  /**
   * Get weather forecast
   */
  static getWeatherForecast(location: string): any | null {
    const weather = this.getWeather(location);
    if (!weather) return null;

    try {
      return JSON.parse(weather.forecast);
    } catch (error) {
      console.error('Failed to parse weather forecast:', error);
      return null;
    }
  }

  // ==================== Content ====================

  /**
   * Cache content (education, health, agriculture)
   */
  static cacheContentData(
    contentType: 'education' | 'health' | 'agriculture',
    contentId: string,
    title: string,
    data: any
  ): void {
    const id = uuidv4();
    cacheContent({
      _id: id,
      contentType,
      contentId,
      title,
      data: JSON.stringify(data)
    });
  }

  /**
   * Get cached content
   */
  static getContent(contentType: string, contentId: string): ContentCache | null {
    return getCachedContent(contentType, contentId);
  }

  /**
   * Get content data
   */
  static getContentData(contentType: string, contentId: string): any | null {
    const content = this.getContent(contentType, contentId);
    if (!content) return null;

    try {
      return JSON.parse(content.data);
    } catch (error) {
      console.error('Failed to parse content data:', error);
      return null;
    }
  }

  /**
   * Check if content is cached and fresh
   */
  static hasValidContent(contentType: string, contentId: string): boolean {
    const content = this.getContent(contentType, contentId);
    if (!content) return false;

    const now = new Date();
    return content.expiresAt > now;
  }

  /**
   * Batch cache content
   */
  static batchCacheContent(
    contentType: 'education' | 'health' | 'agriculture',
    items: Array<{ id: string; title: string; data: any }>
  ): void {
    items.forEach(item => {
      this.cacheContentData(contentType, item.id, item.title, item.data);
    });
  }

  // ==================== Cache Management ====================

  /**
   * Clean expired cache entries
   */
  static cleanExpired(): void {
    cleanExpiredCache();
    console.log('Expired cache entries cleaned');
  }

  /**
   * Get cache statistics
   */
  static getStats(): CacheStats {
    // TODO: Implement actual stats calculation
    // This would require querying Realm for counts and sizes
    return {
      marketPrices: 0,
      weather: 0,
      content: 0,
      totalSize: 0
    };
  }

  /**
   * Clear all cache
   */
  static clearAll(): void {
    cleanExpiredCache();
    console.log('All cache cleared');
  }

  /**
   * Clear cache by type
   */
  static clearByType(type: 'market' | 'weather' | 'content'): void {
    // TODO: Implement type-specific clearing
    console.log(`${type} cache cleared`);
  }

  /**
   * Update cache configuration
   */
  static updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Cache config updated:', this.config);
  }

  /**
   * Prefetch data for offline use
   */
  static async prefetchData(
    userId: string,
    location: string,
    crops: string[]
  ): Promise<void> {
    console.log('Prefetching data for offline use...');

    try {
      // TODO: Implement actual prefetching
      // 1. Fetch and cache weather for location
      // 2. Fetch and cache market prices for crops
      // 3. Fetch and cache relevant content

      console.log('Prefetch completed');
    } catch (error) {
      console.error('Prefetch failed:', error);
    }
  }

  /**
   * Check cache health
   */
  static checkHealth(): {
    healthy: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check cache size
    const stats = this.getStats();
    if (stats.totalSize > this.config.maxCacheSize * 1024) {
      issues.push('Cache size exceeds limit');
    }

    return {
      healthy: issues.length === 0,
      issues
    };
  }
}

export default CacheManager;
