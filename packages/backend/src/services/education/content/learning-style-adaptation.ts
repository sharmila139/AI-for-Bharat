/**
 * Learning Style Adaptation Service
 * Adapts content delivery based on student learning preferences
 * 
 * Features:
 * - Learning style detection (visual, auditory, kinesthetic)
 * - Content type preferences
 * - Adaptive content delivery
 * - Style-specific recommendations
 * - Performance tracking by style
 */

import { Pool } from 'pg';

export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'mixed';

export interface LearningStyleProfile {
  student_id: string;
  primary_style: LearningStyle;
  style_scores: {
    visual: number;
    auditory: number;
    kinesthetic: number;
  };
  content_preferences: ContentPreferences;
  last_updated: Date;
}

export interface ContentPreferences {
  preferred_content_types: string[]; // ['video', 'text', 'interactive', etc.]
  video_preference: 'with_visuals' | 'lecture_style' | 'animated';
  text_preference: 'detailed' | 'summary' | 'bullet_points';
  interactive_preference: 'simulations' | 'games' | 'quizzes';
  audio_enabled: boolean;
}

export interface StyleDetectionData {
  student_id: string;
  content_interactions: ContentInteraction[];
  assessment_performance: AssessmentPerformance[];
  session_patterns: SessionPattern[];
}

export interface ContentInteraction {
  content_id: string;
  content_type: string;
  engagement_score: number;
  completion_rate: number;
  time_spent_minutes: number;
}

export interface AssessmentPerformance {
  content_type: string;
  average_score: number;
  attempts_count: number;
}

export interface SessionPattern {
  preferred_time: string;
  average_session_duration: number;
  interaction_frequency: number;
}

export interface AdaptiveContentRecommendation {
  content_id: string;
  title: string;
  content_type: string;
  adaptation_reason: string;
  style_match_score: number;
  alternative_formats?: AlternativeFormat[];
}

export interface AlternativeFormat {
  format_type: string;
  content_id?: string;
  description: string;
  availability: boolean;
}

export interface PerformanceByStyle {
  learning_style: LearningStyle;
  content_type: string;
  average_score: number;
  completion_rate: number;
  engagement_score: number;
  sample_size: number;
}

export class LearningStyleAdaptationService {
  constructor(private pool: Pool) {}

  /**
   * Detect learning style from student behavior
   */
  async detectLearningStyle(student_id: string): Promise<LearningStyleProfile> {
    // Get content interaction data
    const interactions = await this.pool.query(
      `SELECT 
        lc.content_type,
        AVG(ls.progress_percentage) as avg_completion,
        AVG(ls.duration_minutes) as avg_time,
        COUNT(*) as interaction_count
       FROM learning_sessions ls
       JOIN learning_content lc ON ls.content_id = lc.content_id
       WHERE ls.student_id = $1
       GROUP BY lc.content_type`,
      [student_id]
    );

    // Get assessment performance by content type
    const assessments = await this.pool.query(
      `SELECT 
        lc.content_type,
        AVG(aa.percentage) as avg_score,
        COUNT(*) as attempt_count
       FROM assessment_attempts aa
       JOIN assessments a ON aa.assessment_id = a.assessment_id
       JOIN learning_content lc ON a.topic_id = lc.topic_id
       WHERE aa.student_id = $1
       GROUP BY lc.content_type`,
      [student_id]
    );

    // Calculate style scores
    const styleScores = this.calculateStyleScores(
      interactions.rows,
      assessments.rows
    );

    // Determine primary style
    const primaryStyle = this.determinePrimaryStyle(styleScores);

    // Get or create content preferences
    const preferences = await this.getOrCreatePreferences(student_id, primaryStyle);

    const profile: LearningStyleProfile = {
      student_id,
      primary_style: primaryStyle,
      style_scores: styleScores,
      content_preferences: preferences,
      last_updated: new Date()
    };

    // Save profile
    await this.saveLearningStyleProfile(profile);

    return profile;
  }

