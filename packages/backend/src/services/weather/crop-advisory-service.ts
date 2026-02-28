/**
 * Crop-Specific Advisory Service
 * Generates tailored weather advisories based on crop type and growth stage
 * Validates: Requirements 5.5 - Crop-specific advisories with immediate actions
 */

import { WeatherData } from './weather-service';
import { WeatherAlert, AlertType } from './weather-alert-service';

export type CropType = 
  | 'wheat' 
  | 'rice' 
  | 'tomatoes' 
  | 'peppers' 
  | 'potatoes'
  | 'cotton'
  | 'sugarcane'
  | 'maize'
  | 'onions'
  | 'beans';

export type GrowthStage = 
  | 'seedling' 
  | 'vegetative' 
  | 'flowering' 
  | 'fruiting' 
  | 'harvest';

export interface CropInfo {
  type: CropType;
  growthStage: GrowthStage;
  plantedDate?: Date;
  expectedHarvestDate?: Date;
}

export interface CropAdvisory {
  cropType: CropType;
  growthStage: GrowthStage;
  alertType: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  immediateActions: string[];
  preventiveMeasures: string[];
  warnings: string[];
  expectedImpact: string;
  timeframe: string;
  metadata: {
    weatherCondition: string;
    riskLevel: number; // 0-100
    affectedYield?: string;
  };
}

export interface CropSensitivity {
  frost: { min: number; max: number; critical: number };
  heat: { min: number; max: number; critical: number };
  rainfall: { min: number; max: number; critical: number };
  wind: { min: number; max: number; critical: number };
  humidity: { min: number; max: number };
}

/**
 * Crop Advisory Service
 * Generates crop-specific advisories based on weather conditions and growth stages
 */
export class CropAdvisoryService {
  private cropSensitivities: Map<CropType, Map<GrowthStage, CropSensitivity>>;

  constructor() {
    this.cropSensitivities = new Map();
    this.initializeCropSensitivities();
  }

  /**
   * Generate crop-specific advisory based on weather alert
   */
  generateAdvisory(
    alert: WeatherAlert,
    cropInfo: CropInfo,
    weatherData: WeatherData
  ): CropAdvisory {
    const sensitivity = this.getCropSensitivity(cropInfo.type, cropInfo.growthStage);
    const riskLevel = this.calculateRiskLevel(alert, cropInfo, weatherData, sensitivity);
    const severity = this.determineSeverity(riskLevel);

    return {
      cropType: cropInfo.type,
      growthStage: cropInfo.growthStage,
      alertType: alert.type,
      severity,
      immediateActions: this.getImmediateActions(alert.type, cropInfo, severity),
      preventiveMeasures: this.getPreventiveMeasures(alert.type, cropInfo, severity),
      warnings: this.getWarnings(alert.type, cropInfo, severity),
      expectedImpact: this.getExpectedImpact(alert.type, cropInfo, riskLevel),
      timeframe: this.getTimeframe(alert),
      metadata: {
        weatherCondition: alert.description,
        riskLevel,
        affectedYield: this.estimateYieldImpact(riskLevel)
      }
    };
  }

  /**
   * Generate advisories for multiple crops
   */
  generateAdvisories(
    alert: WeatherAlert,
    crops: CropInfo[],
    weatherData: WeatherData
  ): CropAdvisory[] {
    return crops.map(crop => this.generateAdvisory(alert, crop, weatherData));
  }

  /**
   * Calculate risk level for crop based on weather conditions
   */
  private calculateRiskLevel(
    alert: WeatherAlert,
    cropInfo: CropInfo,
    weatherData: WeatherData,
    sensitivity: CropSensitivity
  ): number {
    let riskLevel = 0;

    switch (alert.type) {
      case 'frost':
        riskLevel = this.calculateFrostRisk(weatherData, sensitivity, cropInfo.growthStage);
        break;
      case 'heavy_rain':
        riskLevel = this.calculateRainfallRisk(weatherData, sensitivity, cropInfo.growthStage);
        break;
      case 'high_temperature':
      case 'heatwave':
        riskLevel = this.calculateHeatRisk(weatherData, sensitivity, cropInfo.growthStage);
        break;
      case 'strong_winds':
        riskLevel = this.calculateWindRisk(weatherData, sensitivity, cropInfo.growthStage);
        break;
      case 'pest_risk':
        riskLevel = this.calculatePestRisk(weatherData, sensitivity, cropInfo.type);
        break;
      case 'drought':
        riskLevel = this.calculateDroughtRisk(weatherData, sensitivity, cropInfo.growthStage);
        break;
    }

    return Math.min(100, Math.max(0, riskLevel));
  }

