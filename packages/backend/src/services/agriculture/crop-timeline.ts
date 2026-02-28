/**
 * Crop Timeline Generator
 * Generates detailed timelines for crop cultivation including sowing, growing stages, and harvest
 */

export interface CropTimelineInput {
  cropId: string;
  cropName: string;
  region: string;
  sowingDate?: Date; // Optional, will use optimal date if not provided
  landArea: number;
  soilType: string;
  irrigationType: 'rainfed' | 'drip' | 'sprinkler' | 'flood';
}

export interface TimelineStage {
  stage: string;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  activities: string[];
  inputs: {
    water?: string;
    fertilizer?: string;
    pesticide?: string;
  };
  expectedConditions: {
    temperature?: string;
    rainfall?: string;
    humidity?: string;
  };
  alerts: string[];
}

export interface CropTimeline {
  cropId: string;
  cropName: string;
  sowingDate: Date;
  harvestDate: Date;
  totalDurationDays: number;
  stages: TimelineStage[];
  criticalDates: {
    date: Date;
    event: string;
    importance: 'high' | 'medium' | 'low';
  }[];
  seasonalRecommendations: string[];
  generatedAt: Date;
}

// Crop growth stage definitions
const CROP_STAGES: Record<string, any> = {
  rice: {
    optimalSowingMonth: 6, // June
    stages: [
      {
        name: 'Land Preparation',
        durationDays: 7,
        activities: ['Plowing', 'Leveling', 'Puddling', 'Bund repair'],
        inputs: {},
        conditions: { temperature: '25-30°C', rainfall: 'Moderate' }
      },
      {
        name: 'Nursery/Sowing',
        durationDays: 21,
        activities: ['Seed treatment', 'Nursery preparation', 'Sowing', 'Watering'],
        inputs: { water: '5cm standing water', fertilizer: 'Basal dose NPK' },
        conditions: { temperature: '25-32°C', rainfall: 'High', humidity: '70-80%' }
      },
      {
        name: 'Transplanting',
        durationDays: 7,
        activities: ['Seedling uprooting', 'Transplanting', 'Gap filling'],
        inputs: { water: '5-7cm standing water' },
        conditions: { temperature: '25-30°C' }
      },
      {
        name: 'Vegetative Growth',
        durationDays: 35,
        activities: ['Weeding', 'Top dressing', 'Pest monitoring', 'Water management'],
        inputs: { water: '5cm standing water', fertilizer: 'Nitrogen top dressing', pesticide: 'As needed' },
        conditions: { temperature: '25-35°C', humidity: '70-85%' }
      },
      {
        name: 'Reproductive Stage',
        durationDays: 30,
        activities: ['Flowering monitoring', 'Pest control', 'Water management'],
        inputs: { water: '3-5cm standing water', fertilizer: 'Potash application' },
        conditions: { temperature: '28-32°C', humidity: '70-80%' }
      },
      {
        name: 'Maturation',
        durationDays: 20,
        activities: ['Grain filling monitoring', 'Water drainage', 'Bird protection'],
        inputs: { water: 'Drain 10 days before harvest' },
        conditions: { temperature: '25-30°C' }
      },
      {
        name: 'Harvest',
        durationDays: 5,
        activities: ['Harvesting', 'Threshing', 'Drying', 'Storage'],
        inputs: {},
        conditions: { rainfall: 'No rain preferred' }
      }
    ]
  },
  wheat: {
    optimalSowingMonth: 11, // November
    stages: [
      {
        name: 'Land Preparation',
        durationDays: 7,
        activities: ['Deep plowing', 'Harrowing', 'Leveling'],
        inputs: {},
        conditions: { temperature: '15-20°C' }
      },
      {
        name: 'Sowing',
        durationDays: 3,
        activities: ['Seed treatment', 'Line sowing', 'Seed covering'],
        inputs: { water: 'Pre-sowing irrigation', fertilizer: 'Basal NPK' },
        conditions: { temperature: '15-25°C', rainfall: 'Low' }
      },
      {
        name: 'Germination',
        durationDays: 10,
        activities: ['Light irrigation', 'Bird protection'],
        inputs: { water: 'Light irrigation' },
        conditions: { temperature: '15-20°C' }
      },
      {
        name: 'Tillering',
        durationDays: 30,
        activities: ['First irrigation', 'Weeding', 'Top dressing'],
        inputs: { water: 'Crown root irrigation', fertilizer: 'Nitrogen top dressing' },
        conditions: { temperature: '15-25°C' }
      },
      {
        name: 'Jointing & Booting',
        durationDays: 35,
        activities: ['Regular irrigation', 'Pest monitoring', 'Second top dressing'],
        inputs: { water: 'Regular irrigation', fertilizer: 'Nitrogen application' },
        conditions: { temperature: '20-25°C' }
      },
      {
        name: 'Flowering & Grain Formation',
        durationDays: 25,
        activities: ['Critical irrigation', 'Disease control', 'Nutrient spray'],
        inputs: { water: 'Critical irrigation', pesticide: 'Fungicide if needed' },
        conditions: { temperature: '20-28°C', humidity: '50-70%' }
      },
      {
        name: 'Grain Filling',
        durationDays: 30,
        activities: ['Milk stage irrigation', 'Dough stage monitoring'],
        inputs: { water: 'Milk stage irrigation' },
        conditions: { temperature: '20-25°C' }
      },
      {
        name: 'Maturation',
        durationDays: 10,
        activities: ['Stop irrigation', 'Harvest preparation'],
        inputs: {},
        conditions: { temperature: '15-25°C', rainfall: 'No rain' }
      },
      {
        name: 'Harvest',
        durationDays: 5,
        activities: ['Harvesting', 'Threshing', 'Winnowing', 'Storage'],
        inputs: {},
        conditions: { rainfall: 'No rain' }
      }
    ]
  },
  cotton: {
    optimalSowingMonth: 5, // May
    stages: [
      {
        name: 'Land Preparation',
        durationDays: 10,
        activities: ['Deep plowing', 'Harrowing', 'Ridge formation'],
        inputs: {},
        conditions: { temperature: '25-30°C' }
      },
      {
        name: 'Sowing',
        durationDays: 5,
        activities: ['Seed treatment', 'Dibbling', 'Gap filling'],
        inputs: { water: 'Pre-sowing irrigation', fertilizer: 'Basal NPK' },
        conditions: { temperature: '25-35°C' }
      },
      {
        name: 'Germination & Establishment',
        durationDays: 20,
        activities: ['Thinning', 'Gap filling', 'Light irrigation'],
        inputs: { water: 'Light irrigation' },
        conditions: { temperature: '25-35°C' }
      },
      {
        name: 'Vegetative Growth',
        durationDays: 50,
        activities: ['Regular irrigation', 'Weeding', 'Top dressing', 'Pest monitoring'],
        inputs: { water: 'Regular irrigation', fertilizer: 'Nitrogen top dressing', pesticide: 'Pest control' },
        conditions: { temperature: '25-35°C', humidity: '60-80%' }
      },
      {
        name: 'Flowering & Boll Formation',
        durationDays: 40,
        activities: ['Critical irrigation', 'Boll worm control', 'Nutrient spray'],
        inputs: { water: 'Critical irrigation', pesticide: 'Bollworm control', fertilizer: 'Foliar spray' },
        conditions: { temperature: '25-32°C', humidity: '60-70%' }
      },
      {
        name: 'Boll Development',
        durationDays: 45,
        activities: ['Regular irrigation', 'Pink bollworm control', 'Defoliation'],
        inputs: { water: 'Regular irrigation', pesticide: 'As needed' },
        conditions: { temperature: '25-35°C' }
      },
      {
        name: 'Boll Opening',
        durationDays: 15,
        activities: ['Stop irrigation', 'Harvest preparation'],
        inputs: {},
        conditions: { temperature: '25-30°C', rainfall: 'No rain' }
      },
      {
        name: 'Harvest',
        durationDays: 30,
        activities: ['Multiple pickings', 'Grading', 'Storage'],
        inputs: {},
        conditions: { rainfall: 'No rain', humidity: 'Low' }
      }
    ]
  },
  maize: {
    optimalSowingMonth: 7, // July
    stages: [
      {
        name: 'Land Preparation',
        durationDays: 5,
        activities: ['Plowing', 'Harrowing', 'Leveling'],
        inputs: {},
        conditions: { temperature: '20-30°C' }
      },
      {
        name: 'Sowing',
        durationDays: 2,
        activities: ['Seed treatment', 'Line sowing', 'Covering'],
        inputs: { water: 'Pre-sowing irrigation', fertilizer: 'Basal NPK' },
        conditions: { temperature: '20-30°C' }
      },
      {
        name: 'Germination',
        durationDays: 8,
        activities: ['Light irrigation', 'Bird protection'],
        inputs: { water: 'Light irrigation' },
        conditions: { temperature: '20-30°C' }
      },
      {
        name: 'Vegetative Growth',
        durationDays: 35,
        activities: ['Weeding', 'Top dressing', 'Earthing up', 'Irrigation'],
        inputs: { water: 'Regular irrigation', fertilizer: 'Nitrogen top dressing' },
        conditions: { temperature: '25-35°C' }
      },
      {
        name: 'Tasseling & Silking',
        durationDays: 15,
        activities: ['Critical irrigation', 'Pest control', 'Pollination monitoring'],
        inputs: { water: 'Critical irrigation', pesticide: 'Stem borer control' },
        conditions: { temperature: '25-30°C', humidity: '60-80%' }
      },
      {
        name: 'Grain Filling',
        durationDays: 25,
        activities: ['Regular irrigation', 'Nutrient spray'],
        inputs: { water: 'Regular irrigation' },
        conditions: { temperature: '25-30°C' }
      },
      {
        name: 'Maturation',
        durationDays: 10,
        activities: ['Stop irrigation', 'Harvest preparation'],
        inputs: {},
        conditions: { temperature: '20-28°C' }
      },
      {
        name: 'Harvest',
        durationDays: 5,
        activities: ['Harvesting', 'Dehusking', 'Drying', 'Storage'],
        inputs: {},
        conditions: { rainfall: 'No rain' }
      }
    ]
  }
};

