/**
 * Offline Crop Recommendation Service
 * Rule-based fallback for crop recommendations when offline
 */

export interface FarmConditions {
  soilType: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  region: string;
  season: string;
  landArea?: number;
}

export interface CropRecommendation {
  crop: string;
  overallScore: number;
  soilScore: number;
  climateScore: number;
  seasonalScore: number;
  marketScore: number;
  suitabilityLevel: string;
  reasons: string[];
  warnings: string[];
  improvementSuggestions?: string[];
}

interface CropProfile {
  name: string;
  displayName: string;
  soilTypes: string[];
  nitrogenRange: [number, number];
  phosphorusRange: [number, number];
  potassiumRange: [number, number];
  phRange: [number, number];
  temperatureRange: [number, number];
  humidityRange: [number, number];
  rainfallRange: [number, number];
  preferredSeasons: string[];
  preferredRegions: string[];
  avgMarketPrice: number; // INR per kg
  avgYield: number; // kg per hectare
  growthDuration: number; // days
}

class OfflineCropRecommendationService {
  private cropProfiles: Map<string, CropProfile>;

  constructor() {
    this.cropProfiles = this.initializeCropProfiles();
  }

  private initializeCropProfiles(): Map<string, CropProfile> {
    const profiles = new Map<string, CropProfile>();

    // Rice
    profiles.set('rice', {
      name: 'rice',
      displayName: 'Rice (धान)',
      soilTypes: ['alluvial', 'clayey', 'loamy'],
      nitrogenRange: [80, 120],
      phosphorusRange: [40, 60],
      potassiumRange: [40, 60],
      phRange: [5.5, 7.0],
      temperatureRange: [20, 35],
      humidityRange: [70, 90],
      rainfallRange: [150, 300],
      preferredSeasons: ['kharif'],
      preferredRegions: ['east', 'south', 'west'],
      avgMarketPrice: 20,
      avgYield: 2500,
      growthDuration: 120,
    });

    // Wheat
    profiles.set('wheat', {
      name: 'wheat',
      displayName: 'Wheat (गेहूं)',
      soilTypes: ['alluvial', 'loamy', 'black'],
      nitrogenRange: [60, 100],
      phosphorusRange: [30, 50],
      potassiumRange: [30, 50],
      phRange: [6.0, 7.5],
      temperatureRange: [15, 25],
      humidityRange: [50, 70],
      rainfallRange: [50, 100],
      preferredSeasons: ['rabi'],
      preferredRegions: ['north', 'central', 'west'],
      avgMarketPrice: 18,
      avgYield: 2000,
      growthDuration: 120,
    });

    // Cotton
    profiles.set('cotton', {
      name: 'cotton',
      displayName: 'Cotton (कपास)',
      soilTypes: ['black', 'alluvial', 'red'],
      nitrogenRange: [60, 100],
      phosphorusRange: [30, 50],
      potassiumRange: [30, 50],
      phRange: [6.5, 8.0],
      temperatureRange: [21, 35],
      humidityRange: [50, 80],
      rainfallRange: [50, 120],
      preferredSeasons: ['kharif'],
      preferredRegions: ['central', 'south', 'west'],
      avgMarketPrice: 50,
      avgYield: 800,
      growthDuration: 180,
    });

    // Maize
    profiles.set('maize', {
      name: 'maize',
      displayName: 'Maize (मक्का)',
      soilTypes: ['loamy', 'alluvial', 'red'],
      nitrogenRange: [80, 120],
      phosphorusRange: [40, 60],
      potassiumRange: [40, 60],
      phRange: [5.5, 7.5],
      temperatureRange: [18, 32],
      humidityRange: [60, 80],
      rainfallRange: [60, 120],
      preferredSeasons: ['kharif', 'rabi'],
      preferredRegions: ['north', 'south', 'central'],
      avgMarketPrice: 15,
      avgYield: 2300,
      growthDuration: 90,
    });

    // Sugarcane
    profiles.set('sugarcane', {
      name: 'sugarcane',
      displayName: 'Sugarcane (गन्ना)',
      soilTypes: ['loamy', 'alluvial', 'black'],
      nitrogenRange: [100, 150],
      phosphorusRange: [50, 80],
      potassiumRange: [50, 80],
      phRange: [6.0, 7.5],
      temperatureRange: [20, 35],
      humidityRange: [70, 90],
      rainfallRange: [150, 250],
      preferredSeasons: ['kharif'],
      preferredRegions: ['south', 'west', 'central'],
      avgMarketPrice: 3,
      avgYield: 35000,
      growthDuration: 365,
    });

    // Tomato
    profiles.set('tomato', {
      name: 'tomato',
      displayName: 'Tomato (टमाटर)',
      soilTypes: ['loamy', 'sandy', 'red'],
      nitrogenRange: [100, 150],
      phosphorusRange: [50, 80],
      potassiumRange: [50, 80],
      phRange: [6.0, 7.0],
      temperatureRange: [18, 30],
      humidityRange: [60, 80],
      rainfallRange: [60, 100],
      preferredSeasons: ['rabi', 'zaid'],
      preferredRegions: ['south', 'west', 'north'],
      avgMarketPrice: 25,
      avgYield: 12000,
      growthDuration: 75,
    });

    // Potato
    profiles.set('potato', {
      name: 'potato',
      displayName: 'Potato (आलू)',
      soilTypes: ['loamy', 'sandy', 'alluvial'],
      nitrogenRange: [80, 120],
      phosphorusRange: [40, 60],
      potassiumRange: [60, 100],
      phRange: [5.0, 6.5],
      temperatureRange: [15, 25],
      humidityRange: [70, 90],
      rainfallRange: [50, 100],
      preferredSeasons: ['rabi'],
      preferredRegions: ['north', 'central', 'east'],
      avgMarketPrice: 12,
      avgYield: 8500,
      growthDuration: 90,
    });

    // Onion
    profiles.set('onion', {
      name: 'onion',
      displayName: 'Onion (प्याज)',
      soilTypes: ['loamy', 'alluvial', 'red'],
      nitrogenRange: [60, 100],
      phosphorusRange: [30, 50],
      potassiumRange: [40, 60],
      phRange: [6.0, 7.0],
      temperatureRange: [15, 30],
      humidityRange: [60, 80],
      rainfallRange: [40, 80],
      preferredSeasons: ['rabi', 'kharif'],
      preferredRegions: ['south', 'west', 'central'],
      avgMarketPrice: 20,
      avgYield: 10000,
      growthDuration: 120,
    });

    return profiles;
  }