  /**
   * Calculate frost risk for crop
   */
  private calculateFrostRisk(
    weatherData: WeatherData,
    sensitivity: CropSensitivity,
    _growthStage: GrowthStage
  ): number {
    const minTemp = Math.min(
      weatherData.current.temperature,
      ...weatherData.hourlyForecast.slice(0, 24).map(f => f.temperature.min)
    );

    if (minTemp <= sensitivity.frost.critical) {
      return 100;
    } else if (minTemp <= sensitivity.frost.min) {
      const range = sensitivity.frost.min - sensitivity.frost.critical;
      const diff = minTemp - sensitivity.frost.critical;
      return 100 - (diff / range) * 30; // 70-100 range
    } else if (minTemp <= sensitivity.frost.max) {
      const range = sensitivity.frost.max - sensitivity.frost.min;
      const diff = minTemp - sensitivity.frost.min;
      return 70 - (diff / range) * 40; // 30-70 range
    }

    return 0;
  }

  /**
   * Calculate rainfall risk for crop
   */
  private calculateRainfallRisk(
    weatherData: WeatherData,
    sensitivity: CropSensitivity,
    _growthStage: GrowthStage
  ): number {
    const rainfall24h = weatherData.hourlyForecast
      .slice(0, 24)
      .reduce((sum, f) => sum + f.rainfall, 0);

    if (rainfall24h >= sensitivity.rainfall.critical) {
      return 100;
    } else if (rainfall24h >= sensitivity.rainfall.max) {
      const range = sensitivity.rainfall.critical - sensitivity.rainfall.max;
      const diff = rainfall24h - sensitivity.rainfall.max;
      return 70 + (diff / range) * 30; // 70-100 range
    } else if (rainfall24h >= sensitivity.rainfall.min) {
      const range = sensitivity.rainfall.max - sensitivity.rainfall.min;
      const diff = rainfall24h - sensitivity.rainfall.min;
      return 30 + (diff / range) * 40; // 30-70 range
    }

    return 0;
  }

  /**
   * Calculate heat risk for crop
   */
  private calculateHeatRisk(
    weatherData: WeatherData,
    sensitivity: CropSensitivity,
    _growthStage: GrowthStage
  ): number {
    const maxTemp = Math.max(
      weatherData.current.temperature,
      ...weatherData.dailyForecast.slice(0, 3).map(f => f.temperature.max)
    );

    if (maxTemp >= sensitivity.heat.critical) {
      return 100;
    } else if (maxTemp >= sensitivity.heat.max) {
      const range = sensitivity.heat.critical - sensitivity.heat.max;
      const diff = maxTemp - sensitivity.heat.max;
      return 70 + (diff / range) * 30; // 70-100 range
    } else if (maxTemp >= sensitivity.heat.min) {
      const range = sensitivity.heat.max - sensitivity.heat.min;
      const diff = maxTemp - sensitivity.heat.min;
      return 30 + (diff / range) * 40; // 30-70 range
    }

    return 0;
  }

  /**
   * Calculate wind risk for crop
   */
  private calculateWindRisk(
    weatherData: WeatherData,
    sensitivity: CropSensitivity,
    _growthStage: GrowthStage
  ): number {
    const maxWind = Math.max(
      weatherData.current.windSpeed,
      ...weatherData.hourlyForecast.slice(0, 24).map(f => f.windSpeed || 0)
    );

    if (maxWind >= sensitivity.wind.critical) {
      return 100;
    } else if (maxWind >= sensitivity.wind.max) {
      const range = sensitivity.wind.critical - sensitivity.wind.max;
      const diff = maxWind - sensitivity.wind.max;
      return 70 + (diff / range) * 30;
    } else if (maxWind >= sensitivity.wind.min) {
      const range = sensitivity.wind.max - sensitivity.wind.min;
      const diff = maxWind - sensitivity.wind.min;
      return 30 + (diff / range) * 40;
    }

    return 0;
  }

