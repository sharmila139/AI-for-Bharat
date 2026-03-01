/**
 * Content Recommendation Engine
 * Provides personalized content recommendations
 * 
 * Features:
 * - Collaborative filtering
 * - Content-based filtering
 * - Knowledge gap-based recommendations
 * - Difficulty progression
 * - Similar content suggestions
 * - Personalized learning paths
 */

import { Pool } from 'pg';

export interface RecommendationRequest {
  student_id: string;
  topic_id?: string;
  subject_id?: string;
  max_recommendations?: number;
  recommendation_type?: 'next_lesson' | 'review' | 'challenge' | 'similar' | 'personalized';
}

export interface ContentRecommendation {
  content_id: string;
  title: string;
  content_type: string;
  topic_name: string;
  difficulty_level: string;
  duration_minutes: number;
  recommendation_score: number;
  recommendation_reason: string;
  estimated_proficiency_gain: number;
}

export interface SimilarContent {
  content_id: string;
  title: string;
  similarity_score: number;
  common_topics: string[];
  common_keywords: string[];
}

export interface LearningPathRecommendation {
  path_id?: string;
  student_id: string;
  subject_id: string;
  recommended_sequence: string[]; // Array of content IDs
  estimated_duration_hours: number;
  difficulty_progression: string[];
  learning_objectives: string[];
}

export class RecommendationEngine {
  constructor(private pool: Pool) {}

  /**
   * Get personalized content recommendations
   */
  async getRecommendations(request: RecommendationRequest): Promise<ContentRecommendation[]> {
    const type = request.recommendation_type || 'personalized';

    switch (type) {
      case 'next_lesson':
        return this.getNextLessonRecommendations(request);
      case 'review':
        return this.getReviewRecommendations(request);
      case 'challenge':
        return this.getChallengeRecommendations(request);
      case 'similar':
        return this.getSimilarContentRecommendations(request);
      default:
        return this.getPersonalizedRecommendations(request);
    }
  }

  /**
   * Get next lesson recommendations based on knowledge state
   */
  private async getNextLessonRecommendations(
    request: RecommendationRequest
  ): Promise<ContentRecommendation[]> {
    const limit = request.max_recommendations || 5;

    // Get student's knowledge state
    const knowledgeState = await this.pool.query(
      `SELECT topic_id, proficiency_score, mastery_level
       FROM knowledge_state
       WHERE student_id = $1
       ORDER BY proficiency_score ASC`,
      [request.student_id]
    );

    // Find topics that need work or are next in sequence
    const query = `
      SELECT DISTINCT
        lc.content_id,
        lc.title,
        lc.content_type,
        t.topic_name,
        lc.difficulty_level,
        lc.duration_minutes,
        CASE
          WHEN ks.proficiency_score IS NULL THEN 80
          WHEN ks.proficiency_score < 50 THEN 90
          WHEN ks.proficiency_score < 70 THEN 70
          ELSE 50
        END as recommendation_score
      FROM learning_content lc
      JOIN topics t ON lc.topic_id = t.topic_id
      LEFT JOIN knowledge_state ks ON t.topic_id = ks.topic_id AND ks.student_id = $1
      LEFT JOIN learning_sessions ls ON lc.content_id = ls.content_id AND ls.student_id = $1
      WHERE lc.status = 'published'
        AND (ls.completed IS NULL OR ls.completed = FALSE)
        ${request.topic_id ? 'AND lc.topic_id = $2' : ''}
        ${request.subject_id ? 'AND t.subject_id = $3' : ''}
      ORDER BY recommendation_score DESC, lc.created_at DESC
      LIMIT $${request.topic_id || request.subject_id ? '4' : '2'}
    `;

    const params: any[] = [request.student_id];
    if (request.topic_id) params.push(request.topic_id);
    if (request.subject_id) params.push(request.subject_id);

    const result = await this.pool.query(query, params);

    return result.rows.map(row => ({
      content_id: row.content_id,
      title: row.title,
      content_type: row.content_type,
      topic_name: row.topic_name,
      difficulty_level: row.difficulty_level,
      duration_minutes: row.duration_minutes,
      recommendation_score: parseFloat(row.recommendation_score),
      recommendation_reason: this.getRecommendationReason(row, 'next_lesson'),
      estimated_proficiency_gain: this.estimateProficiencyGain(row)
    }));
  }

