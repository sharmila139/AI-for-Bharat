/**
 * Multi-Language Subtitle and Transcript Service
 * Handles subtitle management and transcript generation
 * 
 * Features:
 * - Subtitle file management (SRT, VTT formats)
 * - Multi-language subtitle support (15+ languages)
 * - Transcript generation and storage
 * - Subtitle synchronization
 * - Search within transcripts
 */

import { Pool } from 'pg';

export interface Subtitle {
  subtitle_id?: string;
  content_id: string;
  language: string;
  language_name: string;
  format: 'srt' | 'vtt';
  subtitle_url: string;
  file_size_kb: number;
  created_by?: string;
  verified: boolean;
}

export interface SubtitleCue {
  index: number;
  start_time: string; // Format: HH:MM:SS,mmm
  end_time: string;
  text: string;
}

export interface Transcript {
  transcript_id?: string;
  content_id: string;
  language: string;
  full_text: string;
  word_count: number;
  timestamps?: TranscriptTimestamp[];
  generated_method: 'manual' | 'auto' | 'imported';
}

export interface TranscriptTimestamp {
  start_seconds: number;
  end_seconds: number;
  text: string;
}

export interface TranscriptSearchResult {
  content_id: string;
  content_title: string;
  matches: TranscriptMatch[];
  total_matches: number;
}

export interface TranscriptMatch {
  timestamp_seconds: number;
  context: string;
  highlight: string;
}

export class SubtitleService {
  constructor(private pool: Pool) {}

  // Supported languages
  private readonly SUPPORTED_LANGUAGES = {
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
    'ur': 'Urdu',
    'ks': 'Kashmiri',
    'kok': 'Konkani'
  };

  /**
   * Add subtitle to content
   */
  async addSubtitle(subtitle: Subtitle): Promise<string> {
    const languageName = this.SUPPORTED_LANGUAGES[subtitle.language as keyof typeof this.SUPPORTED_LANGUAGES] || subtitle.language;

    const result = await this.pool.query(
      `INSERT INTO subtitles (
        content_id, language, language_name, format, subtitle_url,
        file_size_kb, created_by, verified, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING subtitle_id`,
      [
        subtitle.content_id,
        subtitle.language,
        languageName,
        subtitle.format,
        subtitle.subtitle_url,
        subtitle.file_size_kb,
        subtitle.created_by,
        subtitle.verified || false
      ]
    );

    // Update content subtitles JSONB field
    await this.updateContentSubtitles(subtitle.content_id);

    return result.rows[0].subtitle_id;
  }

