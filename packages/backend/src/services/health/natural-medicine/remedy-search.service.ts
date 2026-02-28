/**
 * Remedy Search Service
 * 
 * Implements comprehensive remedy search with:
 * - Full-text search on names and descriptions
 * - Filtering by ailment, category, difficulty, safety flags
 * - Ranking algorithm: efficacy_rating * 0.4 + success_rate * 0.3 + avg_rating * 0.3
 * - Seasonal filtering
 * - Pagination support
 */

import { Pool } from 'pg';
import {
  RemedySearchFilters,
  RemedySearchResult,
  RemedySearchResponse
} from '../../../types/natural-medicine';

export class RemedySearchService {
  constructor(private pool: Pool) {}

  /**
   * Search remedies with comprehensive filtering and ranking
   * 
   * Ranking Formula:
   * score = efficacy_rating * 0.4 + success_rate * 0.3 + avg_rating * 0.3
   * 
   * @param query - Search query string
   * @param filters - Search filters
   * @param page - Page number (1-indexed)
   * @param pageSize - Results per page
   * @returns Search results with pagination
   */
  async searchRemedies(
    query?: string,
    filters?: RemedySearchFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<RemedySearchResponse> {
    const client = await this.pool.connect();
    
    try {
      const offset = (page - 1) * pageSize;
      
      // Build the WHERE clause
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;
      
      // Base conditions: only published and verified remedies
      conditions.push(`r.status = 'published'`);
      conditions.push(`r.verification_status = 'verified'`);
      
      // Full-text search on names and description
      if (query && query.trim()) {
        params.push(query.trim());
        conditions.push(`(
          to_tsvector('english', COALESCE(r.names->>'en', '') || ' ' || COALESCE(r.description, ''))
          @@ plainto_tsquery('english', $${paramIndex})
          OR r.names->>'en' ILIKE $${paramIndex + 1}
          OR r.description ILIKE $${paramIndex + 1}
        )`);
        params.push(`%${query.trim()}%`);
        paramIndex += 2;
      }
      
      // Filter by ailment
      if (filters?.ailment) {
        params.push(filters.ailment.toLowerCase());
        conditions.push(`$${paramIndex} = ANY(r.ailments_treated)`);
        paramIndex++;
      }
      
      // Filter by category
      if (filters?.category) {
        params.push(filters.category);
        conditions.push(`r.category = $${paramIndex}`);
        paramIndex++;
      }
      
      // Filter by difficulty level
      if (filters?.difficulty_level) {
        params.push(filters.difficulty_level);
        conditions.push(`r.difficulty_level = $${paramIndex}`);
        paramIndex++;
      }
      
      // Filter by max preparation time
      if (filters?.max_preparation_time) {
        params.push(filters.max_preparation_time);
        conditions.push(`r.preparation_time_minutes <= $${paramIndex}`);
        paramIndex++;
      }
      
      // Filter by evidence level
      if (filters?.evidence_level) {
        params.push(filters.evidence_level);
        conditions.push(`r.evidence_level = $${paramIndex}`);
        paramIndex++;
      }
      
      // Filter by minimum efficacy rating
      if (filters?.min_efficacy_rating) {
        params.push(filters.min_efficacy_rating);
        conditions.push(`r.efficacy_rating >= $${paramIndex}`);
        paramIndex++;
      }
      
      // Safety filters
      if (filters?.safe_for_pregnancy !== undefined) {
        params.push(filters.safe_for_pregnancy);
        conditions.push(`si.safe_for_pregnancy = $${paramIndex}`);
        paramIndex++;
      }
      
      if (filters?.safe_for_children !== undefined) {
        params.push(filters.safe_for_children);
        conditions.push(`si.safe_for_children = $${paramIndex}`);
        paramIndex++;
      }
      
      // Seasonal filtering (ingredients available this month)
      if (filters?.seasonal_only) {
        const currentMonth = new Date().getMonth() + 1; // 1-12
        conditions.push(`EXISTS (
          SELECT 1 FROM remedy_ingredients ri
          WHERE ri.remedy_id = r.remedy_id
          AND ${currentMonth} = ANY(ri.seasonal_availability)
        )`);
      }
      
      const whereClause = conditions.length > 0 
        ? `WHERE ${conditions.join(' AND ')}`
        : '';
      
      // Main query with ranking
      const searchQuery = `
        SELECT 
          r.*,
          COUNT(DISTINCT ur.rating_id) as total_ratings,
          COALESCE(ROUND(AVG(ur.rating)::NUMERIC, 2), 0) as average_rating,
          COUNT(DISTINCT ri.ingredient_id) as ingredients_count,
          EXISTS (
            SELECT 1 FROM remedy_ingredients ri2
            WHERE ri2.remedy_id = r.remedy_id
            AND EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER = ANY(ri2.seasonal_availability)
          ) as seasonal_available,
          -- Ranking score calculation
          (
            COALESCE(r.efficacy_rating, 0) * 0.4 +
            COALESCE(r.success_rate_percentage, 0) / 100 * 5 * 0.3 +
            COALESCE(AVG(ur.rating), 0) * 0.3
          ) as relevance_score
        FROM remedies r
        LEFT JOIN user_ratings ur ON r.remedy_id = ur.remedy_id
        LEFT JOIN remedy_ingredients ri ON r.remedy_id = ri.remedy_id
        ${filters?.safe_for_pregnancy !== undefined || filters?.safe_for_children !== undefined 
          ? 'INNER JOIN safety_information si ON r.remedy_id = si.remedy_id' 
          : ''}
        ${whereClause}
        GROUP BY r.remedy_id
        ORDER BY relevance_score DESC, r.efficacy_rating DESC, average_rating DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(pageSize, offset);
      
      // Execute search query
      const searchResult = await client.query(searchQuery, params);
      
      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT r.remedy_id) as total
        FROM remedies r
        ${filters?.safe_for_pregnancy !== undefined || filters?.safe_for_children !== undefined 
          ? 'INNER JOIN safety_information si ON r.remedy_id = si.remedy_id' 
          : ''}
        ${whereClause}
      `;
      
      const countResult = await client.query(countQuery, params.slice(0, -2));
      const totalCount = parseInt(countResult.rows[0].total);
      
      // Format results
      const results: RemedySearchResult[] = searchResult.rows.map(row => ({
        remedy: {
          remedy_id: row.remedy_id,
          names: row.names,
          description: row.description,
          description_multilang: row.description_multilang,
          ailments_treated: row.ailments_treated,
          symptoms_addressed: row.symptoms_addressed,
          preparation_time_minutes: row.preparation_time_minutes,
          difficulty_level: row.difficulty_level,
          efficacy_rating: parseFloat(row.efficacy_rating),
          evidence_level: row.evidence_level,
          success_rate_percentage: row.success_rate_percentage ? parseFloat(row.success_rate_percentage) : undefined,
          verification_status: row.verification_status,
          verified_by: row.verified_by,
          verified_at: row.verified_at,
          verification_notes: row.verification_notes,
          category: row.category,
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at
        },
        relevance_score: parseFloat(row.relevance_score),
        average_rating: row.average_rating ? parseFloat(row.average_rating) : undefined,
        total_ratings: parseInt(row.total_ratings),
        ingredients_count: parseInt(row.ingredients_count),
        seasonal_available: row.seasonal_available
      }));
      
      return {
        results,
        total_count: totalCount,
        page,
        page_size: pageSize,
        filters_applied: filters || {}
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * Search remedies by specific ailment
   * Convenience method for ailment-specific searches
   */
  async searchByAilment(
    ailment: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<RemedySearchResponse> {
    return this.searchRemedies(undefined, { ailment }, page, pageSize);
  }

  /**
   * Get seasonal remedies (ingredients available this month)
   */
  async getSeasonalRemedies(
    page: number = 1,
    pageSize: number = 20
  ): Promise<RemedySearchResponse> {
    return this.searchRemedies(undefined, { seasonal_only: true }, page, pageSize);
  }

  /**
   * Get top-rated remedies
   */
  async getTopRatedRemedies(
    limit: number = 10
  ): Promise<RemedySearchResult[]> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          r.*,
          COUNT(ur.rating_id) as total_ratings,
          ROUND(AVG(ur.rating)::NUMERIC, 2) as average_rating,
          COUNT(DISTINCT ri.ingredient_id) as ingredients_count,
          EXISTS (
            SELECT 1 FROM remedy_ingredients ri2
            WHERE ri2.remedy_id = r.remedy_id
            AND EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER = ANY(ri2.seasonal_availability)
          ) as seasonal_available,
          (
            COALESCE(r.efficacy_rating, 0) * 0.4 +
            COALESCE(r.success_rate_percentage, 0) / 100 * 5 * 0.3 +
            COALESCE(AVG(ur.rating), 0) * 0.3
          ) as relevance_score
        FROM remedies r
        INNER JOIN user_ratings ur ON r.remedy_id = ur.remedy_id
        LEFT JOIN remedy_ingredients ri ON r.remedy_id = ri.remedy_id
        WHERE r.status = 'published' 
        AND r.verification_status = 'verified'
        GROUP BY r.remedy_id
        HAVING COUNT(ur.rating_id) >= 5
        ORDER BY average_rating DESC, r.efficacy_rating DESC
        LIMIT $1
      `;
      
      const result = await client.query(query, [limit]);
      
      return result.rows.map(row => ({
        remedy: {
          remedy_id: row.remedy_id,
          names: row.names,
          description: row.description,
          description_multilang: row.description_multilang,
          ailments_treated: row.ailments_treated,
          symptoms_addressed: row.symptoms_addressed,
          preparation_time_minutes: row.preparation_time_minutes,
          difficulty_level: row.difficulty_level,
          efficacy_rating: parseFloat(row.efficacy_rating),
          evidence_level: row.evidence_level,
          success_rate_percentage: row.success_rate_percentage ? parseFloat(row.success_rate_percentage) : undefined,
          verification_status: row.verification_status,
          verified_by: row.verified_by,
          verified_at: row.verified_at,
          verification_notes: row.verification_notes,
          category: row.category,
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at
        },
        relevance_score: parseFloat(row.relevance_score),
        average_rating: parseFloat(row.average_rating),
        total_ratings: parseInt(row.total_ratings),
        ingredients_count: parseInt(row.ingredients_count),
        seasonal_available: row.seasonal_available
      }));
      
    } finally {
      client.release();
    }
  }

  /**
   * Get remedy suggestions based on user profile
   * Considers safety flags and preferences
   */
  async getPersonalizedRemedies(
    userProfile: {
      is_pregnant?: boolean;
      is_lactating?: boolean;
      has_children?: boolean;
      age?: number;
    },
    ailment?: string,
    limit: number = 10
  ): Promise<RemedySearchResult[]> {
    const filters: RemedySearchFilters = {};
    
    if (userProfile.is_pregnant) {
      filters.safe_for_pregnancy = true;
    }
    
    if (userProfile.has_children) {
      filters.safe_for_children = true;
    }
    
    if (ailment) {
      filters.ailment = ailment;
    }
    
    const response = await this.searchRemedies(undefined, filters, 1, limit);
    return response.results;
  }
}

/**
 * Create remedy search service instance
 */
export function createRemedySearchService(pool: Pool): RemedySearchService {
  return new RemedySearchService(pool);
}