  /**
   * Calculate pest risk for crop
   */
  private calculatePestRisk(
    weatherData: WeatherData,
    _sensitivity: CropSensitivity,
    cropType: CropType
  ): number {
    const { temperature, humidity } = weatherData.current;

    // Pest-prone crops have higher base risk
    const pestProneCrops: CropType[] = ['tomatoes', 'peppers', 'cotton', 'rice'];
    const baseRisk = pestProneCrops.includes(cropType) ? 50 : 30;

    // Check if conditions are in optimal pest range
    const humidityInRange = humidity >= 80 && humidity <= 100;
    const tempInRange = temperature >= 25 && temperature <= 35;

    if (humidityInRange && tempInRange) {
      return baseRisk + 40; // High risk
    } else if (humidityInRange || tempInRange) {
      return baseRisk + 20; // Moderate risk
    }

    return baseRisk;
  }

  /**
   * Calculate drought risk for crop
   */
  private calculateDroughtRisk(
    weatherData: WeatherData,
    _sensitivity: CropSensitivity,
    growthStage: GrowthStage
  ): number {
    const rainfall7days = weatherData.dailyForecast
      .slice(0, 7)
      .reduce((sum, f) => sum + f.rainfall, 0);

    // Critical growth stages are more sensitive to drought
    const criticalStages: GrowthStage[] = ['flowering', 'fruiting'];
    const stageMultiplier = criticalStages.includes(growthStage) ? 1.5 : 1.0;

    if (rainfall7days < 5) {
      return Math.min(100, 90 * stageMultiplier);
    } else if (rainfall7days < 10) {
      return Math.min(100, 60 * stageMultiplier);
    } else if (rainfall7days < 20) {
      return Math.min(100, 30 * stageMultiplier);
    }

    return 0;
  }

