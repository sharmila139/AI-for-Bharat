/**
 * Community Verification Service
 * Handles community-based verification of grievance resolutions
 * Allows citizens to vote on whether a grievance has been properly resolved
 */

import { Pool } from 'pg';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface VerificationVote {
  userId: string;
  grievanceId: string;
  vote: 'yes' | 'no';
  comment?: string;
  photos?: string[]; // URLs to verification photos
}

export interface VerificationStatus {
  grievanceId: string;
  ticketNumber: string;
  isVerified: boolean;
  votesYes: number;
  votesNo: number;
  threshold: number;
  verificationPercentage: number;
  canVote: boolean; // Whether current user can vote
  hasVoted: boolean; // Whether current user has voted
  userVote?: 'yes' | 'no';
}

export interface VerificationResult {
  success: boolean;
  newStatus: VerificationStatus;
  message: string;
}

// ============================================================================
// COMMUNITY VERIFICATION SERVICE
// ============================================================================

export class CommunityVerificationService {
  constructor(private pool: Pool) {}

  /**
   * Submit a verification vote for a resolved grievance
   * Users can vote yes/no on whether the resolution is satisfactory
   */
  async submitVerificationVote(vote: VerificationVote): Promise<VerificationResult> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Check if grievance exists and is in resolved status
      const grievanceQuery = `
        SELECT 
          grievance_id,
          ticket_number,
          status,
          community_verified,
          verification_votes_yes,
          verification_votes_no,
          verification_threshold
        FROM grievances
        WHERE grievance_id = $1
      `;

      const grievanceResult = await client.query(grievanceQuery, [vote.grievanceId]);

      if (grievanceResult.rows.length === 0) {
        throw new Error('Grievance not found');
      }

      const grievance = grievanceResult.rows[0];

      // Only allow voting on resolved grievances
      if (grievance.status !== 'resolved') {
        throw new Error('Can only verify resolved grievances');
      }

      // 2. Check if user has already voted
      const existingVoteQuery = `
        SELECT vote_id, vote_type
        FROM grievance_verification_votes
        WHERE grievance_id = $1 AND user_id = $2
      `;

      const existingVoteResult = await client.query(existingVoteQuery, [
        vote.grievanceId,
        vote.userId
      ]);

      if (existingVoteResult.rows.length > 0) {
        throw new Error('User has already voted on this grievance');
      }

      // 3. Insert verification vote
      const insertVoteQuery = `
        INSERT INTO grievance_verification_votes (
          grievance_id,
          user_id,
          vote_type,
          comment,
          photos
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING vote_id
      `;

      await client.query(insertVoteQuery, [
        vote.grievanceId,
        vote.userId,
        vote.vote,
        vote.comment,
        vote.photos || []
      ]);

      // 4. Update vote counts in grievances table
      const updateField = vote.vote === 'yes' 
        ? 'verification_votes_yes' 
        : 'verification_votes_no';

      const updateQuery = `
        UPDATE grievances
        SET ${updateField} = ${updateField} + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE grievance_id = $1
        RETURNING 
          verification_votes_yes,
          verification_votes_no,
          verification_threshold,
          community_verified
      `;

      const updateResult = await client.query(updateQuery, [vote.grievanceId]);
      const updated = updateResult.rows[0];

      // 5. Check if verification threshold is met
      const totalVotes = updated.verification_votes_yes + updated.verification_votes_no;
      const yesPercentage = totalVotes > 0 
        ? (updated.verification_votes_yes / totalVotes) * 100 
        : 0;

      let verificationStatus = updated.community_verified;
      let message = 'Vote recorded successfully';

      // Mark as verified if threshold met and >70% yes votes
      if (totalVotes >= updated.verification_threshold && yesPercentage >= 70) {
        await client.query(
          `UPDATE grievances 
           SET community_verified = TRUE,
               status = 'closed',
               updated_at = CURRENT_TIMESTAMP
           WHERE grievance_id = $1`,
          [vote.grievanceId]
        );
        verificationStatus = true;
        message = 'Grievance verified by community and closed';

        // Create status update
        await this.createStatusUpdate(
          vote.grievanceId,
          'status_change',
          'Grievance verified by community and closed',
          'system',
          client
        );
      } 
      // Mark as not verified if threshold met and <70% yes votes
      else if (totalVotes >= updated.verification_threshold && yesPercentage < 70) {
        await client.query(
          `UPDATE grievances 
           SET community_verified = FALSE,
               status = 'in_progress',
               updated_at = CURRENT_TIMESTAMP
           WHERE grievance_id = $1`,
          [vote.grievanceId]
        );
        verificationStatus = false;
        message = 'Community verification failed - grievance reopened';

        // Create status update
        await this.createStatusUpdate(
          vote.grievanceId,
          'status_change',
          'Community verification failed - grievance reopened for further action',
          'system',
          client
        );
      }

