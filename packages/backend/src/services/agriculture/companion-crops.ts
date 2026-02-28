/**
 * Companion Crop Suggestion Engine
 * Recommends companion crops for intercropping, mixed cropping, and crop rotation
 */

export interface CompanionCropInput {
  mainCropId: string;
  mainCropName: string;
  landArea: number;
  soilType: string;
  region: string;
  irrigationType: 'rainfed' | 'drip' | 'sprinkler' | 'flood';
  objective: 'pest_control' | 'soil_health' | 'income_diversification' | 'risk_mitigation' | 'all';
}

export interface CompanionCropSuggestion {
  cropId: string;
  cropName: string;
  companionType: 'intercrop' | 'mixed_crop' | 'border_crop' | 'rotation_crop';
  compatibility: number; // 0-100
  benefits: string[];
  plantingPattern: string;
  spaceAllocation: {
    mainCrop: number; // percentage
    companionCrop: number; // percentage
  };
  expectedYieldImpact: {
    mainCrop: string; // e.g., "+10%", "no change", "-5%"
    companionCrop: string;
  };
  additionalIncome: number; // estimated in INR
  managementTips: string[];
}

export interface CompanionCropRecommendation {
  mainCropId: string;
  mainCropName: string;
  suggestions: CompanionCropSuggestion[];
  bestCombination: {
    crops: string[];
    totalIncome: number;
    riskReduction: number; // percentage
    soilHealthImprovement: number; // percentage
  };
  seasonalRotation: {
    season: string;
    crops: string[];
    benefits: string[];
  }[];
  warnings: string[];
  recommendedAt: Date;
}

