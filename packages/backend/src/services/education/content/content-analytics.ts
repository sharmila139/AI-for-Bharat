/**
 * Content Analytics Service
 * Tracks and analyzes content engagement metrics
 * 
 * Features:
 * - View count tracking
 * - Watch time analytics
 * - Completion rate calculation
 * - Drop-off point analysis
 * - Engagement metrics (likes, shares, comments)
 * - Popular content identification
 */

import { Pool } from 'pg';

export interface ContentAnalytics {
  content_id: string;
  view_count: number;
  unique_viewers: number;
  total_watch_time_minutes: number;
  average_watch_time_minutes: number;
  completion_rate: number;
  average_completion_percentage: number;
  likes: number;
  shares: number;
  comments: number;
  average_rating: number;
  rating_count: number;
}

export interface DropOffAnalysis {
  content_id: string;
  duration_minutes: number;
  drop_off_points: DropOffPoint[];
  critical_drop_off_percentage: number;
}

export interface DropOffPoint {
  timestamp_minutes: number;
  viewers_remaining: number;
  drop_off_percentage: number;
  is_critical: boolean; // >20% drop at this point
}

export interface EngagementMetrics {
  content_id: string;
  engagement_score: number; // 0-100
  interaction_rate: number; // percentage of viewers who interacted
  replay_rate: number; // percentage who watched multiple times
  share_rate: number;
  like_rate: number;
  comment_rate: number;
}

export interface PopularContent {
  content_id: string;
  title: string;
  content_type: string;
  topic_name: string;
  view_count: number;
  engagement_score: number;
  trending_score: number; // Based on recent growth
}

export interface ViewEvent {
  student_id: string;
  content_id: string;
  session_id: string;
  watch_duration_minutes: number;
  completion_percentage: number;
  interactions: number;
  device_type?: string;
}

export class ContentAnalyticsService {
  constructor(private pool: Pool) {}

