/**
 * Video Streaming Service
 * Handles multi-quality video streaming with adaptive bitrate
 * 
 * Features:
 * - Adaptive bitrate streaming (360p, 480p, 720p)
 * - Quality selection based on bandwidth
 * - Video transcoding service integration
 * - CDN integration preparation
 * - Bandwidth detection
 */

import { Pool } from 'pg';

export interface VideoQuality {
  resolution: '360p' | '480p' | '720p';
  url: string;
  bitrate: number; // kbps
  file_size_mb: number;
}

export interface VideoStreamingOptions {
  content_id: string;
  preferred_quality?: '360p' | '480p' | '720p' | 'auto';
  bandwidth_kbps?: number;
  offline_mode?: boolean;
}

export interface StreamingMetadata {
  content_id: string;
  title: string;
  duration_minutes: number;
  available_qualities: VideoQuality[];
  recommended_quality: string;
  chapter_markers?: ChapterMarker[];
  subtitles?: SubtitleTrack[];
  cdn_urls?: {
    [quality: string]: string;
  };
}

export interface ChapterMarker {
  timestamp: number;
  title: string;
  description?: string;
  thumbnail_url?: string;
}

export interface SubtitleTrack {
  language: string;
  language_name: string;
  url: string;
  format: 'srt' | 'vtt';
}

export interface BandwidthProfile {
  connection_type: 'slow_2g' | '2g' | '3g' | '4g' | 'wifi';
  estimated_bandwidth_kbps: number;
  recommended_quality: '360p' | '480p' | '720p';
}

export interface TranscodingJob {
  job_id: string;
  content_id: string;
  source_url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  qualities_generated: string[];
  created_at: Date;
  completed_at?: Date;
}

export class VideoStreamingService {
  constructor(private pool: Pool) {}

  // Bandwidth thresholds for quality selection (kbps)
  private readonly QUALITY_THRESHOLDS = {
    '360p': 500,   // 500 kbps minimum
    '480p': 1000,  // 1 Mbps minimum
    '720p': 2500   // 2.5 Mbps minimum
  };

  /**
   * Get streaming metadata for a video
   */
  async getStreamingMetadata(options: VideoStreamingOptions): Promise<StreamingMetadata> {
    const result = await this.pool.query(
      `SELECT content_id, title, duration_minutes, video_quality_options, 
              video_size_mb, chapter_markers, subtitles
       FROM learning_content
       WHERE content_id = $1 AND content_type = 'video'`,
      [options.content_id]
    );

    if (result.rows.length === 0) {
      throw new Error('Video content not found');
    }

    const content = result.rows[0];
    const qualityOptions = content.video_quality_options || {};

    // Build available qualities
    const availableQualities: VideoQuality[] = [];
    
    if (qualityOptions['360p']) {
      availableQualities.push({
        resolution: '360p',
        url: qualityOptions['360p'],
        bitrate: 500,
        file_size_mb: content.video_size_mb * 0.3 // Approximate
      });
    }

    if (qualityOptions['480p']) {
      availableQualities.push({
        resolution: '480p',
        url: qualityOptions['480p'],
        bitrate: 1000,
        file_size_mb: content.video_size_mb * 0.5
      });
    }

    if (qualityOptions['720p']) {
      availableQualities.push({
        resolution: '720p',
        url: qualityOptions['720p'],
        bitrate: 2500,
        file_size_mb: content.video_size_mb
      });
    }

    // Determine recommended quality
    const recommendedQuality = this.selectQuality(
      options.bandwidth_kbps,
      availableQualities,
      options.preferred_quality
    );

    // Prepare CDN URLs (placeholder for CDN integration)
    const cdnUrls: { [quality: string]: string } = {};
    availableQualities.forEach(q => {
      cdnUrls[q.resolution] = this.getCDNUrl(q.url);
    });

    return {
      content_id: content.content_id,
      title: content.title,
      duration_minutes: content.duration_minutes,
      available_qualities: availableQualities,
      recommended_quality: recommendedQuality,
      chapter_markers: content.chapter_markers || [],
      subtitles: this.formatSubtitles(content.subtitles || []),
      cdn_urls: cdnUrls
    };
  }

