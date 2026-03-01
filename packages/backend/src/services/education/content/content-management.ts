/**
 * Content Management Service
 * Handles CRUD operations for educational content including videos, simulations, and games
 * 
 * Features:
 * - Content creation, update, deletion
 * - Video metadata management
 * - Content versioning
 * - Publishing workflow
 * - Content approval system
 */

import { Pool } from 'pg';

export interface VideoMetadata {
  title: string;
  description?: string;
  duration_minutes: number;
  video_quality_options: {
    '360p'?: string;
    '480p'?: string;
    '720p'?: string;
  };
  video_size_mb: number;
  thumbnail_url?: string;
}

export interface ChapterMarker {
  timestamp: number; // seconds
  title: string;
  description?: string;
  thumbnail_url?: string;
}

export interface Subtitle {
  language: string;
  url: string;
  format: 'srt' | 'vtt';
}

export interface ContentVersion {
  version_number: number;
  changes: string;
  created_by: string;
  created_at: Date;
}

export interface ContentData {
  content_id?: string;
  topic_id: string;
  title: string;
  content_type: 'video' | 'text' | 'interactive' | 'quiz' | 'simulation' | 'game' | 'practice';
  difficulty_level: 'easy' | 'medium' | 'hard' | 'advanced';
  content_url?: string;
  content_data?: any;
  duration_minutes?: number;
  video_quality_options?: VideoMetadata['video_quality_options'];
  video_size_mb?: number;
  chapter_markers?: ChapterMarker[];
  subtitles?: Subtitle[];
  transcript?: string;
  available_offline?: boolean;
  offline_size_mb?: number;
  download_priority?: number;
  tags?: string[];
  keywords?: string[];
  language?: string;
  status?: 'draft' | 'review' | 'published' | 'archived';
}

export interface ApprovalWorkflow {
  content_id: string;
  submitted_by: string;
  submitted_at: Date;
  reviewed_by?: string;
  reviewed_at?: Date;
  approval_status: 'pending' | 'approved' | 'rejected';
  reviewer_comments?: string;
}

export class ContentManagementService {
  constructor(private pool: Pool) {}

  /**
   * Create new educational content
   */
  async createContent(content: ContentData, created_by: string): Promise<string> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert content
      const contentResult = await client.query(
        `INSERT INTO learning_content (
          topic_id, title, content_type, difficulty_level, content_url, content_data,
          duration_minutes, video_quality_options, video_size_mb, chapter_markers,
          subtitles, transcript, available_offline, offline_size_mb, download_priority,
          tags, keywords, language, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING content_id`,
        [
          content.topic_id,
          content.title,
          content.content_type,
          content.difficulty_level,
          content.content_url,
          content.content_data ? JSON.stringify(content.content_data) : null,
          content.duration_minutes,
          content.video_quality_options ? JSON.stringify(content.video_quality_options) : null,
          content.video_size_mb,
          content.chapter_markers ? JSON.stringify(content.chapter_markers) : null,
          content.subtitles ? JSON.stringify(content.subtitles) : null,
          content.transcript,
          content.available_offline || false,
          content.offline_size_mb,
          content.download_priority || 0,
          content.tags || [],
          content.keywords || [],
          content.language || 'en',
          content.status || 'draft'
        ]
      );

      const content_id = contentResult.rows[0].content_id;

      // Create initial version
      await this.createVersion(client, content_id, 1, 'Initial version', created_by);

