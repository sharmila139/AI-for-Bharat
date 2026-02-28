/**
 * Media Management Service
 * Handles multi-format content delivery for knowledge base articles
 * Supports images, videos, and audio with optimization and CDN delivery
 */

import { Pool } from 'pg';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import {
  MediaItem,
  ArticleMedia,
  MediaType,
  MultiLanguageText,
} from './knowledge-base-types';

// ============================================================================
// Types
// ============================================================================

export interface MediaUploadInput {
  file: Buffer;
  filename: string;
  mimeType: string;
  caption?: MultiLanguageText;
  altText?: MultiLanguageText;
}

export interface MediaMetadata {
  media_id: string;
  article_id?: string;
  media_type: MediaType;
  file_url: string;
  file_size: number;
  mime_type: string;
  caption?: MultiLanguageText;
  alt_text?: MultiLanguageText;
  duration?: number;
  thumbnail_url?: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  uploaded_at: Date;
}

export interface VideoQuality {
  quality: '360p' | '480p' | '720p';
  url: string;
  bitrate: string;
}

export interface MediaOptimizationOptions {
  compressImages?: boolean;
  generateThumbnails?: boolean;
  maxImageSize?: number; // in KB
  videoQualities?: ('360p' | '480p' | '720p')[];
}

// ============================================================================
// Media Management Service
// ============================================================================

export class MediaManagementService {
  private s3Client?: S3Client;
  private bucketName: string;
  private cdnUrl: string;

  constructor(
    private pool: Pool,
    s3Config?: {
      region: string;
      credentials: {
        accessKeyId: string;
        secretAccessKey: string;
      };
      bucketName: string;
      cdnUrl: string;
    }
  ) {
    // Initialize S3 client (use mock for development if config not provided)
    if (s3Config) {
      this.s3Client = new S3Client({
        region: s3Config.region,
        credentials: s3Config.credentials,
      });
      this.bucketName = s3Config.bucketName;
      this.cdnUrl = s3Config.cdnUrl;
    } else {
      // Mock configuration for development
      this.bucketName = 'ruralconnect-media-dev';
      this.cdnUrl = 'https://cdn.ruralconnect.dev';
    }
  }

  // ============================================================================
  // Media Upload and Management
  // ============================================================================

  /**
   * Upload media file to S3 with optimization
   */
  async uploadMedia(
    articleId: string,
    input: MediaUploadInput,
    options: MediaOptimizationOptions = {}
  ): Promise<MediaMetadata> {
    const mediaType = this.detectMediaType(input.mimeType);
    const mediaId = uuidv4();
    
    let processedFile = input.file;
    let fileSize = input.file.length;
    let thumbnailUrl: string | undefined;

    // Optimize based on media type
    if (mediaType === 'image' && options.compressImages !== false) {
      const optimized = await this.optimizeImage(input.file, options.maxImageSize || 500);
      processedFile = optimized.buffer;
      fileSize = optimized.size;
    }

    // Generate thumbnail for videos
    if (mediaType === 'video' && options.generateThumbnails !== false) {
      thumbnailUrl = await this.generateVideoThumbnail(mediaId, input.file);
    }

    // Upload to S3
    const fileKey = `articles/${articleId}/${mediaType}s/${mediaId}-${input.filename}`;
    const fileUrl = await this.uploadToS3(fileKey, processedFile, input.mimeType);

    // Save metadata to database
    const query = `
      INSERT INTO article_media (
        media_id, article_id, media_type, file_url, file_size, mime_type,
        caption, alt_text, thumbnail_url, processing_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed')
      RETURNING *
    `;

    const values = [
      mediaId,
      articleId,
      mediaType,
      fileUrl,
      fileSize,
      input.mimeType,
      input.caption ? JSON.stringify(input.caption) : null,
      input.altText ? JSON.stringify(input.altText) : null,
      thumbnailUrl || null,
    ];

    const result = await this.pool.query(query, values);
    return this.mapMediaFromDb(result.rows[0]);
  }

