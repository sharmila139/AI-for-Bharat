/**
 * Water Usage Tracking and Efficiency Metrics Service
 * Tracks actual water usage, calculates efficiency metrics, and provides insights
 * for irrigation optimization
 */

export interface WaterUsageRecord {
  id: string;
  scheduleId: string;
  eventId: string;
  cropId: string;
  cropName: string;
  date: Date;
  plannedAmount: number; // in mm
  actualAmount: number; // in mm
  irrigationType: 'flood' | 'drip' | 'sprinkler';
  landArea: number; // in hectares
  duration: number; // in minutes
  weatherConditions?: {
    rainfall: number; // in mm
    temperature: number; // in °C
    humidity: number; // percentage
    evapotranspiration?: number; // in mm
  };
  notes?: string;
  recordedAt: Date;
}

export interface WaterEfficiencyMetrics {
  // Basic metrics
  totalPlanned: number; // in mm
  totalActual: number; // in mm
  totalSaved: number; // in mm (from skipped events)
  variance: number; // percentage difference between planned and actual
  
  // Efficiency metrics
  waterUseEfficiency: number; // crop yield per unit water (kg/m³)
  irrigationEfficiency: number; // percentage of water actually used by crop
  applicationEfficiency: number; // percentage of water applied vs planned
  
  // Comparison metrics
  complianceRate: number; // percentage of events completed on time
  overIrrigationRate: number; // percentage of events with excess water
  underIrrigationRate: number; // percentage of events with insufficient water
  
  // Cost metrics
  totalCost: number; // in currency
  costPerHectare: number; // in currency
  costSavings: number; // in currency (from optimizations)
  
  // Environmental metrics
  waterSavedFromWeather: number; // in mm (from weather-based adjustments)
  carbonFootprint: number; // in kg CO2 (from pumping energy)
  
  // Period information
  period: {
    start: Date;
    end: Date;
    days: number;
  };
}

export interface CropWaterProductivity {
  cropName: string;
  totalWaterUsed: number; // in m³
  totalYield: number; // in kg
  productivity: number; // kg per m³
  benchmarkProductivity: number; // industry standard
  performanceRating: 'excellent' | 'good' | 'average' | 'poor';
  improvementPotential: number; // percentage
}

export interface WaterUsageInsight {
  type: 'success' | 'warning' | 'info' | 'recommendation';
  category: 'efficiency' | 'cost' | 'environmental' | 'compliance' | 'optimization';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendation?: string;
}

export interface IrrigationMethodComparison {
  currentMethod: string;
  currentEfficiency: number;
  alternativeMethods: Array<{
    method: string;
    efficiency: number;
    waterSavings: number; // in mm
    costSavings: number; // in currency
    implementationCost: number; // in currency
    paybackPeriod: number; // in months
    recommendation: string;
  }>;
}

export interface SeasonalWaterAnalysis {
  season: string;
  months: string[];
  totalWaterUsed: number; // in mm
  averagePerEvent: number; // in mm
  eventsCount: number;
  efficiency: number; // percentage
  costPerSeason: number; // in currency
  comparisonToPreviousSeason?: {
    waterChange: number; // percentage
    efficiencyChange: number; // percentage
    costChange: number; // percentage
  };
}

// Irrigation method efficiency constants
const IRRIGATION_METHOD_EFFICIENCY: Record<string, number> = {
  flood: 0.60, // 60% efficiency
  drip: 0.90, // 90% efficiency
  sprinkler: 0.75, // 75% efficiency
};

// Water cost per cubic meter (in ₹)
const WATER_COST_PER_CUBIC_METER = 2;

// Carbon emission factor (kg CO2 per kWh)
const CARBON_EMISSION_FACTOR = 0.82;

// Benchmark crop water productivity (kg per m³)
const CROP_WATER_PRODUCTIVITY_BENCHMARKS: Record<string, number> = {
  rice: 0.6,
  wheat: 1.0,
  cotton: 0.4,
  maize: 1.2,
  sugarcane: 8.0,
  potato: 5.0,
  tomato: 12.0,
  onion: 7.0,
};

