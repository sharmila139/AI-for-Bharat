/**
 * Remedy API Service
 * Client-side API calls for natural medicine database
 */

import axios from 'axios';
import { getAuthToken } from '../auth/auth-service';
import { API_BASE_URL } from '../../config/api-config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/natural-medicine`,
  timeout: 15000,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================================
// TYPES
// ============================================================================

export type RemedyCategory = 'ayurvedic' | 'herbal' | 'home_remedy' | 'dietary' | 'lifestyle';
export type DifficultyLevel = 'easy' | 'moderate' | 'difficult';
export type EvidenceLevel = 'traditional' | 'moderate' | 'strong';

export interface MultiLangName {
  en: string;
  hi?: string;
  ta?: string;
  te?: string;
  [key: string]: string | undefined;
}

export interface RemedySearchFilters {
  ailment?: string;
  category?: RemedyCategory;
  difficulty_level?: DifficultyLevel;
  max_preparation_time?: number;
  evidence_level?: EvidenceLevel;
  safe_for_pregnancy?: boolean;
  safe_for_children?: boolean;
  min_efficacy_rating?: number;
  seasonal_only?: boolean;
  verified_only?: boolean;
}

export interface Remedy {
  remedy_id: string;
  names: MultiLangName;
  description?: string;
  ailments_treated: string[];
  preparation_time_minutes?: number;
  difficulty_level?: DifficultyLevel;
  efficacy_rating?: number;
  evidence_level: EvidenceLevel;
  success_rate_percentage?: number;
  category?: RemedyCategory;
}

export interface RemedySearchResult {
  remedy: Remedy;
  relevance_score: number;
  average_rating?: number;
  total_ratings: number;
  ingredients_count: number;
  seasonal_available: boolean;
}

export interface RemedySearchResponse {
  results: RemedySearchResult[];
  total_count: number;
  page: number;
  page_size: number;
  filters_applied: RemedySearchFilters;
}

export interface RemedyIngredient {
  ingredient_id: string;
  ingredient_name: MultiLangName;
  quantity: string;
  seasonal_availability?: number[];
  availability_notes?: string;
}

export interface PreparationStep {
  step_number: number;
  description: string;
  duration_minutes?: number;
  image_url?: string;
  video_url?: string;
}

export interface DosageGuideline {
  age_group: string;
  dosage_amount: string;
  frequency: string;
  duration?: string;
  special_instructions?: string;
}

export interface SafetyInformation {
  side_effects?: Array<{ effect: string; severity: string }>;
  contraindications?: Array<{ condition: string; reason: string }>;
  drug_interactions?: Array<{ drug: string; interaction: string }>;
  allergy_warnings?: Array<{ allergen: string; reaction: string }>;
  safe_for_pregnancy: boolean;
  safe_for_children: boolean;
  warnings?: string[];
}

