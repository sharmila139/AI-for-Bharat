/**
 * Crop Recommendation API Endpoint
 * Provides crop recommendations based on farm conditions
 */

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

interface CropRecommendationRequest {
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

interface CropRecommendation {
  crop: string;
  overallScore: number;
  soilScore: number;
  climateScore: number;
  seasonalScore: number;
  marketScore: number;
  suitabilityLevel: string;
  improvementSuggestions?: string[];
}

interface CropRecommendationResponse {
  recommendations: CropRecommendation[];
  farmConditions: CropRecommendationRequest;
  source: 'ml-model' | 'rule-based' | 'cached';
  timestamp: string;
}

// Configuration
const LAMBDA_ENDPOINT = process.env.CROP_RECOMMENDATION_LAMBDA_URL || '';
const CACHE_TTL = 3600; // 1 hour in seconds
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Simple in-memory cache (in production, use Redis)
const cache = new Map<string, { data: CropRecommendationResponse; expiresAt: number }>();

/**
 * Generate cache key from request parameters
 */
function generateCacheKey(params: CropRecommendationRequest): string {
  const key = `crop_rec_${params.soilType}_${params.nitrogen}_${params.phosphorus}_${params.potassium}_${params.ph}_${params.temperature}_${params.humidity}_${params.rainfall}_${params.region}_${params.season}`;
  return key;
}

/**
 * Get cached recommendation if available and not expired
 */
function getCachedRecommendation(key: string): CropRecommendationResponse | null {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.data, source: 'cached' };
  }
  if (cached) {
    cache.delete(key); // Remove expired entry
  }
  return null;
}

/**
 * Cache recommendation
 */
function cacheRecommendation(key: string, data: CropRecommendationResponse): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL * 1000,
  });
}

/**
 * Call ML model Lambda function
 */