      await client.query('COMMIT');

      return {
        success: true,
        newStatus: {
          grievanceId: vote.grievanceId,
          ticketNumber: grievance.ticket_number,
          isVerified: verificationStatus,
          votesYes: updated.verification_votes_yes,
          votesNo: updated.verification_votes_no,
          threshold: updated.verification_threshold,
          verificationPercentage: yesPercentage,
          canVote: false, // User just voted
          hasVoted: true,
          userVote: vote.vote
        },
        message
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error submitting verification vote:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get verification status for a grievance
   */
  async getVerificationStatus(
    grievanceId: string,
    userId?: string
  ): Promise<VerificationStatus> {
    const query = `
      SELECT 
        g.grievance_id,
        g.ticket_number,
        g.status,
        g.community_verified,
        g.verification_votes_yes,
        g.verification_votes_no,
        g.verification_threshold
      FROM grievances g
      WHERE g.grievance_id = $1
    `;

    const result = await this.pool.query(query, [grievanceId]);

    if (result.rows.length === 0) {
      throw new Error('Grievance not found');
    }

    const grievance = result.rows[0];
    const totalVotes = grievance.verification_votes_yes + grievance.verification_votes_no;
    const verificationPercentage = totalVotes > 0
      ? (grievance.verification_votes_yes / totalVotes) * 100
      : 0;

    // Check if user has voted
    let hasVoted = false;
    let userVote: 'yes' | 'no' | undefined;

    if (userId) {
      const voteQuery = `
        SELECT vote_type
        FROM grievance_verification_votes
        WHERE grievance_id = $1 AND user_id = $2
      `;
      const voteResult = await this.pool.query(voteQuery, [grievanceId, userId]);
      
      if (voteResult.rows.length > 0) {
        hasVoted = true;
        userVote = voteResult.rows[0].vote_type;
      }
    }

    // Can vote if: grievance is resolved, user hasn't voted, and not already verified
    const canVote = grievance.status === 'resolved' && 
                    !hasVoted && 
                    !grievance.community_verified;

    return {
      grievanceId: grievance.grievance_id,
      ticketNumber: grievance.ticket_number,
      isVerified: grievance.community_verified,
      votesYes: grievance.verification_votes_yes,
      votesNo: grievance.verification_votes_no,
      threshold: grievance.verification_threshold,
      verificationPercentage,
      canVote,
      hasVoted,
      userVote
    };
  }

  /**
   * Get all verification votes for a grievance
   */
  async getVerificationVotes(grievanceId: string): Promise<any[]> {
    const query = `
      SELECT 
        v.vote_id,
        v.vote_type,
        v.comment,
        v.photos,
        v.created_at,
        u.name as voter_name,
        u.user_id
      FROM grievance_verification_votes v
      LEFT JOIN users u ON v.user_id = u.user_id
      WHERE v.grievance_id = $1
      ORDER BY v.created_at DESC
    `;

    const result = await this.pool.query(query, [grievanceId]);
    return result.rows;
  }

  /**
   * Get grievances pending community verification
   */
  async getPendingVerificationGrievances(
    district?: string,
    state?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    let query = `
      SELECT 
        g.grievance_id,
        g.ticket_number,
        g.title,
        g.category,
        g.district,
        g.state,
        g.photos,
        g.resolution_description,
        g.resolution_photos,
        g.resolved_at,
        g.verification_votes_yes,
        g.verification_votes_no,
        g.verification_threshold,
        (g.verification_votes_yes + g.verification_votes_no) as total_votes
      FROM grievances g
      WHERE g.status = 'resolved'
        AND g.community_verified = FALSE
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (district) {
      query += ` AND g.district = $${paramIndex}`;
      params.push(district);
      paramIndex++;
    }

    if (state) {
      query += ` AND g.state = $${paramIndex}`;
      params.push(state);
      paramIndex++;
    }

    query += ` ORDER BY g.resolved_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Create a status update entry
   */
  private async createStatusUpdate(
    grievanceId: string,
    updateType: string,
    updateText: string,
    updatedByRole: string,
    client: any
  ): Promise<void> {
    const query = `
      INSERT INTO grievance_updates (
        grievance_id,
        update_type,
        update_text,
        updated_by_role,
        is_public
      ) VALUES ($1, $2, $3, $4, $5)
    `;

    await client.query(query, [
      grievanceId,
      updateType,
      updateText,
      updatedByRole,
      true
    ]);
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

let serviceInstance: CommunityVerificationService | null = null;

export function getCommunityVerificationService(pool?: Pool): CommunityVerificationService {
  if (!serviceInstance && pool) {
    serviceInstance = new CommunityVerificationService(pool);
  }
  
  if (!serviceInstance) {
    throw new Error('CommunityVerificationService not initialized. Provide a Pool instance.');
  }
  
  return serviceInstance;
}
