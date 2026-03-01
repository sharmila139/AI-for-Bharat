/**
 * Grievance Tracking and Transparency Service
 * 
 * Handles:
 * - Real-time status tracking (Task 21.1)
 * - Timeline with status change history (Task 21.2)
 * - Overdue marking system (Task 21.3)
 * - Resolution documentation (Task 21.4)
 * - Community verification voting (Task 21.5)
 * - Feedback rating collection (Task 21.6)
 * - Public dashboard statistics (Task 21.7)
 * - Automatic escalation (Task 21.8)
 */

import { Pool } from 'pg';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type GrievanceStatus = 
  | 'submitted' 
  | 'acknowledged' 
  | 'in_progress' 
  | 'resolved' 
  | 'closed' 
  | 'rejected';

export interface StatusChange {
  status: GrievanceStatus;
  timestamp: Date;
  updated_by: string;
  updated_by_role: 'citizen' | 'officer' | 'admin' | 'system';
  notes?: string;
  photos?: string[];
}

export interface TimelineEntry {
  update_id: string;
  update_type: 'status_change' | 'assignment' | 'comment' | 'resolution' | 'escalation';
  update_text: string;
  photos?: string[];
  documents?: string[];
  updated_by?: string;
  updated_by_role?: 'citizen' | 'officer' | 'admin' | 'system';
  is_public: boolean;
  created_at: Date;
}

export interface ResolutionData {
  grievance_id: string;
  resolution_description: string;
  resolution_photos?: string[];
  resolved_by: string;
  resolved_at?: Date;
}

export interface VerificationVote {
  grievance_id: string;
  user_id: string;
  vote_type: 'yes' | 'no';
  comment?: string;
  photos?: string[];
}

export interface FeedbackRating {
  grievance_id: string;
  user_id: string;
  rating: number; // 1-5
  feedback_text?: string;
}

export interface DashboardStatistics {
  total_grievances: number;
  resolved_grievances: number;
  overdue_grievances: number;
  in_progress_grievances: number;
  average_resolution_days: number;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
  by_severity: Record<string, number>;
  resolution_rate: number;
  community_satisfaction: number;
}

export interface EscalationResult {
  grievance_id: string;
  escalated: boolean;
  reason: string;
  escalated_to?: string;
  escalated_at?: Date;
}

// ============================================================================
// SLA CONFIGURATION
// ============================================================================

const SLA_DEADLINES: Record<string, Record<string, number>> = {
  // Days by category and severity
  road: { low: 30, medium: 15, high: 7, critical: 2 },
  water: { low: 15, medium: 7, high: 3, critical: 1 },
  electricity: { low: 15, medium: 7, high: 3, critical: 1 },
  sanitation: { low: 20, medium: 10, high: 5, critical: 2 },
  healthcare: { low: 10, medium: 5, high: 2, critical: 1 },
  education: { low: 30, medium: 15, high: 7, critical: 3 },
  public_safety: { low: 7, medium: 3, high: 1, critical: 0.5 },
  other: { low: 30, medium: 15, high: 7, critical: 3 },
};

// ============================================================================
// GRIEVANCE TRACKING SERVICE
// ============================================================================

export class GrievanceTrackingService {
  constructor(private pool: Pool) {}

  // ==========================================================================
  // TASK 21.1: Real-time Status Tracking
  // ==========================================================================

