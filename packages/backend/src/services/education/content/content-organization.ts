/**
 * Content Organization Service
 * Handles hierarchical organization of content by subject, topic, grade, and difficulty
 * 
 * Features:
 * - Subject management
 * - Topic hierarchy (subject → topic → subtopic)
 * - Grade level classification (1-12, college)
 * - Difficulty levels (beginner, intermediate, advanced)
 * - Curriculum alignment (NCERT, CBSE, ICSE, state boards)
 * - Prerequisite tracking
 */

import { Pool } from 'pg';

export interface Subject {
  subject_id?: string;
  subject_name: string;
  subject_code?: string;
  category: 'mathematics' | 'science' | 'language' | 'social_studies' | 'arts' | 'vocational';
  applicable_grades: number[];
  description?: string;
}

export interface Topic {
  topic_id?: string;
  subject_id: string;
  parent_topic_id?: string;
  topic_name: string;
  topic_code?: string;
  difficulty_level: 'easy' | 'medium' | 'hard' | 'advanced';
  level: number; // 0 for root, 1 for subtopic, etc.
  order_index: number;
  prerequisite_topics?: string[];
  estimated_hours?: number;
  description?: string;
  learning_objectives?: string[];
}

export interface CurriculumAlignment {
  content_id: string;
  curriculum_type: 'NCERT' | 'CBSE' | 'ICSE' | 'State';
  board_name?: string;
  grade_level: number;
  chapter_number?: string;
  section_number?: string;
  alignment_notes?: string;
}

export interface ContentHierarchy {
  subject: Subject;
  topics: TopicWithSubtopics[];
}

export interface TopicWithSubtopics extends Topic {
  subtopics?: TopicWithSubtopics[];
  content_count?: number;
}

export class ContentOrganizationService {
  constructor(private pool: Pool) {}

  /**
   * Create a new subject
   */
  async createSubject(subject: Subject): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO subjects (subject_name, subject_code, category, applicable_grades, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING subject_id`,
      [
        subject.subject_name,
        subject.subject_code,
        subject.category,
        subject.applicable_grades,
        subject.description
      ]
    );

    return result.rows[0].subject_id;
  }

  /**
   * Get all subjects
   */
  async getAllSubjects(filters?: { category?: string; grade?: number }): Promise<Subject[]> {
    let query = 'SELECT * FROM subjects WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.category) {
      query += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters?.grade) {
      query += ` AND $${paramIndex} = ANY(applicable_grades)`;
      params.push(filters.grade);
      paramIndex++;
    }

    query += ' ORDER BY subject_name';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Create a new topic
   */
  async createTopic(topic: Topic): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO topics (
        subject_id, parent_topic_id, topic_name, topic_code, difficulty_level,
        level, order_index, prerequisite_topics, estimated_hours, description, learning_objectives
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING topic_id`,
      [
        topic.subject_id,
        topic.parent_topic_id,
        topic.topic_name,
        topic.topic_code,
        topic.difficulty_level,
        topic.level,
        topic.order_index,
        topic.prerequisite_topics || [],
        topic.estimated_hours,
        topic.description,
        topic.learning_objectives || []
      ]
    );