async function callMLModel(params: CropRecommendationRequest): Promise<CropRecommendation[]> {
  try {
    const response = await axios.post(
      LAMBDA_ENDPOINT,
      {
        body: {
          soil_type: params.soilType,
          nitrogen: params.nitrogen,
          phosphorus: params.phosphorus,
          potassium: params.potassium,
          ph: params.ph,
          temperature: params.temperature,
          humidity: params.humidity,
          rainfall: params.rainfall,
          region: params.region,
          season: params.season,
          market_price: params.marketPrice || 20,
          historical_yield: params.historicalYield || 2000,
          top_n: params.topN || 5,
        },
      },
      {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.recommendations) {
      return response.data.recommendations;
    }

    throw new Error('Invalid response from ML model');
  } catch (error) {
    console.error('Error calling ML model:', error);
    throw error;
  }
}

/**
 * Rule-based fallback recommendation
 * Simplified version - in production, use the full offline service
 */
function getRuleBasedRecommendation(params: CropRecommendationRequest): CropRecommendation[] {
  // Simple rule-based logic
  const recommendations: CropRecommendation[] = [];

  // Rice - good for high rainfall, clayey/loamy soil
  if (
    params.rainfall > 150 &&
    ['alluvial', 'clayey', 'loamy'].includes(params.soilType) &&
    params.season === 'kharif'
  ) {
    recommendations.push({
      crop: 'Rice (धान)',
      overallScore: 0.85,
      soilScore: 0.9,
      climateScore: 0.85,
      seasonalScore: 1.0,
      marketScore: 0.7,
      suitabilityLevel: 'Highly Suitable',
    });
  }

  // Wheat - good for rabi season, moderate rainfall
  if (
    params.rainfall < 100 &&
    params.temperature < 25 &&
    params.season === 'rabi' &&
    ['alluvial', 'loamy', 'black'].includes(params.soilType)
  ) {
    recommendations.push({
      crop: 'Wheat (गेहूं)',
      overallScore: 0.82,
      soilScore: 0.85,
      climateScore: 0.8,
      seasonalScore: 1.0,
      marketScore: 0.75,
      suitabilityLevel: 'Highly Suitable',
    });
  }

  // Cotton - good for black soil
  if (params.soilType === 'black' && params.season === 'kharif') {
    recommendations.push({
      crop: 'Cotton (कपास)',
      overallScore: 0.78,
      soilScore: 1.0,
      climateScore: 0.7,
      seasonalScore: 0.9,
      marketScore: 0.8,
      suitabilityLevel: 'Suitable',
    });
  }

  // Maize - versatile crop
  if (['loamy', 'alluvial'].includes(params.soilType)) {
    recommendations.push({
      crop: 'Maize (मक्का)',
      overallScore: 0.75,
      soilScore: 0.8,
      climateScore: 0.75,
      seasonalScore: 0.8,
      marketScore: 0.65,
      suitabilityLevel: 'Suitable',
    });
  }

  // Tomato - good for loamy soil, moderate climate
  if (
    params.soilType === 'loamy' &&
    params.temperature < 30 &&
    ['rabi', 'zaid'].includes(params.season)
  ) {
    recommendations.push({
      crop: 'Tomato (टमाटर)',
      overallScore: 0.72,
      soilScore: 0.85,
      climateScore: 0.7,
      seasonalScore: 0.8,
      marketScore: 0.9,
      suitabilityLevel: 'Suitable',
    });
  }

  // Sort by score and return top N
  recommendations.sort((a, b) => b.overallScore - a.overallScore);
  return recommendations.slice(0, params.topN || 5);
}

/**
 * Validate request parameters
 */
function validateRequest(params: any): { valid: boolean; error?: string } {
  const required = [
    'soilType',
    'nitrogen',
    'phosphorus',
    'potassium',
    'ph',
    'temperature',
    'humidity',
    'rainfall',
    'region',
    'season',
  ];

  for (const field of required) {
    if (params[field] === undefined || params[field] === null) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  // Validate ranges
  const validations: Record<string, [number, number]> = {
    nitrogen: [0, 200],
    phosphorus: [0, 100],
    potassium: [0, 150],
    ph: [3.0, 10.0],
    temperature: [-10, 50],
    humidity: [0, 100],
    rainfall: [0, 500],
  };

  for (const [field, [min, max]] of Object.entries(validations)) {
    const value = params[field];
    if (typeof value !== 'number' || value < min || value > max) {
      return {
        valid: false,
        error: `Field '${field}' must be a number between ${min} and ${max}`,
      };
    }
  }

  // Validate categorical fields
  const validSoilTypes = ['alluvial', 'black', 'red', 'laterite', 'sandy', 'clayey', 'loamy'];
  if (!validSoilTypes.includes(params.soilType)) {
    return {
      valid: false,
      error: `Invalid soilType. Must be one of: ${validSoilTypes.join(', ')}`,
    };
  }

  const validRegions = ['north', 'south', 'east', 'west', 'central'];
  if (!validRegions.includes(params.region)) {
    return {
      valid: false,
      error: `Invalid region. Must be one of: ${validRegions.join(', ')}`,
    };
  }

  const validSeasons = ['kharif', 'rabi', 'zaid'];
  if (!validSeasons.includes(params.season)) {
    return {
      valid: false,
      error: `Invalid season. Must be one of: ${validSeasons.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * POST /api/crop-recommendation
 * Get crop recommendations based on farm conditions
 */
export async function getCropRecommendations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const params: CropRecommendationRequest = req.body;

    // Validate request
    const validation = validateRequest(params);
    if (!validation.valid) {
      res.status(400).json({
        error: 'Validation error',
        message: validation.error,
      });
      return;
    }

    // Check cache
    const cacheKey = generateCacheKey(params);
    const cached = getCachedRecommendation(cacheKey);
    if (cached) {
      console.log('Returning cached recommendation');
      res.json(cached);
      return;
    }

    let recommendations: CropRecommendation[];
    let source: 'ml-model' | 'rule-based' = 'ml-model';

    // Try ML model first
    if (LAMBDA_ENDPOINT) {
      try {
        console.log('Calling ML model...');
        recommendations = await callMLModel(params);
      } catch (error) {
        console.warn('ML model failed, falling back to rule-based:', error);
        recommendations = getRuleBasedRecommendation(params);
        source = 'rule-based';
      }
    } else {
      console.log('No Lambda endpoint configured, using rule-based');
      recommendations = getRuleBasedRecommendation(params);
      source = 'rule-based';
    }

    // Prepare response
    const response: CropRecommendationResponse = {
      recommendations,
      farmConditions: params,
      source,
      timestamp: new Date().toISOString(),
    };

    // Cache response
    cacheRecommendation(cacheKey, response);

    // Return response
    res.json(response);
  } catch (error) {
    console.error('Error in getCropRecommendations:', error);
    next(error);
  }
}

/**
 * GET /api/crop-recommendation/crops
 * Get list of all supported crops
 */
export async function getSupportedCrops(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const crops = [
      { name: 'rice', displayName: 'Rice (धान)', category: 'cereal' },
      { name: 'wheat', displayName: 'Wheat (गेहूं)', category: 'cereal' },
      { name: 'cotton', displayName: 'Cotton (कपास)', category: 'fiber' },
      { name: 'maize', displayName: 'Maize (मक्का)', category: 'cereal' },
      { name: 'sugarcane', displayName: 'Sugarcane (गन्ना)', category: 'cash' },
      { name: 'tomato', displayName: 'Tomato (टमाटर)', category: 'vegetable' },
      { name: 'potato', displayName: 'Potato (आलू)', category: 'vegetable' },
      { name: 'onion', displayName: 'Onion (प्याज)', category: 'vegetable' },
    ];

    res.json({ crops });
  } catch (error) {
    console.error('Error in getSupportedCrops:', error);
    next(error);
  }
}

/**
 * GET /api/crop-recommendation/health
 * Health check endpoint
 */
export async function healthCheck(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const health = {
      status: 'healthy',
      mlModelAvailable: !!LAMBDA_ENDPOINT,
      cacheSize: cache.size,
      timestamp: new Date().toISOString(),
    };

    res.json(health);
  } catch (error) {
    console.error('Error in healthCheck:', error);
    next(error);
  }
}

// Export router setup
export function setupCropRecommendationRoutes(router: any): void {
  router.post('/crop-recommendation', getCropRecommendations);
  router.get('/crop-recommendation/crops', getSupportedCrops);
  router.get('/crop-recommendation/health', healthCheck);
}