  /**
   * Update grievance status with real-time tracking
   */
  async updateStatus(
    grievanceId: string,
    newStatus: GrievanceStatus,
    updatedBy: string,
    updatedByRole: 'citizen' | 'officer' | 'admin' | 'system',
    notes?: string,
    photos?: string[]
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current status
      const currentResult = await client.query(
        'SELECT status, status_history FROM grievances WHERE grievance_id = $1',
        [grievanceId]
      );

      if (currentResult.rows.length === 0) {
        throw new Error('Grievance not found');
      }

      const currentStatus = currentResult.rows[0].status;
      const statusHistory = currentResult.rows[0].status_history || [];

      // Create status change entry
      const statusChange: StatusChange = {
        status: newStatus,
        timestamp: new Date(),
        updated_by: updatedBy,
        updated_by_role: updatedByRole,
        notes,
        photos,
      };

      // Update status history
      statusHistory.push(statusChange);

      // Update grievance
      await client.query(
        `UPDATE grievances 
         SET status = $1, status_history = $2, updated_at = CURRENT_TIMESTAMP
         WHERE grievance_id = $3`,
        [newStatus, JSON.stringify(statusHistory), grievanceId]
      );

      // Create timeline entry
      await this.addTimelineEntry(
        client,
        grievanceId,
        'status_change',
        `Status changed from ${currentStatus} to ${newStatus}${notes ? ': ' + notes : ''}`,
        updatedBy,
        updatedByRole,
        photos
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get current status of a grievance
   */
  async getStatus(grievanceId: string): Promise<GrievanceStatus> {
    const result = await this.pool.query(
      'SELECT status FROM grievances WHERE grievance_id = $1',
      [grievanceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Grievance not found');
    }

    return result.rows[0].status;
  }

  // ==========================================================================
  // TASK 21.2: Timeline with Status Change History
  // ==========================================================================

  /**
   * Get complete timeline for a grievance
   */
  async getTimeline(grievanceId: string): Promise<TimelineEntry[]> {
    const result = await this.pool.query(
      `SELECT 
        update_id,
        update_type,
        update_text,
        photos,
        documents,
        updated_by,
        updated_by_role,
        is_public,
        created_at
       FROM grievance_updates
       WHERE grievance_id = $1
       ORDER BY created_at ASC`,
      [grievanceId]
    );

    return result.rows.map(row => ({
      update_id: row.update_id,
      update_type: row.update_type,
      update_text: row.update_text,
      photos: row.photos,
      documents: row.documents,
      updated_by: row.updated_by,
      updated_by_role: row.updated_by_role,
      is_public: row.is_public,
      created_at: new Date(row.created_at),
    }));
  }

  /**
   * Add entry to grievance timeline
   */
  private async addTimelineEntry(
    client: any,
    grievanceId: string,
    updateType: 'status_change' | 'assignment' | 'comment' | 'resolution' | 'escalation',
    updateText: string,
    updatedBy?: string,
    updatedByRole?: 'citizen' | 'officer' | 'admin' | 'system',
    photos?: string[],
    documents?: string[],
    isPublic: boolean = true
  ): Promise<void> {
    await client.query(
      `INSERT INTO grievance_updates 
       (grievance_id, update_type, update_text, photos, documents, updated_by, updated_by_role, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [grievanceId, updateType, updateText, photos, documents, updatedBy, updatedByRole, isPublic]
    );
  }

  /**
   * Get status history from grievance
   */
  async getStatusHistory(grievanceId: string): Promise<StatusChange[]> {
    const result = await this.pool.query(
      'SELECT status_history FROM grievances WHERE grievance_id = $1',
      [grievanceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Grievance not found');
    }

    const history = result.rows[0].status_history || [];
    return history.map((entry: any) => ({
      ...entry,
      timestamp: new Date(entry.timestamp),
    }));
  }

  // ==========================================================================
  // TASK 21.3: Overdue Marking System
  // ==========================================================================

  /**
   * Calculate SLA deadline for a grievance
   */
  calculateSLADeadline(
    category: string,
    severity: string,
    createdAt: Date
  ): Date {
    const slaConfig = SLA_DEADLINES[category] || SLA_DEADLINES.other;
    const days = slaConfig[severity] || slaConfig.medium;
    
    const deadline = new Date(createdAt);
    deadline.setDate(deadline.getDate() + days);
    
    return deadline;
  }

  /**
   * Check and mark overdue grievances
   */
  async markOverdueGrievances(): Promise<number> {
    const result = await this.pool.query(
      `UPDATE grievances
       SET is_overdue = TRUE
       WHERE sla_deadline < CURRENT_TIMESTAMP
         AND status NOT IN ('resolved', 'closed', 'rejected')
         AND is_overdue = FALSE
       RETURNING grievance_id`
    );

    return result.rowCount || 0;
  }

  /**
   * Get days open for a grievance
   */
  async getDaysOpen(grievanceId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT EXTRACT(DAY FROM (CURRENT_TIMESTAMP - created_at)) as days_open
       FROM grievances
       WHERE grievance_id = $1`,
      [grievanceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Grievance not found');
    }

    return Math.floor(result.rows[0].days_open);
  }

  /**
   * Check if grievance is overdue
   */
  async isOverdue(grievanceId: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT is_overdue, sla_deadline, status
       FROM grievances
       WHERE grievance_id = $1`,
      [grievanceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Grievance not found');
    }

    const { is_overdue, sla_deadline, status } = result.rows[0];
    
    // Check if already marked or if deadline passed
    if (is_overdue) return true;
    
    if (status === 'resolved' || status === 'closed' || status === 'rejected') {
      return false;
    }

    return sla_deadline && new Date(sla_deadline) < new Date();
  }

  // ==========================================================================
  // TASK 21.4: Resolution Documentation
  // ==========================================================================

  /**
   * Mark grievance as resolved with documentation
   */
  async resolveGrievance(data: ResolutionData): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update grievance with resolution
      await client.query(
        `UPDATE grievances
         SET status = 'resolved',
             resolution_description = $1,
             resolution_photos = $2,
             resolved_by = $3,
             resolved_at = COALESCE($4, CURRENT_TIMESTAMP),
             updated_at = CURRENT_TIMESTAMP
         WHERE grievance_id = $5`,
        [
          data.resolution_description,
          data.resolution_photos,
          data.resolved_by,
          data.resolved_at,
          data.grievance_id,
        ]
      );

      // Add to timeline
      await this.addTimelineEntry(
        client,
        data.grievance_id,
        'resolution',
        `Grievance resolved: ${data.resolution_description}`,
        data.resolved_by,
        'officer',
        data.resolution_photos
      );

      // Update status history
      const statusChange: StatusChange = {
        status: 'resolved',
        timestamp: data.resolved_at || new Date(),
        updated_by: data.resolved_by,
        updated_by_role: 'officer',
        notes: data.resolution_description,
        photos: data.resolution_photos,
      };

      await client.query(
        `UPDATE grievances
         SET status_history = status_history || $1::jsonb
         WHERE grievance_id = $2`,
        [JSON.stringify(statusChange), data.grievance_id]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get resolution details
   */
  async getResolution(grievanceId: string) {
    const result = await this.pool.query(
      `SELECT 
        resolution_description,
        resolution_photos,
        resolved_by,
        resolved_at
       FROM grievances
       WHERE grievance_id = $1`,
      [grievanceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Grievance not found');
    }

    const row = result.rows[0];
    
    if (!row.resolved_at) {
      return null;
    }

    return {
      resolution_description: row.resolution_description,
      resolution_photos: row.resolution_photos,
      resolved_by: row.resolved_by,
      resolved_at: new Date(row.resolved_at),
    };
  }

  // ==========================================================================
  // TASK 21.5: Community Verification Voting System
  // ==========================================================================

  /**
   * Submit community verification vote
   */
  async submitVerificationVote(vote: VerificationVote): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert vote
      await client.query(
        `INSERT INTO grievance_verification_votes 
         (grievance_id, user_id, vote_type, comment, photos)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (grievance_id, user_id) 
         DO UPDATE SET vote_type = $3, comment = $4, photos = $5`,
        [vote.grievance_id, vote.user_id, vote.vote_type, vote.comment, vote.photos]
      );

      // Update vote counts
      const voteCountResult = await client.query(
        `SELECT 
          COUNT(*) FILTER (WHERE vote_type = 'yes') as yes_count,
          COUNT(*) FILTER (WHERE vote_type = 'no') as no_count
         FROM grievance_verification_votes
         WHERE grievance_id = $1`,
        [vote.grievance_id]
      );

      const { yes_count, no_count } = voteCountResult.rows[0];

      await client.query(
        `UPDATE grievances
         SET verification_votes_yes = $1,
             verification_votes_no = $2
         WHERE grievance_id = $3`,
        [parseInt(yes_count), parseInt(no_count), vote.grievance_id]
      );

      // Check if verification threshold reached
      const grievanceResult = await client.query(
        `SELECT verification_threshold, verification_votes_yes
         FROM grievances
         WHERE grievance_id = $1`,
        [vote.grievance_id]
      );

      const { verification_threshold, verification_votes_yes } = grievanceResult.rows[0];

      if (verification_votes_yes >= verification_threshold) {
        await client.query(
          `UPDATE grievances
           SET community_verified = TRUE
           WHERE grievance_id = $1`,
          [vote.grievance_id]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get verification votes for a grievance
   */
  async getVerificationVotes(grievanceId: string) {
    const result = await this.pool.query(
      `SELECT 
        vote_id,
        user_id,
        vote_type,
        comment,
        photos,
        created_at
       FROM grievance_verification_votes
       WHERE grievance_id = $1
       ORDER BY created_at DESC`,
      [grievanceId]
    );

    return result.rows.map(row => ({
      vote_id: row.vote_id,
      user_id: row.user_id,
      vote_type: row.vote_type,
      comment: row.comment,
      photos: row.photos,
      created_at: new Date(row.created_at),
    }));
  }

  /**
   * Get verification status
   */
  async getVerificationStatus(grievanceId: string) {
    const result = await this.pool.query(
      `SELECT 
        community_verified,
        verification_votes_yes,
        verification_votes_no,
        verification_threshold
       FROM grievances
       WHERE grievance_id = $1`,
      [grievanceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Grievance not found');
    }

    return result.rows[0];
  }

  // ==========================================================================
  // TASK 21.6: Feedback Rating Collection
  // ==========================================================================

  /**
   * Submit feedback rating for resolved grievance
   */
  async submitFeedback(feedback: FeedbackRating): Promise<void> {
    if (feedback.rating < 1 || feedback.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if grievance is resolved
      const statusResult = await client.query(
        'SELECT status FROM grievances WHERE grievance_id = $1',
        [feedback.grievance_id]
      );

      if (statusResult.rows.length === 0) {
        throw new Error('Grievance not found');
      }

      if (statusResult.rows[0].status !== 'resolved' && statusResult.rows[0].status !== 'closed') {
        throw new Error('Can only provide feedback for resolved grievances');
      }

      // Update grievance with feedback
      await client.query(
        `UPDATE grievances
         SET user_rating = $1,
             user_feedback = $2,
             feedback_at = CURRENT_TIMESTAMP,
             status = 'closed'
         WHERE grievance_id = $3`,
        [feedback.rating, feedback.feedback_text, feedback.grievance_id]
      );

      // Add to timeline
      await this.addTimelineEntry(
        client,
        feedback.grievance_id,
        'comment',
        `User provided feedback with rating: ${feedback.rating}/5`,
        feedback.user_id,
        'citizen'
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get feedback for a grievance
   */
  async getFeedback(grievanceId: string) {
    const result = await this.pool.query(
      `SELECT user_rating, user_feedback, feedback_at
       FROM grievances
       WHERE grievance_id = $1`,
      [grievanceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Grievance not found');
    }

    const row = result.rows[0];
    
    if (!row.user_rating) {
      return null;
    }

    return {
      rating: row.user_rating,
      feedback_text: row.user_feedback,
      feedback_at: new Date(row.feedback_at),
    };
  }

  // ==========================================================================
  // TASK 21.7: Public Dashboard with Statistics
  // ==========================================================================

  /**
   * Get dashboard statistics
   */
  async getDashboardStatistics(
    district?: string,
    state?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<DashboardStatistics> {
    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (district) {
      whereClause += ` AND district = $${paramIndex}`;
      params.push(district);
      paramIndex++;
    }

    if (state) {
      whereClause += ` AND state = $${paramIndex}`;
      params.push(state);
      paramIndex++;
    }

    if (startDate) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    // Get overall statistics
    const overallResult = await this.pool.query(
      `SELECT 
        COUNT(*) as total_grievances,
        COUNT(*) FILTER (WHERE status = 'resolved' OR status = 'closed') as resolved_grievances,
        COUNT(*) FILTER (WHERE is_overdue = TRUE) as overdue_grievances,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_grievances,
        AVG(EXTRACT(DAY FROM (resolved_at - created_at))) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_days,
        AVG(user_rating) FILTER (WHERE user_rating IS NOT NULL) as avg_rating
       FROM grievances
       WHERE ${whereClause}`,
      params
    );

    // Get by category
    const categoryResult = await this.pool.query(
      `SELECT category, COUNT(*) as count
       FROM grievances
       WHERE ${whereClause}
       GROUP BY category`,
      params
    );

    // Get by status
    const statusResult = await this.pool.query(
      `SELECT status, COUNT(*) as count
       FROM grievances
       WHERE ${whereClause}
       GROUP BY status`,
      params
    );

    // Get by severity
    const severityResult = await this.pool.query(
      `SELECT ai_severity, COUNT(*) as count
       FROM grievances
       WHERE ${whereClause} AND ai_severity IS NOT NULL
       GROUP BY ai_severity`,
      params
    );

    const overall = overallResult.rows[0];
    const total = parseInt(overall.total_grievances);
    const resolved = parseInt(overall.resolved_grievances);

    return {
      total_grievances: total,
      resolved_grievances: resolved,
      overdue_grievances: parseInt(overall.overdue_grievances),
      in_progress_grievances: parseInt(overall.in_progress_grievances),
      average_resolution_days: parseFloat(overall.avg_resolution_days) || 0,
      by_category: categoryResult.rows.reduce((acc, row) => {
        acc[row.category] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>),
      by_status: statusResult.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>),
      by_severity: severityResult.rows.reduce((acc, row) => {
        acc[row.ai_severity] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>),
      resolution_rate: total > 0 ? (resolved / total) * 100 : 0,
      community_satisfaction: parseFloat(overall.avg_rating) || 0,
    };
  }

  // ==========================================================================
  // TASK 21.8: Automatic Escalation System
  // ==========================================================================

  /**
   * Check and escalate overdue grievances
   */
  async escalateOverdueGrievances(): Promise<EscalationResult[]> {
    const client = await this.pool.connect();
    const results: EscalationResult[] = [];
    
    try {
      // Find grievances that exceed SLA by 50%
      const grievancesResult = await client.query(
        `SELECT 
          grievance_id,
          ticket_number,
          category,
          ai_severity,
          sla_deadline,
          created_at,
          assigned_authority,
          EXTRACT(DAY FROM (CURRENT_TIMESTAMP - sla_deadline)) as days_overdue
         FROM grievances
         WHERE status NOT IN ('resolved', 'closed', 'rejected')
           AND sla_deadline IS NOT NULL
           AND CURRENT_TIMESTAMP > sla_deadline + (sla_deadline - created_at) * 0.5`
      );

      for (const row of grievancesResult.rows) {
        await client.query('BEGIN');

        try {
          // Update status to escalated
          await client.query(
            `UPDATE grievances
             SET status = 'in_progress',
                 priority = 'urgent',
                 updated_at = CURRENT_TIMESTAMP
             WHERE grievance_id = $1`,
            [row.grievance_id]
          );

          // Add escalation to timeline
          const escalationText = `Grievance automatically escalated due to SLA breach. ` +
            `Overdue by ${Math.floor(row.days_overdue)} days. ` +
            `Escalated to higher authority for immediate action.`;

          await this.addTimelineEntry(
            client,
            row.grievance_id,
            'escalation',
            escalationText,
            undefined,
            'system'
          );

          // Update status history
          const statusChange: StatusChange = {
            status: 'in_progress',
            timestamp: new Date(),
            updated_by: 'system',
            updated_by_role: 'system',
            notes: escalationText,
          };

          await client.query(
            `UPDATE grievances
             SET status_history = status_history || $1::jsonb
             WHERE grievance_id = $2`,
            [JSON.stringify(statusChange), row.grievance_id]
          );

          results.push({
            grievance_id: row.grievance_id,
            escalated: true,
            reason: `SLA exceeded by ${Math.floor(row.days_overdue)} days`,
            escalated_to: 'Higher Authority',
            escalated_at: new Date(),
          });

          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.push({
            grievance_id: row.grievance_id,
            escalated: false,
            reason: `Escalation failed: ${errorMessage}`,
          });
        }
      }
    } finally {
      client.release();
    }

    return results;
  }

  /**
   * Check if grievance should be escalated
   */
  async shouldEscalate(grievanceId: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 
        sla_deadline,
        created_at,
        status
       FROM grievances
       WHERE grievance_id = $1`,
      [grievanceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Grievance not found');
    }

    const { sla_deadline, created_at, status } = result.rows[0];

    if (status === 'resolved' || status === 'closed' || status === 'rejected') {
      return false;
    }

    if (!sla_deadline) {
      return false;
    }

    const deadline = new Date(sla_deadline);
    const created = new Date(created_at);
    const now = new Date();

    // Calculate 50% threshold
    const slaWindow = deadline.getTime() - created.getTime();
    const escalationThreshold = deadline.getTime() + (slaWindow * 0.5);

    return now.getTime() > escalationThreshold;
  }
}

export default GrievanceTrackingService;