  /**
   * Get review recommendations for weak areas
   */
  private async getReviewRecommendations(
    request: RecommendationRequest
  ): Promise<ContentRecommendation[]> {
    const limit = request.max_recommendations || 5;

    const query = `
      SELECT 
        lc.content_id,
        lc.title,
        lc.content_type,
        t.topic_name,
        lc.difficulty_level,
        lc.duration_minutes,
        (100 - ks.proficiency_score) as recommendation_score,
        ks.proficiency_score
      FROM knowledge_state ks
      JOIN topics t ON ks.topic_id = t.topic_id
      JOIN learning_content lc ON t.topic_id = lc.topic_id
      WHERE ks.student_id = $1
        AND ks.proficiency_score < 70
        AND ks.mastery_level IN ('learning', 'practicing')
        AND lc.status = 'published'
        ${request.topic_id ? 'AND lc.topic_id = $2' : ''}
        ${request.subject_id ? 'AND t.subject_id = $3' : ''}
      ORDER BY recommendation_score DESC
      LIMIT $${request.topic_id || request.subject_id ? '4' : '2'}
    `;

    const params: any[] = [request.student_id];
    if (request.topic_id) params.push(request.topic_id);
    if (request.subject_id) params.push(request.subject_id);

    const result = await this.pool.query(query, params);

    return result.rows.map(row => ({
      content_id: row.content_id,
      title: row.title,
      content_type: row.content_type,
      topic_name: row.topic_name,
      difficulty_level: row.difficulty_level,
      duration_minutes: row.duration_minutes,
      recommendation_score: parseFloat(row.recommendation_score),
      recommendation_reason: `Review needed - Current proficiency: ${Math.round(row.proficiency_score)}%`,
      estimated_proficiency_gain: 15
    }));
  }

  /**
   * Get challenge recommendations for advanced learners
   */
  private async getChallengeRecommendations(
    request: RecommendationRequest
  ): Promise<ContentRecommendation[]> {
    const limit = request.max_recommendations || 5;

    const query = `
      SELECT 
        lc.content_id,
        lc.title,
        lc.content_type,
        t.topic_name,
        lc.difficulty_level,
        lc.duration_minutes,
        ks.proficiency_score as recommendation_score
      FROM knowledge_state ks
      JOIN topics t ON ks.topic_id = t.topic_id
      JOIN learning_content lc ON t.topic_id = lc.topic_id
      WHERE ks.student_id = $1
        AND ks.proficiency_score >= 80
        AND lc.difficulty_level IN ('hard', 'advanced')
        AND lc.status = 'published'
        ${request.topic_id ? 'AND lc.topic_id = $2' : ''}
        ${request.subject_id ? 'AND t.subject_id = $3' : ''}
      ORDER BY ks.proficiency_score DESC, lc.difficulty_level DESC
      LIMIT $${request.topic_id || request.subject_id ? '4' : '2'}
    `;

    const params: any[] = [request.student_id];
    if (request.topic_id) params.push(request.topic_id);
    if (request.subject_id) params.push(request.subject_id);

    const result = await this.pool.query(query, params);

    return result.rows.map(row => ({
      content_id: row.content_id,
      title: row.title,
      content_type: row.content_type,
      topic_name: row.topic_name,
      difficulty_level: row.difficulty_level,
      duration_minutes: row.duration_minutes,
      recommendation_score: parseFloat(row.recommendation_score),
      recommendation_reason: 'Challenge yourself with advanced content',
      estimated_proficiency_gain: 10
    }));
  }