  /**
   * Select appropriate video quality based on bandwidth
   */
  selectQuality(
    bandwidth_kbps: number | undefined,
    availableQualities: VideoQuality[],
    preferredQuality?: string
  ): string {
    // If preferred quality is specified and available, use it
    if (preferredQuality && preferredQuality !== 'auto') {
      const preferred = availableQualities.find(q => q.resolution === preferredQuality);
      if (preferred) return preferredQuality;
    }

    // If no bandwidth info, default to 480p or highest available
    if (!bandwidth_kbps) {
      const default480p = availableQualities.find(q => q.resolution === '480p');
      return default480p ? '480p' : availableQualities[availableQualities.length - 1].resolution;
    }

    // Select based on bandwidth
    if (bandwidth_kbps >= this.QUALITY_THRESHOLDS['720p']) {
      const q720p = availableQualities.find(q => q.resolution === '720p');
      if (q720p) return '720p';
    }

    if (bandwidth_kbps >= this.QUALITY_THRESHOLDS['480p']) {
      const q480p = availableQualities.find(q => q.resolution === '480p');
      if (q480p) return '480p';
    }

    // Default to 360p for low bandwidth
    const q360p = availableQualities.find(q => q.resolution === '360p');
    return q360p ? '360p' : availableQualities[0].resolution;
  }

  /**
   * Get bandwidth profile recommendation
   */
  getBandwidthProfile(bandwidth_kbps: number): BandwidthProfile {
    let connectionType: BandwidthProfile['connection_type'];
    let recommendedQuality: '360p' | '480p' | '720p';

    if (bandwidth_kbps < 250) {
      connectionType = 'slow_2g';
      recommendedQuality = '360p';
    } else if (bandwidth_kbps < 500) {
      connectionType = '2g';
      recommendedQuality = '360p';
    } else if (bandwidth_kbps < 2000) {
      connectionType = '3g';
      recommendedQuality = '480p';
    } else if (bandwidth_kbps < 5000) {
      connectionType = '4g';
      recommendedQuality = '720p';
    } else {
      connectionType = 'wifi';
      recommendedQuality = '720p';
    }

    return {
      connection_type: connectionType,
      estimated_bandwidth_kbps: bandwidth_kbps,
      recommended_quality: recommendedQuality
    };
  }

