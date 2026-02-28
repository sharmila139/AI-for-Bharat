/**
 * Weather Alert Service
 * Generates weather alerts based on configurable thresholds
 * Features: multiple alert types, severity levels, threshold monitoring, crop-specific advisories
 */

import { WeatherService, WeatherLocation, WeatherData } from './weather-service';

export type AlertType = 
  | 'frost' 
  | 'heavy_rain' 
  | 'high_temperature' 
  | 'strong_winds'
  | 'drought'
  | 'heatwave'
  | 'pest_risk';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface WeatherAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  location: WeatherLocation;
  title: string;
  description: string;
  advisories: string[];
  timestamp: Date;
  validUntil: Date;
  metadata: {
    currentValue?: number;
    threshold?: number;
    unit?: string;
    affectedCrops?: string[];
  };
}

export interface AlertThresholds {
  frost: {
    critical: number; // Temperature in °C
    warning: number;
    leadTimeHours: number;
  };
  heavyRain: {
    critical24h: number; // Rainfall in mm
    warning24h: number;
    critical72h: number;
    warning72h: number;
  };
  highTemperature: {
    critical: number; // Temperature in °C
    warning: number;
  };
  strongWinds: {
    critical: number; // Wind speed in m/s
    warning: number;
  };
  drought: {
    daysWithoutRain: number;
    minRainfall: number; // mm
  };
  heatwave: {
    temperature: number; // °C
    consecutiveDays: number;
  };
  pestRisk: {
    minHumidity: number; // %
    maxHumidity: number;
    minTemperature: number; // °C
    maxTemperature: number;
  };
}

export interface AlertServiceConfig {
  thresholds?: Partial<AlertThresholds>;
  enabledAlertTypes?: AlertType[];
  checkIntervalMinutes?: number;
}

/**
 * Weather Alert Service
 * Monitors weather conditions and generates alerts based on thresholds
 */
export class WeatherAlertService {
  private weatherService: WeatherService;
  private thresholds: AlertThresholds;
  private enabledAlertTypes: Set<AlertType>;
  private activeAlerts: Map<string, WeatherAlert>;
  private alertHistory: WeatherAlert[];

  constructor(weatherService: WeatherService, config: AlertServiceConfig = {}) {
    this.weatherService = weatherService;
    this.thresholds = this.getDefaultThresholds(config.thresholds);
    this.enabledAlertTypes = new Set(
      config.enabledAlertTypes || [
        'frost',
        'heavy_rain',
        'high_temperature',
        'strong_winds',
        'drought',
        'heatwave',
        'pest_risk'
      ]
    );
    this.activeAlerts = new Map();
    this.alertHistory = [];
  }

  /**
   * Check weather conditions and generate alerts for a location
   */
  async checkAndGenerateAlerts(location: WeatherLocation): Promise<WeatherAlert[]> {
    const weatherData = await this.weatherService.getWeather(location);
    const alerts: WeatherAlert[] = [];

    // Check each enabled alert type
    if (this.enabledAlertTypes.has('frost')) {
      const frostAlert = this.checkFrostConditions(weatherData);
      if (frostAlert) alerts.push(frostAlert);
    }

    if (this.enabledAlertTypes.has('heavy_rain')) {
      const rainAlert = this.checkHeavyRainConditions(weatherData);
      if (rainAlert) alerts.push(rainAlert);
    }

    if (this.enabledAlertTypes.has('high_temperature')) {
      const tempAlert = this.checkHighTemperatureConditions(weatherData);
      if (tempAlert) alerts.push(tempAlert);
    }

    if (this.enabledAlertTypes.has('strong_winds')) {
      const windAlert = this.checkStrongWindConditions(weatherData);
      if (windAlert) alerts.push(windAlert);
    }

    if (this.enabledAlertTypes.has('drought')) {
      const droughtAlert = this.checkDroughtConditions(weatherData);
      if (droughtAlert) alerts.push(droughtAlert);
    }

    if (this.enabledAlertTypes.has('heatwave')) {
      const heatwaveAlert = this.checkHeatwaveConditions(weatherData);
      if (heatwaveAlert) alerts.push(heatwaveAlert);
    }

    if (this.enabledAlertTypes.has('pest_risk')) {
      const pestAlert = this.checkPestRiskConditions(weatherData);
      if (pestAlert) alerts.push(pestAlert);
    }

    // Store active alerts and add to history
    alerts.forEach(alert => {
      this.activeAlerts.set(alert.id, alert);
      this.alertHistory.push(alert);
    });

    return alerts;
  }

