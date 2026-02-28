/**
 * Irrigation Schedule Generator
 * Creates and manages irrigation schedules based on crop water requirements,
 * soil type, weather forecast, and irrigation method
 */

export interface IrrigationScheduleInput {
  cropId: string;
  cropName: string;
  growthStage: string;
  soilType: 'sandy' | 'loamy' | 'clay' | 'silt' | 'red' | 'black' | 'alluvial';
  irrigationType: 'flood' | 'drip' | 'sprinkler' | 'rainfed';
  landArea: number; // in hectares
  plantingDate: Date;
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  weatherForecast?: WeatherForecast[];
}

export interface WeatherForecast {
  date: Date;
  rainfall: number; // in mm
  temperature: {
    min: number;
    max: number;
  };
  humidity: number; // percentage
  evapotranspiration?: number; // in mm
}

export interface IrrigationEvent {
  id: string;
  scheduledDate: Date;
  amount: number; // in mm or liters per hectare
  duration: number; // in minutes
  method: 'flood' | 'drip' | 'sprinkler';
  status: 'scheduled' | 'completed' | 'skipped' | 'adjusted';
  reason?: string;
  actualDate?: Date;
  actualAmount?: number;
  notes?: string;
}

export interface IrrigationSchedule {
  cropId: string;
  cropName: string;
  plantingDate: Date;
  soilType: string;
  irrigationType: string;
  landArea: number;
  events: IrrigationEvent[];
  totalWaterRequired: number; // in mm
  totalWaterScheduled: number; // in mm
  efficiency: number; // percentage
  nextIrrigation?: IrrigationEvent;
  recommendations: string[];
  generatedAt: Date;
  lastUpdated: Date;
}

export interface WaterUsageMetrics {
  totalScheduled: number; // in mm
  totalApplied: number; // in mm
  totalSkipped: number; // in mm
  efficiency: number; // percentage
  complianceRate: number; // percentage of events completed on time
  waterSaved: number; // in mm
  costSavings: number; // in currency
  eventsCompleted: number;
  eventsSkipped: number;
  eventsAdjusted: number;
}

// Crop water requirements by growth stage (in mm per day)
const CROP_WATER_REQUIREMENTS: Record<string, Record<string, number>> = {
  rice: {
    'Land Preparation': 10,
    'Nursery/Sowing': 8,
    'Transplanting': 10,
    'Vegetative Growth': 7,
    'Reproductive Stage': 8,
    'Maturation': 5,
    'Harvest': 0
  },
  wheat: {
    'Land Preparation': 0,
    'Sowing': 5,
    'Germination': 4,
    'Tillering': 5,
    'Jointing & Booting': 6,
    'Flowering & Grain Formation': 7,
    'Grain Filling': 6,
    'Maturation': 3,
    'Harvest': 0
  },
  cotton: {
    'Land Preparation': 0,
    'Sowing': 4,
    'Germination & Establishment': 5,
    'Vegetative Growth': 6,
    'Flowering & Boll Formation': 7,
    'Boll Development': 6,
    'Boll Opening': 3,
    'Harvest': 0
  },
  maize: {
    'Land Preparation': 0,
    'Sowing': 4,
    'Germination': 5,
    'Vegetative Growth': 6,
    'Tasseling & Silking': 8,
    'Grain Filling': 6,
    'Maturation': 3,
    'Harvest': 0
  }
};

// Soil water retention capacity (in mm per meter depth)
const SOIL_WATER_RETENTION: Record<string, number> = {
  sandy: 80,
  loamy: 150,
  clay: 200,
  silt: 120,
  red: 100,
  black: 180,
  alluvial: 140
};

// Irrigation efficiency by method
const IRRIGATION_EFFICIENCY: Record<string, number> = {
  flood: 0.60, // 60% efficiency
  drip: 0.90, // 90% efficiency
  sprinkler: 0.75, // 75% efficiency
  rainfed: 0.50 // 50% efficiency (natural rainfall)
};

