/**
 * Weather Update Scheduler
 * Implements hourly weather data updates with caching
 * Features: scheduled updates, location management, error handling, metrics tracking
 */

import cron, { ScheduledTask } from 'node-cron';
import { WeatherService, WeatherLocation } from './weather-service';

export interface SchedulerConfig {
  enabled?: boolean;
  cronExpression?: string; // Default: '0 * * * *' (every hour)
  locations?: WeatherLocation[];
  onUpdate?: (location: WeatherLocation, success: boolean, error?: Error) => void;
  onError?: (error: Error) => void;
}

export interface UpdateMetrics {
  totalUpdates: number;
  successfulUpdates: number;
  failedUpdates: number;
  lastUpdateTime: Date | null;
  lastError: Error | null;
}

/**
 * Weather Update Scheduler
 * Manages scheduled weather data updates for registered locations
 */
export class WeatherUpdateScheduler {
  private weatherService: WeatherService;
  private config: Required<SchedulerConfig>;
  private cronJob: ScheduledTask | null = null;
  private locations: Map<string, WeatherLocation>;
  private metrics: UpdateMetrics;
  private isRunning: boolean = false;

  constructor(weatherService: WeatherService, config: SchedulerConfig = {}) {
    this.weatherService = weatherService;
    this.config = {
      enabled: config.enabled ?? true,
      cronExpression: config.cronExpression ?? '0 * * * *', // Every hour at minute 0
      locations: config.locations ?? [],
      onUpdate: config.onUpdate ?? (() => {}),
      onError: config.onError ?? ((error) => console.error('Scheduler error:', error)),
    };

    this.locations = new Map();
    this.metrics = {
      totalUpdates: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      lastUpdateTime: null,
      lastError: null,
    };

    // Register initial locations
    this.config.locations.forEach(loc => this.addLocation(loc));
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (!this.config.enabled) {
      console.log('Weather update scheduler is disabled');
      return;
    }

    if (this.cronJob) {
      console.log('Weather update scheduler is already running');
      return;
    }

    // Validate cron expression
    if (!cron.validate(this.config.cronExpression)) {
      throw new Error(`Invalid cron expression: ${this.config.cronExpression}`);
    }

    this.cronJob = cron.schedule(this.config.cronExpression, async () => {
      await this.runUpdate();
    });

    this.isRunning = true;
    console.log(`Weather update scheduler started with expression: ${this.config.cronExpression}`);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.isRunning = false;
      console.log('Weather update scheduler stopped');
    }
  }

  /**
   * Check if scheduler is running
   */
  isSchedulerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Add a location to update schedule
   */
  addLocation(location: WeatherLocation): void {
    const key = this.getLocationKey(location);
    this.locations.set(key, location);
    console.log(`Added location to scheduler: ${location.name || key}`);
  }

  /**
   * Remove a location from update schedule
   */
  removeLocation(location: WeatherLocation): void {
    const key = this.getLocationKey(location);
    const removed = this.locations.delete(key);
    if (removed) {
      console.log(`Removed location from scheduler: ${location.name || key}`);
    }
  }

  /**
   * Get all registered locations
   */
  getLocations(): WeatherLocation[] {
    return Array.from(this.locations.values());
  }

  /**
   * Clear all locations
   */
  clearLocations(): void {
    this.locations.clear();
    console.log('Cleared all locations from scheduler');
  }

  /**
   * Manually trigger an update for all locations
   */
  async triggerUpdate(): Promise<void> {
    await this.runUpdate();
  }

  /**
   * Run weather update for all registered locations
   */
  private async runUpdate(): Promise<void> {
    if (this.locations.size === 0) {
      console.log('No locations registered for weather updates');
      return;
    }

    console.log(`Starting weather update for ${this.locations.size} location(s)`);
    const startTime = Date.now();

    for (const [key, location] of this.locations.entries()) {
      try {
        // Fetch weather data (will be cached by WeatherService)
        await this.weatherService.getWeather(location);
        
        this.metrics.successfulUpdates++;
        this.config.onUpdate(location, true);
        
        console.log(`Successfully updated weather for: ${location.name || key}`);
      } catch (error) {
        const err = error as Error;
        this.metrics.failedUpdates++;
        this.metrics.lastError = err;
        this.config.onUpdate(location, false, err);
        
        console.error(`Failed to update weather for ${location.name || key}:`, err.message);
      }

      this.metrics.totalUpdates++;
    }

    this.metrics.lastUpdateTime = new Date();
    const duration = Date.now() - startTime;
    console.log(`Weather update completed in ${duration}ms`);
  }

  /**
   * Get location key for map storage
   */
  private getLocationKey(location: WeatherLocation): string {
    return `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
  }

  /**
   * Get scheduler metrics
   */
  getMetrics(): UpdateMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalUpdates: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      lastUpdateTime: null,
      lastError: null,
    };
    console.log('Scheduler metrics reset');
  }

  /**
   * Get scheduler configuration
   */
  getConfig(): SchedulerConfig {
    return {
      enabled: this.config.enabled,
      cronExpression: this.config.cronExpression,
      locations: Array.from(this.locations.values()),
    };
  }

  /**
   * Update cron expression (requires restart)
   */
  updateCronExpression(expression: string): void {
    if (!cron.validate(expression)) {
      throw new Error(`Invalid cron expression: ${expression}`);
    }

    const wasRunning = this.isRunning;
    if (wasRunning) {
      this.stop();
    }

    this.config.cronExpression = expression;

    if (wasRunning) {
      this.start();
    }

    console.log(`Updated cron expression to: ${expression}`);
  }
}

/**
 * Create weather update scheduler instance
 */
export function createWeatherUpdateScheduler(
  weatherService: WeatherService,
  config?: SchedulerConfig
): WeatherUpdateScheduler {
  return new WeatherUpdateScheduler(weatherService, config);
}