  /**
   * Check for frost conditions
   * Validates: Requirements 5.6 - Frost alert with 24-hour lead time
   */
  private checkFrostConditions(weatherData: WeatherData): WeatherAlert | null {
    const { current, hourlyForecast } = weatherData;
    const leadTimeHours = this.thresholds.frost.leadTimeHours;

    // Check forecast for next 24 hours
    const relevantForecast = hourlyForecast.slice(0, leadTimeHours);
    const minTemp = Math.min(
      current.temperature,
      ...relevantForecast.map(f => f.temperature.min)
    );

    let severity: AlertSeverity | null = null;
    if (minTemp <= this.thresholds.frost.critical) {
      severity = 'critical';
    } else if (minTemp <= this.thresholds.frost.warning) {
      severity = 'warning';
    }

    if (!severity) return null;

    return {
      id: this.generateAlertId('frost', weatherData.location),
      type: 'frost',
      severity,
      location: weatherData.location,
      title: severity === 'critical' ? 'Critical Frost Alert' : 'Frost Warning',
      description: `Temperature expected to drop to ${minTemp.toFixed(1)}°C within the next ${leadTimeHours} hours. Frost-sensitive crops are at risk.`,
      advisories: [
        'Cover sensitive crops with protective sheets or plastic',
        'Water crops before sunset to help retain heat',
        'Use smoke or heaters in small areas if possible',
        'Harvest mature crops that may be damaged',
        'Move potted plants indoors or to sheltered areas'
      ],
      timestamp: new Date(),
      validUntil: new Date(Date.now() + leadTimeHours * 60 * 60 * 1000),
      metadata: {
        currentValue: minTemp,
        threshold: severity === 'critical' ? this.thresholds.frost.critical : this.thresholds.frost.warning,
        unit: '°C',
        affectedCrops: ['tomatoes', 'peppers', 'cucumbers', 'beans', 'potatoes']
      }
    };
  }

  /**
   * Check for heavy rain conditions
   * Validates: Requirements 5.7 - Heavy rain alert with drainage recommendations
   */
  private checkHeavyRainConditions(weatherData: WeatherData): WeatherAlert | null {
    const { hourlyForecast, dailyForecast } = weatherData;

    // Calculate 24-hour rainfall
    const rainfall24h = hourlyForecast
      .slice(0, 24)
      .reduce((sum, f) => sum + f.rainfall, 0);

    // Calculate 72-hour rainfall
    const rainfall72h = dailyForecast
      .slice(0, 3)
      .reduce((sum, f) => sum + f.rainfall, 0);

    let severity: AlertSeverity | null = null;
    let rainfall = 0;
    let period = '';

    if (rainfall24h >= this.thresholds.heavyRain.critical24h) {
      severity = 'critical';
      rainfall = rainfall24h;
      period = '24 hours';
    } else if (rainfall24h >= this.thresholds.heavyRain.warning24h) {
      severity = 'warning';
      rainfall = rainfall24h;
      period = '24 hours';
    } else if (rainfall72h >= this.thresholds.heavyRain.critical72h) {
      severity = 'critical';
      rainfall = rainfall72h;
      period = '72 hours';
    } else if (rainfall72h >= this.thresholds.heavyRain.warning72h) {
      severity = 'warning';
      rainfall = rainfall72h;
      period = '72 hours';
    }

    if (!severity) return null;

    return {
      id: this.generateAlertId('heavy_rain', weatherData.location),
      type: 'heavy_rain',
      severity,
      location: weatherData.location,
      title: severity === 'critical' ? 'Critical Heavy Rain Alert' : 'Heavy Rain Warning',
      description: `Expected rainfall of ${rainfall.toFixed(1)}mm in the next ${period}. Risk of waterlogging and flooding.`,
      advisories: [
        'Ensure proper drainage in fields to prevent waterlogging',
        'Avoid irrigation during heavy rain period',
        'Protect crops from soil erosion with mulching',
        'Delay fertilizer application until after rain',
        'Check and clear drainage channels',
        'Harvest mature crops if possible before heavy rain'
      ],
      timestamp: new Date(),
      validUntil: new Date(Date.now() + (period === '24 hours' ? 24 : 72) * 60 * 60 * 1000),
      metadata: {
        currentValue: rainfall,
        threshold: period === '24 hours' 
          ? (severity === 'critical' ? this.thresholds.heavyRain.critical24h : this.thresholds.heavyRain.warning24h)
          : (severity === 'critical' ? this.thresholds.heavyRain.critical72h : this.thresholds.heavyRain.warning72h),
        unit: 'mm',
        affectedCrops: ['all crops']
      }
    };
  }

