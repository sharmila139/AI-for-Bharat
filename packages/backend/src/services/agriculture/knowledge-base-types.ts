/**
 * Knowledge Base Types and Interfaces
 * Multi-language support for sustainable farming knowledge base
 */

// ============================================================================
// Multi-language Content Types
// ============================================================================

export type SupportedLanguage = 
  | 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' 
  | 'ml' | 'pa' | 'or' | 'as' | 'ur' | 'ks' | 'kok' | 'mni';

export interface MultiLanguageText {
  [key: string]: string; // Language code to text mapping
}

// ============================================================================
// Evidence and Verification Types
// ============================================================================

export type EvidenceLevel = 'traditional' | 'moderate' | 'strong';

export interface ScientificReference {
  title: string;
  authors: string;
  year: number;
  journal?: string;
  url?: string;
  doi?: string;
}

// ============================================================================
// Media Types
// ============================================================================

export type MediaType = 'image' | 'video' | 'audio' | 'document';

export interface MediaItem {
  url: string;
  caption?: MultiLanguageText;
  alt_text?: MultiLanguageText;
  thumbnail_url?: string;
  duration?: number; // For video/audio in seconds
}

export interface ArticleMedia {
  images: MediaItem[];
  videos: MediaItem[];
  audio: MediaItem[];
}

// ============================================================================
// Implementation Guide Types
// ============================================================================

export interface ImplementationStep {
  step: number;
  description: MultiLanguageText;
  duration?: string;
  image_url?: string;
  warnings?: MultiLanguageText[];
}

export interface Material {
  name: MultiLanguageText;
  quantity: string;
  cost?: number;
  where_to_find?: MultiLanguageText;
}

export interface Tool {
  name: MultiLanguageText;
  optional?: boolean;
}

export interface ImplementationGuide {
  steps: ImplementationStep[];
  materials: Material[];
  tools: Tool[];
  timeline: string;
  difficulty_level?: 'easy' | 'medium' | 'hard';
}

// ============================================================================
// Benefits Types
// ============================================================================

export interface EnvironmentalBenefit {
  description: MultiLanguageText;
  impact: 'low' | 'medium' | 'high';
  metrics?: {
    carbon_reduction?: string;
    water_saved?: string;
    soil_improvement?: string;
  };
}

export interface EconomicBenefit {
  description: MultiLanguageText;
  roi?: string;
  payback_period?: string;
  cost_reduction?: string;
  revenue_increase?: string;
}

export interface SocialBenefit {
  description: MultiLanguageText;
  community_impact?: string;
  health_benefits?: string;
}

export interface ArticleBenefits {
  environmental?: EnvironmentalBenefit;
  economic?: EconomicBenefit;
  social?: SocialBenefit;
}

// ============================================================================
// Article Types
// ============================================================================

export type ArticleCategory = 
  | 'organic_farming' 
  | 'pest_management' 
  | 'soil_conservation' 
  | 'water_management' 
  | 'crop_rotation' 
  | 'general';

export type ArticleStatus = 'draft' | 'review' | 'published' | 'archived';

export type AuthorType = 'extension_officer' | 'researcher' | 'farmer' | 'admin';