    return result.rows[0].topic_id;
  }

  /**
   * Get topic by ID
   */
  async getTopicById(topic_id: string): Promise<Topic | null> {
    const result = await this.pool.query(
      'SELECT * FROM topics WHERE topic_id = $1',
      [topic_id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get topics by subject
   */
  async getTopicsBySubject(
    subject_id: string,
    filters?: {
      difficulty_level?: string;
      parent_topic_id?: string | null;
    }
  ): Promise<Topic[]> {
    let query = 'SELECT * FROM topics WHERE subject_id = $1';
    const params: any[] = [subject_id];
    let paramIndex = 2;

    if (filters?.difficulty_level) {
      query += ` AND difficulty_level = $${paramIndex}`;
      params.push(filters.difficulty_level);
      paramIndex++;
    }

    if (filters?.parent_topic_id !== undefined) {
      if (filters.parent_topic_id === null) {
        query += ' AND parent_topic_id IS NULL';
      } else {
        query += ` AND parent_topic_id = $${paramIndex}`;
        params.push(filters.parent_topic_id);
        paramIndex++;
      }
    }

    query += ' ORDER BY order_index, topic_name';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Get complete topic hierarchy for a subject
   */
  async getTopicHierarchy(subject_id: string): Promise<TopicWithSubtopics[]> {
    // Get all topics for the subject
    const allTopics = await this.getTopicsBySubject(subject_id);

    // Build hierarchy
    const topicMap = new Map<string, TopicWithSubtopics>();
    const rootTopics: TopicWithSubtopics[] = [];

    // First pass: create map
    allTopics.forEach(topic => {
      topicMap.set(topic.topic_id!, { ...topic, subtopics: [] });
    });

    // Second pass: build hierarchy
    allTopics.forEach(topic => {
      const topicWithSubs = topicMap.get(topic.topic_id!)!;
      
      if (topic.parent_topic_id) {
        const parent = topicMap.get(topic.parent_topic_id);
        if (parent) {
          parent.subtopics!.push(topicWithSubs);
        }
      } else {
        rootTopics.push(topicWithSubs);
      }
    });

    // Get content counts
    for (const topic of topicMap.values()) {
      topic.content_count = await this.getContentCount(topic.topic_id!);
    }

    return rootTopics;
  }

  /**
   * Get content hierarchy (subject → topics → content)
   */
  async getContentHierarchy(subject_id: string): Promise<ContentHierarchy> {
    const subjectResult = await this.pool.query(
      'SELECT * FROM subjects WHERE subject_id = $1',
      [subject_id]
    );

    if (subjectResult.rows.length === 0) {
      throw new Error('Subject not found');
    }

    const subject = subjectResult.rows[0];
    const topics = await this.getTopicHierarchy(subject_id);

    return { subject, topics };
  }

  /**
   * Get content organized by grade level
   */
  async getContentByGrade(grade_level: number): Promise<ContentHierarchy[]> {
    const subjects = await this.getAllSubjects({ grade: grade_level });
    
    const hierarchies: ContentHierarchy[] = [];
    for (const subject of subjects) {
      const topics = await this.getTopicHierarchy(subject.subject_id!);
      hierarchies.push({ subject, topics });
    }

    return hierarchies;
  }

  /**
   * Get content organized by difficulty
   */
  async getContentByDifficulty(
    subject_id: string,
    difficulty_level: string
  ): Promise<Topic[]> {
    return this.getTopicsBySubject(subject_id, { difficulty_level });
  }

  /**
   * Add curriculum alignment
   */
  async addCurriculumAlignment(alignment: CurriculumAlignment): Promise<void> {
    await this.pool.query(
      `INSERT INTO curriculum_alignments (
        content_id, curriculum_type, board_name, grade_level,
        chapter_number, section_number, alignment_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (content_id, curriculum_type, grade_level) 
      DO UPDATE SET
        board_name = EXCLUDED.board_name,
        chapter_number = EXCLUDED.chapter_number,
        section_number = EXCLUDED.section_number,
        alignment_notes = EXCLUDED.alignment_notes`,
      [
        alignment.content_id,
        alignment.curriculum_type,
        alignment.board_name,
        alignment.grade_level,
        alignment.chapter_number,
        alignment.section_number,
        alignment.alignment_notes
      ]
    );
  }

  /**
   * Get curriculum alignments for content
   */
  async getCurriculumAlignments(content_id: string): Promise<CurriculumAlignment[]> {
    const result = await this.pool.query(
      'SELECT * FROM curriculum_alignments WHERE content_id = $1',
      [content_id]
    );

    return result.rows;
  }

  /**
   * Get prerequisite topics
   */
  async getPrerequisites(topic_id: string): Promise<Topic[]> {
    const topic = await this.getTopicById(topic_id);
    
    if (!topic || !topic.prerequisite_topics || topic.prerequisite_topics.length === 0) {
      return [];
    }

    const result = await this.pool.query(
      'SELECT * FROM topics WHERE topic_id = ANY($1)',
      [topic.prerequisite_topics]
    );

    return result.rows;
  }

  /**
   * Get next recommended topics
   */
  async getNextTopics(topic_id: string): Promise<Topic[]> {
    // Find topics that have this topic as a prerequisite
    const result = await this.pool.query(
      'SELECT * FROM topics WHERE $1 = ANY(prerequisite_topics) ORDER BY order_index',
      [topic_id]
    );

    return result.rows;
  }

  /**
   * Update topic order
   */
  async updateTopicOrder(topic_id: string, new_order: number): Promise<void> {
    await this.pool.query(
      'UPDATE topics SET order_index = $1, updated_at = CURRENT_TIMESTAMP WHERE topic_id = $2',
      [new_order, topic_id]
    );
  }

  /**
   * Search topics
   */
  async searchTopics(
    search_query: string,
    filters?: {
      subject_id?: string;
      difficulty_level?: string;
      grade_level?: number;
    }
  ): Promise<Topic[]> {
    let query = `
      SELECT t.* FROM topics t
      LEFT JOIN subjects s ON t.subject_id = s.subject_id
      WHERE (
        t.topic_name ILIKE $1 OR
        t.description ILIKE $1 OR
        EXISTS (
          SELECT 1 FROM unnest(t.learning_objectives) obj
          WHERE obj ILIKE $1
        )
      )
    `;
    const params: any[] = [`%${search_query}%`];
    let paramIndex = 2;

    if (filters?.subject_id) {
      query += ` AND t.subject_id = $${paramIndex}`;
      params.push(filters.subject_id);
      paramIndex++;
    }

    if (filters?.difficulty_level) {
      query += ` AND t.difficulty_level = $${paramIndex}`;
      params.push(filters.difficulty_level);
      paramIndex++;
    }

    if (filters?.grade_level) {
      query += ` AND $${paramIndex} = ANY(s.applicable_grades)`;
      params.push(filters.grade_level);
      paramIndex++;
    }

    query += ' ORDER BY t.topic_name LIMIT 50';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Get content count for a topic
   */
  private async getContentCount(topic_id: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as count FROM learning_content WHERE topic_id = $1 AND status = $2',
      [topic_id, 'published']
    );

    return parseInt(result.rows[0].count);
  }
}