  /**
   * Get similar content recommendations (collaborative filtering)
   */
  private async getSimilarContentRecommendations(
    request: RecommendationRequest
  ): Promise<ContentRecommendation[]> {
    // Get recently viewed content
    const recentContent = await this.pool.query(
      `SELECT DISTINCT content_id
       FROM learning_sessions
       WHERE student_id = $1
       ORDER BY started_at DESC
       LIMIT 3`,
      [request.student_id]
    );

    if (recentContent.rows.length === 0) {
      return this.getNextLessonRecommendations(request);
    }

    const contentIds = recentContent.rows.map(r => r.content_id);

    // Find content viewed by similar students
    const query = `
      SELECT 
        lc.content_id,
        lc.title,
        lc.content_type,
        t.topic_name,
        lc.difficulty_level,
        lc.duration_minutes,
        COUNT(DISTINCT ls.student_id) as similarity_score
      FROM learning_sessions ls
      JOIN learning_content lc ON ls.content_id = lc.content_id
      JOIN topics t ON lc.topic_id = t.topic_id
      WHERE ls.student_id IN (
        SELECT DISTINCT student_id
        FROM learning_sessions
        WHERE content_id = ANY($1)
          AND student_id != $2
      )
      AND lc.content_id != ALL($1)
      AND lc.status = 'published'
      AND NOT EXISTS (
        SELECT 1 FROM learning_sessions ls2
        WHERE ls2.student_id = $2 AND ls2.content_id = lc.content_id AND ls2.completed = TRUE
      )
      GROUP BY lc.content_id, lc.title, lc.content_type, t.topic_name, lc.difficulty_level, lc.duration_minutes
      ORDER BY similarity_score DESC
      LIMIT $3
    `;

    const result = await this.pool.query(query, [
      contentIds,
      request.student_id,
      request.max_recommendations || 5
    ]);

    return result.rows.map(row => ({
      content_id: row.content_id,
      title: row.title,
      content_type: row.content_type,
      topic_name: row.topic_name,
      difficulty_level: row.difficulty_level,
      duration_minutes: row.duration_minutes,
      recommendation_score: parseFloat(row.similarity_score),
      recommendation_reason: 'Students like you also learned this',
      estimated_proficiency_gain: 12
    }));
  }