  /**
   * Check for high temperature conditions
   */
  private checkHighTemperatureConditions(weatherData: WeatherData): WeatherAlert | null {
    const { current, dailyForecast } = weatherData;

    // Check current and next 3 days
    const maxTemp = Math.max(
      current.temperature,
      ...dailyForecast.slice(0, 3).map(f => f.temperature.max)
    );

    let severity: AlertSeverity | null = null;
    if (maxTemp >= this.thresholds.highTemperature.critical) {
      severity = 'critical';
    } else if (maxTemp >= this.thresholds.highTemperature.warning) {
      severity = 'warning';
    }

    if (!severity) return null;

    return {
      id: this.generateAlertId('high_temperature', weatherData.location),
      type: 'high_temperature',
      severity,
      location: weatherData.location,
      title: severity === 'critical' ? 'Critical Heat Alert' : 'High Temperature Warning',
      description: `Temperature expected to reach ${maxTemp.toFixed(1)}°C. Risk of heat stress to crops and livestock.`,
      advisories: [
        'Increase irrigation frequency to prevent heat stress',
        'Apply mulch to retain soil moisture',
        'Provide shade for livestock',
        'Avoid working during peak heat hours (11 AM - 3 PM)',
        'Monitor crops for signs of wilting',
        'Consider light irrigation during evening hours'
      ],
      timestamp: new Date(),
      validUntil: new Date(Date.now() + 72 * 60 * 60 * 1000),
      metadata: {
        currentValue: maxTemp,
        threshold: severity === 'critical' ? this.thresholds.highTemperature.critical : this.thresholds.highTemperature.warning,
        unit: '°C',
        affectedCrops: ['wheat', 'rice', 'vegetables', 'fruits']
      }
    };
  }

  /**
   * Check for strong wind conditions
   */
  private checkStrongWindConditions(weatherData: WeatherData): WeatherAlert | null {
    const { current, hourlyForecast } = weatherData;

    // Check current and next 24 hours
    const maxWindSpeed = Math.max(
      current.windSpeed,
      ...hourlyForecast.slice(0, 24).map(f => f.windSpeed || 0)
    );

    let severity: AlertSeverity | null = null;
    if (maxWindSpeed >= this.thresholds.strongWinds.critical) {
      severity = 'critical';
    } else if (maxWindSpeed >= this.thresholds.strongWinds.warning) {
      severity = 'warning';
    }

    if (!severity) return null;

    return {
      id: this.generateAlertId('strong_winds', weatherData.location),
      type: 'strong_winds',
      severity,
      location: weatherData.location,
      title: severity === 'critical' ? 'Critical Wind Alert' : 'Strong Wind Warning',
      description: `Wind speeds expected to reach ${maxWindSpeed.toFixed(1)} m/s. Risk of crop damage and lodging.`,
      advisories: [
        'Stake tall crops to prevent lodging',
        'Secure greenhouse structures and shade nets',
        'Harvest mature crops if possible',
        'Avoid spraying pesticides or fertilizers',
        'Check and secure irrigation equipment',
        'Protect young seedlings with windbreaks'
      ],
      timestamp: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metadata: {
        currentValue: maxWindSpeed,
        threshold: severity === 'critical' ? this.thresholds.strongWinds.critical : this.thresholds.strongWinds.warning,
        unit: 'm/s',
        affectedCrops: ['tall crops', 'fruit trees', 'vegetables']
      }
    };
  }