export class WaterUsageTracker {
  private usageRecords: WaterUsageRecord[] = [];

  /**
   * Record actual water usage for an irrigation event
   */
  recordWaterUsage(record: Omit<WaterUsageRecord, 'id' | 'recordedAt'>): WaterUsageRecord {
    const newRecord: WaterUsageRecord = {
      ...record,
      id: `WU-${record.scheduleId}-${record.eventId}-${Date.now()}`,
      recordedAt: new Date(),
    };

    this.usageRecords.push(newRecord);
    return newRecord;
  }

  /**
   * Calculate comprehensive water efficiency metrics
   */
  calculateEfficiencyMetrics(
    scheduleId: string,
    startDate: Date,
    endDate: Date
  ): WaterEfficiencyMetrics {
    const records = this.usageRecords.filter(
      (r) =>
        r.scheduleId === scheduleId &&
        r.date >= startDate &&
        r.date <= endDate
    );

    if (records.length === 0) {
      return this.getEmptyMetrics(startDate, endDate);
    }

    // Basic metrics
    const totalPlanned = records.reduce((sum, r) => sum + r.plannedAmount, 0);
    const totalActual = records.reduce((sum, r) => sum + r.actualAmount, 0);
    const variance = totalPlanned > 0 
      ? ((totalActual - totalPlanned) / totalPlanned) * 100 
      : 0;

    // Calculate water saved from skipped events (where actual is 0 but planned > 0)
    const totalSaved = records
      .filter((r) => r.actualAmount === 0 && r.plannedAmount > 0)
      .reduce((sum, r) => sum + r.plannedAmount, 0);

    // Efficiency metrics
    const irrigationType = records[0]?.irrigationType || 'flood';
    const irrigationEfficiency = IRRIGATION_METHOD_EFFICIENCY[irrigationType] * 100;
    
    const applicationEfficiency = totalPlanned > 0
      ? (totalActual / totalPlanned) * 100
      : 0;

    // Water use efficiency (requires yield data - using estimated value)
    const waterUseEfficiency = this.calculateWaterUseEfficiency(records);

    // Compliance metrics
    const complianceRate = this.calculateComplianceRate(records);
    const overIrrigationRate = this.calculateOverIrrigationRate(records);
    const underIrrigationRate = this.calculateUnderIrrigationRate(records);

    // Cost metrics
    const landArea = records[0]?.landArea || 1;
    const totalCost = this.calculateWaterCost(totalActual, landArea);
    const costPerHectare = landArea > 0 ? totalCost / landArea : 0;
    const costSavings = this.calculateWaterCost(totalSaved, landArea);

    // Environmental metrics
    const carbonFootprint = this.calculateCarbonFootprint(totalActual, landArea);

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      totalPlanned: Math.round(totalPlanned * 10) / 10,
      totalActual: Math.round(totalActual * 10) / 10,
      totalSaved: Math.round(totalSaved * 10) / 10,
      variance: Math.round(variance * 10) / 10,
      waterUseEfficiency: Math.round(waterUseEfficiency * 100) / 100,
      irrigationEfficiency: Math.round(irrigationEfficiency * 10) / 10,
      applicationEfficiency: Math.round(applicationEfficiency * 10) / 10,
      complianceRate: Math.round(complianceRate * 10) / 10,
      overIrrigationRate: Math.round(overIrrigationRate * 10) / 10,
      underIrrigationRate: Math.round(underIrrigationRate * 10) / 10,
      totalCost: Math.round(totalCost),
      costPerHectare: Math.round(costPerHectare),
      costSavings: Math.round(costSavings),
      waterSavedFromWeather: Math.round(totalSaved * 10) / 10,
      carbonFootprint: Math.round(carbonFootprint * 10) / 10,
      period: {
        start: startDate,
        end: endDate,
        days,
      },
    };
  }

  /**
   * Calculate water use efficiency (estimated based on typical crop yields)
   */
  private calculateWaterUseEfficiency(records: WaterUsageRecord[]): number {
    if (records.length === 0) return 0;

    const totalWaterM3 = records.reduce((sum, r) => {
      // Convert mm to m³: 1mm over 1 hectare = 10 m³
      return sum + (r.actualAmount * r.landArea * 10);
    }, 0);

    // Estimate yield based on crop type (this would come from actual harvest data)
    const cropName = records[0]?.cropName.toLowerCase() || 'rice';
    const estimatedYieldPerHectare = this.getEstimatedYield(cropName);
    const totalLandArea = records[0]?.landArea || 1;
    const estimatedTotalYield = estimatedYieldPerHectare * totalLandArea;

    return totalWaterM3 > 0 ? estimatedTotalYield / totalWaterM3 : 0;
  }

  /**
   * Get estimated crop yield (kg per hectare)
   */
  private getEstimatedYield(cropName: string): number {
    const yields: Record<string, number> = {
      rice: 4000,
      wheat: 3500,
      cotton: 2000,
      maize: 5000,
      sugarcane: 70000,
      potato: 25000,
      tomato: 40000,
      onion: 30000,
    };
    return yields[cropName] || 3000;
  }

  /**
   * Calculate compliance rate (events completed on time)
   */
  private calculateComplianceRate(records: WaterUsageRecord[]): number {
    if (records.length === 0) return 0;

    const onTimeEvents = records.filter((r) => {
      // Consider on-time if actual amount is within 80-120% of planned
      const ratio = r.actualAmount / r.plannedAmount;
      return ratio >= 0.8 && ratio <= 1.2;
    });

    return (onTimeEvents.length / records.length) * 100;
  }

  /**
   * Calculate over-irrigation rate
   */
  private calculateOverIrrigationRate(records: WaterUsageRecord[]): number {
    if (records.length === 0) return 0;

    const overIrrigated = records.filter((r) => r.actualAmount > r.plannedAmount * 1.2);
    return (overIrrigated.length / records.length) * 100;
  }

  /**
   * Calculate under-irrigation rate
   */
  private calculateUnderIrrigationRate(records: WaterUsageRecord[]): number {
    if (records.length === 0) return 0;

    const underIrrigated = records.filter((r) => r.actualAmount < r.plannedAmount * 0.8);
    return (underIrrigated.length / records.length) * 100;
  }

  /**
   * Calculate water cost
   */
  private calculateWaterCost(waterMm: number, landArea: number): number {
    // Convert mm to m³: 1mm over 1 hectare = 10 m³
    const waterM3 = waterMm * landArea * 10;
    return waterM3 * WATER_COST_PER_CUBIC_METER;
  }

  /**
   * Calculate carbon footprint from pumping energy
   */
  private calculateCarbonFootprint(waterMm: number, landArea: number): number {
    // Convert mm to m³
    const waterM3 = waterMm * landArea * 10;
    
    // Estimate energy consumption (kWh per m³) - typical for groundwater pumping
    const energyPerM3 = 0.5; // kWh per m³
    const totalEnergy = waterM3 * energyPerM3;
    
    // Calculate carbon emissions
    return totalEnergy * CARBON_EMISSION_FACTOR;
  }

  /**
   * Get empty metrics for periods with no data
   */
  private getEmptyMetrics(startDate: Date, endDate: Date): WaterEfficiencyMetrics {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      totalPlanned: 0,
      totalActual: 0,
      totalSaved: 0,
      variance: 0,
      waterUseEfficiency: 0,
      irrigationEfficiency: 0,
      applicationEfficiency: 0,
      complianceRate: 0,
      overIrrigationRate: 0,
      underIrrigationRate: 0,
      totalCost: 0,
      costPerHectare: 0,
      costSavings: 0,
      waterSavedFromWeather: 0,
      carbonFootprint: 0,
      period: {
        start: startDate,
        end: endDate,
        days,
      },
    };
  }

  /**
   * Calculate crop water productivity
   */
  calculateCropWaterProductivity(
    cropName: string,
    totalWaterUsedMm: number,
    landArea: number,
    actualYield: number
  ): CropWaterProductivity {
    // Convert mm to m³
    const totalWaterUsedM3 = totalWaterUsedMm * landArea * 10;

    // Calculate productivity
    const productivity = totalWaterUsedM3 > 0 ? actualYield / totalWaterUsedM3 : 0;

    // Get benchmark
    const cropKey = cropName.toLowerCase();
    const benchmarkProductivity = CROP_WATER_PRODUCTIVITY_BENCHMARKS[cropKey] || 1.0;

    // Calculate performance rating
    const performanceRatio = productivity / benchmarkProductivity;
    let performanceRating: 'excellent' | 'good' | 'average' | 'poor';
    
    if (performanceRatio >= 1.2) {
      performanceRating = 'excellent';
    } else if (performanceRatio >= 1.0) {
      performanceRating = 'good';
    } else if (performanceRatio >= 0.8) {
      performanceRating = 'average';
    } else {
      performanceRating = 'poor';
    }

    // Calculate improvement potential
    const improvementPotential = benchmarkProductivity > productivity
      ? ((benchmarkProductivity - productivity) / productivity) * 100
      : 0;

    return {
      cropName,
      totalWaterUsed: Math.round(totalWaterUsedM3 * 10) / 10,
      totalYield: Math.round(actualYield),
      productivity: Math.round(productivity * 100) / 100,
      benchmarkProductivity,
      performanceRating,
      improvementPotential: Math.round(improvementPotential * 10) / 10,
    };
  }

  /**
   * Generate actionable insights based on water usage data
   */
  generateInsights(metrics: WaterEfficiencyMetrics, irrigationType: string): WaterUsageInsight[] {
    const insights: WaterUsageInsight[] = [];

    // Efficiency insights
    if (metrics.irrigationEfficiency < 70) {
      insights.push({
        type: 'warning',
        category: 'efficiency',
        title: 'Low Irrigation Efficiency',
        description: `Your irrigation efficiency is ${metrics.irrigationEfficiency}%, which is below optimal levels.`,
        impact: 'high',
        actionable: true,
        recommendation: 'Consider upgrading to drip or sprinkler irrigation to improve efficiency by 20-30%.',
      });
    } else if (metrics.irrigationEfficiency >= 85) {
      insights.push({
        type: 'success',
        category: 'efficiency',
        title: 'Excellent Irrigation Efficiency',
        description: `Your irrigation efficiency of ${metrics.irrigationEfficiency}% is excellent!`,
        impact: 'high',
        actionable: false,
      });
    }

    // Over-irrigation warning
    if (metrics.overIrrigationRate > 20) {
      insights.push({
        type: 'warning',
        category: 'efficiency',
        title: 'Frequent Over-Irrigation Detected',
        description: `${metrics.overIrrigationRate}% of irrigation events used more water than planned.`,
        impact: 'medium',
        actionable: true,
        recommendation: 'Monitor soil moisture before irrigating and adjust amounts based on actual needs.',
      });
    }

    // Under-irrigation warning
    if (metrics.underIrrigationRate > 20) {
      insights.push({
        type: 'warning',
        category: 'efficiency',
        title: 'Frequent Under-Irrigation Detected',
        description: `${metrics.underIrrigationRate}% of irrigation events used less water than planned.`,
        impact: 'medium',
        actionable: true,
        recommendation: 'Ensure adequate water supply and check for system issues that may be limiting water delivery.',
      });
    }

    // Cost savings from weather adjustments
    if (metrics.costSavings > 1000) {
      insights.push({
        type: 'success',
        category: 'cost',
        title: 'Significant Cost Savings',
        description: `You saved ₹${metrics.costSavings} by adjusting irrigation based on weather forecasts.`,
        impact: 'high',
        actionable: false,
      });
    }

    // Compliance insights
    if (metrics.complianceRate < 70) {
      insights.push({
        type: 'warning',
        category: 'compliance',
        title: 'Low Schedule Compliance',
        description: `Only ${metrics.complianceRate}% of irrigation events were completed as planned.`,
        impact: 'medium',
        actionable: true,
        recommendation: 'Set up irrigation reminders and try to follow the schedule more closely for optimal results.',
      });
    }

    // Environmental insights
    if (metrics.carbonFootprint > 100) {
      insights.push({
        type: 'info',
        category: 'environmental',
        title: 'Carbon Footprint',
        description: `Your irrigation activities generated ${metrics.carbonFootprint} kg of CO2 emissions.`,
        impact: 'low',
        actionable: true,
        recommendation: 'Consider solar-powered pumps to reduce carbon emissions and energy costs.',
      });
    }

    // Water savings insights
    if (metrics.waterSavedFromWeather > 50) {
      insights.push({
        type: 'success',
        category: 'optimization',
        title: 'Weather-Based Optimization Working',
        description: `Saved ${metrics.waterSavedFromWeather}mm of water by adjusting for rainfall.`,
        impact: 'high',
        actionable: false,
      });
    }

    // Method-specific recommendations
    if (irrigationType === 'flood' && metrics.irrigationEfficiency < 70) {
      insights.push({
        type: 'recommendation',
        category: 'optimization',
        title: 'Upgrade Irrigation Method',
        description: 'Flood irrigation has lower efficiency compared to modern methods.',
        impact: 'high',
        actionable: true,
        recommendation: 'Switching to drip irrigation could save 30-40% water and reduce costs significantly.',
      });
    }

    return insights;
  }

  /**
   * Compare current irrigation method with alternatives
   */
  compareIrrigationMethods(
    currentMethod: string,
    totalWaterUsedMm: number,
    landArea: number,
    periodDays: number
  ): IrrigationMethodComparison {
    const currentEfficiency = IRRIGATION_METHOD_EFFICIENCY[currentMethod] * 100;
    const alternativeMethods: IrrigationMethodComparison['alternativeMethods'] = [];

    // Calculate for each alternative method
    const methods = ['drip', 'sprinkler', 'flood'];
    
    for (const method of methods) {
      if (method === currentMethod) continue;

      const methodEfficiency = IRRIGATION_METHOD_EFFICIENCY[method] * 100;
      const efficiencyGain = methodEfficiency - currentEfficiency;
      
      // Calculate water savings
      const waterSavings = efficiencyGain > 0 
        ? (totalWaterUsedMm * (efficiencyGain / 100))
        : 0;

      // Calculate cost savings
      const costSavings = this.calculateWaterCost(waterSavings, landArea);

      // Estimate implementation cost
      const implementationCost = this.estimateImplementationCost(method, landArea);

      // Calculate payback period (months)
      const annualSavings = (costSavings / periodDays) * 365;
      const paybackPeriod = annualSavings > 0 
        ? Math.ceil((implementationCost / annualSavings) * 12)
        : 999;

      // Generate recommendation
      let recommendation = '';
      if (efficiencyGain > 15 && paybackPeriod < 24) {
        recommendation = `Highly recommended: ${efficiencyGain.toFixed(0)}% efficiency gain with ${paybackPeriod} month payback period.`;
      } else if (efficiencyGain > 10 && paybackPeriod < 36) {
        recommendation = `Good option: ${efficiencyGain.toFixed(0)}% efficiency gain with ${paybackPeriod} month payback period.`;
      } else if (efficiencyGain > 0) {
        recommendation = `Marginal benefit: ${efficiencyGain.toFixed(0)}% efficiency gain but longer payback period.`;
      } else {
        recommendation = `Not recommended: Current method is more efficient.`;
      }

      alternativeMethods.push({
        method,
        efficiency: Math.round(methodEfficiency * 10) / 10,
        waterSavings: Math.round(waterSavings * 10) / 10,
        costSavings: Math.round(costSavings),
        implementationCost: Math.round(implementationCost),
        paybackPeriod,
        recommendation,
      });
    }

    // Sort by efficiency (descending)
    alternativeMethods.sort((a, b) => b.efficiency - a.efficiency);

    return {
      currentMethod,
      currentEfficiency: Math.round(currentEfficiency * 10) / 10,
      alternativeMethods,
    };
  }

  /**
   * Estimate implementation cost for irrigation method
   */
  private estimateImplementationCost(method: string, landArea: number): number {
    // Cost per hectare in ₹
    const costPerHectare: Record<string, number> = {
      drip: 80000,
      sprinkler: 50000,
      flood: 20000,
    };

    return (costPerHectare[method] || 50000) * landArea;
  }

  /**
   * Analyze water usage by season
   */
  analyzeSeasonalUsage(
    scheduleId: string,
    year: number
  ): SeasonalWaterAnalysis[] {
    const seasons = [
      { name: 'Kharif (Monsoon)', months: ['June', 'July', 'August', 'September'] },
      { name: 'Rabi (Winter)', months: ['October', 'November', 'December', 'January', 'February'] },
      { name: 'Zaid (Summer)', months: ['March', 'April', 'May'] },
    ];

    const analyses: SeasonalWaterAnalysis[] = [];

    for (const season of seasons) {
      const seasonRecords = this.getSeasonRecords(scheduleId, season.months, year);
      
      if (seasonRecords.length === 0) {
        continue;
      }

      const totalWaterUsed = seasonRecords.reduce((sum, r) => sum + r.actualAmount, 0);
      const averagePerEvent = totalWaterUsed / seasonRecords.length;
      const landArea = seasonRecords[0]?.landArea || 1;
      const costPerSeason = this.calculateWaterCost(totalWaterUsed, landArea);

      // Calculate efficiency
      const totalPlanned = seasonRecords.reduce((sum, r) => sum + r.plannedAmount, 0);
      const efficiency = totalPlanned > 0 ? (totalWaterUsed / totalPlanned) * 100 : 0;

      analyses.push({
        season: season.name,
        months: season.months,
        totalWaterUsed: Math.round(totalWaterUsed * 10) / 10,
        averagePerEvent: Math.round(averagePerEvent * 10) / 10,
        eventsCount: seasonRecords.length,
        efficiency: Math.round(efficiency * 10) / 10,
        costPerSeason: Math.round(costPerSeason),
      });
    }

    return analyses;
  }

  /**
   * Get records for a specific season
   */
  private getSeasonRecords(
    scheduleId: string,
    months: string[],
    year: number
  ): WaterUsageRecord[] {
    return this.usageRecords.filter((r) => {
      if (r.scheduleId !== scheduleId) return false;
      
      const recordYear = r.date.getFullYear();
      const recordMonth = r.date.toLocaleString('en-US', { month: 'long' });
      
      return recordYear === year && months.includes(recordMonth);
    });
  }

  /**
   * Get all usage records for a schedule
   */
  getUsageRecords(scheduleId: string): WaterUsageRecord[] {
    return this.usageRecords.filter((r) => r.scheduleId === scheduleId);
  }

  /**
   * Get usage records for a specific date range
   */
  getUsageRecordsByDateRange(
    scheduleId: string,
    startDate: Date,
    endDate: Date
  ): WaterUsageRecord[] {
    return this.usageRecords.filter(
      (r) =>
        r.scheduleId === scheduleId &&
        r.date >= startDate &&
        r.date <= endDate
    );
  }

  /**
   * Clear all usage records (for testing)
   */
  clearRecords(): void {
    this.usageRecords = [];
  }
}
