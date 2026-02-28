/**
 * Cache Staleness Detector
 * Detects and manages stale cache entries with 30-day threshold
 */

import RealmDatabase from '../../database/realm-config';

export interface StalenessConfig {
  marketPriceThreshold: number; // days
  weatherThreshold: number; // days
  contentThreshold: number; // days
  warningThreshold: number; // days before expiry to warn
}

export interface StaleEntry {
  id: string;
  type: 'market' | 'weather' | 'content';
  entityId: string;
  cachedAt: Date;
  expiresAt: Date;
  age: number; // days
  isStale: boolean;
  isExpired: boolean;
}

export interface StalenessReport {
  totalEntries: number;
  staleEntries: number;
  expiredEntries: number;
  warningEntries: number;
  byType: {
    market: { total: number; stale: number; expired: number };
    weather: { total: number; stale: number; expired: number };
    content: { total: number; stale: number; expired: number };
  };
  oldestEntry?: StaleEntry;
  recommendations: string[];
}

export class StalenessDetector {
  private static config: StalenessConfig = {
    marketPriceThreshold: 7, // 7 days
    weatherThreshold: 1, // 1 day
    contentThreshold: 30, // 30 days
    warningThreshold: 3 // 3 days before expiry
  };

  /**
   * Initialize staleness detector
   */
  static initialize(config?: Partial<StalenessConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    console.log('Staleness detector initialized');
  }

  /**
   * Check if cache entry is stale
   */
  static isStale(cachedAt: Date, expiresAt: Date, threshold: number): boolean {
    const now = new Date();
    const age = this.getAgeInDays(cachedAt, now);
    
    // Entry is stale if it's older than threshold or expired
    return age > threshold || expiresAt < now;
  }

  /**
   * Check if cache entry is expired
   */
  static isExpired(expiresAt: Date): boolean {
    return expiresAt < new Date();
  }

  /**
   * Check if cache entry is near expiry
   */
  static isNearExpiry(expiresAt: Date): boolean {
    const now = new Date();
    const daysUntilExpiry = this.getAgeInDays(now, expiresAt);
    return daysUntilExpiry <= this.config.warningThreshold && daysUntilExpiry > 0;
  }

