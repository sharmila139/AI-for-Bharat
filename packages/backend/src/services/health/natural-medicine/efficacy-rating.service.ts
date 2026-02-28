/**
 * Efficacy Rating and Evidence Level Service
 * Manages efficacy ratings, evidence classification, and user feedback aggregation
 */

import { Pool } from 'pg';
import { EvidenceLevel, Effectiveness } from '../../../types/natural-medicine';

export class EfficacyRatingService {
  constructor(private pool: Pool) {}

  async getEfficacyRating(remedyId: string): Promise<{
    efficacy_rating: number;
    evidence_level: EvidenceLevel;
    success_rate_percentage: number;
    total_user_ratings: number;
    average_user_rating: number;
  }> {
    const query = `
      SELECT 
        r.efficacy_rating,
        r.evidence_level,
        r.success_rate_percentage,
        COUNT(ur.rating_id) as total_user_ratings,
        COALESCE(AVG(ur.rating), 0) as average_user_rating
      FROM remedies r
      LEFT JOIN user_ratings ur ON r.remedy_id = ur.remedy_id
      WHERE r.remedy_id = $1
      GROUP BY r.remedy_id
    `;
    
    const result = await this.pool.query(query, [remedyId]);
    
    if (result.rows.length === 0) {
      throw new Error('Remedy not found');
    }
    
    return {
      efficacy_rating: parseFloat(result.rows[0].efficacy_rating),
      evidence_level: result.rows[0].evidence_level,
      success_rate_percentage: parseFloat(result.rows[0].success_rate_percentage || 0),
      total_user_ratings: parseInt(result.rows[0].total_user_ratings),
      average_user_rating: parseFloat(result.rows[0].average_user_rating)
    };
  }

  async addUserRating(
    remedyId: string,
    userId: string,
    rating: number,
    effectiveness?: Effectiveness,
    reviewText?: string
  ): Promise<void> {
    const query = `
      INSERT INTO user_ratings (
        remedy_id, user_id, rating, effectiveness, review_text
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (remedy_id, user_id) 
      DO UPDATE SET 
        rating = EXCLUDED.rating,
        effectiveness = EXCLUDED.effectiveness,
        review_text = EXCLUDED.review_text
    `;
    
    await this.pool.query(query, [remedyId, userId, rating, effectiveness, reviewText]);
  }

  async getRemediesByEvidenceLevel(evidenceLevel: EvidenceLevel): Promise<string[]> {
    const query = `
      SELECT remedy_id
      FROM remedies
      WHERE evidence_level = $1
      AND status = 'published'
      AND verification_status = 'verified'
      ORDER BY efficacy_rating DESC
    `;
    
    const result = await this.pool.query(query, [evidenceLevel]);
    return result.rows.map(row => row.remedy_id);
  }
}

export function createEfficacyRatingService(pool: Pool): EfficacyRatingService {
  return new EfficacyRatingService(pool);
}