export class CropTimelineService {
  /**
   * Generate comprehensive crop timeline
   */
  generateTimeline(input: CropTimelineInput): CropTimeline {
    const cropKey = input.cropName.toLowerCase();
    const cropData = CROP_STAGES[cropKey] || this.getDefaultCropStages();

    // Determine sowing date
    const sowingDate = input.sowingDate || this.getOptimalSowingDate(cropData.optimalSowingMonth);

    // Generate timeline stages
    const stages: TimelineStage[] = [];
    let currentDate = new Date(sowingDate);

    for (const stageData of cropData.stages) {
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + stageData.durationDays);

      // Adjust activities based on irrigation type
      const activities = this.adjustActivitiesForIrrigation(
        stageData.activities,
        input.irrigationType
      );

      // Generate alerts for critical stages
      const alerts = this.generateStageAlerts(stageData, input);

      stages.push({
        stage: stageData.name,
        startDate,
        endDate,
        durationDays: stageData.durationDays,
        activities,
        inputs: stageData.inputs,
        expectedConditions: stageData.conditions,
        alerts
      });

      currentDate = new Date(endDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate harvest date
    const harvestDate = stages[stages.length - 1].endDate;
    const totalDurationDays = Math.floor(
      (harvestDate.getTime() - sowingDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Generate critical dates
    const criticalDates = this.generateCriticalDates(stages);

    // Generate seasonal recommendations
    const seasonalRecommendations = this.generateSeasonalRecommendations(
      input,
      sowingDate
    );

    return {
      cropId: input.cropId,
      cropName: input.cropName,
      sowingDate,
      harvestDate,
      totalDurationDays,
      stages,
      criticalDates,
      seasonalRecommendations,
      generatedAt: new Date()
    };
  }

  /**
   * Get optimal sowing date based on month
   */
  private getOptimalSowingDate(month: number): Date {
    const currentYear = new Date().getFullYear();
    const date = new Date(currentYear, month - 1, 1);
    
    // If the optimal month has passed, use next year
    if (date < new Date()) {
      date.setFullYear(currentYear + 1);
    }
    
    return date;
  }

  /**
   * Adjust activities based on irrigation type
   */
  private adjustActivitiesForIrrigation(
    activities: string[],
    irrigationType: string
  ): string[] {
    const adjusted = [...activities];

    if (irrigationType === 'drip') {
      return adjusted.map(activity =>
        activity.includes('irrigation') ? activity + ' (drip system)' : activity
      );
    } else if (irrigationType === 'rainfed') {
      return adjusted.filter(activity => !activity.toLowerCase().includes('irrigation'));
    }

    return adjusted;
  }

  /**
   * Generate stage-specific alerts
   */
  private generateStageAlerts(stageData: any, input: CropTimelineInput): string[] {
    const alerts: string[] = [];

    if (stageData.name.includes('Flowering') || stageData.name.includes('Reproductive')) {
      alerts.push('Critical stage - ensure adequate water and nutrients');
    }

    if (stageData.name.includes('Harvest') && input.irrigationType === 'rainfed') {
      alerts.push('Monitor weather forecast - avoid harvesting during rain');
    }

    if (stageData.inputs.pesticide) {
      alerts.push('Monitor for pests regularly during this stage');
    }

    return alerts;
  }

  /**
   * Generate critical dates for calendar
   */
  private generateCriticalDates(stages: TimelineStage[]): {
    date: Date;
    event: string;
    importance: 'high' | 'medium' | 'low';
  }[] {
    const criticalDates: any[] = [];

    stages.forEach(stage => {
      if (stage.stage === 'Sowing' || stage.stage === 'Transplanting') {
        criticalDates.push({
          date: stage.startDate,
          event: `${stage.stage} begins`,
          importance: 'high' as const
        });
      }

      if (stage.stage.includes('Flowering') || stage.stage.includes('Reproductive')) {
        criticalDates.push({
          date: stage.startDate,
          event: 'Critical growth stage - ensure optimal conditions',
          importance: 'high' as const
        });
      }

      if (stage.stage === 'Harvest') {
        criticalDates.push({
          date: stage.startDate,
          event: 'Harvest window begins',
          importance: 'high' as const
        });
      }

      // Add fertilizer application dates
      if (stage.inputs.fertilizer) {
        criticalDates.push({
          date: new Date(stage.startDate.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days after stage start
          event: `Apply ${stage.inputs.fertilizer}`,
          importance: 'medium' as const
        });
      }
    });

    return criticalDates;
  }

  /**
   * Generate seasonal recommendations
   */
  private generateSeasonalRecommendations(
    input: CropTimelineInput,
    sowingDate: Date
  ): string[] {
    const recommendations: string[] = [];
    const month = sowingDate.getMonth() + 1;

    // Monsoon season (June-September)
    if (month >= 6 && month <= 9) {
      recommendations.push('Monsoon season - ensure proper drainage to prevent waterlogging');
      recommendations.push('Monitor for fungal diseases due to high humidity');
    }

    // Winter season (October-February)
    if (month >= 10 || month <= 2) {
      recommendations.push('Winter season - protect crops from frost if temperatures drop below 5°C');
      recommendations.push('Reduced water requirement due to lower evaporation');
    }

    // Summer season (March-May)
    if (month >= 3 && month <= 5) {
      recommendations.push('Summer season - increase irrigation frequency due to high evaporation');
      recommendations.push('Provide shade nets if temperatures exceed 40°C');
    }

    if (input.irrigationType === 'rainfed') {
      recommendations.push('Rainfed cultivation - closely monitor monsoon forecasts');
    }

    return recommendations;
  }

  /**
   * Get default crop stages for unknown crops
   */
  private getDefaultCropStages() {
    return {
      optimalSowingMonth: 6,
      stages: [
        {
          name: 'Land Preparation',
          durationDays: 7,
          activities: ['Plowing', 'Leveling'],
          inputs: {},
          conditions: {}
        },
        {
          name: 'Sowing',
          durationDays: 3,
          activities: ['Seed treatment', 'Sowing'],
          inputs: { water: 'Pre-sowing irrigation', fertilizer: 'Basal dose' },
          conditions: {}
        },
        {
          name: 'Vegetative Growth',
          durationDays: 60,
          activities: ['Weeding', 'Irrigation', 'Fertilization'],
          inputs: { water: 'Regular irrigation', fertilizer: 'Top dressing' },
          conditions: {}
        },
        {
          name: 'Reproductive Stage',
          durationDays: 30,
          activities: ['Pest control', 'Water management'],
          inputs: { water: 'Critical irrigation' },
          conditions: {}
        },
        {
          name: 'Harvest',
          durationDays: 5,
          activities: ['Harvesting', 'Processing', 'Storage'],
          inputs: {},
          conditions: {}
        }
      ]
    };
  }

  /**
   * Get timeline for current date
   */
  getCurrentStage(timeline: CropTimeline): TimelineStage | null {
    const now = new Date();
    return timeline.stages.find(
      stage => now >= stage.startDate && now <= stage.endDate
    ) || null;
  }

  /**
   * Get upcoming activities (next 7 days)
   */
  getUpcomingActivities(timeline: CropTimeline): {
    date: Date;
    stage: string;
    activities: string[];
  }[] {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return timeline.stages
      .filter(stage => stage.startDate >= now && stage.startDate <= sevenDaysLater)
      .map(stage => ({
        date: stage.startDate,
        stage: stage.stage,
        activities: stage.activities
      }));
  }
}
