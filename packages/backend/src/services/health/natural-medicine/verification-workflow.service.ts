/**
 * Verification Workflow Service
 * Manages remedy verification by Ayurvedic doctors and pharmacologists
 */

import { Pool } from 'pg';
import { VerificationStatus } from '../../../types/natural-medicine';

export interface VerificationRequest {
  remedy_id: string;
  requested_by: string;
  request_notes?: string;
}

export interface VerificationReview {
  remedy_id: string;
  reviewer_id: string;
  status: 'verified' | 'rejected';
  notes?: string;
}

export class VerificationWorkflowService {
  constructor(private pool: Pool) {}

  async submitForVerification(request: VerificationRequest): Promise<void> {
    const query = `
      UPDATE remedies
      SET status = 'review'
      WHERE remedy_id = $1
    `;
    
    await this.pool.query(query, [request.remedy_id]);
  }

  async getPendingVerifications(): Promise<any[]> {
    const query = `
      SELECT r.*, 
        COUNT(ri.ingredient_id) as ingredient_count,
        COUNT(pm.step_id) as step_count,
        COUNT(dg.dosage_id) as dosage_count,
        EXISTS(SELECT 1 FROM safety_information WHERE remedy_id = r.remedy_id) as has_safety_info
      FROM remedies r
      LEFT JOIN remedy_ingredients ri ON r.remedy_id = ri.remedy_id
      LEFT JOIN preparation_methods pm ON r.remedy_id = pm.remedy_id
      LEFT JOIN dosage_guidelines dg ON r.remedy_id = dg.remedy_id
      WHERE r.verification_status = 'pending'
      AND r.status = 'review'
      GROUP BY r.remedy_id
      ORDER BY r.created_at ASC
    `;
    
    const result = await this.pool.query(query);
    return result.rows;
  }

  async reviewRemedy(review: VerificationReview): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const query = `
        UPDATE remedies
        SET 
          verification_status = $1,
          verified_by = $2,
          verified_at = CURRENT_TIMESTAMP,
          verification_notes = $3,
          status = CASE 
            WHEN $1 = 'verified' THEN 'published'
            WHEN $1 = 'rejected' THEN 'draft'
            ELSE status
          END
        WHERE remedy_id = $4
      `;
      
      await client.query(query, [
        review.status,
        review.reviewer_id,
        review.notes || null,
        review.remedy_id
      ]);
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getVerificationHistory(remedyId: string): Promise<any> {
    const query = `
      SELECT 
        verification_status,
        verified_by,
        verified_at,
        verification_notes
      FROM remedies
      WHERE remedy_id = $1
    `;
    
    const result = await this.pool.query(query, [remedyId]);
    return result.rows[0];
  }

  async getVerifierStatistics(verifierId: string): Promise<{
    total_verified: number;
    total_rejected: number;
    pending_reviews: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE verification_status = 'verified') as total_verified,
        COUNT(*) FILTER (WHERE verification_status = 'rejected') as total_rejected,
        (SELECT COUNT(*) FROM remedies WHERE verification_status = 'pending' AND status = 'review') as pending_reviews
      FROM remedies
      WHERE verified_by = $1
    `;
    
    const result = await this.pool.query(query, [verifierId]);
    return {
      total_verified: parseInt(result.rows[0].total_verified),
      total_rejected: parseInt(result.rows[0].total_rejected),
      pending_reviews: parseInt(result.rows[0].pending_reviews)
    };
  }
}

export function createVerificationWorkflowService(pool: Pool): VerificationWorkflowService {
  return new VerificationWorkflowService(pool);
}