  private calculateRangeScore(
    value: number,
    idealRange: [number, number],
    tolerance: number = 0.2
  ): number {
    const [min, max] = idealRange;
    const rangeWidth = max - min;

    // Perfect score if within ideal range
    if (value >= min && value <= max) {
      const center = (min + max) / 2;
      const distanceFromCenter = Math.abs(value - center);
      const maxDistance = rangeWidth / 2;
      return 1.0 - (distanceFromCenter / maxDistance) * 0.2; // 0.8 to 1.0
    }

    // Reduced score if outside but within tolerance
    const toleranceRange = rangeWidth * tolerance;

    if (value < min) {
      const distance = min - value;
      if (distance <= toleranceRange) {
        return 0.5 * (1 - distance / toleranceRange); // 0 to 0.5
      }
      return 0.0;
    } else {
      const distance = value - max;
      if (distance <= toleranceRange) {
        return 0.5 * (1 - distance / toleranceRange); // 0 to 0.5
      }
      return 0.0;
    }
  }

  private calculateSoilScore(
    conditions: FarmConditions,
    profile: CropProfile
  ): { score: number; reasons: string[]; warnings: string[] } {
    const reasons: string[] = [];
    const warnings: string[] = [];
    const scores: number[] = [];
    const weights = [0.25, 0.25, 0.20, 0.20, 0.10];

    // Soil type match
    const soilMatch = profile.soilTypes.includes(conditions.soilType) ? 1.0 : 0.3;
    scores.push(soilMatch);
    if (soilMatch === 1.0) {
      reasons.push(`Soil type (${conditions.soilType}) is ideal`);
    } else {
      warnings.push(`Soil type not ideal. Best: ${profile.soilTypes.join(', ')}`);
    }

    // Nitrogen
    const nScore = this.calculateRangeScore(conditions.nitrogen, profile.nitrogenRange);
    scores.push(nScore);
    if (nScore >= 0.8) {
      reasons.push('Nitrogen levels are optimal');
    } else if (nScore < 0.5) {
      warnings.push(
        `Nitrogen ${conditions.nitrogen < profile.nitrogenRange[0] ? 'deficient' : 'excess'}`
      );
    }

    // Phosphorus
    const pScore = this.calculateRangeScore(conditions.phosphorus, profile.phosphorusRange);
    scores.push(pScore);
    if (pScore < 0.5) {
      warnings.push(
        `Phosphorus ${conditions.phosphorus < profile.phosphorusRange[0] ? 'deficient' : 'excess'}`
      );
    }

    // Potassium
    const kScore = this.calculateRangeScore(conditions.potassium, profile.potassiumRange);
    scores.push(kScore);
    if (kScore < 0.5) {
      warnings.push(
        `Potassium ${conditions.potassium < profile.potassiumRange[0] ? 'deficient' : 'excess'}`
      );
    }

    // pH
    const phScore = this.calculateRangeScore(conditions.ph, profile.phRange, 0.3);
    scores.push(phScore);
    if (phScore >= 0.8) {
      reasons.push('Soil pH is optimal');
    } else if (phScore < 0.5) {
      warnings.push(`pH ${conditions.ph < profile.phRange[0] ? 'too acidic' : 'too alkaline'}`);
    }

    // Calculate weighted score
    const totalScore = scores.reduce((sum, score, i) => sum + score * weights[i], 0);

    return { score: totalScore, reasons, warnings };
  }