  /**
   * Get age of cache entry in days
   */
  static getAgeInDays(from: Date, to: Date): number {
    const diffMs = to.getTime() - from.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Scan all cache entries for staleness
   */
  static scanCache(): StalenessReport {
    const realm = RealmDatabase.getInstance();
    const now = new Date();

    const report: StalenessReport = {
      totalEntries: 0,
      staleEntries: 0,
      expiredEntries: 0,
      warningEntries: 0,
      byType: {
        market: { total: 0, stale: 0, expired: 0 },
        weather: { total: 0, stale: 0, expired: 0 },
        content: { total: 0, stale: 0, expired: 0 }
      },
      recommendations: []
    };

    let oldestEntry: StaleEntry | undefined;

    // Scan market prices
    const marketPrices = realm.objects('MarketPriceCache');
    report.byType.market.total = marketPrices.length;
    
    marketPrices.forEach((entry: any) => {
      const age = this.getAgeInDays(entry.cachedAt, now);
      const isStale = this.isStale(entry.cachedAt, entry.expiresAt, this.config.marketPriceThreshold);
      const isExpired = this.isExpired(entry.expiresAt);
      const isNearExpiry = this.isNearExpiry(entry.expiresAt);

      if (isStale) report.byType.market.stale++;
      if (isExpired) report.byType.market.expired++;
      if (isNearExpiry) report.warningEntries++;

      const staleEntry: StaleEntry = {
        id: entry._id,
        type: 'market',
        entityId: `${entry.commodity}:${entry.market}`,
        cachedAt: entry.cachedAt,
        expiresAt: entry.expiresAt,
        age,
        isStale,
        isExpired
      };

      if (!oldestEntry || age > oldestEntry.age) {
        oldestEntry = staleEntry;
      }
    });

    // Scan weather
    const weather = realm.objects('WeatherCache');
    report.byType.weather.total = weather.length;
    
    weather.forEach((entry: any) => {
      const age = this.getAgeInDays(entry.cachedAt, now);
      const isStale = this.isStale(entry.cachedAt, entry.expiresAt, this.config.weatherThreshold);
      const isExpired = this.isExpired(entry.expiresAt);
      const isNearExpiry = this.isNearExpiry(entry.expiresAt);

      if (isStale) report.byType.weather.stale++;
      if (isExpired) report.byType.weather.expired++;
      if (isNearExpiry) report.warningEntries++;

      const staleEntry: StaleEntry = {
        id: entry._id,
        type: 'weather',
        entityId: entry.location,
        cachedAt: entry.cachedAt,
        expiresAt: entry.expiresAt,
        age,
        isStale,
        isExpired
      };

      if (!oldestEntry || age > oldestEntry.age) {
        oldestEntry = staleEntry;
      }
    });

    // Scan content
    const content = realm.objects('ContentCache');
    report.byType.content.total = content.length;
    
    content.forEach((entry: any) => {
      const age = this.getAgeInDays(entry.cachedAt, now);
      const isStale = this.isStale(entry.cachedAt, entry.expiresAt, this.config.contentThreshold);
      const isExpired = this.isExpired(entry.expiresAt);
      const isNearExpiry = this.isNearExpiry(entry.expiresAt);

      if (isStale) report.byType.content.stale++;
      if (isExpired) report.byType.content.expired++;
      if (isNearExpiry) report.warningEntries++;

      const staleEntry: StaleEntry = {
        id: entry._id,
        type: 'content',
        entityId: `${entry.contentType}:${entry.contentId}`,
        cachedAt: entry.cachedAt,
        expiresAt: entry.expiresAt,
        age,
        isStale,
        isExpired
      };

      if (!oldestEntry || age > oldestEntry.age) {
        oldestEntry = staleEntry;
      }
    });

    // Calculate totals
    report.totalEntries = report.byType.market.total + report.byType.weather.total + report.byType.content.total;
    report.staleEntries = report.byType.market.stale + report.byType.weather.stale + report.byType.content.stale;
    report.expiredEntries = report.byType.market.expired + report.byType.weather.expired + report.byType.content.expired;
    report.oldestEntry = oldestEntry;

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  /**
   * Generate recommendations based on staleness report
   */
  private static generateRecommendations(report: StalenessReport): string[] {
    const recommendations: string[] = [];

    // Check expired entries
    if (report.expiredEntries > 0) {
      recommendations.push(`Clean ${report.expiredEntries} expired cache entries`);
    }

    // Check stale entries
    if (report.staleEntries > report.totalEntries * 0.3) {
      recommendations.push('Over 30% of cache is stale - consider refreshing data');
    }

    // Check warning entries
    if (report.warningEntries > 10) {
      recommendations.push(`${report.warningEntries} entries expiring soon - refresh when online`);
    }

    // Type-specific recommendations
    if (report.byType.market.stale > 5) {
      recommendations.push('Update market prices when online');
    }

    if (report.byType.weather.stale > 0) {
      recommendations.push('Weather data is stale - refresh for accurate forecasts');
    }

    if (report.byType.content.stale > 20) {
      recommendations.push('Consider updating educational content');
    }

    // Check oldest entry
    if (report.oldestEntry && report.oldestEntry.age > 30) {
      recommendations.push(`Oldest cache entry is ${report.oldestEntry.age} days old - consider cleanup`);
    }

    return recommendations;
  }

  /**
   * Get stale entries by type
   */
  static getStaleEntries(type: 'market' | 'weather' | 'content'): StaleEntry[] {
    const realm = RealmDatabase.getInstance();
    const now = new Date();
    const staleEntries: StaleEntry[] = [];

    let collection: string;
    let threshold: number;

    switch (type) {
      case 'market':
        collection = 'MarketPriceCache';
        threshold = this.config.marketPriceThreshold;
        break;
      case 'weather':
        collection = 'WeatherCache';
        threshold = this.config.weatherThreshold;
        break;
      case 'content':
        collection = 'ContentCache';
        threshold = this.config.contentThreshold;
        break;
    }

    const entries = realm.objects(collection);
    
    entries.forEach((entry: any) => {
      const age = this.getAgeInDays(entry.cachedAt, now);
      const isStale = this.isStale(entry.cachedAt, entry.expiresAt, threshold);
      const isExpired = this.isExpired(entry.expiresAt);

      if (isStale || isExpired) {
        staleEntries.push({
          id: entry._id,
          type,
          entityId: type === 'market' ? `${entry.commodity}:${entry.market}` :
                   type === 'weather' ? entry.location :
                   `${entry.contentType}:${entry.contentId}`,
          cachedAt: entry.cachedAt,
          expiresAt: entry.expiresAt,
          age,
          isStale,
          isExpired
        });
      }
    });

    return staleEntries;
  }

  /**
   * Clean stale entries
   */
  static cleanStaleEntries(type?: 'market' | 'weather' | 'content'): number {
    const realm = RealmDatabase.getInstance();
    let deletedCount = 0;

    realm.write(() => {
      if (!type || type === 'market') {
        const staleMarket = realm.objects('MarketPriceCache')
          .filtered('expiresAt < $0', new Date());
        deletedCount += staleMarket.length;
        realm.delete(staleMarket);
      }

      if (!type || type === 'weather') {
        const staleWeather = realm.objects('WeatherCache')
          .filtered('expiresAt < $0', new Date());
        deletedCount += staleWeather.length;
        realm.delete(staleWeather);
      }

      if (!type || type === 'content') {
        const staleContent = realm.objects('ContentCache')
          .filtered('expiresAt < $0', new Date());
        deletedCount += staleContent.length;
        realm.delete(staleContent);
      }
    });

    console.log(`Cleaned ${deletedCount} stale entries`);
    return deletedCount;
  }

  /**
   * Get entries expiring soon
   */
  static getExpiringSoon(): StaleEntry[] {
    const realm = RealmDatabase.getInstance();
    const now = new Date();
    const warningDate = new Date(now.getTime() + this.config.warningThreshold * 24 * 60 * 60 * 1000);
    const expiringSoon: StaleEntry[] = [];

    // Check all cache types
    ['MarketPriceCache', 'WeatherCache', 'ContentCache'].forEach(collection => {
      const entries = realm.objects(collection)
        .filtered('expiresAt > $0 AND expiresAt < $1', now, warningDate);

      entries.forEach((entry: any) => {
        const age = this.getAgeInDays(entry.cachedAt, now);
        const type = collection === 'MarketPriceCache' ? 'market' :
                    collection === 'WeatherCache' ? 'weather' : 'content';

        expiringSoon.push({
          id: entry._id,
          type: type as 'market' | 'weather' | 'content',
          entityId: entry._id,
          cachedAt: entry.cachedAt,
          expiresAt: entry.expiresAt,
          age,
          isStale: false,
          isExpired: false
        });
      });
    });

    return expiringSoon;
  }

  /**
   * Update configuration
   */
  static updateConfig(config: Partial<StalenessConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Staleness detector config updated:', this.config);
  }

  /**
   * Get configuration
   */
  static getConfig(): StalenessConfig {
    return { ...this.config };
  }
}

export default StalenessDetector;