  /**
   * Get subtitles for content
   */
  async getSubtitles(content_id: string, language?: string): Promise<Subtitle[]> {
    let query = 'SELECT * FROM subtitles WHERE content_id = $1';
    const params: any[] = [content_id];

    if (language) {
      query += ' AND language = $2';
      params.push(language);
    }

    query += ' ORDER BY language';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Update subtitle
   */
  async updateSubtitle(
    subtitle_id: string,
    updates: Partial<Subtitle>
  ): Promise<void> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'subtitle_id' && key !== 'content_id') {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length > 0) {
      values.push(subtitle_id);
      await this.pool.query(
        `UPDATE subtitles SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE subtitle_id = $${paramIndex}`,
        values
      );

      // Get content_id and update content subtitles
      const contentResult = await this.pool.query(
        'SELECT content_id FROM subtitles WHERE subtitle_id = $1',
        [subtitle_id]
      );
      
      if (contentResult.rows.length > 0) {
        await this.updateContentSubtitles(contentResult.rows[0].content_id);
      }
    }
  }

  /**
   * Delete subtitle
   */
  async deleteSubtitle(subtitle_id: string): Promise<void> {
    const contentResult = await this.pool.query(
      'SELECT content_id FROM subtitles WHERE subtitle_id = $1',
      [subtitle_id]
    );

    await this.pool.query('DELETE FROM subtitles WHERE subtitle_id = $1', [subtitle_id]);

    if (contentResult.rows.length > 0) {
      await this.updateContentSubtitles(contentResult.rows[0].content_id);
    }
  }

  /**
   * Verify subtitle
   */
  async verifySubtitle(subtitle_id: string, verified_by: string): Promise<void> {
    await this.pool.query(
      `UPDATE subtitles 
       SET verified = TRUE, verified_by = $1, verified_at = CURRENT_TIMESTAMP 
       WHERE subtitle_id = $2`,
      [verified_by, subtitle_id]
    );
  }

  /**
   * Parse SRT subtitle file
   */
  parseSRT(srtContent: string): SubtitleCue[] {
    const cues: SubtitleCue[] = [];
    const blocks = srtContent.trim().split('\n\n');

    blocks.forEach(block => {
      const lines = block.split('\n');
      if (lines.length >= 3) {
        const index = parseInt(lines[0]);
        const timeLine = lines[1];
        const text = lines.slice(2).join('\n');

        const [startTime, endTime] = timeLine.split(' --> ');

        cues.push({
          index,
          start_time: startTime.trim(),
          end_time: endTime.trim(),
          text: text.trim()
        });
      }
    });

    return cues;
  }

  /**
   * Convert SRT to VTT format
   */
  convertSRTtoVTT(srtContent: string): string {
    let vttContent = 'WEBVTT\n\n';
    
    const cues = this.parseSRT(srtContent);
    
    cues.forEach(cue => {
      // Convert comma to dot in timestamps for VTT
      const startTime = cue.start_time.replace(',', '.');
      const endTime = cue.end_time.replace(',', '.');
      
      vttContent += `${startTime} --> ${endTime}\n`;
      vttContent += `${cue.text}\n\n`;
    });

    return vttContent;
  }

  /**
   * Add transcript to content
   */
  async addTranscript(transcript: Transcript): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO transcripts (
        content_id, language, full_text, word_count, timestamps,
        generated_method, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING transcript_id`,
      [
        transcript.content_id,
        transcript.language,
        transcript.full_text,
        transcript.word_count,
        transcript.timestamps ? JSON.stringify(transcript.timestamps) : null,
        transcript.generated_method
      ]
    );

    // Update content transcript field
    await this.pool.query(
      `UPDATE learning_content 
       SET transcript = $1 
       WHERE content_id = $2 AND language = $3`,
      [transcript.full_text, transcript.content_id, transcript.language]
    );

    return result.rows[0].transcript_id;
  }

  /**
   * Get transcript for content
   */
  async getTranscript(content_id: string, language: string): Promise<Transcript | null> {
    const result = await this.pool.query(
      'SELECT * FROM transcripts WHERE content_id = $1 AND language = $2',
      [content_id, language]
    );

    if (result.rows.length === 0) return null;

    return result.rows[0];
  }

  /**
   * Search within transcripts
   */
  async searchTranscripts(
    search_query: string,
    filters?: {
      topic_id?: string;
      subject_id?: string;
      language?: string;
    }
  ): Promise<TranscriptSearchResult[]> {
    let query = `
      SELECT 
        t.content_id,
        lc.title as content_title,
        t.full_text,
        t.timestamps,
        ts_headline('english', t.full_text, plainto_tsquery('english', $1)) as highlighted
      FROM transcripts t
      JOIN learning_content lc ON t.content_id = lc.content_id
      JOIN topics tp ON lc.topic_id = tp.topic_id
      WHERE to_tsvector('english', t.full_text) @@ plainto_tsquery('english', $1)
    `;

    const params: any[] = [search_query];
    let paramIndex = 2;

    if (filters?.topic_id) {
      query += ` AND lc.topic_id = $${paramIndex}`;
      params.push(filters.topic_id);
      paramIndex++;
    }

    if (filters?.subject_id) {
      query += ` AND tp.subject_id = $${paramIndex}`;
      params.push(filters.subject_id);
      paramIndex++;
    }

    if (filters?.language) {
      query += ` AND t.language = $${paramIndex}`;
      params.push(filters.language);
      paramIndex++;
    }

    query += ' LIMIT 20';

    const result = await this.pool.query(query, params);

    return result.rows.map(row => {
      const matches = this.extractMatches(row.full_text, search_query, row.timestamps);
      
      return {
        content_id: row.content_id,
        content_title: row.content_title,
        matches,
        total_matches: matches.length
      };
    });
  }

  /**
   * Generate transcript from subtitles
   */
  async generateTranscriptFromSubtitles(
    content_id: string,
    language: string
  ): Promise<string> {
    const subtitles = await this.getSubtitles(content_id, language);
    
    if (subtitles.length === 0) {
      throw new Error('No subtitles found for this language');
    }

    // In production, fetch and parse the subtitle file
    // For now, return a placeholder
    const transcript: Transcript = {
      content_id,
      language,
      full_text: 'Generated transcript from subtitles',
      word_count: 0,
      generated_method: 'auto'
    };

    return this.addTranscript(transcript);
  }

  /**
   * Get available subtitle languages for content
   */
  async getAvailableLanguages(content_id: string): Promise<string[]> {
    const result = await this.pool.query(
      'SELECT DISTINCT language FROM subtitles WHERE content_id = $1 ORDER BY language',
      [content_id]
    );

    return result.rows.map(r => r.language);
  }

  /**
   * Update content subtitles JSONB field
   */
  private async updateContentSubtitles(content_id: string): Promise<void> {
    const subtitles = await this.getSubtitles(content_id);
    
    const subtitlesJson = subtitles.map(s => ({
      language: s.language,
      language_name: s.language_name,
      url: s.subtitle_url,
      format: s.format
    }));

    await this.pool.query(
      'UPDATE learning_content SET subtitles = $1 WHERE content_id = $2',
      [JSON.stringify(subtitlesJson), content_id]
    );
  }

  /**
   * Extract matches from transcript
   */
  private extractMatches(
    fullText: string,
    searchQuery: string,
    timestamps?: any[]
  ): TranscriptMatch[] {
    const matches: TranscriptMatch[] = [];
    const regex = new RegExp(searchQuery, 'gi');
    let match;

    while ((match = regex.exec(fullText)) !== null) {
      const start = Math.max(0, match.index - 50);
      const end = Math.min(fullText.length, match.index + searchQuery.length + 50);
      const context = fullText.substring(start, end);

      // Find timestamp if available
      let timestamp = 0;
      if (timestamps) {
        const charPosition = match.index;
        // Simple approximation - in production, use actual timestamp mapping
        timestamp = Math.floor((charPosition / fullText.length) * 600); // Assume 10 min video
      }

      matches.push({
        timestamp_seconds: timestamp,
        context,
        highlight: searchQuery
      });

      if (matches.length >= 5) break; // Limit matches per content
    }

    return matches;
  }
}