  /**
   * Determine severity based on risk level
   */
  private determineSeverity(riskLevel: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskLevel >= 80) return 'critical';
    if (riskLevel >= 60) return 'high';
    if (riskLevel >= 30) return 'medium';
    return 'low';
  }

  /**
   * Get immediate actions for crop and alert type
   */
  private getImmediateActions(
    alertType: AlertType,
    cropInfo: CropInfo,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): string[] {
    const actions: string[] = [];
    const { type: cropType, growthStage } = cropInfo;

    switch (alertType) {
      case 'frost':
        if (severity === 'critical' || severity === 'high') {
          actions.push('Cover plants immediately with frost cloth or plastic sheets');
          actions.push('Water crops before sunset to help retain soil heat');
          if (growthStage === 'fruiting' || growthStage === 'flowering') {
            actions.push('Harvest mature produce immediately to prevent total loss');
          }
          if (['tomatoes', 'peppers'].includes(cropType)) {
            actions.push('Use smoke pots or heaters in small areas if available');
          }
        } else {
          actions.push('Monitor temperature closely and prepare protective covers');
          actions.push('Move potted plants to sheltered areas');
        }
        break;

      case 'heavy_rain':
        actions.push('Ensure drainage channels are clear and functional');
        actions.push('Stop all irrigation immediately');
        if (growthStage === 'harvest') {
          actions.push('Harvest mature crops before heavy rain if possible');
        }
        if (['tomatoes', 'peppers', 'potatoes'].includes(cropType)) {
          actions.push('Apply fungicide to prevent disease outbreak after rain');
        }
        if (severity === 'critical') {
          actions.push('Create emergency drainage trenches in low-lying areas');
        }
        break;

      case 'high_temperature':
      case 'heatwave':
        actions.push('Increase irrigation frequency to twice daily (morning and evening)');
        actions.push('Apply organic mulch to retain soil moisture');
        if (['wheat', 'rice'].includes(cropType) && growthStage === 'flowering') {
          actions.push('Irrigate during flowering hours to prevent pollen sterility');
        }
        if (severity === 'critical') {
          actions.push('Provide temporary shade using shade nets if available');
          if (growthStage === 'harvest') {
            actions.push('Consider emergency harvesting to prevent quality loss');
          }
        }
        break;

      case 'strong_winds':
        if (growthStage === 'flowering' || growthStage === 'fruiting') {
          actions.push('Stake tall plants and provide support structures immediately');
        }
        actions.push('Secure greenhouse structures and shade nets');
        if (growthStage === 'harvest') {
          actions.push('Harvest mature crops to prevent wind damage');
        }
        actions.push('Avoid spraying pesticides or fertilizers until winds subside');
        break;

      case 'pest_risk':
        actions.push('Inspect crops daily for early signs of pest infestation');
        actions.push('Check undersides of leaves for eggs and larvae');
        if (['tomatoes', 'peppers'].includes(cropType)) {
          actions.push('Apply neem oil spray as preventive measure');
        }
        actions.push('Set up pheromone traps for early detection');
        break;

      case 'drought':
        actions.push('Switch to drip irrigation to minimize water waste');
        actions.push('Apply thick layer of mulch to conserve soil moisture');
        if (severity === 'critical') {
          actions.push('Prioritize irrigation for high-value or critical-stage crops');
          if (growthStage === 'seedling') {
            actions.push('Consider replanting with drought-resistant varieties');
          }
        }
        break;
    }

    return actions;
  }

  /**
   * Get preventive measures for crop and alert type
   */
  private getPreventiveMeasures(
    alertType: AlertType,
    cropInfo: CropInfo,
    _severity: 'low' | 'medium' | 'high' | 'critical'
  ): string[] {
    const measures: string[] = [];
    const { type: cropType } = cropInfo;

    switch (alertType) {
      case 'frost':
        measures.push('Install permanent frost protection structures for future seasons');
        measures.push('Plant frost-resistant varieties in frost-prone areas');
        measures.push('Maintain good air circulation to prevent cold air pockets');
        break;

      case 'heavy_rain':
        measures.push('Improve field drainage system with proper channels');
        measures.push('Build raised beds for better water drainage');
        measures.push('Maintain soil organic matter to improve water infiltration');
        if (['tomatoes', 'peppers'].includes(cropType)) {
          measures.push('Use disease-resistant varieties in high-rainfall areas');
        }
        break;

      case 'high_temperature':
      case 'heatwave':
        measures.push('Install permanent shade nets for sensitive crops');
        measures.push('Use heat-tolerant varieties in hot regions');
        measures.push('Maintain soil organic matter to improve water retention');
        measures.push('Plant windbreaks to reduce heat stress');
        break;

      case 'strong_winds':
        measures.push('Establish windbreaks with trees or shrubs');
        measures.push('Use dwarf or wind-resistant crop varieties');
        measures.push('Install permanent support structures for tall crops');
        break;

      case 'pest_risk':
        measures.push('Practice crop rotation to break pest cycles');
        measures.push('Maintain field hygiene by removing crop residues');
        measures.push('Encourage beneficial insects with companion planting');
        measures.push('Use pest-resistant varieties when available');
        break;

      case 'drought':
        measures.push('Install efficient irrigation systems (drip or sprinkler)');
        measures.push('Harvest rainwater for irrigation during dry periods');
        measures.push('Select drought-tolerant crop varieties');
        measures.push('Improve soil water-holding capacity with organic matter');
        break;
    }

    return measures;
  }

  /**
   * Get warnings for crop and alert type
   */
  private getWarnings(
    alertType: AlertType,
    cropInfo: CropInfo,
    _severity: 'low' | 'medium' | 'high' | 'critical'
  ): string[] {
    const warnings: string[] = [];
    const { type: cropType } = cropInfo;

    switch (alertType) {
      case 'frost':
        if (['tomatoes', 'peppers', 'beans'].includes(cropType)) {
          warnings.push('These crops are highly frost-sensitive and may suffer complete loss');
        }
        if (cropInfo.growthStage === 'flowering' || cropInfo.growthStage === 'fruiting') {
          warnings.push('Frost during flowering/fruiting can cause severe yield reduction');
        }
        if (_severity === 'critical') {
          warnings.push('Temperatures below -2°C can kill plants even with protection');
        }
        break;

      case 'heavy_rain':
        warnings.push('Waterlogging can cause root rot and plant death within 24-48 hours');
        if (['tomatoes', 'peppers', 'potatoes'].includes(cropType)) {
          warnings.push('High risk of fungal diseases (blight, rot) after heavy rain');
        }
        if (cropInfo.growthStage === 'flowering') {
          warnings.push('Heavy rain can wash away flowers and reduce fruit set');
        }
        break;

      case 'high_temperature':
      case 'heatwave':
        if (['wheat', 'rice'].includes(cropType) && cropInfo.growthStage === 'flowering') {
          warnings.push('High temperatures during flowering cause pollen sterility and yield loss');
        }
        warnings.push('Heat stress can cause permanent damage if not addressed within 24 hours');
        if (_severity === 'critical') {
          warnings.push('Temperatures above 40°C can cause irreversible crop damage');
        }
        break;

      case 'strong_winds':
        if (cropInfo.growthStage === 'flowering' || cropInfo.growthStage === 'fruiting') {
          warnings.push('Wind can cause flower/fruit drop, significantly reducing yield');
        }
        if (['tomatoes', 'peppers'].includes(cropType)) {
          warnings.push('Tall plants are prone to lodging (falling over) in strong winds');
        }
        break;

      case 'pest_risk':
        warnings.push('Pest populations can explode rapidly in favorable conditions');
        if (['tomatoes', 'peppers'].includes(cropType)) {
          warnings.push('High risk of aphids, whiteflies, and fruit borers');
        }
        if (cropType === 'cotton') {
          warnings.push('High risk of bollworm infestation');
        }
        break;

      case 'drought':
        if (cropInfo.growthStage === 'flowering' || cropInfo.growthStage === 'fruiting') {
          warnings.push('Water stress during critical stages causes severe yield reduction');
        }
        warnings.push('Prolonged drought can cause permanent wilting and plant death');
        if (_severity === 'critical') {
          warnings.push('Crop may not recover even with irrigation if stress is prolonged');
        }
        break;
    }

    return warnings;
  }

  /**
   * Get expected impact description
   */
  private getExpectedImpact(
    alertType: AlertType,
    cropInfo: CropInfo,
    riskLevel: number
  ): string {
    const { type: cropType, growthStage } = cropInfo;
    const severity = this.determineSeverity(riskLevel);

    const impactMap: Record<string, Record<string, string>> = {
      frost: {
        critical: `Complete crop loss likely for ${cropType}. Immediate action required.`,
        high: `Severe damage expected. Yield reduction of 50-80% possible.`,
        medium: `Moderate damage expected. Yield reduction of 20-50% possible.`,
        low: `Minor damage possible. Yield reduction of 5-20% possible.`
      },
      heavy_rain: {
        critical: `Severe waterlogging and disease risk. Yield loss of 40-70% possible.`,
        high: `Significant waterlogging risk. Yield reduction of 20-40% possible.`,
        medium: `Moderate waterlogging risk. Yield reduction of 10-20% possible.`,
        low: `Minor waterlogging risk. Minimal yield impact expected.`
      },
      high_temperature: {
        critical: `Severe heat stress. Yield reduction of 30-60% likely.`,
        high: `Significant heat stress. Yield reduction of 15-30% possible.`,
        medium: `Moderate heat stress. Yield reduction of 5-15% possible.`,
        low: `Minor heat stress. Minimal yield impact expected.`
      },
      strong_winds: {
        critical: `Severe lodging and physical damage. Yield loss of 30-50% possible.`,
        high: `Significant wind damage. Yield reduction of 15-30% possible.`,
        medium: `Moderate wind damage. Yield reduction of 5-15% possible.`,
        low: `Minor wind damage. Minimal yield impact expected.`
      },
      pest_risk: {
        critical: `High pest infestation risk. Yield loss of 40-80% without control.`,
        high: `Significant pest risk. Yield reduction of 20-40% possible.`,
        medium: `Moderate pest risk. Yield reduction of 10-20% possible.`,
        low: `Low pest risk. Minimal yield impact with monitoring.`
      },
      drought: {
        critical: `Severe water stress. Yield reduction of 50-90% likely.`,
        high: `Significant water stress. Yield reduction of 30-50% possible.`,
        medium: `Moderate water stress. Yield reduction of 15-30% possible.`,
        low: `Minor water stress. Yield reduction of 5-15% possible.`
      }
    };

    const baseImpact = impactMap[alertType]?.[severity] || 'Impact assessment unavailable.';

    // Add growth stage specific impact
    if (growthStage === 'flowering' || growthStage === 'fruiting') {
      return `${baseImpact} Critical growth stage - impact may be higher.`;
    }

    return baseImpact;
  }

  /**
   * Get timeframe for action
   */
  private getTimeframe(alert: WeatherAlert): string {
    const hoursUntilExpiry = Math.floor(
      (alert.validUntil.getTime() - alert.timestamp.getTime()) / (1000 * 60 * 60)
    );

    if (hoursUntilExpiry <= 6) {
      return 'Immediate action required (within 6 hours)';
    } else if (hoursUntilExpiry <= 24) {
      return 'Action required within 24 hours';
    } else if (hoursUntilExpiry <= 48) {
      return 'Action required within 48 hours';
    } else {
      return `Action required within ${Math.ceil(hoursUntilExpiry / 24)} days`;
    }
  }

  /**
   * Estimate yield impact percentage
   */
  private estimateYieldImpact(riskLevel: number): string {
    if (riskLevel >= 80) {
      return '40-80% yield loss possible';
    } else if (riskLevel >= 60) {
      return '20-40% yield reduction';
    } else if (riskLevel >= 30) {
      return '10-20% yield reduction';
    } else {
      return '5-10% yield reduction';
    }
  }

  /**
   * Get crop sensitivity for specific crop and growth stage
   */
  private getCropSensitivity(cropType: CropType, growthStage: GrowthStage): CropSensitivity {
    const cropSensitivity = this.cropSensitivities.get(cropType);
    if (!cropSensitivity) {
      return this.getDefaultSensitivity();
    }

    const stageSensitivity = cropSensitivity.get(growthStage);
    return stageSensitivity || this.getDefaultSensitivity();
  }

  /**
   * Get default sensitivity values
   */
  private getDefaultSensitivity(): CropSensitivity {
    return {
      frost: { min: 2, max: 5, critical: -2 },
      heat: { min: 35, max: 38, critical: 42 },
      rainfall: { min: 30, max: 50, critical: 100 },
      wind: { min: 10, max: 15, critical: 20 },
      humidity: { min: 70, max: 95 }
    };
  }

  /**
   * Initialize crop sensitivities for all crops and growth stages
   */
  private initializeCropSensitivities(): void {
    // Wheat sensitivities
    const wheatSensitivities = new Map<GrowthStage, CropSensitivity>();
    wheatSensitivities.set('seedling', {
      frost: { min: 0, max: 3, critical: -3 },
      heat: { min: 30, max: 35, critical: 40 },
      rainfall: { min: 20, max: 40, critical: 80 },
      wind: { min: 12, max: 18, critical: 25 },
      humidity: { min: 60, max: 85 }
    });
    wheatSensitivities.set('vegetative', {
      frost: { min: -2, max: 2, critical: -5 },
      heat: { min: 32, max: 37, critical: 42 },
      rainfall: { min: 25, max: 45, critical: 90 },
      wind: { min: 15, max: 20, critical: 28 },
      humidity: { min: 60, max: 85 }
    });
    wheatSensitivities.set('flowering', {
      frost: { min: 2, max: 5, critical: 0 },
      heat: { min: 30, max: 35, critical: 38 },
      rainfall: { min: 15, max: 30, critical: 60 },
      wind: { min: 10, max: 15, critical: 22 },
      humidity: { min: 50, max: 75 }
    });
    wheatSensitivities.set('fruiting', {
      frost: { min: 2, max: 5, critical: 0 },
      heat: { min: 32, max: 37, critical: 40 },
      rainfall: { min: 10, max: 25, critical: 50 },
      wind: { min: 12, max: 18, critical: 25 },
      humidity: { min: 40, max: 70 }
    });
    wheatSensitivities.set('harvest', {
      frost: { min: 0, max: 3, critical: -3 },
      heat: { min: 35, max: 40, critical: 45 },
      rainfall: { min: 5, max: 15, critical: 40 },
      wind: { min: 15, max: 22, critical: 30 },
      humidity: { min: 30, max: 60 }
    });
    this.cropSensitivities.set('wheat', wheatSensitivities);

    // Rice sensitivities
    const riceSensitivities = new Map<GrowthStage, CropSensitivity>();
    riceSensitivities.set('seedling', {
      frost: { min: 10, max: 15, critical: 5 },
      heat: { min: 35, max: 38, critical: 42 },
      rainfall: { min: 50, max: 80, critical: 150 },
      wind: { min: 10, max: 15, critical: 22 },
      humidity: { min: 70, max: 95 }
    });
    riceSensitivities.set('vegetative', {
      frost: { min: 12, max: 18, critical: 8 },
      heat: { min: 35, max: 38, critical: 42 },
      rainfall: { min: 60, max: 100, critical: 180 },
      wind: { min: 12, max: 18, critical: 25 },
      humidity: { min: 75, max: 95 }
    });
    riceSensitivities.set('flowering', {
      frost: { min: 15, max: 20, critical: 12 },
      heat: { min: 33, max: 36, critical: 39 },
      rainfall: { min: 40, max: 70, critical: 120 },
      wind: { min: 8, max: 12, critical: 18 },
      humidity: { min: 70, max: 90 }
    });
    riceSensitivities.set('fruiting', {
      frost: { min: 15, max: 20, critical: 12 },
      heat: { min: 33, max: 37, critical: 40 },
      rainfall: { min: 30, max: 60, critical: 100 },
      wind: { min: 10, max: 15, critical: 22 },
      humidity: { min: 65, max: 85 }
    });
    riceSensitivities.set('harvest', {
      frost: { min: 12, max: 18, critical: 8 },
      heat: { min: 35, max: 40, critical: 45 },
      rainfall: { min: 10, max: 30, critical: 70 },
      wind: { min: 12, max: 18, critical: 25 },
      humidity: { min: 50, max: 75 }
    });
    this.cropSensitivities.set('rice', riceSensitivities);

    // Tomatoes sensitivities
    const tomatoSensitivities = new Map<GrowthStage, CropSensitivity>();
    tomatoSensitivities.set('seedling', {
      frost: { min: 5, max: 10, critical: 2 },
      heat: { min: 32, max: 35, critical: 38 },
      rainfall: { min: 20, max: 40, critical: 80 },
      wind: { min: 8, max: 12, critical: 18 },
      humidity: { min: 60, max: 85 }
    });
    tomatoSensitivities.set('vegetative', {
      frost: { min: 5, max: 10, critical: 2 },
      heat: { min: 32, max: 35, critical: 38 },
      rainfall: { min: 25, max: 45, critical: 90 },
      wind: { min: 10, max: 15, critical: 22 },
      humidity: { min: 60, max: 85 }
    });
    tomatoSensitivities.set('flowering', {
      frost: { min: 8, max: 12, critical: 5 },
      heat: { min: 30, max: 33, critical: 36 },
      rainfall: { min: 15, max: 35, critical: 70 },
      wind: { min: 8, max: 12, critical: 18 },
      humidity: { min: 50, max: 75 }
    });
    tomatoSensitivities.set('fruiting', {
      frost: { min: 8, max: 12, critical: 5 },
      heat: { min: 30, max: 34, critical: 37 },
      rainfall: { min: 20, max: 40, critical: 80 },
      wind: { min: 10, max: 15, critical: 22 },
      humidity: { min: 55, max: 80 }
    });
    tomatoSensitivities.set('harvest', {
      frost: { min: 8, max: 12, critical: 5 },
      heat: { min: 32, max: 36, critical: 40 },
      rainfall: { min: 10, max: 25, critical: 60 },
      wind: { min: 12, max: 18, critical: 25 },
      humidity: { min: 50, max: 75 }
    });
    this.cropSensitivities.set('tomatoes', tomatoSensitivities);

    // Peppers sensitivities (similar to tomatoes but slightly more heat tolerant)
    const pepperSensitivities = new Map<GrowthStage, CropSensitivity>();
    pepperSensitivities.set('seedling', {
      frost: { min: 5, max: 10, critical: 2 },
      heat: { min: 33, max: 36, critical: 40 },
      rainfall: { min: 20, max: 40, critical: 80 },
      wind: { min: 8, max: 12, critical: 18 },
      humidity: { min: 60, max: 85 }
    });
    pepperSensitivities.set('vegetative', {
      frost: { min: 5, max: 10, critical: 2 },
      heat: { min: 33, max: 36, critical: 40 },
      rainfall: { min: 25, max: 45, critical: 90 },
      wind: { min: 10, max: 15, critical: 22 },
      humidity: { min: 60, max: 85 }
    });
    pepperSensitivities.set('flowering', {
      frost: { min: 8, max: 12, critical: 5 },
      heat: { min: 32, max: 35, critical: 38 },
      rainfall: { min: 15, max: 35, critical: 70 },
      wind: { min: 8, max: 12, critical: 18 },
      humidity: { min: 50, max: 75 }
    });
    pepperSensitivities.set('fruiting', {
      frost: { min: 8, max: 12, critical: 5 },
      heat: { min: 32, max: 36, critical: 39 },
      rainfall: { min: 20, max: 40, critical: 80 },
      wind: { min: 10, max: 15, critical: 22 },
      humidity: { min: 55, max: 80 }
    });
    pepperSensitivities.set('harvest', {
      frost: { min: 8, max: 12, critical: 5 },
      heat: { min: 33, max: 37, critical: 41 },
      rainfall: { min: 10, max: 25, critical: 60 },
      wind: { min: 12, max: 18, critical: 25 },
      humidity: { min: 50, max: 75 }
    });
    this.cropSensitivities.set('peppers', pepperSensitivities);

    // Potatoes sensitivities
    const potatoSensitivities = new Map<GrowthStage, CropSensitivity>();
    potatoSensitivities.set('seedling', {
      frost: { min: 2, max: 5, critical: -1 },
      heat: { min: 28, max: 32, critical: 35 },
      rainfall: { min: 25, max: 45, critical: 90 },
      wind: { min: 12, max: 18, critical: 25 },
      humidity: { min: 65, max: 85 }
    });
    potatoSensitivities.set('vegetative', {
      frost: { min: 2, max: 5, critical: -1 },
      heat: { min: 28, max: 32, critical: 35 },
      rainfall: { min: 30, max: 50, critical: 100 },
      wind: { min: 15, max: 20, critical: 28 },
      humidity: { min: 65, max: 85 }
    });
    potatoSensitivities.set('flowering', {
      frost: { min: 3, max: 6, critical: 0 },
      heat: { min: 26, max: 30, critical: 33 },
      rainfall: { min: 25, max: 45, critical: 90 },
      wind: { min: 12, max: 18, critical: 25 },
      humidity: { min: 60, max: 80 }
    });
    potatoSensitivities.set('fruiting', {
      frost: { min: 3, max: 6, critical: 0 },
      heat: { min: 26, max: 30, critical: 33 },
      rainfall: { min: 20, max: 40, critical: 80 },
      wind: { min: 12, max: 18, critical: 25 },
      humidity: { min: 60, max: 80 }
    });
    potatoSensitivities.set('harvest', {
      frost: { min: 2, max: 5, critical: -1 },
      heat: { min: 28, max: 32, critical: 36 },
      rainfall: { min: 10, max: 25, critical: 60 },
      wind: { min: 15, max: 22, critical: 30 },
      humidity: { min: 50, max: 70 }
    });
    this.cropSensitivities.set('potatoes', potatoSensitivities);

    // Add default sensitivities for other crops
    const defaultStages = ['seedling', 'vegetative', 'flowering', 'fruiting', 'harvest'] as GrowthStage[];
    const otherCrops: CropType[] = ['cotton', 'sugarcane', 'maize', 'onions', 'beans'];
    
    otherCrops.forEach(crop => {
      const sensitivities = new Map<GrowthStage, CropSensitivity>();
      defaultStages.forEach(stage => {
        sensitivities.set(stage, this.getDefaultSensitivity());
      });
      this.cropSensitivities.set(crop, sensitivities);
    });
  }
}

/**
 * Create crop advisory service instance
 */
export function createCropAdvisoryService(): CropAdvisoryService {
  return new CropAdvisoryService();
}