  private calculateClimateScore(
    conditions: FarmConditions,
    profile: CropProfile
  ): { score: number; reasons: string[]; warnings: string[] } {
    const reasons: string[] = [];
    const warnings: string[] = [];
    const scores: number[] = [];
    const weights = [0.4, 0.3, 0.3];

    // Temperature
    const tempScore = this.calculateRangeScore(conditions.temperature, profile.temperatureRange);
    scores.push(tempScore);
    if (tempScore >= 0.8) {
      reasons.push('Temperature is ideal');
    } else if (tempScore < 0.5) {
      warnings.push(
        `Temperature ${conditions.temperature < profile.temperatureRange[0] ? 'too low' : 'too high'}`
      );
    }

    // Humidity
    const humidityScore = this.calculateRangeScore(conditions.humidity, profile.humidityRange);
    scores.push(humidityScore);
    if (humidityScore >= 0.8) {
      reasons.push('Humidity is optimal');
    }

    // Rainfall
    const rainfallScore = this.calculateRangeScore(conditions.rainfall, profile.rainfallRange);
    scores.push(rainfallScore);
    if (rainfallScore >= 0.8) {
      reasons.push('Rainfall is adequate');
    } else if (rainfallScore < 0.5) {
      warnings.push(
        `Rainfall ${conditions.rainfall < profile.rainfallRange[0] ? 'insufficient - irrigation needed' : 'excessive - drainage needed'}`
      );
    }

    const totalScore = scores.reduce((sum, score, i) => sum + score * weights[i], 0);

    return { score: totalScore, reasons, warnings };
  }

  private calculateSeasonalScore(
    conditions: FarmConditions,
    profile: CropProfile
  ): { score: number; reasons: string[]; warnings: string[] } {
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Season match
    const seasonMatch = profile.preferredSeasons.includes(conditions.season) ? 1.0 : 0.5;
    if (seasonMatch === 1.0) {
      reasons.push(`Perfect season (${conditions.season})`);
    } else {
      warnings.push(`Not ideal season. Best: ${profile.preferredSeasons.join(', ')}`);
    }

    // Region match
    const regionMatch = profile.preferredRegions.includes(conditions.region) ? 1.0 : 0.7;
    if (regionMatch === 1.0) {
      reasons.push(`Suitable for ${conditions.region} region`);
    }

    const score = (seasonMatch + regionMatch) / 2;

    return { score, reasons, warnings };
  }

  private calculateMarketScore(profile: CropProfile): number {
    // Simple market score based on revenue potential
    const revenue = profile.avgMarketPrice * profile.avgYield;
    const normalizedRevenue = Math.min(revenue / 100000, 1.5);
    return Math.min(normalizedRevenue / 1.5, 1.0);
  }

  private getSuitabilityLevel(score: number): string {
    if (score >= 0.8) return 'Highly Suitable';
    if (score >= 0.6) return 'Suitable';
    if (score >= 0.4) return 'Moderately Suitable';
    if (score >= 0.2) return 'Marginally Suitable';
    return 'Not Suitable';
  }

  public recommendCrops(
    conditions: FarmConditions,
    topN: number = 5,
    minScore: number = 0.3
  ): CropRecommendation[] {
    const recommendations: CropRecommendation[] = [];

    // Evaluate each crop
    for (const [cropName, profile] of this.cropProfiles) {
      const soilResult = this.calculateSoilScore(conditions, profile);
      const climateResult = this.calculateClimateScore(conditions, profile);
      const seasonalResult = this.calculateSeasonalScore(conditions, profile);
      const marketScore = this.calculateMarketScore(profile);

      // Weighted overall score
      const overallScore =
        soilResult.score * 0.3 +
        climateResult.score * 0.35 +
        seasonalResult.score * 0.15 +
        marketScore * 0.2;

      // Only include crops above minimum score
      if (overallScore >= minScore) {
        const allReasons = [
          ...soilResult.reasons,
          ...climateResult.reasons,
          ...seasonalResult.reasons,
        ];
        const allWarnings = [
          ...soilResult.warnings,
          ...climateResult.warnings,
          ...seasonalResult.warnings,
        ];

        recommendations.push({
          crop: profile.displayName,
          overallScore: Math.round(overallScore * 1000) / 1000,
          soilScore: Math.round(soilResult.score * 1000) / 1000,
          climateScore: Math.round(climateResult.score * 1000) / 1000,
          seasonalScore: Math.round(seasonalResult.score * 1000) / 1000,
          marketScore: Math.round(marketScore * 1000) / 1000,
          suitabilityLevel: this.getSuitabilityLevel(overallScore),
          reasons: allReasons,
          warnings: allWarnings,
        });
      }
    }

    // Sort by overall score (descending)
    recommendations.sort((a, b) => b.overallScore - a.overallScore);

    // Return top N
    return recommendations.slice(0, topN);
  }

  public getCropDetails(cropName: string): CropProfile | undefined {
    return this.cropProfiles.get(cropName.toLowerCase());
  }

  public getAllCrops(): CropProfile[] {
    return Array.from(this.cropProfiles.values());
  }
}

// Singleton instance
export const offlineCropRecommendation = new OfflineCropRecommendationService();