  /**
   * Track content view
   */
  async trackView(event: ViewEvent): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert view event
      await client.query(
        `INSERT INTO content_views (
          student_id, content_id, session_id, watch_duration_minutes,
          completion_percentage, interactions, device_type, viewed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
        [
          event.student_id,
          event.content_id,
          event.session_id,
          event.watch_duration_minutes,
          event.completion_percentage,
          event.interactions,
          event.device_type
        ]
      );

      // Update content view count
      await client.query(
        `UPDATE learning_content 
         SET view_count = view_count + 1,
             completion_count = completion_count + CASE WHEN $1 >= 90 THEN 1 ELSE 0 END
         WHERE content_id = $2`,
        [event.completion_percentage, event.content_id]
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
   * Get content analytics
   */
  async getContentAnalytics(content_id: string): Promise<ContentAnalytics> {
    const result = await this.pool.query(
      `SELECT 
        cv.content_id,
        COUNT(*) as view_count,
        COUNT(DISTINCT cv.student_id) as unique_viewers,
        SUM(cv.watch_duration_minutes) as total_watch_time,
        AVG(cv.watch_duration_minutes) as avg_watch_time,
        AVG(cv.completion_percentage) as avg_completion_pct,
        SUM(CASE WHEN cv.completion_percentage >= 90 THEN 1 ELSE 0 END)::FLOAT / COUNT(*) * 100 as completion_rate,
        COALESCE(SUM(ce.likes), 0) as likes,
        COALESCE(SUM(ce.shares), 0) as shares,
        COALESCE(COUNT(cc.comment_id), 0) as comments,
        lc.average_rating,
        COALESCE(COUNT(cr.rating_id), 0) as rating_count
       FROM content_views cv
       LEFT JOIN learning_content lc ON cv.content_id = lc.content_id
       LEFT JOIN content_engagement ce ON cv.content_id = ce.content_id
       LEFT JOIN content_comments cc ON cv.content_id = cc.content_id
       LEFT JOIN content_ratings cr ON cv.content_id = cr.content_id
       WHERE cv.content_id = $1
       GROUP BY cv.content_id, lc.average_rating`,
      [content_id]
    );

    if (result.rows.length === 0) {
      return {
        content_id,
        view_count: 0,
        unique_viewers: 0,
        total_watch_time_minutes: 0,
        average_watch_time_minutes: 0,
        completion_rate: 0,
        average_completion_percentage: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        average_rating: 0,
        rating_count: 0
      };
    }

    const row = result.rows[0];
    return {
      content_id: row.content_id,
      view_count: parseInt(row.view_count),
      unique_viewers: parseInt(row.unique_viewers),
      total_watch_time_minutes: parseFloat(row.total_watch_time) || 0,
      average_watch_time_minutes: parseFloat(row.avg_watch_time) || 0,
      completion_rate: parseFloat(row.completion_rate) || 0,
      average_completion_percentage: parseFloat(row.avg_completion_pct) || 0,
      likes: parseInt(row.likes) || 0,
      shares: parseInt(row.shares) || 0,
      comments: parseInt(row.comments) || 0,
      average_rating: parseFloat(row.average_rating) || 0,
      rating_count: parseInt(row.rating_count) || 0
    };
  }

  /**
   * Analyze drop-off points
   */
  async analyzeDropOff(content_id: string): Promise<DropOffAnalysis> {
    // Get content duration
    const contentResult = await this.pool.query(
      'SELECT duration_minutes FROM learning_content WHERE content_id = $1',
      [content_id]
    );

    if (contentResult.rows.length === 0) {
      throw new Error('Content not found');
    }

    const duration = contentResult.rows[0].duration_minutes;

    // Analyze drop-off at 10% intervals
    const intervals = 10;
    const dropOffPoints: DropOffPoint[] = [];
    
    for (let i = 1; i <= intervals; i++) {
      const percentage = (i / intervals) * 100;
      const timestamp = (duration * i) / intervals;

      const result = await this.pool.query(
        `SELECT COUNT(*) as viewers_remaining
         FROM content_views
         WHERE content_id = $1 AND completion_percentage >= $2`,
        [content_id, percentage]
      );

      const viewersRemaining = parseInt(result.rows[0].viewers_remaining);
      
      // Calculate drop-off from previous point
      const previousViewers = i === 1 ? 
        await this.getTotalViews(content_id) :
        dropOffPoints[i - 2].viewers_remaining;

      const dropOffPct = previousViewers > 0 ?
        ((previousViewers - viewersRemaining) / previousViewers) * 100 : 0;

      dropOffPoints.push({
        timestamp_minutes: timestamp,
        viewers_remaining: viewersRemaining,
        drop_off_percentage: dropOffPct,
        is_critical: dropOffPct > 20
      });
    }

    // Find maximum drop-off
    const maxDropOff = Math.max(...dropOffPoints.map(p => p.drop_off_percentage));

    return {
      content_id,
      duration_minutes: duration,
      drop_off_points: dropOffPoints,
      critical_drop_off_percentage: maxDropOff
    };
  }

  /**
   * Calculate engagement metrics
   */
  async getEngagementMetrics(content_id: string): Promise<EngagementMetrics> {
    const analytics = await this.getContentAnalytics(content_id);

    // Calculate interaction rate
    const interactionResult = await this.pool.query(
      `SELECT COUNT(*) as interacted_viewers
       FROM content_views
       WHERE content_id = $1 AND interactions > 0`,
      [content_id]
    );

    const interactedViewers = parseInt(interactionResult.rows[0].interacted_viewers);
    const interactionRate = analytics.unique_viewers > 0 ?
      (interactedViewers / analytics.unique_viewers) * 100 : 0;

    // Calculate replay rate
    const replayResult = await this.pool.query(
      `SELECT COUNT(DISTINCT student_id) as replay_viewers
       FROM (
         SELECT student_id, COUNT(*) as view_count
         FROM content_views
         WHERE content_id = $1
         GROUP BY student_id
         HAVING COUNT(*) > 1
       ) subquery`,
      [content_id]
    );

    const replayViewers = parseInt(replayResult.rows[0].replay_viewers);
    const replayRate = analytics.unique_viewers > 0 ?
      (replayViewers / analytics.unique_viewers) * 100 : 0;

    // Calculate engagement score (0-100)
    const engagementScore = this.calculateEngagementScore({
      completion_rate: analytics.completion_rate,
      interaction_rate: interactionRate,
      replay_rate: replayRate,
      like_rate: analytics.unique_viewers > 0 ? (analytics.likes / analytics.unique_viewers) * 100 : 0,
      share_rate: analytics.unique_viewers > 0 ? (analytics.shares / analytics.unique_viewers) * 100 : 0,
      comment_rate: analytics.unique_viewers > 0 ? (analytics.comments / analytics.unique_viewers) * 100 : 0
    });

    return {
      content_id,
      engagement_score: engagementScore,
      interaction_rate: interactionRate,
      replay_rate: replayRate,
      share_rate: analytics.unique_viewers > 0 ? (analytics.shares / analytics.unique_viewers) * 100 : 0,
      like_rate: analytics.unique_viewers > 0 ? (analytics.likes / analytics.unique_viewers) * 100 : 0,
      comment_rate: analytics.unique_viewers > 0 ? (analytics.comments / analytics.unique_viewers) * 100 : 0
    };
  }

  /**
   * Get popular content
   */
  async getPopularContent(
    filters?: {
      topic_id?: string;
      subject_id?: string;
      content_type?: string;
      time_period_days?: number;
    },
    limit: number = 10
  ): Promise<PopularContent[]> {
    let query = `
      SELECT 
        lc.content_id,
        lc.title,
        lc.content_type,
        t.topic_name,
        lc.view_count,
        COALESCE(ce.engagement_score, 0) as engagement_score,
        COALESCE(ce.trending_score, 0) as trending_score
      FROM learning_content lc
      LEFT JOIN topics t ON lc.topic_id = t.topic_id
      LEFT JOIN (
        SELECT 
          content_id,
          AVG(completion_percentage) * 0.4 + 
          (COUNT(DISTINCT student_id)::FLOAT / NULLIF(COUNT(*), 0)) * 0.3 +
          (SUM(interactions)::FLOAT / NULLIF(COUNT(*), 0)) * 0.3 as engagement_score,
          COUNT(*) as recent_views
        FROM content_views
        WHERE viewed_at >= CURRENT_TIMESTAMP - INTERVAL '${filters?.time_period_days || 30} days'
        GROUP BY content_id
      ) ce ON lc.content_id = ce.content_id
      WHERE lc.status = 'published'
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.topic_id) {
      query += ` AND lc.topic_id = $${paramIndex}`;
      params.push(filters.topic_id);
      paramIndex++;
    }