// Companion crop database with compatibility matrix
const COMPANION_CROPS: Record<string, any> = {
  rice: {
    intercrops: [
      {
        name: 'mung_bean',
        compatibility: 85,
        benefits: ['Nitrogen fixation', 'Additional income', 'Weed suppression'],
        pattern: 'Plant between rice rows after 30 days',
        spaceAllocation: { main: 70, companion: 30 },
        yieldImpact: { main: '+5%', companion: 'normal' },
        income: 15000
      },
      {
        name: 'azolla',
        compatibility: 90,
        benefits: ['Nitrogen fixation', 'Weed control', 'Organic matter'],
        pattern: 'Spread in standing water',
        spaceAllocation: { main: 100, companion: 0 },
        yieldImpact: { main: '+10%', companion: 'N/A' },
        income: 0
      }
    ],
    borderCrops: [
      {
        name: 'marigold',
        compatibility: 80,
        benefits: ['Pest repellent', 'Attracts beneficial insects'],
        pattern: 'Plant along field borders',
        spaceAllocation: { main: 95, companion: 5 },
        yieldImpact: { main: 'no change', companion: 'N/A' },
        income: 5000
      }
    ],
    rotationCrops: [
      {
        name: 'wheat',
        compatibility: 95,
        benefits: ['Different nutrient requirements', 'Pest cycle break', 'Soil structure improvement'],
        pattern: 'Sow after rice harvest',
        spaceAllocation: { main: 0, companion: 100 },
        yieldImpact: { main: 'N/A', companion: 'normal' },
        income: 50000
      },
      {
        name: 'chickpea',
        compatibility: 90,
        benefits: ['Nitrogen fixation', 'Soil health improvement', 'Pest cycle break'],
        pattern: 'Sow after rice harvest',
        spaceAllocation: { main: 0, companion: 100 },
        yieldImpact: { main: 'N/A', companion: 'normal' },
        income: 45000
      }
    ]
  },
  wheat: {
    intercrops: [
      {
        name: 'mustard',
        compatibility: 75,
        benefits: ['Additional income', 'Pest deterrent', 'Early harvest'],
        pattern: 'Alternate rows (2:1 ratio)',
        spaceAllocation: { main: 70, companion: 30 },
        yieldImpact: { main: '-5%', companion: 'normal' },
        income: 18000
      },
      {
        name: 'chickpea',
        compatibility: 80,
        benefits: ['Nitrogen fixation', 'Income diversification', 'Risk mitigation'],
        pattern: 'Alternate rows (2:2 ratio)',
        spaceAllocation: { main: 60, companion: 40 },
        yieldImpact: { main: 'no change', companion: 'normal' },
        income: 25000
      }
    ],
    rotationCrops: [
      {
        name: 'rice',
        compatibility: 95,
        benefits: ['Pest cycle break', 'Different water requirements', 'Soil health'],
        pattern: 'Sow after wheat harvest',
        spaceAllocation: { main: 0, companion: 100 },
        yieldImpact: { main: 'N/A', companion: 'normal' },
        income: 60000
      },
      {
        name: 'maize',
        compatibility: 85,
        benefits: ['Pest cycle break', 'Different nutrient uptake', 'Soil structure'],
        pattern: 'Sow after wheat harvest',
        spaceAllocation: { main: 0, companion: 100 },
        yieldImpact: { main: 'N/A', companion: 'normal' },
        income: 55000
      }
    ]
  },
  cotton: {
    intercrops: [
      {
        name: 'green_gram',
        compatibility: 85,
        benefits: ['Nitrogen fixation', 'Early income', 'Soil cover'],
        pattern: 'Plant between cotton rows',
        spaceAllocation: { main: 70, companion: 30 },
        yieldImpact: { main: '+5%', companion: 'normal' },
        income: 20000
      },
      {
        name: 'black_gram',
        compatibility: 80,
        benefits: ['Nitrogen fixation', 'Additional income', 'Weed suppression'],
        pattern: 'Plant between cotton rows',
        spaceAllocation: { main: 70, companion: 30 },
        yieldImpact: { main: '+5%', companion: 'normal' },
        income: 18000
      }
    ],
    borderCrops: [
      {
        name: 'maize',
        compatibility: 75,
        benefits: ['Trap crop for bollworms', 'Wind break'],
        pattern: 'Plant 2-3 rows around field',
        spaceAllocation: { main: 90, companion: 10 },
        yieldImpact: { main: '+10%', companion: 'reduced' },
        income: 8000
      }
    ],
    rotationCrops: [
      {
        name: 'wheat',
        compatibility: 90,
        benefits: ['Pest cycle break', 'Different nutrient needs', 'Soil health'],
        pattern: 'Sow after cotton harvest',
        spaceAllocation: { main: 0, companion: 100 },
        yieldImpact: { main: 'N/A', companion: 'normal' },
        income: 50000
      }
    ]
  },
  maize: {
    intercrops: [
      {
        name: 'cowpea',
        compatibility: 90,
        benefits: ['Nitrogen fixation', 'Ground cover', 'Additional income'],
        pattern: 'Plant between maize rows',
        spaceAllocation: { main: 60, companion: 40 },
        yieldImpact: { main: 'no change', companion: 'normal' },
        income: 22000
      },
      {
        name: 'soybean',
        compatibility: 85,
        benefits: ['Nitrogen fixation', 'Soil health', 'Income diversification'],
        pattern: 'Alternate rows (1:1 ratio)',
        spaceAllocation: { main: 50, companion: 50 },
        yieldImpact: { main: 'no change', companion: 'normal' },
        income: 28000
      }
    ],
    rotationCrops: [
      {
        name: 'wheat',
        compatibility: 95,
        benefits: ['Pest cycle break', 'Soil structure improvement'],
        pattern: 'Sow after maize harvest',
        spaceAllocation: { main: 0, companion: 100 },
        yieldImpact: { main: 'N/A', companion: 'normal' },
        income: 50000
      }
    ]
  },
  tomato: {
    intercrops: [
      {
        name: 'onion',
        compatibility: 85,
        benefits: ['Pest repellent', 'Space utilization', 'Additional income'],
        pattern: 'Plant between tomato rows',
        spaceAllocation: { main: 60, companion: 40 },
        yieldImpact: { main: 'no change', companion: 'normal' },
        income: 35000
      },
      {
        name: 'coriander',
        compatibility: 80,
        benefits: ['Attracts beneficial insects', 'Quick harvest', 'Additional income'],
        pattern: 'Plant between tomato rows',
        spaceAllocation: { main: 70, companion: 30 },
        yieldImpact: { main: 'no change', companion: 'normal' },
        income: 15000
      }
    ],
    borderCrops: [
      {
        name: 'marigold',
        compatibility: 90,
        benefits: ['Pest repellent', 'Nematode control', 'Attracts pollinators'],
        pattern: 'Plant along field borders',
        spaceAllocation: { main: 95, companion: 5 },
        yieldImpact: { main: '+5%', companion: 'N/A' },
        income: 8000
      }
    ]
  }
};