  /**
   * Get article media
   */
  async getArticleMedia(articleId: string): Promise<ArticleMedia> {
    const query = `
      SELECT * FROM article_media
      WHERE article_id = $1 AND processing_status = 'completed'
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [articleId]);
    const mediaItems = result.rows.map(row => this.mapMediaFromDb(row));

    // Group by media type
    const media: ArticleMedia = {
      images: [],
      videos: [],
      audio: [],
    };

    for (const item of mediaItems) {
      const mediaItem: MediaItem = {
        url: item.file_url,
        caption: item.caption,
        alt_text: item.alt_text,
        thumbnail_url: item.thumbnail_url,
        duration: item.duration,
      };

      if (item.media_type === 'image') {
        media.images.push(mediaItem);
      } else if (item.media_type === 'video') {
        media.videos.push(mediaItem);
      } else if (item.media_type === 'audio') {
        media.audio.push(mediaItem);
      }
    }

    return media;
  }

  /**
   * Update media metadata
   */
  async updateMediaMetadata(
    mediaId: string,
    updates: {
      caption?: MultiLanguageText;
      altText?: MultiLanguageText;
      duration?: number;
    }
  ): Promise<MediaMetadata> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.caption) {
      updateFields.push(`caption = $${paramIndex++}`);
      values.push(JSON.stringify(updates.caption));
    }

    if (updates.altText) {
      updateFields.push(`alt_text = $${paramIndex++}`);
      values.push(JSON.stringify(updates.altText));
    }

    if (updates.duration !== undefined) {
      updateFields.push(`duration = $${paramIndex++}`);
      values.push(updates.duration);
    }

    if (updateFields.length === 0) {
      throw new Error('No updates provided');
    }

    const query = `
      UPDATE article_media
      SET ${updateFields.join(', ')}
      WHERE media_id = $${paramIndex}
      RETURNING *
    `;

    values.push(mediaId);

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Media not found');
    }

    return this.mapMediaFromDb(result.rows[0]);
  }

  /**
   * Delete media file
   */
  async deleteMedia(mediaId: string): Promise<boolean> {
    // Get media info
    const selectQuery = 'SELECT * FROM article_media WHERE media_id = $1';
    const selectResult = await this.pool.query(selectQuery, [mediaId]);

    if (selectResult.rows.length === 0) {
      return false;
    }

    const media = selectResult.rows[0];

    // Delete from S3
    await this.deleteFromS3(media.file_url);

    // Delete thumbnail if exists
    if (media.thumbnail_url) {
      await this.deleteFromS3(media.thumbnail_url);
    }

    // Delete from database
    const deleteQuery = 'DELETE FROM article_media WHERE media_id = $1';
    await this.pool.query(deleteQuery, [mediaId]);

    return true;
  }

  // ============================================================================
  // Media Optimization
  // ============================================================================

  /**
   * Optimize image (compress and resize)
   */
  private async optimizeImage(
    buffer: Buffer,
    maxSizeKB: number = 500
  ): Promise<{ buffer: Buffer; size: number }> {
    let quality = 90;
    let optimized = buffer;

    // Resize if too large (max 1920px width)
    const metadata = await sharp(buffer).metadata();
    if (metadata.width && metadata.width > 1920) {
      optimized = await sharp(buffer)
        .resize(1920, null, { withoutEnlargement: true })
        .toBuffer();
    }

    // Compress until under target size
    while (optimized.length > maxSizeKB * 1024 && quality > 20) {
      optimized = await sharp(buffer)
        .jpeg({ quality, progressive: true })
        .toBuffer();
      quality -= 10;
    }

    return {
      buffer: optimized,
      size: optimized.length,
    };
  }

  /**
   * Generate video thumbnail
   */
  private async generateVideoThumbnail(
    mediaId: string,
    _videoBuffer: Buffer
  ): Promise<string> {
    // In production, use ffmpeg to extract frame
    // For now, return placeholder
    return `${this.cdnUrl}/thumbnails/${mediaId}-thumb.jpg`;
  }

  /**
   * Get video quality variants
   */
  async getVideoQualities(videoUrl: string): Promise<VideoQuality[]> {
    // In production, this would return actual transcoded versions
    // For now, return mock data
    const baseUrl = videoUrl.replace(/\.[^.]+$/, '');
    
    return [
      {
        quality: '360p',
        url: `${baseUrl}-360p.mp4`,
        bitrate: '500kbps',
      },
      {
        quality: '480p',
        url: `${baseUrl}-480p.mp4`,
        bitrate: '1000kbps',
      },
      {
        quality: '720p',
        url: `${baseUrl}-720p.mp4`,
        bitrate: '2500kbps',
      },
    ];
  }

  // ============================================================================
  // Adaptive Delivery
  // ============================================================================

  /**
   * Get media URL with adaptive quality based on bandwidth
   */
  async getAdaptiveMediaUrl(
    mediaId: string,
    bandwidth?: 'low' | 'medium' | 'high'
  ): Promise<string> {
    const query = 'SELECT * FROM article_media WHERE media_id = $1';
    const result = await this.pool.query(query, [mediaId]);

    if (result.rows.length === 0) {
      throw new Error('Media not found');
    }

    const media = result.rows[0];

    // For videos, return appropriate quality
    if (media.media_type === 'video') {
      const qualities = await this.getVideoQualities(media.file_url);
      
      if (bandwidth === 'low') {
        return qualities.find(q => q.quality === '360p')?.url || media.file_url;
      } else if (bandwidth === 'medium') {
        return qualities.find(q => q.quality === '480p')?.url || media.file_url;
      } else {
        return qualities.find(q => q.quality === '720p')?.url || media.file_url;
      }
    }

    return media.file_url;
  }

  /**
   * Generate signed URL for temporary access
   */
  async getSignedMediaUrl(mediaId: string, expiresIn: number = 3600): Promise<string> {
    const query = 'SELECT file_url FROM article_media WHERE media_id = $1';
    const result = await this.pool.query(query, [mediaId]);

    if (result.rows.length === 0) {
      throw new Error('Media not found');
    }

    const fileUrl = result.rows[0].file_url;
    const fileKey = this.extractS3Key(fileUrl);

    if (!this.s3Client) {
      // Return direct URL if S3 not configured
      return fileUrl;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  // ============================================================================
  // S3 Operations
  // ============================================================================

  /**
   * Upload file to S3
   */
  private async uploadToS3(
    key: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    if (!this.s3Client) {
      // Mock upload for development
      return `${this.cdnUrl}/${key}`;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // 1 year
    });

    await this.s3Client.send(command);
    return `${this.cdnUrl}/${key}`;
  }

  /**
   * Delete file from S3
   */
  private async deleteFromS3(fileUrl: string): Promise<void> {
    if (!this.s3Client) {
      return; // Skip for development
    }

    const key = this.extractS3Key(fileUrl);

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Extract S3 key from CDN URL
   */
  private extractS3Key(url: string): string {
    return url.replace(this.cdnUrl + '/', '');
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Detect media type from MIME type
   */
  private detectMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType.startsWith('audio/')) {
      return 'audio';
    } else {
      return 'document';
    }
  }

  /**
   * Map database row to MediaMetadata
   */
  private mapMediaFromDb(row: any): MediaMetadata {
    return {
      media_id: row.media_id,
      article_id: row.article_id,
      media_type: row.media_type,
      file_url: row.file_url,
      file_size: row.file_size,
      mime_type: row.mime_type,
      caption: row.caption ? (typeof row.caption === 'string' ? JSON.parse(row.caption) : row.caption) : undefined,
      alt_text: row.alt_text ? (typeof row.alt_text === 'string' ? JSON.parse(row.alt_text) : row.alt_text) : undefined,
      duration: row.duration,
      thumbnail_url: row.thumbnail_url,
      processing_status: row.processing_status,
      uploaded_at: row.uploaded_at,
    };
  }
}