export class IrrigationScheduleService {
  /**
   * Generate irrigation schedule for a crop
   */
  generateSchedule(input: IrrigationScheduleInput): IrrigationSchedule {
    const cropKey = input.cropName.toLowerCase();
    const waterRequirements = CROP_WATER_REQUIREMENTS[cropKey] || this.getDefaultWaterRequirements();
    
    // Get water requirement for current growth stage
    const dailyWaterNeed = waterRequirements[input.growthStage] || 5;
    
    // Calculate irrigation frequency based on soil type
    const frequency = this.calculateIrrigationFrequency(
      dailyWaterNeed,
      input.soilType,
      input.irrigationType
    );
    
    // Generate irrigation events for next 30 days
    const events = this.generateIrrigationEvents(
      input,
      dailyWaterNeed,
      frequency
    );
    
    // Adjust schedule based on weather forecast
    if (input.weatherForecast && input.weatherForecast.length > 0) {
      this.adjustForWeather(events, input.weatherForecast);
    }
    
    // Calculate totals and efficiency
    const totalWaterScheduled = events.reduce((sum, event) => 
      event.status !== 'skipped' ? sum + event.amount : sum, 0
    );
    
    const totalWaterRequired = dailyWaterNeed * 30;
    const efficiency = IRRIGATION_EFFICIENCY[input.irrigationType] * 100;
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(input, events, dailyWaterNeed);
    
    // Find next irrigation event
    const now = new Date();
    const nextIrrigation = events.find(e => 
      e.scheduledDate > now && e.status === 'scheduled'
    );
    
    return {
      cropId: input.cropId,
      cropName: input.cropName,
      plantingDate: input.plantingDate,
      soilType: input.soilType,
      irrigationType: input.irrigationType,
      landArea: input.landArea,
      events,
      totalWaterRequired,
      totalWaterScheduled,
      efficiency,
      nextIrrigation,
      recommendations,
      generatedAt: new Date(),
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate irrigation frequency based on soil and crop needs
   */
  private calculateIrrigationFrequency(
    dailyWaterNeed: number,
    soilType: string,
    irrigationType: string
  ): number {
    const retention = SOIL_WATER_RETENTION[soilType] || 120;
    const efficiency = IRRIGATION_EFFICIENCY[irrigationType] || 0.70;
    
    // Calculate days between irrigation
    // Formula: retention / (dailyWaterNeed / efficiency)
    const frequency = Math.floor(retention / (dailyWaterNeed / efficiency));
    
    // Adjust based on irrigation type
    if (irrigationType === 'drip') {
      return Math.max(1, Math.min(frequency, 2)); // Drip: daily to every 2 days
    } else if (irrigationType === 'sprinkler') {
      return Math.max(2, Math.min(frequency, 5)); // Sprinkler: 2-5 days
    } else if (irrigationType === 'flood') {
      return Math.max(5, Math.min(frequency, 10)); // Flood: 5-10 days
    }
    
    return Math.max(3, Math.min(frequency, 7)); // Default: 3-7 days
  }

  /**
   * Generate irrigation events for the schedule period
   */
  private generateIrrigationEvents(
    input: IrrigationScheduleInput,
    dailyWaterNeed: number,
    frequency: number
  ): IrrigationEvent[] {
    const events: IrrigationEvent[] = [];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30-day schedule
    
    let currentDate = new Date(startDate);
    let eventCounter = 1;
    
    while (currentDate <= endDate) {
      // Calculate water amount for this irrigation event
      const amount = this.calculateIrrigationAmount(
        dailyWaterNeed,
        frequency,
        input.irrigationType,
        input.landArea
      );
      
      // Calculate duration based on method and amount
      const duration = this.calculateIrrigationDuration(
        amount,
        input.irrigationType,
        input.landArea
      );
      
      events.push({
        id: `IRR-${input.cropId}-${eventCounter}`,
        scheduledDate: new Date(currentDate),
        amount,
        duration,
        method: input.irrigationType === 'rainfed' ? 'flood' : input.irrigationType,
        status: 'scheduled',
        reason: `Regular irrigation for ${input.growthStage}`
      });
      
      // Move to next irrigation date
      currentDate.setDate(currentDate.getDate() + frequency);
      eventCounter++;
    }
    
    return events;
  }

  /**
   * Calculate irrigation amount per event
   */
  private calculateIrrigationAmount(
    dailyWaterNeed: number,
    frequency: number,
    irrigationType: string,
    _landArea: number
  ): number {
    const efficiency = IRRIGATION_EFFICIENCY[irrigationType] || 0.70;
    
    // Total water needed for the frequency period
    const totalNeed = dailyWaterNeed * frequency;
    
    // Adjust for irrigation efficiency
    const amount = totalNeed / efficiency;
    
    return Math.round(amount * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Calculate irrigation duration in minutes
   */
  private calculateIrrigationDuration(
    amount: number,
    irrigationType: string,
    _landArea: number
  ): number {
    // Handle invalid inputs
    if (isNaN(amount) || isNaN(_landArea) || _landArea <= 0) {
      return 60; // Default 1 hour
    }
    
    // Flow rates (liters per minute per hectare)
    const flowRates: Record<string, number> = {
      drip: 50,
      sprinkler: 200,
      flood: 500
    };
    
    const flowRate = flowRates[irrigationType] || 200;
    
    // Convert mm to liters per hectare (1mm = 10,000 liters per hectare)
    const totalLiters = amount * 10000 * _landArea;
    
    // Calculate duration
    const duration = Math.ceil(totalLiters / flowRate);
    
    return isNaN(duration) || duration <= 0 ? 60 : duration;
  }

  /**
   * Adjust schedule based on weather forecast
   * Property 13: When rainfall forecast exceeds 10mm within 48 hours,
   * the next scheduled irrigation event should be skipped or reduced
   */
  adjustForWeather(
    events: IrrigationEvent[],
    forecast: WeatherForecast[]
  ): void {
    for (const event of events) {
      if (event.status !== 'scheduled') continue;
      
      // Check rainfall in 48 hours before and after the event
      const eventDate = event.scheduledDate;
      const twoDaysBefore = new Date(eventDate);
      twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
      const twoDaysAfter = new Date(eventDate);
      twoDaysAfter.setDate(twoDaysAfter.getDate() + 2);
      
      // Calculate total rainfall in the 48-hour window
      const relevantForecasts = forecast.filter(f => 
        f.date >= twoDaysBefore && f.date <= twoDaysAfter
      );
      
      const totalRainfall = relevantForecasts.reduce((sum, f) => sum + f.rainfall, 0);
      
      // Skip irrigation if rainfall exceeds 10mm within 48 hours
      if (totalRainfall > 10) {
        event.status = 'skipped';
        event.reason = `Skipped due to ${totalRainfall.toFixed(1)}mm rainfall forecast`;
      } else if (totalRainfall > 5) {
        // Reduce irrigation amount if moderate rainfall expected
        event.amount = event.amount * 0.5;
        event.duration = Math.ceil(event.duration * 0.5);
        event.status = 'adjusted';
        event.reason = `Reduced by 50% due to ${totalRainfall.toFixed(1)}mm rainfall forecast`;
      }
      
      // Adjust for high evapotranspiration
      const avgET = relevantForecasts.reduce((sum, f) => 
        sum + (f.evapotranspiration || 0), 0
      ) / relevantForecasts.length;
      
      if (avgET > 8 && event.status === 'scheduled') {
        event.amount = event.amount * 1.2;
        event.duration = Math.ceil(event.duration * 1.2);
        event.status = 'adjusted';
        event.reason = `Increased by 20% due to high evapotranspiration (${avgET.toFixed(1)}mm/day)`;
      }
    }
  }

  /**
   * Generate recommendations for irrigation management
   */
  private generateRecommendations(
    input: IrrigationScheduleInput,
    events: IrrigationEvent[],
    _dailyWaterNeed: number
  ): string[] {
    const recommendations: string[] = [];
    
    // Irrigation method recommendations
    if (input.irrigationType === 'flood') {
      recommendations.push('Consider switching to drip or sprinkler irrigation to save 30-40% water');
      recommendations.push('Ensure proper field leveling to prevent water wastage in flood irrigation');
    } else if (input.irrigationType === 'drip') {
      recommendations.push('Check drip emitters regularly for clogging to maintain efficiency');
      recommendations.push('Drip irrigation is highly efficient - you are saving significant water');
    } else if (input.irrigationType === 'sprinkler') {
      recommendations.push('Irrigate during early morning or evening to reduce evaporation losses');
      recommendations.push('Check sprinkler nozzles for uniform water distribution');
    }
    
    // Soil-specific recommendations
    if (input.soilType === 'sandy') {
      recommendations.push('Sandy soil has low water retention - irrigate more frequently with less water');
      recommendations.push('Add organic matter to improve water retention capacity');
    } else if (input.soilType === 'clay') {
      recommendations.push('Clay soil retains water well - avoid over-irrigation to prevent waterlogging');
      recommendations.push('Ensure proper drainage to prevent root damage');
    }
    
    // Growth stage recommendations
    if (input.growthStage.includes('Flowering') || input.growthStage.includes('Reproductive')) {
      recommendations.push('Critical growth stage - ensure consistent water supply for optimal yield');
      recommendations.push('Avoid water stress during this period as it directly impacts production');
    }
    
    // Weather-based recommendations
    const skippedEvents = events.filter(e => e.status === 'skipped').length;
    if (skippedEvents > 0) {
      recommendations.push(`${skippedEvents} irrigation events skipped due to rainfall - saving water and costs`);
    }
    
    // Water conservation
    recommendations.push('Monitor soil moisture before each irrigation to avoid over-watering');
    recommendations.push('Use mulching to reduce evaporation and maintain soil moisture');
    
    return recommendations;
  }

  /**
   * Record actual irrigation event
   */
  recordIrrigationEvent(
    schedule: IrrigationSchedule,
    eventId: string,
    actualDate: Date,
    actualAmount: number,
    notes?: string
  ): IrrigationSchedule {
    const event = schedule.events.find(e => e.id === eventId);
    
    if (!event) {
      throw new Error(`Irrigation event ${eventId} not found`);
    }
    
    event.status = 'completed';
    event.actualDate = actualDate;
    event.actualAmount = actualAmount;
    event.notes = notes;
    
    schedule.lastUpdated = new Date();
    
    return schedule;
  }

  /**
   * Calculate water usage efficiency metrics
   */
  calculateMetrics(schedule: IrrigationSchedule): WaterUsageMetrics {
    const completedEvents = schedule.events.filter(e => e.status === 'completed');
    const skippedEvents = schedule.events.filter(e => e.status === 'skipped');
    const adjustedEvents = schedule.events.filter(e => e.status === 'adjusted');
    
    const totalScheduled = schedule.events.reduce((sum, e) => 
      e.status === 'scheduled' || e.status === 'adjusted' ? sum + e.amount : sum, 0
    );
    
    const totalApplied = completedEvents.reduce((sum, e) => 
      sum + (e.actualAmount || e.amount), 0
    );
    
    const totalSkipped = skippedEvents.reduce((sum, e) => sum + e.amount, 0);
    
    // Calculate efficiency
    const efficiency = totalApplied > 0 
      ? (schedule.totalWaterRequired / totalApplied) * 100 
      : 0;
    
    // Calculate compliance rate
    const scheduledEvents = schedule.events.filter(e => 
      e.scheduledDate <= new Date()
    );
    const complianceRate = scheduledEvents.length > 0
      ? Math.min(100, (completedEvents.length / scheduledEvents.length) * 100)
      : 0;
    
    // Calculate water saved
    const waterSaved = totalSkipped;
    
    // Estimate cost savings (assuming ₹2 per cubic meter)
    // 1mm over 1 hectare = 10 cubic meters
    const costSavings = (waterSaved * schedule.landArea * 10 * 2);
    
    return {
      totalScheduled,
      totalApplied,
      totalSkipped,
      efficiency: Math.round(efficiency * 10) / 10,
      complianceRate: Math.round(complianceRate * 10) / 10,
      waterSaved,
      costSavings: Math.round(costSavings),
      eventsCompleted: completedEvents.length,
      eventsSkipped: skippedEvents.length,
      eventsAdjusted: adjustedEvents.length
    };
  }

  /**
   * Get upcoming irrigation events (next 7 days)
   */
  getUpcomingEvents(schedule: IrrigationSchedule): IrrigationEvent[] {
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    
    return schedule.events.filter(e => 
      e.scheduledDate >= now && 
      e.scheduledDate <= sevenDaysLater &&
      e.status === 'scheduled'
    );
  }

  /**
   * Get overdue irrigation events
   */
  getOverdueEvents(schedule: IrrigationSchedule): IrrigationEvent[] {
    const now = new Date();
    
    return schedule.events.filter(e => 
      e.scheduledDate < now && 
      e.status === 'scheduled'
    );
  }

  /**
   * Update schedule with new weather forecast
   */
  updateScheduleWithForecast(
    schedule: IrrigationSchedule,
    forecast: WeatherForecast[]
  ): IrrigationSchedule {
    // Only adjust future events
    const futureEvents = schedule.events.filter(e => 
      e.scheduledDate > new Date() && 
      (e.status === 'scheduled' || e.status === 'adjusted')
    );
    
    // Reset adjusted events to scheduled before re-adjusting
    futureEvents.forEach(e => {
      if (e.status === 'adjusted') {
        e.status = 'scheduled';
      }
    });
    
    this.adjustForWeather(futureEvents, forecast);
    
    schedule.lastUpdated = new Date();
    
    return schedule;
  }

  /**
   * Get default water requirements for unknown crops
   */
  private getDefaultWaterRequirements(): Record<string, number> {
    return {
      'Land Preparation': 5,
      'Sowing': 4,
      'Germination': 5,
      'Vegetative Growth': 6,
      'Reproductive Stage': 7,
      'Maturation': 4,
      'Harvest': 0
    };
  }
}