export interface CompleteRemedy extends Remedy {
  ingredients: RemedyIngredient[];
  preparation_steps: PreparationStep[];
  dosage_guidelines: DosageGuideline[];
  safety_info?: SafetyInformation;
  average_rating?: number;
  total_ratings?: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Search remedies with filters
 */
export const searchRemedies = async (
  query?: string,
  filters?: RemedySearchFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<RemedySearchResponse> => {
  // Mock data for development
  if (__DEV__) {
    const allMockRemedies: RemedySearchResult[] = [
      {
        remedy: {
          remedy_id: '1',
          names: { en: 'Ginger Tea for Cold', hi: 'सर्दी के लिए अदरक की चाय' },
          description: 'Natural remedy for common cold and cough',
          ailments_treated: ['cold', 'cough', 'sore throat'],
          preparation_time_minutes: 10,
          difficulty_level: 'easy',
          efficacy_rating: 4.5,
          evidence_level: 'strong',
          success_rate_percentage: 85,
          category: 'herbal',
        },
        relevance_score: 0.95,
        average_rating: 4.5,
        total_ratings: 234,
        ingredients_count: 3,
        seasonal_available: true,
      },
      {
        remedy: {
          remedy_id: '2',
          names: { en: 'Turmeric Milk', hi: 'हल्दी दूध' },
          description: 'Anti-inflammatory drink for immunity',
          ailments_treated: ['inflammation', 'immunity', 'joint pain'],
          preparation_time_minutes: 5,
          difficulty_level: 'easy',
          efficacy_rating: 4.7,
          evidence_level: 'strong',
          success_rate_percentage: 90,
          category: 'ayurvedic',
        },
        relevance_score: 0.92,
        average_rating: 4.7,
        total_ratings: 456,
        ingredients_count: 4,
        seasonal_available: true,
      },
      {
        remedy: {
          remedy_id: '3',
          names: { en: 'Honey Lemon Water', hi: 'शहद नींबू पानी' },
          description: 'Detox drink for digestion',
          ailments_treated: ['digestion', 'detox', 'weight loss'],
          preparation_time_minutes: 3,
          difficulty_level: 'easy',
          efficacy_rating: 4.3,
          evidence_level: 'moderate',
          success_rate_percentage: 75,
          category: 'home_remedy',
        },
        relevance_score: 0.88,
        average_rating: 4.3,
        total_ratings: 189,
        ingredients_count: 3,
        seasonal_available: true,
      },
    ];

    // Filter by query if provided
    let filtered = allMockRemedies;
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = allMockRemedies.filter(
        (r) =>
          r.remedy.names.en.toLowerCase().includes(lowerQuery) ||
          r.remedy.description?.toLowerCase().includes(lowerQuery) ||
          r.remedy.ailments_treated.some((a) => a.toLowerCase().includes(lowerQuery))
      );
    }

    return {
      results: filtered.slice((page - 1) * pageSize, page * pageSize),
      total_count: filtered.length,
      page,
      page_size: pageSize,
      filters_applied: filters || {},
    };
  }

  const response = await api.post('/search', {
    query,
    filters,
    page,
    page_size: pageSize,
  });
  return response.data;
};

/**
 * Get complete remedy details
 */
export const getRemedyDetails = async (remedyId: string): Promise<CompleteRemedy> => {
  const response = await api.get(`/remedies/${remedyId}`);
  return response.data;
};

/**
 * Get seasonal remedies
 */
export const getSeasonalRemedies = async (
  page: number = 1,
  pageSize: number = 20
): Promise<RemedySearchResponse> => {
  const response = await api.get('/seasonal', {
    params: { page, page_size: pageSize },
  });
  return response.data;
};

/**
 * Get top-rated remedies
 */
export const getTopRatedRemedies = async (limit: number = 10): Promise<RemedySearchResult[]> => {
  // Mock data for development
  if (__DEV__) {
    const mockRemedies: RemedySearchResult[] = [
      {
        remedy: {
          remedy_id: '1',
          names: { en: 'Ginger Tea for Cold', hi: 'सर्दी के लिए अदरक की चाय' },
          description: 'Natural remedy for common cold and cough',
          ailments_treated: ['cold', 'cough', 'sore throat'],
          preparation_time_minutes: 10,
          difficulty_level: 'easy',
          efficacy_rating: 4.5,
          evidence_level: 'strong',
          success_rate_percentage: 85,
          category: 'herbal',
        },
        relevance_score: 0.95,
        average_rating: 4.5,
        total_ratings: 234,
        ingredients_count: 3,
        seasonal_available: true,
      },
      {
        remedy: {
          remedy_id: '2',
          names: { en: 'Turmeric Milk', hi: 'हल्दी दूध' },
          description: 'Anti-inflammatory drink for immunity',
          ailments_treated: ['inflammation', 'immunity', 'joint pain'],
          preparation_time_minutes: 5,
          difficulty_level: 'easy',
          efficacy_rating: 4.7,
          evidence_level: 'strong',
          success_rate_percentage: 90,
          category: 'ayurvedic',
        },
        relevance_score: 0.92,
        average_rating: 4.7,
        total_ratings: 456,
        ingredients_count: 4,
        seasonal_available: true,
      },
      {
        remedy: {
          remedy_id: '3',
          names: { en: 'Honey Lemon Water', hi: 'शहद नींबू पानी' },
          description: 'Detox drink for digestion',
          ailments_treated: ['digestion', 'detox', 'weight loss'],
          preparation_time_minutes: 3,
          difficulty_level: 'easy',
          efficacy_rating: 4.3,
          evidence_level: 'moderate',
          success_rate_percentage: 75,
          category: 'home_remedy',
        },
        relevance_score: 0.88,
        average_rating: 4.3,
        total_ratings: 189,
        ingredients_count: 3,
        seasonal_available: true,
      },
      {
        remedy: {
          remedy_id: '4',
          names: { en: 'Tulsi Tea', hi: 'तुलसी की चाय' },
          description: 'Holy basil tea for respiratory health',
          ailments_treated: ['cough', 'asthma', 'respiratory'],
          preparation_time_minutes: 8,
          difficulty_level: 'easy',
          efficacy_rating: 4.6,
          evidence_level: 'strong',
          success_rate_percentage: 88,
          category: 'ayurvedic',
        },
        relevance_score: 0.90,
        average_rating: 4.6,
        total_ratings: 312,
        ingredients_count: 2,
        seasonal_available: true,
      },
      {
        remedy: {
          remedy_id: '5',
          names: { en: 'Aloe Vera Juice', hi: 'एलोवेरा जूस' },
          description: 'Natural remedy for skin and digestion',
          ailments_treated: ['skin', 'digestion', 'acidity'],
          preparation_time_minutes: 5,
          difficulty_level: 'easy',
          efficacy_rating: 4.4,
          evidence_level: 'moderate',
          success_rate_percentage: 80,
          category: 'herbal',
        },
        relevance_score: 0.85,
        average_rating: 4.4,
        total_ratings: 267,
        ingredients_count: 2,
        seasonal_available: true,
      },
    ];
    return mockRemedies.slice(0, limit);
  }

  const response = await api.get('/top-rated', {
    params: { limit },
  });
  return response.data;
};

/**
 * Search remedies by ailment
 */
export const searchByAilment = async (
  ailment: string,
  page: number = 1,
  pageSize: number = 20
): Promise<RemedySearchResponse> => {
  const response = await api.get(`/search/ailment/${encodeURIComponent(ailment)}`, {
    params: { page, page_size: pageSize },
  });
  return response.data;
};

/**
 * Get personalized remedy recommendations
 */
export const getPersonalizedRemedies = async (
  userProfile: {
    is_pregnant?: boolean;
    is_lactating?: boolean;
    has_children?: boolean;
    age?: number;
  },
  ailment?: string,
  limit: number = 10
): Promise<RemedySearchResult[]> => {
  const response = await api.post('/personalized', {
    user_profile: userProfile,
    ailment,
    limit,
  });
  return response.data;
};

/**
 * Rate a remedy
 */
export const rateRemedy = async (
  remedyId: string,
  rating: number,
  effectiveness?: string,
  reviewText?: string
): Promise<void> => {
  await api.post('/ratings', {
    remedy_id: remedyId,
    rating,
    effectiveness,
    review_text: reviewText,
  });
};

export default {
  searchRemedies,
  getRemedyDetails,
  getSeasonalRemedies,
  getTopRatedRemedies,
  searchByAilment,
  getPersonalizedRemedies,
  rateRemedy,
};