  /**
   * Get learning style profile
   */
  async getLearningStyleProfile(student_id: string): Promise<LearningStyleProfile | null> {
    const result = await this.pool.query(
      `SELECT * FROM learning_style_profiles WHERE student_id = $1`,
      [student_id]
    );

    if (result.rows.length === 0) {
      // Auto-detect if not exists
      return this.detectLearningStyle(student_id);
    }

    return {
      student_id: result.rows[0].student_id,
      primary_style: result.rows[0].primary_style,
      style_scores: result.rows[0].style_scores,
      content_preferences: result.rows[0].content_preferences,
      last_updated: result.rows[0].last_updated
    };
  }

  /**
   * Update learning style profile
   */
  async updateLearningStyleProfile(
    student_id: string,
    updates: Partial<LearningStyleProfile>
  ): Promise<void> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.primary_style) {
      updateFields.push(`primary_style = $${paramIndex}`);
      values.push(updates.primary_style);
      paramIndex++;
    }

    if (updates.style_scores) {
      updateFields.push(`style_scores = $${paramIndex}`);
      values.push(JSON.stringify(updates.style_scores));
      paramIndex++;
    }

    if (updates.content_preferences) {
      updateFields.push(`content_preferences = $${paramIndex}`);
      values.push(JSON.stringify(updates.content_preferences));
      paramIndex++;
    }

    if (updateFields.length > 0) {
      updateFields.push(`last_updated = CURRENT_TIMESTAMP`);
      values.push(student_id);
      
      await this.pool.query(
        `UPDATE learning_style_profiles 
         SET ${updateFields.join(', ')}
         WHERE student_id = $${paramIndex}`,
        values
      );
    }
  }

  /**
   * Get adaptive content recommendations
   */
  async getAdaptiveRecommendations(
    student_id: string,
    topic_id?: string,
    limit: number = 10
  ): Promise<AdaptiveContentRecommendation[]> {
    const profile = await this.getLearningStyleProfile(student_id);
    
    if (!profile) {
      throw new Error('Learning style profile not found');
    }

    // Build query based on learning style
    const preferredTypes = this.getPreferredContentTypes(profile.primary_style);
    
    let query = `
      SELECT 
        lc.content_id,
        lc.title,
        lc.content_type,
        lc.difficulty_level,
        CASE 
          WHEN lc.content_type = ANY($1) THEN 100
          ELSE 50
        END as style_match_score
      FROM learning_content lc
      WHERE lc.status = 'published'
        AND NOT EXISTS (
          SELECT 1 FROM learning_sessions ls
          WHERE ls.student_id = $2 AND ls.content_id = lc.content_id AND ls.completed = TRUE
        )
    `;

    const params: any[] = [preferredTypes, student_id];
    let paramIndex = 3;

    if (topic_id) {
      query += ` AND lc.topic_id = $${paramIndex}`;
      params.push(topic_id);
      paramIndex++;
    }

    query += ` ORDER BY style_match_score DESC, lc.view_count DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await this.pool.query(query, params);

    return result.rows.map(row => ({
      content_id: row.content_id,
      title: row.title,
      content_type: row.content_type,
      adaptation_reason: this.getAdaptationReason(row.content_type, profile.primary_style),
      style_match_score: parseFloat(row.style_match_score),
      alternative_formats: this.getAlternativeFormats(row.content_type)
    }));
  }

  /**
   * Track performance by learning style
   */
  async trackPerformanceByStyle(student_id: string): Promise<PerformanceByStyle[]> {
    const profile = await this.getLearningStyleProfile(student_id);
    
    if (!profile) {
      return [];
    }

    const result = await this.pool.query(
      `SELECT 
        lc.content_type,
        AVG(aa.percentage) as avg_score,
        AVG(ls.progress_percentage) as avg_completion,
        COUNT(DISTINCT ls.session_id) as session_count
       FROM learning_sessions ls
       LEFT JOIN assessment_attempts aa ON ls.student_id = aa.student_id
       JOIN learning_content lc ON ls.content_id = lc.content_id
       WHERE ls.student_id = $1
       GROUP BY lc.content_type`,
      [student_id]
    );

    return result.rows.map(row => ({
      learning_style: profile.primary_style,
      content_type: row.content_type,
      average_score: parseFloat(row.avg_score) || 0,
      completion_rate: parseFloat(row.avg_completion) || 0,
      engagement_score: this.calculateEngagementScore(row),
      sample_size: parseInt(row.session_count)
    }));
  }

  /**
   * Get content alternatives for different learning styles
   */
  async getContentAlternatives(
    content_id: string,
    target_style: LearningStyle
  ): Promise<AlternativeFormat[]> {
    const content = await this.pool.query(
      'SELECT topic_id, content_type FROM learning_content WHERE content_id = $1',
      [content_id]
    );

    if (content.rows.length === 0) {
      return [];
    }

    const topicId = content.rows[0].topic_id;
    const currentType = content.rows[0].content_type;

    // Find alternative content types for the same topic
    const alternatives = await this.pool.query(
      `SELECT content_id, content_type, title
       FROM learning_content
       WHERE topic_id = $1 AND content_type != $2 AND status = 'published'`,
      [topicId, currentType]
    );

    const preferredTypes = this.getPreferredContentTypes(target_style);

    return alternatives.rows.map(row => ({
      format_type: row.content_type,
      content_id: row.content_id,
      description: `${row.content_type} version: ${row.title}`,
      availability: preferredTypes.includes(row.content_type)
    }));
  }

  /**
   * Calculate style scores from interaction data
   */
  private calculateStyleScores(
    interactions: any[],
    assessments: any[]
  ): { visual: number; auditory: number; kinesthetic: number } {
    const scores = {
      visual: 0,
      auditory: 0,
      kinesthetic: 0
    };

    // Visual learners prefer videos, images, diagrams
    const visualTypes = ['video', 'text', 'image'];
    // Auditory learners prefer audio, lectures, discussions
    const auditoryTypes = ['video', 'audio', 'lecture'];
    // Kinesthetic learners prefer interactive, simulations, practice
    const kinestheticTypes = ['interactive', 'simulation', 'game', 'practice'];

    interactions.forEach(interaction => {
      const weight = parseFloat(interaction.avg_completion) * parseFloat(interaction.interaction_count);
      
      if (visualTypes.includes(interaction.content_type)) {
        scores.visual += weight;
      }
      if (auditoryTypes.includes(interaction.content_type)) {
        scores.auditory += weight;
      }
      if (kinestheticTypes.includes(interaction.content_type)) {
        scores.kinesthetic += weight;
      }
    });

    // Normalize scores to 0-100
    const total = scores.visual + scores.auditory + scores.kinesthetic;
    if (total > 0) {
      scores.visual = (scores.visual / total) * 100;
      scores.auditory = (scores.auditory / total) * 100;
      scores.kinesthetic = (scores.kinesthetic / total) * 100;
    } else {
      // Default equal distribution
      scores.visual = 33.33;
      scores.auditory = 33.33;
      scores.kinesthetic = 33.33;
    }

    return scores;
  }

  /**
   * Determine primary learning style
   */
  private determinePrimaryStyle(scores: {
    visual: number;
    auditory: number;
    kinesthetic: number;
  }): LearningStyle {
    const maxScore = Math.max(scores.visual, scores.auditory, scores.kinesthetic);
    
    // If scores are close (within 10%), consider it mixed
    const scoreDiff = maxScore - Math.min(scores.visual, scores.auditory, scores.kinesthetic);
    if (scoreDiff < 10) {
      return 'mixed';
    }

    if (scores.visual === maxScore) return 'visual';
    if (scores.auditory === maxScore) return 'auditory';
    return 'kinesthetic';
  }

  /**
   * Get preferred content types for learning style
   */
  private getPreferredContentTypes(style: LearningStyle): string[] {
    switch (style) {
      case 'visual':
        return ['video', 'text', 'interactive'];
      case 'auditory':
        return ['video', 'audio'];
      case 'kinesthetic':
        return ['interactive', 'simulation', 'game', 'practice'];
      case 'mixed':
        return ['video', 'interactive', 'text', 'simulation'];
      default:
        return ['video', 'text'];
    }
  }

  /**
   * Get or create content preferences
   */
  private async getOrCreatePreferences(
    student_id: string,
    style: LearningStyle
  ): Promise<ContentPreferences> {
    const result = await this.pool.query(
      'SELECT content_preferences FROM learning_style_profiles WHERE student_id = $1',
      [student_id]
    );

    if (result.rows.length > 0 && result.rows[0].content_preferences) {
      return result.rows[0].content_preferences;
    }

    // Create default preferences based on style
    return {
      preferred_content_types: this.getPreferredContentTypes(style),
      video_preference: style === 'visual' ? 'with_visuals' : 'lecture_style',
      text_preference: style === 'visual' ? 'detailed' : 'summary',
      interactive_preference: style === 'kinesthetic' ? 'simulations' : 'quizzes',
      audio_enabled: style === 'auditory'
    };
  }

  /**
   * Save learning style profile
   */
  private async saveLearningStyleProfile(profile: LearningStyleProfile): Promise<void> {
    await this.pool.query(
      `INSERT INTO learning_style_profiles (
        student_id, primary_style, style_scores, content_preferences, last_updated
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (student_id) 
      DO UPDATE SET
        primary_style = EXCLUDED.primary_style,
        style_scores = EXCLUDED.style_scores,
        content_preferences = EXCLUDED.content_preferences,
        last_updated = CURRENT_TIMESTAMP`,
      [
        profile.student_id,
        profile.primary_style,
        JSON.stringify(profile.style_scores),
        JSON.stringify(profile.content_preferences)
      ]
    );
  }

  /**
   * Get adaptation reason text
   */
  private getAdaptationReason(contentType: string, style: LearningStyle): string {
    const reasons: { [key: string]: { [key in LearningStyle]: string } } = {
      'video': {
        'visual': 'Visual content matches your learning style',
        'auditory': 'Audio narration supports your learning',
        'kinesthetic': 'Includes demonstrations you can follow',
        'mixed': 'Combines multiple learning approaches'
      },
      'interactive': {
        'visual': 'Interactive visuals enhance understanding',
        'auditory': 'Includes audio feedback',
        'kinesthetic': 'Hands-on practice matches your style',
        'mixed': 'Engages multiple senses'
      },
      'text': {
        'visual': 'Visual diagrams and formatting',
        'auditory': 'Can be read aloud',
        'kinesthetic': 'Includes practice exercises',
        'mixed': 'Flexible learning format'
      }
    };

    return reasons[contentType]?.[style] || 'Recommended for your learning style';
  }

  /**
   * Get alternative formats
   */
  private getAlternativeFormats(currentType: string): AlternativeFormat[] {
    const alternatives: { [key: string]: AlternativeFormat[] } = {
      'video': [
        { format_type: 'text', description: 'Read as text with images', availability: true },
        { format_type: 'interactive', description: 'Interactive simulation', availability: false }
      ],
      'text': [
        { format_type: 'video', description: 'Watch video explanation', availability: true },
        { format_type: 'audio', description: 'Listen to audio version', availability: false }
      ],
      'interactive': [
        { format_type: 'video', description: 'Watch demonstration', availability: true },
        { format_type: 'text', description: 'Read step-by-step guide', availability: true }
      ]
    };

    return alternatives[currentType] || [];
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(data: any): number {
    const completion = parseFloat(data.avg_completion) || 0;
    const sessionCount = parseInt(data.session_count) || 0;
    
    return Math.min(100, (completion * 0.7) + (Math.min(sessionCount, 10) * 3));
  }
}