  /**
   * Get personalized recommendations (hybrid approach)
   */
  private async getPersonalizedRecommendations(
    request: RecommendationRequest
  ): Promise<ContentRecommendation[]> {
    const limit = request.max_recommendations || 10;

    // Combine multiple recommendation strategies
    const nextLesson = await this.getNextLessonRecommendations({
      ...request,
      max_recommendations: 3
    });

    const review = await this.getReviewRecommendations({
      ...request,
      max_recommendations: 2
    });

    const similar = await this.getSimilarContentRecommendations({
      ...request,
      max_recommendations: 3
    });

    const challenge = await this.getChallengeRecommendations({
      ...request,
      max_recommendations: 2
    });

    // Combine and deduplicate
    const allRecommendations = [...nextLesson, ...review, ...similar, ...challenge];
    const uniqueRecommendations = new Map<string, ContentRecommendation>();

    allRecommendations.forEach(rec => {
      if (!uniqueRecommendations.has(rec.content_id)) {
        uniqueRecommendations.set(rec.content_id, rec);
      }
    });

    // Sort by recommendation score and return top N
    return Array.from(uniqueRecommendations.values())
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, limit);
  }

  /**
   * Find similar content based on content features
   */
  async findSimilarContent(
    content_id: string,
    limit: number = 5
  ): Promise<SimilarContent[]> {
    const query = `
      SELECT 
        lc2.content_id,
        lc2.title,
        (
          -- Topic similarity
          CASE WHEN lc1.topic_id = lc2.topic_id THEN 40 ELSE 0 END +
          -- Difficulty similarity
          CASE WHEN lc1.difficulty_level = lc2.difficulty_level THEN 20 ELSE 0 END +
          -- Content type similarity
          CASE WHEN lc1.content_type = lc2.content_type THEN 15 ELSE 0 END +
          -- Tag overlap
          (SELECT COUNT(*) * 5 FROM unnest(lc1.tags) tag WHERE tag = ANY(lc2.tags)) +
          -- Keyword overlap
          (SELECT COUNT(*) * 3 FROM unnest(lc1.keywords) kw WHERE kw = ANY(lc2.keywords))
        ) as similarity_score,
        ARRAY(SELECT unnest(lc1.tags) INTERSECT SELECT unnest(lc2.tags)) as common_tags,
        ARRAY(SELECT unnest(lc1.keywords) INTERSECT SELECT unnest(lc2.keywords)) as common_keywords
      FROM learning_content lc1
      CROSS JOIN learning_content lc2
      WHERE lc1.content_id = $1
        AND lc2.content_id != $1
        AND lc2.status = 'published'
      ORDER BY similarity_score DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [content_id, limit]);

    return result.rows.map(row => ({
      content_id: row.content_id,
      title: row.title,
      similarity_score: parseFloat(row.similarity_score),
      common_topics: row.common_tags || [],
      common_keywords: row.common_keywords || []
    }));
  }

  /**
   * Generate personalized learning path
   */
  async generateLearningPath(
    student_id: string,
    subject_id: string,
    target_proficiency: number = 80
  ): Promise<LearningPathRecommendation> {
    // Get student's current knowledge state for the subject
    const knowledgeState = await this.pool.query(
      `SELECT ks.topic_id, ks.proficiency_score, t.prerequisite_topics, t.estimated_hours
       FROM knowledge_state ks
       JOIN topics t ON ks.topic_id = t.topic_id
       WHERE ks.student_id = $1 AND t.subject_id = $2
       ORDER BY ks.proficiency_score ASC`,
      [student_id, subject_id]
    );

    // Get all topics for the subject
    const allTopics = await this.pool.query(
      `SELECT topic_id, prerequisite_topics, estimated_hours, learning_objectives
       FROM topics
       WHERE subject_id = $1
       ORDER BY level, order_index`,
      [subject_id]
    );

    // Build learning sequence considering prerequisites and current proficiency
    const sequence: string[] = [];
    const objectives: string[] = [];
    let totalHours = 0;

    // Add topics that need improvement
    for (const topic of knowledgeState.rows) {
      if (topic.proficiency_score < target_proficiency) {
        // Get content for this topic
        const content = await this.pool.query(
          `SELECT content_id FROM learning_content 
           WHERE topic_id = $1 AND status = 'published'
           ORDER BY difficulty_level, created_at
           LIMIT 2`,
          [topic.topic_id]
        );

        content.rows.forEach(c => sequence.push(c.content_id));
        totalHours += parseFloat(topic.estimated_hours) || 1;
      }
    }

    // Add new topics in prerequisite order
    const coveredTopics = new Set(knowledgeState.rows.map(r => r.topic_id));
    for (const topic of allTopics.rows) {
      if (!coveredTopics.has(topic.topic_id)) {
        // Check if prerequisites are met
        const prereqsMet = !topic.prerequisite_topics || 
          topic.prerequisite_topics.every((p: string) => coveredTopics.has(p));

        if (prereqsMet) {
          const content = await this.pool.query(
            `SELECT content_id FROM learning_content 
             WHERE topic_id = $1 AND status = 'published'
             ORDER BY difficulty_level, created_at
             LIMIT 2`,
            [topic.topic_id]
          );

          content.rows.forEach(c => sequence.push(c.content_id));
          if (topic.learning_objectives) {
            objectives.push(...topic.learning_objectives);
          }
          totalHours += parseFloat(topic.estimated_hours) || 1;
          coveredTopics.add(topic.topic_id);
        }
      }
    }

    // Get difficulty progression
    const difficultyProgression = await this.getDifficultyProgression(sequence);

    return {
      student_id,
      subject_id,
      recommended_sequence: sequence,
      estimated_duration_hours: totalHours,
      difficulty_progression: difficultyProgression,
      learning_objectives: objectives
    };
  }

  /**
   * Get difficulty progression for a sequence
   */
  private async getDifficultyProgression(contentIds: string[]): Promise<string[]> {
    if (contentIds.length === 0) return [];

    const result = await this.pool.query(
      `SELECT difficulty_level FROM learning_content 
       WHERE content_id = ANY($1)
       ORDER BY array_position($1, content_id)`,
      [contentIds]
    );

    return result.rows.map(r => r.difficulty_level);
  }

  /**
   * Get recommendation reason text
   */
  private getRecommendationReason(content: any, type: string): string {
    switch (type) {
      case 'next_lesson':
        return 'Continue your learning journey';
      case 'review':
        return 'Strengthen your understanding';
      case 'challenge':
        return 'Ready for a challenge';
      case 'similar':
        return 'Based on your interests';
      default:
        return 'Recommended for you';
    }
  }

  /**
   * Estimate proficiency gain from content
   */
  private estimateProficiencyGain(content: any): number {
    const difficultyMap: { [key: string]: number } = {
      'easy': 8,
      'medium': 12,
      'hard': 15,
      'advanced': 18
    };

    return difficultyMap[content.difficulty_level] || 10;
  }
}
