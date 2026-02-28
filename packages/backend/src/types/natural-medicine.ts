/**
 * TypeScript interfaces for Natural Medicine Database
 * Corresponds to schema: 06_natural_medicine.sql
 */

/**
 * Multi-language name structure
 * Supports English, Hindi, Tamil, Telugu, and other Indian languages
 */
export interface MultiLangName {
  en: string; // English (required)
  hi?: string; // Hindi
  ta?: string; // Tamil
  te?: string; // Telugu
  bn?: string; // Bengali
  mr?: string; // Marathi
  gu?: string; // Gujarati
  kn?: string; // Kannada
  ml?: string; // Malayalam
  pa?: string; // Punjabi
  or?: string; // Odia
  as?: string; // Assamese
  ur?: string; // Urdu
  scientific?: string; // Scientific name
  [key: string]: string | undefined; // Allow other language codes
}

/**
 * Evidence level for remedy efficacy
 */
export type EvidenceLevel = 'traditional' | 'moderate' | 'strong';

/**
 * Verification status for remedies
 */
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

/**
 * Remedy status in the system
 */
export type RemedyStatus = 'draft' | 'review' | 'published' | 'archived';

/**
 * Remedy category
 */
export type RemedyCategory = 'ayurvedic' | 'herbal' | 'home_remedy' | 'dietary' | 'lifestyle';

/**
 * Difficulty level for preparation
 */
export type DifficultyLevel = 'easy' | 'moderate' | 'difficult';

/**
 * Age groups for dosage guidelines
 */
export type AgeGroup = 'infant' | 'child' | 'adult' | 'elderly' | 'pregnant' | 'lactating';

/**
 * Effectiveness rating from users
 */
export type Effectiveness = 'very_effective' | 'effective' | 'somewhat_effective' | 'not_effective';

/**
 * Core remedy information
 */
export interface Remedy {
  remedy_id: string;
  names: MultiLangName;
  description?: string;
  description_multilang?: Record<string, string>;
  ailments_treated: string[];
  symptoms_addressed?: string[];
  preparation_time_minutes?: number;
  difficulty_level?: DifficultyLevel;
  efficacy_rating?: number; // 1.0 to 5.0
  evidence_level: EvidenceLevel;
  success_rate_percentage?: number; // 0 to 100
  verification_status: VerificationStatus;
  verified_by?: string; // UUID of verifying user
  verified_at?: Date;
  verification_notes?: string;
  category?: RemedyCategory;
  status: RemedyStatus;
  created_at: Date;
  updated_at: Date;
}

/**
 * Substitute ingredient information
 */
export interface SubstituteIngredient {
  name: MultiLangName;
  notes?: string;
}

/**
 * Ingredient for a remedy
 */