    if (filters?.subject_id) {
      query += ` AND t.subject_id = $${paramIndex}`;
      params.push(filters.subject_id);
      paramIndex++;
    }

    if (filters?.content_type) {
      query += ` AND lc.content_type = $${paramIndex}`;
      params.push(filters.content_type);
      paramIndex++;
    }

    query += `
      ORDER BY 
        (lc.view_count * 0.3 + COALESCE(ce.engagement_score, 0) * 0.4 + COALESCE(ce.recent_views, 0) * 0.3) DESC
      LIMIT $${paramIndex}
    `;
    params.push(limit);

    const result = await this.pool.query(query, params);

    return result.rows.map(row => ({
      content_id: row.content_id,
      title: row.title,
      content_type: row.content_type,
      topic_name: row.topic_name,
      view_count: parseInt(row.view_count),
      engagement_score: parseFloat(row.engagement_score) || 0,
      trending_score: parseFloat(row.trending_score) || 0
    }));
  }

  /**
   * Track content interaction (like, share, comment)
   */
  async trackInteraction(
    student_id: string,
    content_id: string,
    interaction_type: 'like' | 'share' | 'comment',
    comment_text?: string
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      if (interaction_type === 'like') {
        await client.query(
          `INSERT INTO content_engagement (content_id, student_id, likes, created_at)
           VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
           ON CONFLICT (content_id, student_id) 
           DO UPDATE SET likes = content_engagement.likes + 1`,
          [content_id, student_id]
        );
      } else if (interaction_type === 'share') {
        await client.query(
          `INSERT INTO content_engagement (content_id, student_id, shares, created_at)
           VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
           ON CONFLICT (content_id, student_id) 
           DO UPDATE SET shares = content_engagement.shares + 1`,
          [content_id, student_id]
        );
      } else if (interaction_type === 'comment' && comment_text) {
        await client.query(
          `INSERT INTO content_comments (content_id, student_id, comment_text, created_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          [content_id, student_id, comment_text]
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
   * Add content rating
   */
  async rateContent(
    student_id: string,
    content_id: string,
    rating: number
  ): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert or update rating
      await client.query(
        `INSERT INTO content_ratings (content_id, student_id, rating, created_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (content_id, student_id) 
         DO UPDATE SET rating = $3, updated_at = CURRENT_TIMESTAMP`,
        [content_id, student_id, rating]
      );

      // Update average rating in content table
      const avgResult = await client.query(
        `SELECT AVG(rating) as avg_rating
         FROM content_ratings
         WHERE content_id = $1`,
        [content_id]
      );

      await client.query(
        `UPDATE learning_content 
         SET average_rating = $1
         WHERE content_id = $2`,
        [avgResult.rows[0].avg_rating, content_id]
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
   * Calculate engagement score
   */
  private calculateEngagementScore(metrics: {
    completion_rate: number;
    interaction_rate: number;
    replay_rate: number;
    like_rate: number;
    share_rate: number;
    comment_rate: number;
  }): number {
    // Weighted average of different engagement metrics
    const score = 
      metrics.completion_rate * 0.30 +
      metrics.interaction_rate * 0.20 +
      metrics.replay_rate * 0.15 +
      metrics.like_rate * 0.15 +
      metrics.share_rate * 0.10 +
      metrics.comment_rate * 0.10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Get total views for content
   */
  private async getTotalViews(content_id: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as total FROM content_views WHERE content_id = $1',
      [content_id]
    );

    return parseInt(result.rows[0].total);
  }
}