  /**
   * Check for drought conditions
   */
  private checkDroughtConditions(weatherData: WeatherData): WeatherAlert | null {
    const { dailyForecast } = weatherData;

    // Check next 7 days for rainfall
    const next7Days = dailyForecast.slice(0, 7);
    const totalRainfall = next7Days.reduce((sum, f) => sum + f.rainfall, 0);
    const daysWithRain = next7Days.filter(f => f.rainfall >= this.thresholds.drought.minRainfall).length;
    const daysWithoutRain = 7 - daysWithRain;

    if (daysWithoutRain < this.thresholds.drought.daysWithoutRain) {
      return null;
    }

    const severity: AlertSeverity = totalRainfall < 5 ? 'critical' : 'warning';

    return {
      id: this.generateAlertId('drought', weatherData.location),
      type: 'drought',
      severity,
      location: weatherData.location,
      title: severity === 'critical' ? 'Critical Drought Alert' : 'Drought Warning',
      description: `Only ${totalRainfall.toFixed(1)}mm rainfall expected in next 7 days. ${daysWithoutRain} days without significant rain.`,
      advisories: [
        'Implement water conservation measures',
        'Use drip irrigation to minimize water waste',
        'Apply mulch to retain soil moisture',
        'Consider drought-resistant crop varieties',
        'Prioritize irrigation for high-value crops',
        'Monitor soil moisture levels regularly'
      ],
      timestamp: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      metadata: {
        currentValue: totalRainfall,
        threshold: this.thresholds.drought.minRainfall,
        unit: 'mm',
        affectedCrops: ['all crops']
      }
    };
  }

  /**
   * Check for heatwave conditions
   */
  private checkHeatwaveConditions(weatherData: WeatherData): WeatherAlert | null {
    const { dailyForecast } = weatherData;

    // Check for consecutive days above threshold
    const consecutiveDays = this.thresholds.heatwave.consecutiveDays;
    const threshold = this.thresholds.heatwave.temperature;

    let consecutiveCount = 0;
    for (const day of dailyForecast.slice(0, 7)) {
      if (day.temperature.max >= threshold) {
        consecutiveCount++;
        if (consecutiveCount >= consecutiveDays) {
          break;
        }
      } else {
        consecutiveCount = 0;
      }
    }

    if (consecutiveCount < consecutiveDays) {
      return null;
    }

    return {
      id: this.generateAlertId('heatwave', weatherData.location),
      type: 'heatwave',
      severity: 'critical',
      location: weatherData.location,
      title: 'Heatwave Alert',
      description: `${consecutiveCount} consecutive days with temperatures above ${threshold}°C expected. Severe heat stress risk.`,
      advisories: [
        'Increase irrigation frequency significantly',
        'Provide shade for crops where possible',
        'Apply reflective mulch to reduce soil temperature',
        'Avoid field work during peak heat hours',
        'Monitor livestock closely for heat stress',
        'Consider emergency harvesting of sensitive crops'
      ],
      timestamp: new Date(),
      validUntil: new Date(Date.now() + consecutiveCount * 24 * 60 * 60 * 1000),
      metadata: {
        currentValue: consecutiveCount,
        threshold: consecutiveDays,
        unit: 'days',
        affectedCrops: ['all crops', 'livestock']
      }
    };
  }