  /**
   * Track video streaming session
   */
  async trackStreamingSession(
    student_id: string,
    content_id: string,
    quality: string,
    bandwidth_kbps?: number
  ): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO video_streaming_sessions (
        student_id, content_id, quality_selected, bandwidth_kbps, started_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING session_id`,
      [student_id, content_id, quality, bandwidth_kbps]
    );

    return result.rows[0].session_id;
  }

  /**
   * Update streaming session metrics
   */
  async updateStreamingMetrics(
    session_id: string,
    metrics: {
      buffering_events?: number;
      quality_switches?: number;
      total_buffering_time_seconds?: number;
      playback_completed?: boolean;
    }
  ): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (metrics.buffering_events !== undefined) {
      updates.push(`buffering_events = $${paramIndex}`);
      values.push(metrics.buffering_events);
      paramIndex++;
    }

    if (metrics.quality_switches !== undefined) {
      updates.push(`quality_switches = $${paramIndex}`);
      values.push(metrics.quality_switches);
      paramIndex++;
    }

    if (metrics.total_buffering_time_seconds !== undefined) {
      updates.push(`total_buffering_time_seconds = $${paramIndex}`);
      values.push(metrics.total_buffering_time_seconds);
      paramIndex++;
    }

    if (metrics.playback_completed !== undefined) {
      updates.push(`playback_completed = $${paramIndex}`);
      values.push(metrics.playback_completed);
      paramIndex++;
    }

    if (updates.length > 0) {
      values.push(session_id);
      await this.pool.query(
        `UPDATE video_streaming_sessions 
         SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE session_id = $${paramIndex}`,
        values
      );
    }
  }

  /**
   * Get streaming analytics
   */
  async getStreamingAnalytics(content_id: string): Promise<{
    total_views: number;
    quality_distribution: { [quality: string]: number };
    average_buffering_rate: number;
    completion_rate: number;
  }> {
    const result = await this.pool.query(
      `SELECT 
        COUNT(*) as total_views,
        quality_selected,
        AVG(buffering_events) as avg_buffering,
        SUM(CASE WHEN playback_completed THEN 1 ELSE 0 END) as completed_views
       FROM video_streaming_sessions
       WHERE content_id = $1
       GROUP BY quality_selected`,
      [content_id]
    );

    const qualityDistribution: { [quality: string]: number } = {};
    let totalViews = 0;
    let totalBuffering = 0;
    let completedViews = 0;

    result.rows.forEach(row => {
      const count = parseInt(row.total_views);
      qualityDistribution[row.quality_selected] = count;
      totalViews += count;
      totalBuffering += parseFloat(row.avg_buffering) * count;
      completedViews += parseInt(row.completed_views);
    });

    return {
      total_views: totalViews,
      quality_distribution: qualityDistribution,
      average_buffering_rate: totalViews > 0 ? totalBuffering / totalViews : 0,
      completion_rate: totalViews > 0 ? (completedViews / totalViews) * 100 : 0
    };
  }

  /**
   * Request video transcoding
   */
  async requestTranscoding(
    content_id: string,
    source_url: string,
    target_qualities: string[]
  ): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO transcoding_jobs (
        content_id, source_url, target_qualities, status, created_at
      ) VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP)
      RETURNING job_id`,
      [content_id, source_url, target_qualities]
    );

    // In production, this would trigger AWS MediaConvert or similar service
    // For now, we just create the job record

    return result.rows[0].job_id;
  }

  /**
   * Update transcoding job status
   */
  async updateTranscodingStatus(
    job_id: string,
    status: 'processing' | 'completed' | 'failed',
    qualityUrls?: { [quality: string]: string }
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE transcoding_jobs 
         SET status = $1, 
             completed_at = CASE WHEN $1 IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE NULL END,
             updated_at = CURRENT_TIMESTAMP
         WHERE job_id = $2`,
        [status, job_id]
      );

      // If completed, update content with new quality URLs
      if (status === 'completed' && qualityUrls) {
        const jobResult = await client.query(
          'SELECT content_id FROM transcoding_jobs WHERE job_id = $1',
          [job_id]
        );

        if (jobResult.rows.length > 0) {
          const content_id = jobResult.rows[0].content_id;
          
          await client.query(
            `UPDATE learning_content 
             SET video_quality_options = $1, updated_at = CURRENT_TIMESTAMP
             WHERE content_id = $2`,
            [JSON.stringify(qualityUrls), content_id]
          );
        }
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
   * Get CDN URL for video (placeholder for CDN integration)
   */
  private getCDNUrl(originalUrl: string): string {
    // In production, this would return CloudFront or similar CDN URL
    // For now, return the original URL
    return originalUrl;
  }

  /**
   * Format subtitles for response
   */
  private formatSubtitles(subtitles: any[]): SubtitleTrack[] {
    const languageNames: { [key: string]: string } = {
      'en': 'English',
      'hi': 'Hindi',
      'ta': 'Tamil',
      'te': 'Telugu',
      'bn': 'Bengali',
      'mr': 'Marathi',
      'gu': 'Gujarati',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'pa': 'Punjabi',
      'or': 'Odia',
      'as': 'Assamese',
      'ur': 'Urdu'
    };

    return subtitles.map(sub => ({
      language: sub.language,
      language_name: languageNames[sub.language] || sub.language,
      url: sub.url,
      format: sub.format
    }));
  }
}
