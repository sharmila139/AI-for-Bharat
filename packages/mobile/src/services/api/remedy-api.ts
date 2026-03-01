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
