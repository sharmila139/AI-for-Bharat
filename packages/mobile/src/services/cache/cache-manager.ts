/**
 * Cache Manager
 * Manages caching for weather, market prices, and content
 * NOTE: Stubbed implementation without Realm (in-memory only)
 */

import { v4 as uuidv4 } from 'uuid';

// Stub interfaces
export interface MarketPriceCache {
  _id: string;
  commodity: string;
  market: string;
  price: number;
  unit: string;
  date: Date;
  cachedAt: Date;
  expiresAt: Date;
}

export interface WeatherCache {
  _id: string;
  location: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  forecast: string;
  cachedAt: Date;
  expiresAt: Date;
}

export interface ContentCache {
  _id: string;
  contentType: string;
  contentId: string;
  title: string;
  data: string;
  cachedAt: Date;
  expiresAt: Date;
}

// In-memory storage
const marketPriceStore: Map<string, MarketPriceCache> = new Map();
const weatherStore: Map<string, WeatherCache> = new Map();
const contentStore: Map<string, ContentCache> = new Map();

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

    if (this.config.autoCleanup) {
      this.setupAutoCleanup();
    }

    console.log('Cache manager initialized');
  }

  /**
   * Setup automatic cache cleanup
   */
  private static setupAutoCleanup(): void {
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
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.marketPriceTTL * 60 * 60 * 1000);
    
    marketPriceStore.set(id, {
      _id: id,
      commodity,
      market,
      price,
      unit,
      date,
      cachedAt: now,
      expiresAt
    });
  }

  /**
   * Get cached market prices
   */
  static getMarketPrices(commodity: string): MarketPriceCache[] {
    return Array.from(marketPriceStore.values())
      .filter(p => p.commodity === commodity)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
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
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.weatherTTL * 60 * 60 * 1000);
    
    weatherStore.set(location, {
      _id: id,
      location,
      temperature,
      humidity,
      rainfall,
      forecast: JSON.stringify(forecast),
      cachedAt: now,
      expiresAt
    });
  }

  /**
   * Get cached weather
   */
  static getWeather(location: string): WeatherCache | null {
    return weatherStore.get(location) || null;
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
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.contentTTL * 24 * 60 * 60 * 1000);
    
    const key = `${contentType}:${contentId}`;
    contentStore.set(key, {
      _id: id,
      contentType,
      contentId,
      title,
      data: JSON.stringify(data),
      cachedAt: now,
      expiresAt
    });
  }

  /**
   * Get cached content
   */
  static getContent(contentType: string, contentId: string): ContentCache | null {
    const key = `${contentType}:${contentId}`;
    return contentStore.get(key) || null;
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
    const now = new Date();
    
    // Clean market prices
    Array.from(marketPriceStore.entries()).forEach(([id, item]) => {
      if (item.expiresAt < now) {
        marketPriceStore.delete(id);
      }
    });
    
    // Clean weather
    Array.from(weatherStore.entries()).forEach(([id, item]) => {
      if (item.expiresAt < now) {
        weatherStore.delete(id);
      }
    });
    
    // Clean content
    Array.from(contentStore.entries()).forEach(([id, item]) => {
      if (item.expiresAt < now) {
        contentStore.delete(id);
      }
    });
    
    console.log('Expired cache entries cleaned');
  }

  /**
   * Get cache statistics
   */
  static getStats(): CacheStats {
    return {
      marketPrices: marketPriceStore.size,
      weather: weatherStore.size,
      content: contentStore.size,
      totalSize: 0 // Stub
    };
  }

  /**
   * Clear all cache
   */
  static clearAll(): void {
    marketPriceStore.clear();
    weatherStore.clear();
    contentStore.clear();
    console.log('All cache cleared');
  }

  /**
   * Clear cache by type
   */
  static clearByType(type: 'market' | 'weather' | 'content'): void {
    if (type === 'market') marketPriceStore.clear();
    else if (type === 'weather') weatherStore.clear();
    else if (type === 'content') contentStore.clear();
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
    _userId: string,
    _location: string,
    _crops: string[]
  ): Promise<void> {
    console.log('Prefetching data for offline use...');
    // Stub implementation
    console.log('Prefetch completed');
  }

  /**
   * Check cache health
   */
  static checkHealth(): {
    healthy: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
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