  /**
   * Check for pest risk conditions
   * Validates: Requirements 5.8 - Pest risk advisory based on humidity and temperature
   */
  private checkPestRiskConditions(weatherData: WeatherData): WeatherAlert | null {
    const { current } = weatherData;
    const { minHumidity, maxHumidity, minTemperature, maxTemperature } = this.thresholds.pestRisk;

    // Check if conditions are favorable for pests
    const humidityInRange = current.humidity >= minHumidity && current.humidity <= maxHumidity;
    const temperatureInRange = current.temperature >= minTemperature && current.temperature <= maxTemperature;

    if (!humidityInRange || !temperatureInRange) {
      return null;
    }

    return {
      id: this.generateAlertId('pest_risk', weatherData.location),
      type: 'pest_risk',
      severity: 'warning',
      location: weatherData.location,
      title: 'Pest Risk Advisory',
      description: `Current conditions (${current.temperature.toFixed(1)}°C, ${current.humidity}% humidity) are favorable for pest activity.`,
      advisories: [
        'Monitor crops regularly for pest infestation',
        'Apply preventive organic pesticides if needed',
        'Check undersides of leaves for eggs',
        'Use pheromone traps for early detection',
        'Maintain field hygiene and remove crop residues',
        'Consider biological pest control methods'
      ],
      timestamp: new Date(),
      validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
      metadata: {
        currentValue: current.humidity,
        threshold: maxHumidity,
        unit: '%',
        affectedCrops: ['vegetables', 'fruits', 'cotton']
      }
    };
  }

  /**
   * Get all active alerts for a location
   */
  getActiveAlerts(location?: WeatherLocation): WeatherAlert[] {
    const now = new Date();
    const alerts = Array.from(this.activeAlerts.values()).filter(
      alert => alert.validUntil > now
    );

    if (location) {
      return alerts.filter(
        alert => this.isSameLocation(alert.location, location)
      );
    }

    return alerts;
  }

  /**
   * Get alert history
   */
  getAlertHistory(location?: WeatherLocation, limit?: number): WeatherAlert[] {
    let history = [...this.alertHistory];

    if (location) {
      history = history.filter(alert => this.isSameLocation(alert.location, location));
    }

    // Sort by timestamp descending
    history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (limit) {
      history = history.slice(0, limit);
    }

    return history;
  }

  /**
   * Clear expired alerts
   */
  clearExpiredAlerts(): number {
    const now = new Date();
    let clearedCount = 0;

    for (const [id, alert] of this.activeAlerts.entries()) {
      if (alert.validUntil <= now) {
        this.activeAlerts.delete(id);
        clearedCount++;
      }
    }

    return clearedCount;
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(thresholds: Partial<AlertThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds(): AlertThresholds {
    return { ...this.thresholds };
  }

  /**
   * Enable/disable alert types
   */
  setEnabledAlertTypes(types: AlertType[]): void {
    this.enabledAlertTypes = new Set(types);
  }

  /**
   * Get enabled alert types
   */
  getEnabledAlertTypes(): AlertType[] {
    return Array.from(this.enabledAlertTypes);
  }

  /**
   * Get default thresholds
   */
  private getDefaultThresholds(overrides?: Partial<AlertThresholds>): AlertThresholds {
    const defaults: AlertThresholds = {
      frost: {
        critical: -2,
        warning: 2,
        leadTimeHours: 24
      },
      heavyRain: {
        critical24h: 50,
        warning24h: 30,
        critical72h: 100,
        warning72h: 70
      },
      highTemperature: {
        critical: 40,
        warning: 35
      },
      strongWinds: {
        critical: 15, // ~54 km/h
        warning: 10   // ~36 km/h
      },
      drought: {
        daysWithoutRain: 5,
        minRainfall: 2
      },
      heatwave: {
        temperature: 38,
        consecutiveDays: 3
      },
      pestRisk: {
        minHumidity: 80,
        maxHumidity: 100,
        minTemperature: 25,
        maxTemperature: 35
      }
    };

    return { ...defaults, ...overrides };
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(type: AlertType, location: WeatherLocation): string {
    const locationKey = `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
    return `ALERT-${type}-${locationKey}-${Date.now()}`;
  }

  /**
   * Check if two locations are the same
   */
  private isSameLocation(loc1: WeatherLocation, loc2: WeatherLocation): boolean {
    return (
      loc1.latitude.toFixed(4) === loc2.latitude.toFixed(4) &&
      loc1.longitude.toFixed(4) === loc2.longitude.toFixed(4)
    );
  }

  /**
   * Clear all alerts (for testing)
   */
  clear(): void {
    this.activeAlerts.clear();
    this.alertHistory = [];
  }
}

/**
 * Create weather alert service instance
 */
export function createWeatherAlertService(
  weatherService: WeatherService,
  config?: AlertServiceConfig
): WeatherAlertService {
  return new WeatherAlertService(weatherService, config);
}
