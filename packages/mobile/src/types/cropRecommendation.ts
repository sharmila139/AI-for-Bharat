/**
 * Crop Recommendation Type Definitions
 */

export interface CropRecommendationInput {
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
  marketPrice?: number;
  historicalYield?: number;
  topN?: number;
}

export interface CropRecommendation {
  crop: string;
  overallScore: number;
  soilScore: number;
  climateScore: number;
  seasonalScore: number;
  marketScore: number;
  suitabilityLevel: string;
  improvementSuggestions?: string[];
}

export interface CropRecommendationResponse {
  recommendations: CropRecommendation[];
  farmConditions: CropRecommendationInput;
  source: 'ml-model' | 'rule-based' | 'cached';
  timestamp: string;
}

export const SOIL_TYPES = [
  { value: 'alluvial', label: 'Alluvial (जलोढ़)' },
  { value: 'black', label: 'Black (काली)' },
  { value: 'red', label: 'Red (लाल)' },
  { value: 'laterite', label: 'Laterite (लैटेराइट)' },
  { value: 'sandy', label: 'Sandy (रेतीली)' },
  { value: 'clayey', label: 'Clayey (चिकनी)' },
  { value: 'loamy', label: 'Loamy (दोमट)' },
];

export const REGIONS = [
  { value: 'north', label: 'North India' },
  { value: 'south', label: 'South India' },
  { value: 'east', label: 'East India' },
  { value: 'west', label: 'West India' },
  { value: 'central', label: 'Central India' },
];

export const SEASONS = [
  { value: 'kharif', label: 'Kharif (खरीफ) - Monsoon' },
  { value: 'rabi', label: 'Rabi (रबी) - Winter' },
  { value: 'zaid', label: 'Zaid (जायद) - Summer' },
];

export const WATER_AVAILABILITY = [
  { value: 'abundant', label: 'Abundant (>200mm/month)' },
  { value: 'moderate', label: 'Moderate (100-200mm/month)' },
  { value: 'limited', label: 'Limited (<100mm/month)' },
];