      await client.query('COMMIT');
      return content_id;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update existing content
   */
  async updateContent(
    content_id: string,
    updates: Partial<ContentData>,
    updated_by: string
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current version
      const versionResult = await client.query(
        'SELECT MAX(version_number) as current_version FROM content_versions WHERE content_id = $1',
        [content_id]
      );
      const currentVersion = versionResult.rows[0]?.current_version || 0;
      const newVersion = currentVersion + 1;

      // Build update query dynamically
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && key !== 'content_id') {
          updateFields.push(`${key} = $${paramIndex}`);
          
          // Handle JSONB fields
          if (['video_quality_options', 'chapter_markers', 'subtitles', 'content_data'].includes(key)) {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
          paramIndex++;
        }
      });

      if (updateFields.length > 0) {
        values.push(content_id);
        await client.query(
          `UPDATE learning_content SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
           WHERE content_id = $${paramIndex}`,
          values
        );

        // Create new version
        await this.createVersion(
          client,
          content_id,
          newVersion,
          'Content updated',
          updated_by
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
   * Delete content (soft delete by archiving)
   */
  async deleteContent(content_id: string): Promise<void> {
    await this.pool.query(
      `UPDATE learning_content SET status = 'archived', updated_at = CURRENT_TIMESTAMP 
       WHERE content_id = $1`,
      [content_id]
    );
  }

  /**
   * Get content by ID
   */
  async getContentById(content_id: string): Promise<ContentData | null> {
    const result = await this.pool.query(
      'SELECT * FROM learning_content WHERE content_id = $1',
      [content_id]
    );

    if (result.rows.length === 0) return null;

    return this.mapRowToContent(result.rows[0]);
  }

  /**
   * Get content by topic
   */
  async getContentByTopic(
    topic_id: string,
    filters?: {
      content_type?: string;
      difficulty_level?: string;
      language?: string;
      status?: string;
    }
  ): Promise<ContentData[]> {
    let query = 'SELECT * FROM learning_content WHERE topic_id = $1';
    const params: any[] = [topic_id];
    let paramIndex = 2;

    if (filters) {
      if (filters.content_type) {
        query += ` AND content_type = $${paramIndex}`;
        params.push(filters.content_type);
        paramIndex++;
      }
      if (filters.difficulty_level) {
        query += ` AND difficulty_level = $${paramIndex}`;
        params.push(filters.difficulty_level);
        paramIndex++;
      }
      if (filters.language) {
        query += ` AND language = $${paramIndex}`;
        params.push(filters.language);
        paramIndex++;
      }
      if (filters.status) {
        query += ` AND status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.mapRowToContent(row));
  }

  /**
   * Submit content for approval
   */
  async submitForApproval(content_id: string, submitted_by: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update content status
      await client.query(
        `UPDATE learning_content SET status = 'review', updated_at = CURRENT_TIMESTAMP 
         WHERE content_id = $1`,
        [content_id]
      );

      // Create approval record
      await client.query(
        `INSERT INTO content_approvals (content_id, submitted_by, submitted_at, approval_status)
         VALUES ($1, $2, CURRENT_TIMESTAMP, 'pending')`,
        [content_id, submitted_by]
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
   * Approve or reject content
   */
  async reviewContent(
    content_id: string,
    reviewed_by: string,
    approved: boolean,
    comments?: string
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const newStatus = approved ? 'published' : 'draft';
      const approvalStatus = approved ? 'approved' : 'rejected';

      // Update content status
      await client.query(
        `UPDATE learning_content SET status = $1, updated_at = CURRENT_TIMESTAMP,
         published_at = CASE WHEN $1 = 'published' THEN CURRENT_TIMESTAMP ELSE published_at END
         WHERE content_id = $2`,
        [newStatus, content_id]
      );

      // Update approval record
      await client.query(
        `UPDATE content_approvals 
         SET reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, 
             approval_status = $2, reviewer_comments = $3
         WHERE content_id = $4 AND approval_status = 'pending'`,
        [reviewed_by, approvalStatus, comments, content_id]
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
   * Get content versions
   */
  async getContentVersions(content_id: string): Promise<ContentVersion[]> {
    const result = await this.pool.query(
      `SELECT version_number, changes, created_by, created_at 
       FROM content_versions 
       WHERE content_id = $1 
       ORDER BY version_number DESC`,
      [content_id]
    );

    return result.rows;
  }

  /**
   * Create a new version record
   */
  private async createVersion(
    client: any,
    content_id: string,
    version_number: number,
    changes: string,
    created_by: string
  ): Promise<void> {
    await client.query(
      `INSERT INTO content_versions (content_id, version_number, changes, created_by, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [content_id, version_number, changes, created_by]
    );
  }

  /**
   * Map database row to ContentData
   */
  private mapRowToContent(row: any): ContentData {
    return {
      content_id: row.content_id,
      topic_id: row.topic_id,
      title: row.title,
      content_type: row.content_type,
      difficulty_level: row.difficulty_level,
      content_url: row.content_url,
      content_data: row.content_data,
      duration_minutes: row.duration_minutes,
      video_quality_options: row.video_quality_options,
      video_size_mb: row.video_size_mb,
      chapter_markers: row.chapter_markers,
      subtitles: row.subtitles,
      transcript: row.transcript,
      available_offline: row.available_offline,
      offline_size_mb: row.offline_size_mb,
      download_priority: row.download_priority,
      tags: row.tags,
      keywords: row.keywords,
      language: row.language,
      status: row.status
    };
  }
}