export interface RemedyIngredient {
  ingredient_id: string;
  remedy_id: string;
  ingredient_name: MultiLangName;
  quantity: string; // e.g., "1 teaspoon", "100 grams"
  unit?: string; // e.g., "teaspoon", "grams", "ml"
  seasonal_availability?: number[]; // Array of month numbers (1-12)
  availability_notes?: string;
  substitutes?: SubstituteIngredient[];
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Step-by-step preparation method
 */
export interface PreparationMethod {
  step_id: string;
  remedy_id: string;
  step_number: number;
  description: string;
  description_multilang?: Record<string, string>;
  duration_minutes?: number;
  temperature?: string; // e.g., "medium heat", "room temperature"
  image_url?: string;
  video_url?: string;
  audio_url?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Age-specific dosage guideline
 */
export interface DosageGuideline {
  dosage_id: string;
  remedy_id: string;
  age_group: AgeGroup;
  age_range_min?: number; // Minimum age in years
  age_range_max?: number; // Maximum age in years
  dosage_amount: string; // e.g., "1 teaspoon", "half cup"
  frequency: string; // e.g., "twice daily", "before meals"
  duration?: string; // e.g., "3-5 days", "until symptoms improve"
  special_instructions?: string;
  special_instructions_multilang?: Record<string, string>;
  best_time?: string; // e.g., "morning empty stomach", "before bed"
  created_at: Date;
  updated_at: Date;
}

/**
 * Side effect information
 */
export interface SideEffect {
  effect: string;
  severity: 'mild' | 'moderate' | 'severe';
  frequency: 'rare' | 'occasional' | 'common';
}

/**
 * Drug interaction information
 */
export interface DrugInteraction {
  drug: string;
  interaction: string;
  severity: 'mild' | 'moderate' | 'severe';
}

/**
 * Contraindication information
 */
export interface Contraindication {
  condition: string;
  reason: string;
  severity: 'caution' | 'avoid' | 'contraindicated';
}

/**
 * Allergy warning information
 */
export interface AllergyWarning {
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
}

/**
 * Safety information for a remedy
 */
export interface SafetyInformation {
  safety_id: string;
  remedy_id: string;
  side_effects?: SideEffect[];
  contraindications?: Contraindication[];
  drug_interactions?: DrugInteraction[];
  allergy_warnings?: AllergyWarning[];
  safe_for_pregnancy: boolean;
  safe_for_children: boolean;
  safe_for_elderly: boolean;
  safe_for_lactating: boolean;
  warnings?: string[];
  precautions?: string[];
  created_at: Date;
  updated_at: Date;
}

/**
 * User rating and review for a remedy
 */
export interface UserRating {
  rating_id: string;
  remedy_id: string;
  user_id: string;
  rating: number; // 1 to 5
  review_text?: string;
  ailment_treated?: string;
  effectiveness?: Effectiveness;
  days_used?: number;
  followed_instructions: boolean;
  helpful_count: number;
  not_helpful_count: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Complete remedy with all related information
 */
export interface CompleteRemedy extends Remedy {
  ingredients: RemedyIngredient[];
  preparation_steps: PreparationMethod[];
  dosage_guidelines: DosageGuideline[];
  safety_info?: SafetyInformation;
  ratings?: UserRating[];
  average_rating?: number;
  total_ratings?: number;
}

/**
 * Remedy search filters
 */
export interface RemedySearchFilters {
  ailment?: string;
  category?: RemedyCategory;
  difficulty_level?: DifficultyLevel;
  max_preparation_time?: number;
  evidence_level?: EvidenceLevel;
  safe_for_pregnancy?: boolean;
  safe_for_children?: boolean;
  min_efficacy_rating?: number;
  seasonal_only?: boolean; // Only show remedies with ingredients available this month
  verified_only?: boolean;
}

/**
 * Remedy search result with ranking
 */
export interface RemedySearchResult {
  remedy: Remedy;
  relevance_score: number;
  average_rating?: number;
  total_ratings: number;
  ingredients_count: number;
  seasonal_available: boolean;
}

/**
 * Remedy statistics for analytics
 */
export interface RemedyStatistics {
  remedy_id: string;
  total_views: number;
  total_ratings: number;
  average_rating: number;
  success_rate: number;
  positive_feedback_count: number;
  negative_feedback_count: number;
  most_common_ailment: string;
}

/**
 * Request to create a new remedy
 */
export interface CreateRemedyRequest {
  names: MultiLangName;
  description?: string;
  description_multilang?: Record<string, string>;
  ailments_treated: string[];
  symptoms_addressed?: string[];
  preparation_time_minutes?: number;
  difficulty_level?: DifficultyLevel;
  efficacy_rating?: number;
  evidence_level: EvidenceLevel;
  category?: RemedyCategory;
  ingredients: Omit<RemedyIngredient, 'ingredient_id' | 'remedy_id' | 'created_at' | 'updated_at'>[];
  preparation_steps: Omit<PreparationMethod, 'step_id' | 'remedy_id' | 'created_at' | 'updated_at'>[];
  dosage_guidelines: Omit<DosageGuideline, 'dosage_id' | 'remedy_id' | 'created_at' | 'updated_at'>[];
  safety_info: Omit<SafetyInformation, 'safety_id' | 'remedy_id' | 'created_at' | 'updated_at'>;
}

/**
 * Request to update a remedy
 */
export interface UpdateRemedyRequest extends Partial<CreateRemedyRequest> {
  remedy_id: string;
}

/**
 * Request to verify a remedy (by Ayurvedic doctor)
 */
export interface VerifyRemedyRequest {
  remedy_id: string;
  verification_status: 'verified' | 'rejected';
  verification_notes?: string;
}

/**
 * Request to rate a remedy
 */
export interface RateRemedyRequest {
  remedy_id: string;
  rating: number; // 1 to 5
  review_text?: string;
  ailment_treated?: string;
  effectiveness?: Effectiveness;
  days_used?: number;
  followed_instructions?: boolean;
}

/**
 * Response for remedy search
 */
export interface RemedySearchResponse {
  results: RemedySearchResult[];
  total_count: number;
  page: number;
  page_size: number;
  filters_applied: RemedySearchFilters;
}