export class CompanionCropService {
  /**
   * Generate companion crop recommendations
   */
  recommendCompanionCrops(input: CompanionCropInput): CompanionCropRecommendation {
    const cropKey = input.mainCropName.toLowerCase();
    const cropData = COMPANION_CROPS[cropKey];

    if (!cropData) {
      return this.getDefaultRecommendation(input);
    }

    const suggestions: CompanionCropSuggestion[] = [];

    // Add intercrop suggestions
    if (cropData.intercrops) {
      cropData.intercrops.forEach((crop: any) => {
        if (this.isCompatibleWithConditions(crop, input)) {
          suggestions.push(this.createSuggestion(crop, 'intercrop', input));
        }
      });
    }

    // Add border crop suggestions
    if (cropData.borderCrops) {
      cropData.borderCrops.forEach((crop: any) => {
        suggestions.push(this.createSuggestion(crop, 'border_crop', input));
      });
    }

    // Add rotation crop suggestions
    if (cropData.rotationCrops) {
      cropData.rotationCrops.forEach((crop: any) => {
        suggestions.push(this.createSuggestion(crop, 'rotation_crop', input));
      });
    }

    // Filter by objective
    const filteredSuggestions = this.filterByObjective(suggestions, input.objective);

    // Determine best combination
    const bestCombination = this.determineBestCombination(filteredSuggestions, input);

    // Generate seasonal rotation plan
    const seasonalRotation = this.generateSeasonalRotation(input.mainCropName, cropData);

    // Generate warnings
    const warnings = this.generateWarnings(input, filteredSuggestions);

    return {
      mainCropId: input.mainCropId,
      mainCropName: input.mainCropName,
      suggestions: filteredSuggestions,
      bestCombination,
      seasonalRotation,
      warnings,
      recommendedAt: new Date()
    };
  }

  /**
   * Create suggestion from crop data
   */
  private createSuggestion(
    crop: any,
    type: 'intercrop' | 'mixed_crop' | 'border_crop' | 'rotation_crop',
    input: CompanionCropInput
  ): CompanionCropSuggestion {
    const incomePerAcre = crop.income;
    const totalIncome = (incomePerAcre * input.landArea * crop.spaceAllocation.companion) / 100;

    return {
      cropId: crop.name,
      cropName: this.formatCropName(crop.name),
      companionType: type,
      compatibility: crop.compatibility,
      benefits: crop.benefits,
      plantingPattern: crop.pattern,
      spaceAllocation: crop.spaceAllocation,
      expectedYieldImpact: {
        mainCrop: crop.yieldImpact.main,
        companionCrop: crop.yieldImpact.companion
      },
      additionalIncome: Math.round(totalIncome),
      managementTips: this.generateManagementTips(crop, type)
    };
  }

  /**
   * Check if crop is compatible with conditions
   */
  private isCompatibleWithConditions(crop: any, input: CompanionCropInput): boolean {
    // For rainfed, avoid water-intensive intercrops
    if (input.irrigationType === 'rainfed' && crop.name.includes('water')) {
      return false;
    }
    return true;
  }

  /**
   * Filter suggestions by objective
   */
  private filterByObjective(
    suggestions: CompanionCropSuggestion[],
    objective: string
  ): CompanionCropSuggestion[] {
    if (objective === 'all') {
      return suggestions;
    }

    return suggestions.filter(suggestion => {
      switch (objective) {
        case 'pest_control':
          return suggestion.benefits.some(b => 
            b.toLowerCase().includes('pest') || b.toLowerCase().includes('repellent')
          );
        case 'soil_health':
          return suggestion.benefits.some(b => 
            b.toLowerCase().includes('nitrogen') || b.toLowerCase().includes('soil')
          );
        case 'income_diversification':
          return suggestion.additionalIncome > 0;
        case 'risk_mitigation':
          return suggestion.companionType === 'rotation_crop' || suggestion.additionalIncome > 10000;
        default:
          return true;
      }
    });
  }