export interface KnowledgeArticle {
  article_id: string;
  title: MultiLanguageText;
  content: MultiLanguageText;
  summary?: MultiLanguageText;
  category: ArticleCategory;
  subcategory?: string;
  tags: string[];
  media: ArticleMedia;
  evidence_level: EvidenceLevel;
  scientific_references: ScientificReference[];
  implementation_guide?: ImplementationGuide;
  benefits?: ArticleBenefits;
  view_count: number;
  rating_sum: number;
  rating_count: number;
  average_rating?: number; // Computed
  success_story_count: number;
  verified_by?: string;
  verification_date?: Date;
  verification_notes?: string;
  applicable_crops: string[];
  applicable_regions: string[];
  applicable_seasons: string[];
  available_languages: SupportedLanguage[];
  primary_language: SupportedLanguage;
  status: ArticleStatus;
  published_at?: Date;
  author_id?: string;
  author_type?: AuthorType;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Crop Rotation Plan Types
// ============================================================================

export interface RotationSequenceItem {
  year: number;
  season: string;
  crop: string;
  benefits: MultiLanguageText;
  expected_yield?: string;
}

export interface SoilHealthImprovement {
  nitrogen_gain?: string;
  phosphorus_gain?: string;
  potassium_gain?: string;
  organic_matter?: string;
  description: MultiLanguageText;
}

export interface FinancialBreakdown {
  total_investment: number;
  expected_revenue: number;
  profit_margin: string;
  year_wise_breakdown: Array<{
    year: number;
    investment: number;
    revenue: number;
    profit: number;
  }>;
}

export interface CropRotationPlan {
  plan_id: string;
  plan_name: MultiLanguageText;
  description?: MultiLanguageText;
  rotation_sequence: RotationSequenceItem[];
  suitable_soil_types: string[];
  suitable_regions: string[];
  soil_health_improvement?: SoilHealthImprovement;
  financial_benefits?: FinancialBreakdown;
  verified_by?: string;
  verification_date?: Date;
  adoption_count: number;
  success_rate?: number;
  status: 'draft' | 'published' | 'archived';
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Community Engagement Types
// ============================================================================

export interface ArticleRating {
  rating_id: string;
  article_id: string;
  user_id: string;
  rating: number; // 1-5
  review_text?: string;
  implemented: boolean;
  implementation_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SuccessStory {
  story_id: string;
  article_id: string;
  user_id: string;
  title: MultiLanguageText;
  story_text: MultiLanguageText;
  results_achieved?: {
    yield_increase?: string;
    cost_reduction?: string;
    time_saved?: string;
    other_benefits?: MultiLanguageText;
  };
  images: string[];
  videos: string[];
  location_district?: string;
  location_state?: string;
  verified: boolean;
  verified_by?: string;
  verification_date?: Date;
  helpful_count: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

export interface ArticleQuestion {
  question_id: string;
  article_id: string;
  user_id: string;
  question_text: string;
  is_answered: boolean;
  upvote_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ArticleAnswer {
  answer_id: string;
  question_id: string;
  user_id: string;
  answer_text: string;
  is_expert_answer: boolean;
  verified_by?: string;
  upvote_count: number;
  is_accepted: boolean;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Search and Filter Types
// ============================================================================

export interface ArticleSearchFilters {
  category?: ArticleCategory;
  subcategory?: string;
  tags?: string[];
  evidence_level?: EvidenceLevel;
  applicable_crops?: string[];
  applicable_regions?: string[];
  applicable_seasons?: string[];
  language?: SupportedLanguage;
  status?: ArticleStatus;
  verified_only?: boolean;
  min_rating?: number;
}

export interface ArticleSearchQuery {
  query?: string; // Natural language search
  filters?: ArticleSearchFilters;
  sort_by?: 'relevance' | 'rating' | 'views' | 'recent' | 'success_stories';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  language?: SupportedLanguage; // Preferred language for results
}

export interface ArticleSearchResult {
  articles: KnowledgeArticle[];
  total_count: number;
  page: number;
  total_pages: number;
  has_more: boolean;
}

// ============================================================================
// Content Management Types
// ============================================================================

export interface CreateArticleInput {
  title: MultiLanguageText;
  content: MultiLanguageText;
  summary?: MultiLanguageText;
  category: ArticleCategory;
  subcategory?: string;
  tags?: string[];
  evidence_level: EvidenceLevel;
  scientific_references?: ScientificReference[];
  implementation_guide?: ImplementationGuide;
  benefits?: ArticleBenefits;
  applicable_crops?: string[];
  applicable_regions?: string[];
  applicable_seasons?: string[];
  available_languages: SupportedLanguage[];
  primary_language: SupportedLanguage;
  author_type?: AuthorType;
}

export interface UpdateArticleInput extends Partial<CreateArticleInput> {
  article_id: string;
}

export interface VerifyArticleInput {
  article_id: string;
  verified_by: string;
  verification_notes?: string;
}

export interface PublishArticleInput {
  article_id: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface ArticleAnalytics {
  article_id: string;
  view_count: number;
  average_rating: number;
  rating_count: number;
  success_story_count: number;
  question_count: number;
  implementation_count: number;
  engagement_score: number; // Computed metric
}

export interface KnowledgeBaseStats {
  total_articles: number;
  published_articles: number;
  verified_articles: number;
  total_views: number;
  total_ratings: number;
  average_rating: number;
  total_success_stories: number;
  articles_by_category: Record<ArticleCategory, number>;
  articles_by_evidence_level: Record<EvidenceLevel, number>;
  articles_by_language: Record<SupportedLanguage, number>;
}
