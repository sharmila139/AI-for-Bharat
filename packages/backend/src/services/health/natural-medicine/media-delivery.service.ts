/**
 * Media Delivery Service
 * Manages video, audio, and image URLs for remedy instructions
 */

import { Pool } from 'pg';

export interface MediaUrls {
  image_urls: string[];
  video_urls: string[];
  audio_urls: string[];
}

export class MediaDeliveryService {
  constructor(private pool: Pool) {}

  async getRemedyMedia(remedyId: string): Promise<MediaUrls> {
    const query = `
      SELECT image_url, video_url, audio_url
      FROM preparation_methods
      WHERE remedy_id = $1
      ORDER BY step_number ASC
    `;
    
    const result = await this.pool.query(query, [remedyId]);
    
    const media: MediaUrls = {
      image_urls: [],
      video_urls: [],
      audio_urls: []
    };
    
    for (const row of result.rows) {
      if (row.image_url) media.image_urls.push(row.image_url);
      if (row.video_url) media.video_urls.push(row.video_url);
      if (row.audio_url) media.audio_urls.push(row.audio_url);
    }
    
    return media;
  }

  async addMediaToStep(
    stepId: string,
    mediaType: 'image' | 'video' | 'audio',
    mediaUrl: string
  ): Promise<void> {
    const columnMap = {
      image: 'image_url',
      video: 'video_url',
      audio: 'audio_url'
    };
    
    const query = `
      UPDATE preparation_methods
      SET ${columnMap[mediaType]} = $1
      WHERE step_id = $2
    `;
    
    await this.pool.query(query, [mediaUrl, stepId]);
  }

  async getMediaForStep(stepId: string): Promise<{
    image_url?: string;
    video_url?: string;
    audio_url?: string;
  }> {
    const query = `
      SELECT image_url, video_url, audio_url
      FROM preparation_methods
      WHERE step_id = $1
    `;
    
    const result = await this.pool.query(query, [stepId]);
    
    if (result.rows.length === 0) {
      throw new Error('Step not found');
    }
    
    return result.rows[0];
  }
}

export function createMediaDeliveryService(pool: Pool): MediaDeliveryService {
  return new MediaDeliveryService(pool);
}