  /**
   * Determine best combination
   */
  private determineBestCombination(
    suggestions: CompanionCropSuggestion[],
    input: CompanionCropInput
  ): any {
    // Select one intercrop and one border crop for best combination
    const intercrop = suggestions
      .filter(s => s.companionType === 'intercrop')
      .sort((a, b) => b.compatibility - a.compatibility)[0];

    const borderCrop = suggestions
      .filter(s => s.companionType === 'border_crop')
      .sort((a, b) => b.compatibility - a.compatibility)[0];

    const crops: string[] = [input.mainCropName];
    let totalIncome = 0;
    let riskReduction = 0;
    let soilHealthImprovement = 0;

    if (intercrop) {
      crops.push(intercrop.cropName);
      totalIncome += intercrop.additionalIncome;
      riskReduction += 15;
      if (intercrop.benefits.some(b => b.toLowerCase().includes('nitrogen'))) {
        soilHealthImprovement += 20;
      }
    }

    if (borderCrop) {
      crops.push(borderCrop.cropName);
      totalIncome += borderCrop.additionalIncome;
      riskReduction += 10;
    }

    return {
      crops,
      totalIncome: Math.round(totalIncome),
      riskReduction,
      soilHealthImprovement
    };
  }

  /**
   * Generate seasonal rotation plan
   */
  private generateSeasonalRotation(mainCrop: string, cropData: any): any[] {
    const rotation: any[] = [];

    // Main crop season
    rotation.push({
      season: 'Kharif (Monsoon)',
      crops: [mainCrop],
      benefits: ['Primary income', 'Optimal growing conditions']
    });

    // Rotation crops
    if (cropData.rotationCrops && cropData.rotationCrops.length > 0) {
      const rotationCrop = cropData.rotationCrops[0];
      rotation.push({
        season: 'Rabi (Winter)',
        crops: [this.formatCropName(rotationCrop.name)],
        benefits: rotationCrop.benefits
      });
    }

    return rotation;
  }

  /**
   * Generate warnings
   */
  private generateWarnings(
    input: CompanionCropInput,
    suggestions: CompanionCropSuggestion[]
  ): string[] {
    const warnings: string[] = [];

    if (input.irrigationType === 'rainfed') {
      warnings.push('Rainfed cultivation - Ensure companion crops have similar water requirements');
    }

    const hasIntercrop = suggestions.some(s => s.companionType === 'intercrop');
    if (hasIntercrop) {
      warnings.push('Intercropping requires careful spacing and timing - follow planting patterns strictly');
    }

    if (input.landArea < 2) {
      warnings.push('Small land area - Consider border crops instead of intercrops for easier management');
    }

    return warnings;
  }

  /**
   * Generate management tips
   */
  private generateManagementTips(crop: any, type: string): string[] {
    const tips: string[] = [];

    if (type === 'intercrop') {
      tips.push('Ensure proper spacing to avoid competition');
      tips.push('Adjust fertilizer doses for both crops');
      tips.push('Monitor both crops for pests and diseases');
    }

    if (type === 'border_crop') {
      tips.push('Maintain border crops throughout the season');
      tips.push('Do not use pesticides on border crops if they attract beneficial insects');
    }

    if (type === 'rotation_crop') {
      tips.push('Prepare land immediately after main crop harvest');
      tips.push('Ensure proper residue management');
    }

    if (crop.benefits.some((b: string) => b.toLowerCase().includes('nitrogen'))) {
      tips.push('Incorporate crop residue into soil after harvest for nitrogen benefit');
    }

    return tips;
  }

  /**
   * Format crop name for display
   */
  private formatCropName(name: string): string {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get default recommendation for unknown crops
   */
  private getDefaultRecommendation(input: CompanionCropInput): CompanionCropRecommendation {
    return {
      mainCropId: input.mainCropId,
      mainCropName: input.mainCropName,
      suggestions: [],
      bestCombination: {
        crops: [input.mainCropName],
        totalIncome: 0,
        riskReduction: 0,
        soilHealthImprovement: 0
      },
      seasonalRotation: [],
      warnings: ['Companion crop data not available for this crop'],
      recommendedAt: new Date()
    };
  }
}
