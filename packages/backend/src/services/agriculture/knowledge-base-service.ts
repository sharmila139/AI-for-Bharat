/**
 * Knowledge Base Content Management Service
 * Handles CRUD operations for sustainable farming knowledge base
 */

import { Pool } from 'pg';
import {
  KnowledgeArticle,
  CreateArticleInput,
  UpdateArticleInput,
  VerifyArticleInput,
  PublishArticleInput,
  ArticleSearchQuery,
  ArticleSearchResult,
  ArticleAnalytics,
  KnowledgeBaseStats,
  SupportedLanguage,
  ArticleRating,
  SuccessStory,
  ArticleQuestion,
  ArticleAnswer,
  CropRotationPlan,
  RotationSequenceItem,
  MultiLanguageText,
  SoilHealthImprovement,
  FinancialBreakdown,
} from './knowledge-base-types';

export class KnowledgeBaseService {
  constructor(private pool: Pool) {}

  // ============================================================================
  // Article CRUD Operations
  // ============================================================================

  /**
   * Create a new knowledge article
   */
  async createArticle(
    input: CreateArticleInput,
    authorId: string
  ): Promise<KnowledgeArticle> {
    const query = `
      INSERT INTO knowledge_articles (
        title, content, summary, category, subcategory, tags,
        evidence_level, scientific_references, implementation_guide, benefits,
        applicable_crops, applicable_regions, applicable_seasons,
        available_languages, primary_language, author_id, author_type, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'draft')
      RETURNING *
    `;

    const values = [
      JSON.stringify(input.title),
      JSON.stringify(input.content),
      input.summary ? JSON.stringify(input.summary) : null,
      input.category,
      input.subcategory || null,
      input.tags || [],
      input.evidence_level,
      JSON.stringify(input.scientific_references || []),
      input.implementation_guide ? JSON.stringify(input.implementation_guide) : null,
      input.benefits ? JSON.stringify(input.benefits) : null,
      input.applicable_crops || [],
      input.applicable_regions || [],
      input.applicable_seasons || [],
      input.available_languages,
      input.primary_language,
      authorId,
      input.author_type || 'admin',
    ];

    const result = await this.pool.query(query, values);
    return this.mapArticleFromDb(result.rows[0]);
  }

  /**
   * Get article by ID
   */
  async getArticleById(
    articleId: string,
    language?: SupportedLanguage
  ): Promise<KnowledgeArticle | null> {
    const query = `
      SELECT * FROM knowledge_articles
      WHERE article_id = $1
    `;

    const result = await this.pool.query(query, [articleId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    // Increment view count asynchronously
    this.incrementViewCount(articleId).catch(console.error);

    return this.mapArticleFromDb(result.rows[0], language);
  }

  /**
   * Update an existing article
   */
  async updateArticle(input: UpdateArticleInput): Promise<KnowledgeArticle> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    if (input.title) {
      updates.push(`title = $${paramIndex++}`);
      values.push(JSON.stringify(input.title));
    }
    if (input.content) {
      updates.push(`content = $${paramIndex++}`);
      values.push(JSON.stringify(input.content));
    }
    if (input.summary !== undefined) {
      updates.push(`summary = $${paramIndex++}`);
      values.push(input.summary ? JSON.stringify(input.summary) : null);
    }
    if (input.category) {
      updates.push(`category = $${paramIndex++}`);
      values.push(input.category);
    }
    if (input.subcategory !== undefined) {
      updates.push(`subcategory = $${paramIndex++}`);
      values.push(input.subcategory);
    }
    if (input.tags) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(input.tags);
    }
    if (input.evidence_level) {
      updates.push(`evidence_level = $${paramIndex++}`);
      values.push(input.evidence_level);
    }
    if (input.scientific_references) {
      updates.push(`scientific_references = $${paramIndex++}`);
      values.push(JSON.stringify(input.scientific_references));
    }
    if (input.implementation_guide !== undefined) {
      updates.push(`implementation_guide = $${paramIndex++}`);
      values.push(input.implementation_guide ? JSON.stringify(input.implementation_guide) : null);
    }
    if (input.benefits !== undefined) {
      updates.push(`benefits = $${paramIndex++}`);
      values.push(input.benefits ? JSON.stringify(input.benefits) : null);
    }
    if (input.applicable_crops) {
      updates.push(`applicable_crops = $${paramIndex++}`);
      values.push(input.applicable_crops);
    }
    if (input.applicable_regions) {
      updates.push(`applicable_regions = $${paramIndex++}`);
      values.push(input.applicable_regions);
    }
    if (input.applicable_seasons) {
      updates.push(`applicable_seasons = $${paramIndex++}`);
      values.push(input.applicable_seasons);
    }
    if (input.available_languages) {
      updates.push(`available_languages = $${paramIndex++}`);
      values.push(input.available_languages);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE knowledge_articles
      SET ${updates.join(', ')}
      WHERE article_id = $${paramIndex}
      RETURNING *
    `;

    values.push(input.article_id);

    const result = await this.pool.query(query, values);
    return this.mapArticleFromDb(result.rows[0]);
  }

  /**
   * Delete an article (soft delete by archiving)
   */
  async deleteArticle(articleId: string): Promise<boolean> {
    const query = `
      UPDATE knowledge_articles
      SET status = 'archived', updated_at = CURRENT_TIMESTAMP
      WHERE article_id = $1
      RETURNING article_id
    `;

    const result = await this.pool.query(query, [articleId]);
    return result.rows.length > 0;
  }

  /**
   * Verify an article (approve)
   */
  async verifyArticle(input: VerifyArticleInput): Promise<KnowledgeArticle> {
    const query = `
      UPDATE knowledge_articles
      SET verified_by = $1,
          verification_date = CURRENT_TIMESTAMP,
          verification_notes = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE article_id = $3
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      input.verified_by,
      input.verification_notes || null,
      input.article_id,
    ]);

    return this.mapArticleFromDb(result.rows[0]);
  }

  /**
   * Reject an article verification
   */
  async rejectArticle(
    articleId: string,
    rejectedBy: string,
    rejectionReason: string
  ): Promise<KnowledgeArticle> {
    const query = `
      UPDATE knowledge_articles
      SET status = 'draft',
          verification_notes = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE article_id = $2
      RETURNING *
    `;

    const notes = `Rejected by ${rejectedBy}: ${rejectionReason}`;
    const result = await this.pool.query(query, [notes, articleId]);

    return this.mapArticleFromDb(result.rows[0]);
  }

  /**
   * Verify an answer as expert-reviewed
   */
  async verifyAnswer(
    answerId: string,
    verifiedBy: string
  ): Promise<ArticleAnswer> {
    const query = `
      UPDATE article_answers
      SET verified_by = $1,
          is_expert_answer = TRUE
      WHERE answer_id = $2
      RETURNING *
    `;

    const result = await this.pool.query(query, [verifiedBy, answerId]);

    if (result.rows.length === 0) {
      throw new Error('Answer not found');
    }

    return result.rows[0];
  }

  /**
   * Verify (approve) a success story
   */
  async verifySuccessStory(
    storyId: string,
    verifiedBy: string,
    _verificationNotes?: string
  ): Promise<SuccessStory> {
    const query = `
      UPDATE success_stories
      SET verified = TRUE,
          verified_by = $1,
          verification_date = CURRENT_TIMESTAMP,
          status = 'approved',
          updated_at = CURRENT_TIMESTAMP
      WHERE story_id = $2
      RETURNING *
    `;

    const result = await this.pool.query(query, [verifiedBy, storyId]);

    if (result.rows.length === 0) {
      throw new Error('Success story not found');
    }

    return result.rows[0];
  }

  /**
   * Reject a success story
   */
  async rejectSuccessStory(
    storyId: string,
    rejectedBy: string,
    _rejectionReason: string
  ): Promise<SuccessStory> {
    const query = `
      UPDATE success_stories
      SET status = 'rejected',
          verified = FALSE,
          verified_by = $1,
          verification_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE story_id = $2
      RETURNING *
    `;

    const result = await this.pool.query(query, [rejectedBy, storyId]);

    if (result.rows.length === 0) {
      throw new Error('Success story not found');
    }

    return result.rows[0];
  }

  /**
   * Get pending verification items for officers
   */
  async getPendingVerificationItems(): Promise<{
    articles: KnowledgeArticle[];
    success_stories: SuccessStory[];
    answers: ArticleAnswer[];
  }> {
    // Get unverified articles in review status
    const articlesQuery = `
      SELECT * FROM knowledge_articles
      WHERE status = 'review' AND verified_by IS NULL
      ORDER BY created_at ASC
      LIMIT 50
    `;
    const articlesResult = await this.pool.query(articlesQuery);

    // Get pending success stories
    const storiesQuery = `
      SELECT * FROM success_stories
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 50
    `;
    const storiesResult = await this.pool.query(storiesQuery);

    // Get unverified expert answers
    const answersQuery = `
      SELECT * FROM article_answers
      WHERE is_expert_answer = TRUE AND verified_by IS NULL
      ORDER BY created_at ASC
      LIMIT 50
    `;
    const answersResult = await this.pool.query(answersQuery);

    return {
      articles: articlesResult.rows.map(row => this.mapArticleFromDb(row)),
      success_stories: storiesResult.rows,
      answers: answersResult.rows,
    };
  }

  /**
   * Get verification history for an officer
   */
  async getVerificationHistory(
    officerId: string,
    limit: number = 50
  ): Promise<{
    verified_articles: KnowledgeArticle[];
    verified_stories: SuccessStory[];
    verified_answers: ArticleAnswer[];
  }> {
    // Get articles verified by this officer
    const articlesQuery = `
      SELECT * FROM knowledge_articles
      WHERE verified_by = $1
      ORDER BY verification_date DESC
      LIMIT $2
    `;
    const articlesResult = await this.pool.query(articlesQuery, [officerId, limit]);

    // Get success stories verified by this officer
    const storiesQuery = `
      SELECT * FROM success_stories
      WHERE verified_by = $1
      ORDER BY verification_date DESC
      LIMIT $2
    `;
    const storiesResult = await this.pool.query(storiesQuery, [officerId, limit]);

    // Get answers verified by this officer
    const answersQuery = `
      SELECT * FROM article_answers
      WHERE verified_by = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const answersResult = await this.pool.query(answersQuery, [officerId, limit]);

    return {
      verified_articles: articlesResult.rows.map(row => this.mapArticleFromDb(row)),
      verified_stories: storiesResult.rows,
      verified_answers: answersResult.rows,
    };
  }

  /**
   * Get verification statistics for an officer
   */
  async getVerificationStats(officerId: string): Promise<{
    total_articles_verified: number;
    total_stories_verified: number;
    total_answers_verified: number;
    articles_this_month: number;
    stories_this_month: number;
    answers_this_month: number;
  }> {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM knowledge_articles WHERE verified_by = $1) as total_articles,
        (SELECT COUNT(*) FROM success_stories WHERE verified_by = $1) as total_stories,
        (SELECT COUNT(*) FROM article_answers WHERE verified_by = $1) as total_answers,
        (SELECT COUNT(*) FROM knowledge_articles 
         WHERE verified_by = $1 AND verification_date >= DATE_TRUNC('month', CURRENT_DATE)) as articles_this_month,
        (SELECT COUNT(*) FROM success_stories 
         WHERE verified_by = $1 AND verification_date >= DATE_TRUNC('month', CURRENT_DATE)) as stories_this_month,
        (SELECT COUNT(*) FROM article_answers 
         WHERE verified_by = $1 AND created_at >= DATE_TRUNC('month', CURRENT_DATE)) as answers_this_month
    `;

    const result = await this.pool.query(query, [officerId]);
    const row = result.rows[0];

    return {
      total_articles_verified: parseInt(row.total_articles) || 0,
      total_stories_verified: parseInt(row.total_stories) || 0,
      total_answers_verified: parseInt(row.total_answers) || 0,
      articles_this_month: parseInt(row.articles_this_month) || 0,
      stories_this_month: parseInt(row.stories_this_month) || 0,
      answers_this_month: parseInt(row.answers_this_month) || 0,
    };
  }

  /**
   * Publish an article
   */
  async publishArticle(input: PublishArticleInput): Promise<KnowledgeArticle> {
    const query = `
      UPDATE knowledge_articles
      SET status = 'published',
          published_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE article_id = $1
      RETURNING *
    `;

    const result = await this.pool.query(query, [input.article_id]);
    return this.mapArticleFromDb(result.rows[0]);
  }

  // ============================================================================
  // Search and Discovery
  // ============================================================================

  /**
   * Search articles with natural language and filters
   */
  async searchArticles(searchQuery: ArticleSearchQuery): Promise<ArticleSearchResult> {
      const page = searchQuery.page || 1;
      const limit = searchQuery.limit || 20;
      const offset = (page - 1) * limit;

      let whereConditions: string[] = ['status = $1'];
      let values: any[] = ['published'];
      let paramIndex = 2;

      // Apply filters
      if (searchQuery.filters) {
        const filters = searchQuery.filters;

        if (filters.category) {
          whereConditions.push(`category = $${paramIndex++}`);
          values.push(filters.category);
        }

        if (filters.subcategory) {
          whereConditions.push(`subcategory = $${paramIndex++}`);
          values.push(filters.subcategory);
        }

        if (filters.evidence_level) {
          whereConditions.push(`evidence_level = $${paramIndex++}`);
          values.push(filters.evidence_level);
        }

        if (filters.tags && filters.tags.length > 0) {
          whereConditions.push(`tags && $${paramIndex++}`);
          values.push(filters.tags);
        }

        if (filters.applicable_crops && filters.applicable_crops.length > 0) {
          whereConditions.push(`applicable_crops && $${paramIndex++}`);
          values.push(filters.applicable_crops);
        }

        if (filters.applicable_regions && filters.applicable_regions.length > 0) {
          whereConditions.push(`applicable_regions && $${paramIndex++}`);
          values.push(filters.applicable_regions);
        }

        if (filters.applicable_seasons && filters.applicable_seasons.length > 0) {
          whereConditions.push(`applicable_seasons && $${paramIndex++}`);
          values.push(filters.applicable_seasons);
        }

        if (filters.language) {
          whereConditions.push(`$${paramIndex++} = ANY(available_languages)`);
          values.push(filters.language);
        }

        if (filters.verified_only) {
          whereConditions.push(`verified_by IS NOT NULL`);
        }

        if (filters.min_rating) {
          whereConditions.push(`(rating_sum::float / NULLIF(rating_count, 0)) >= $${paramIndex++}`);
          values.push(filters.min_rating);
        }
      }

      // Natural language search with intent understanding
      let rankingExpression = '';
      if (searchQuery.query) {
        // Parse query to extract intent and entities
        const parsedQuery = this.parseNaturalLanguageQuery(searchQuery.query, searchQuery.language);

        // Detect language for proper text search configuration
        const searchLanguage = this.detectLanguage(searchQuery.query);
        const tsConfig = searchLanguage === 'hi' ? 'simple' : 'english';

        // Expand query with synonyms
        const expandedQuery = this.expandQueryWithSynonyms(parsedQuery.processedQuery);

        // Build full-text search condition with multi-language support
        whereConditions.push(`
          (
            to_tsvector('${tsConfig}', COALESCE(title->>'en', '') || ' ' || COALESCE(title->>'hi', '')) ||
            to_tsvector('${tsConfig}', COALESCE(content->>'en', '') || ' ' || COALESCE(content->>'hi', '')) ||
            to_tsvector('${tsConfig}', COALESCE(summary->>'en', '') || ' ' || COALESCE(summary->>'hi', ''))
          ) @@ plainto_tsquery('${tsConfig}', $${paramIndex})
        `);
        values.push(expandedQuery);
        paramIndex++;

        // Apply extracted entities as filters
        if (parsedQuery.entities.crops.length > 0) {
          whereConditions.push(`applicable_crops && $${paramIndex++}`);
          values.push(parsedQuery.entities.crops);
        }

        if (parsedQuery.entities.categories.length > 0) {
          whereConditions.push(`category = ANY($${paramIndex++})`);
          values.push(parsedQuery.entities.categories);
        }

        if (parsedQuery.entities.tags.length > 0) {
          whereConditions.push(`tags && $${paramIndex++}`);
          values.push(parsedQuery.entities.tags);
        }

        // Build advanced ranking expression with multiple factors
        rankingExpression = `
          (
            -- Title match weighted highest (4x)
            4.0 * ts_rank(
              to_tsvector('${tsConfig}', COALESCE(title->>'en', '') || ' ' || COALESCE(title->>'hi', '')),
              plainto_tsquery('${tsConfig}', $${values.length})
            ) +
            -- Content match (1x)
            ts_rank(
              to_tsvector('${tsConfig}', COALESCE(content->>'en', '') || ' ' || COALESCE(content->>'hi', '')),
              plainto_tsquery('${tsConfig}', $${values.length})
            ) +
            -- Summary match (2x)
            2.0 * ts_rank(
              to_tsvector('${tsConfig}', COALESCE(summary->>'en', '') || ' ' || COALESCE(summary->>'hi', '')),
              plainto_tsquery('${tsConfig}', $${values.length})
            ) +
            -- Evidence level bonus (strong=0.3, moderate=0.2, traditional=0.1)
            CASE evidence_level
              WHEN 'strong' THEN 0.3
              WHEN 'moderate' THEN 0.2
              WHEN 'traditional' THEN 0.1
              ELSE 0
            END +
            -- Recency bonus (published in last 30 days = 0.2, last 90 days = 0.1)
            CASE
              WHEN published_at > CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 0.2
              WHEN published_at > CURRENT_TIMESTAMP - INTERVAL '90 days' THEN 0.1
              ELSE 0
            END +
            -- Popularity bonus (normalized rating * 0.1 + normalized views * 0.05)
            COALESCE((rating_sum::float / NULLIF(rating_count, 0)) / 5.0 * 0.1, 0) +
            COALESCE(LEAST(view_count::float / 1000.0, 1.0) * 0.05, 0)
          )
        `;
      }

      // Build ORDER BY clause
      let orderBy = 'created_at DESC';
      if (searchQuery.sort_by) {
        switch (searchQuery.sort_by) {
          case 'rating':
            orderBy = '(rating_sum::float / NULLIF(rating_count, 0)) DESC NULLS LAST';
            break;
          case 'views':
            orderBy = 'view_count DESC';
            break;
          case 'recent':
            orderBy = 'published_at DESC';
            break;
          case 'success_stories':
            orderBy = 'success_story_count DESC';
            break;
          case 'relevance':
            if (rankingExpression) {
              orderBy = `${rankingExpression} DESC`;
            }
            break;
        }
      } else if (rankingExpression) {
        // Default to relevance ranking when query is provided
        orderBy = `${rankingExpression} DESC`;
      }

      if (searchQuery.sort_order === 'asc' && searchQuery.sort_by !== 'relevance') {
        orderBy = orderBy.replace('DESC', 'ASC');
      }

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM knowledge_articles
        WHERE ${whereConditions.join(' AND ')}
      `;

      const countResult = await this.pool.query(countQuery, values);
      const totalCount = parseInt(countResult.rows[0].total);

      // Data query
      const dataQuery = `
        SELECT *
        FROM knowledge_articles
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;

      values.push(limit, offset);

      const dataResult = await this.pool.query(dataQuery, values);

      const articles = dataResult.rows.map(row => 
        this.mapArticleFromDb(row, searchQuery.language)
      );

      return {
        articles,
        total_count: totalCount,
        page,
        total_pages: Math.ceil(totalCount / limit),
        has_more: offset + articles.length < totalCount,
      };
    }

  /**
   * Get articles by category
   */
  async getArticlesByCategory(
    category: string,
    language?: SupportedLanguage,
    limit: number = 20
  ): Promise<KnowledgeArticle[]> {
    const query = `
      SELECT * FROM knowledge_articles
      WHERE category = $1 AND status = 'published'
      ORDER BY view_count DESC, rating_sum DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [category, limit]);
    return result.rows.map(row => this.mapArticleFromDb(row, language));
  }

  /**
   * Get trending articles
   */
  async getTrendingArticles(
    limit: number = 10,
    language?: SupportedLanguage
  ): Promise<KnowledgeArticle[]> {
    const query = `
      SELECT * FROM knowledge_articles
      WHERE status = 'published'
        AND published_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
      ORDER BY view_count DESC, rating_sum DESC
      LIMIT $1
    `;

    const result = await this.pool.query(query, [limit]);
    return result.rows.map(row => this.mapArticleFromDb(row, language));
  }

  // ============================================================================
  // Community Engagement
  // ============================================================================

  /**
   * Add or update article rating
   */
  async rateArticle(
    articleId: string,
    userId: string,
    rating: number,
    reviewText?: string
  ): Promise<ArticleRating> {
    const query = `
      INSERT INTO article_ratings (article_id, user_id, rating, review_text)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (article_id, user_id)
      DO UPDATE SET rating = $3, review_text = $4, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await this.pool.query(query, [articleId, userId, rating, reviewText || null]);
    return result.rows[0];
  }

  /**
   * Get article ratings
   */
  async getArticleRatings(articleId: string, limit: number = 10): Promise<ArticleRating[]> {
    const query = `
      SELECT * FROM article_ratings
      WHERE article_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [articleId, limit]);
    return result.rows;
  }

  /**
   * Submit a success story
   */
  async submitSuccessStory(story: Omit<SuccessStory, 'story_id' | 'created_at' | 'updated_at'>): Promise<SuccessStory> {
    const query = `
      INSERT INTO success_stories (
        article_id, user_id, title, story_text, results_achieved,
        images, videos, location_district, location_state, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *
    `;

    const values = [
      story.article_id,
      story.user_id,
      JSON.stringify(story.title),
      JSON.stringify(story.story_text),
      story.results_achieved ? JSON.stringify(story.results_achieved) : null,
      story.images,
      story.videos,
      story.location_district || null,
      story.location_state || null,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get success stories for an article
   */
  async getSuccessStories(articleId: string, limit: number = 10): Promise<SuccessStory[]> {
    const query = `
      SELECT * FROM success_stories
      WHERE article_id = $1 AND status = 'approved'
      ORDER BY helpful_count DESC, created_at DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [articleId, limit]);
    return result.rows;
  }

  /**
   * Ask a question about an article
   */
  async askQuestion(
    articleId: string,
    userId: string,
    questionText: string
  ): Promise<ArticleQuestion> {
    const query = `
      INSERT INTO article_questions (article_id, user_id, question_text)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await this.pool.query(query, [articleId, userId, questionText]);
    return result.rows[0];
  }

  /**
   * Answer a question
   */
  async answerQuestion(
    questionId: string,
    userId: string,
    answerText: string,
    isExpertAnswer: boolean = false
  ): Promise<ArticleAnswer> {
    const query = `
      INSERT INTO article_answers (question_id, user_id, answer_text, is_expert_answer)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await this.pool.query(query, [questionId, userId, answerText, isExpertAnswer]);
    return result.rows[0];
  }

  /**
   * Get Q&A for an article
   */
  async getArticleQA(articleId: string, limit: number = 10): Promise<Array<ArticleQuestion & { answers: ArticleAnswer[] }>> {
    const questionsQuery = `
      SELECT * FROM article_questions
      WHERE article_id = $1
      ORDER BY upvote_count DESC, created_at DESC
      LIMIT $2
    `;

    const questionsResult = await this.pool.query(questionsQuery, [articleId, limit]);
    const questions = questionsResult.rows;

    // Get answers for each question
    const questionsWithAnswers = await Promise.all(
      questions.map(async (question) => {
        const answersQuery = `
          SELECT * FROM article_answers
          WHERE question_id = $1
          ORDER BY is_accepted DESC, upvote_count DESC, created_at ASC
        `;
        const answersResult = await this.pool.query(answersQuery, [question.question_id]);
        return {
          ...question,
          answers: answersResult.rows,
        };
      })
    );

    return questionsWithAnswers;
  }

  /**
   * Upvote a question
   */
  async upvoteQuestion(questionId: string, _userId: string): Promise<ArticleQuestion> {
    // Check if user already upvoted (using a separate tracking table would be better in production)
    const query = `
      UPDATE article_questions
      SET upvote_count = upvote_count + 1
      WHERE question_id = $1
      RETURNING *
    `;

    const result = await this.pool.query(query, [questionId]);
    
    if (result.rows.length === 0) {
      throw new Error('Question not found');
    }

    return result.rows[0];
  }

  /**
   * Upvote an answer
   */
  async upvoteAnswer(answerId: string, _userId: string): Promise<ArticleAnswer> {
    const query = `
      UPDATE article_answers
      SET upvote_count = upvote_count + 1
      WHERE answer_id = $1
      RETURNING *
    `;

    const result = await this.pool.query(query, [answerId]);
    
    if (result.rows.length === 0) {
      throw new Error('Answer not found');
    }

    return result.rows[0];
  }

  /**
   * Accept an answer (mark as the accepted solution)
   */
  async acceptAnswer(answerId: string, questionOwnerId: string): Promise<ArticleAnswer> {
    // First, verify the user owns the question
    const verifyQuery = `
      SELECT q.user_id, q.question_id
      FROM article_answers a
      JOIN article_questions q ON a.question_id = q.question_id
      WHERE a.answer_id = $1
    `;

    const verifyResult = await this.pool.query(verifyQuery, [answerId]);
    
    if (verifyResult.rows.length === 0) {
      throw new Error('Answer not found');
    }

    if (verifyResult.rows[0].user_id !== questionOwnerId) {
      throw new Error('Only the question owner can accept an answer');
    }

    const questionId = verifyResult.rows[0].question_id;

    // Unaccept any previously accepted answers for this question
    await this.pool.query(
      `UPDATE article_answers SET is_accepted = FALSE WHERE question_id = $1`,
      [questionId]
    );

    // Accept the specified answer
    const query = `
      UPDATE article_answers
      SET is_accepted = TRUE
      WHERE answer_id = $1
      RETURNING *
    `;

    const result = await this.pool.query(query, [answerId]);
    return result.rows[0];
  }

  /**
   * Mark a success story as helpful
   */
  async markStoryHelpful(storyId: string, _userId: string): Promise<SuccessStory> {
    const query = `
      UPDATE success_stories
      SET helpful_count = helpful_count + 1
      WHERE story_id = $1
      RETURNING *
    `;

    const result = await this.pool.query(query, [storyId]);
    
    if (result.rows.length === 0) {
      throw new Error('Success story not found');
    }

    return result.rows[0];
  }

  /**
   * Get questions by user
   */
  async getUserQuestions(userId: string, limit: number = 20): Promise<ArticleQuestion[]> {
    const query = `
      SELECT * FROM article_questions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [userId, limit]);
    return result.rows;
  }

  /**
   * Get answers by user
   */
  async getUserAnswers(userId: string, limit: number = 20): Promise<ArticleAnswer[]> {
    const query = `
      SELECT * FROM article_answers
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [userId, limit]);
    return result.rows;
  }

  // ============================================================================
  // Crop Rotation Plan Generator
  // ============================================================================

  /**
   * Generate a crop rotation plan based on farm profile and goals
   */
  async generateRotationPlan(input: {
    district: string;
    state: string;
    soil_type: string;
    land_area: number;
    current_crop?: string;
    previous_crops?: string[];
    farmer_goals: ('yield' | 'sustainability' | 'profit')[];
    num_seasons: number; // 4-16 seasons (2-4 years with 2 seasons per year)
    language?: SupportedLanguage;
  }): Promise<CropRotationPlan> {
    const { district, state, soil_type, current_crop, previous_crops = [], farmer_goals, num_seasons, language: _language = 'en' } = input;

    // Validate input
    if (num_seasons < 4 || num_seasons > 16) {
      throw new Error('Number of seasons must be between 4 and 16 (2-4 years)');
    }

    // Define crop families and their characteristics
    const cropDatabase = this.getCropDatabase();

    // Get crops suitable for the region and soil
    const suitableCrops = this.filterSuitableCrops(cropDatabase, soil_type, state);

    // Generate rotation sequence
    const rotationSequence = this.generateRotationSequence(
      suitableCrops,
      num_seasons,
      current_crop,
      previous_crops,
      farmer_goals
    );

    // Calculate soil health improvement
    const soilHealthImprovement = this.calculateSoilHealthImprovement(rotationSequence, cropDatabase);

    // Calculate financial benefits
    const financialBenefits = this.calculateFinancialBenefits(rotationSequence, cropDatabase);

    // Create plan name and description
    const planName: MultiLanguageText = {
      en: `${num_seasons / 2}-Year Rotation Plan for ${district}, ${state}`,
      hi: `${district}, ${state} के लिए ${num_seasons / 2} वर्षीय फसल चक्र योजना`,
    };

    const description: MultiLanguageText = {
      en: `Optimized crop rotation plan for ${soil_type} soil, focusing on ${farmer_goals.join(', ')}. This plan balances nutrient-demanding and nitrogen-fixing crops while preventing pest buildup.`,
      hi: `${soil_type} मिट्टी के लिए अनुकूलित फसल चक्र योजना, ${farmer_goals.join(', ')} पर ध्यान केंद्रित करते हुए। यह योजना पोषक तत्वों की मांग वाली और नाइट्रोजन स्थिरीकरण फसलों को संतुलित करती है।`,
    };

    // Create the plan object
    const plan: CropRotationPlan = {
      plan_id: '', // Will be set by database
      plan_name: planName,
      description,
      rotation_sequence: rotationSequence,
      suitable_soil_types: [soil_type],
      suitable_regions: [state],
      soil_health_improvement: soilHealthImprovement,
      financial_benefits: financialBenefits,
      adoption_count: 0,
      status: 'published',
      created_at: new Date(),
      updated_at: new Date(),
    };

    return plan;
  }

  /**
   * Validate a rotation sequence for proper crop family rotation
   */
  validateRotationSequence(sequence: RotationSequenceItem[]): {
    valid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const cropDatabase = this.getCropDatabase();

    // Check for same crop family in consecutive seasons
    for (let i = 0; i < sequence.length - 1; i++) {
      const currentCrop = cropDatabase[sequence[i].crop];
      const nextCrop = cropDatabase[sequence[i + 1].crop];

      if (currentCrop && nextCrop && currentCrop.family === nextCrop.family) {
        issues.push(
          `Same crop family (${currentCrop.family}) in consecutive seasons: ${sequence[i].crop} → ${sequence[i + 1].crop}`
        );
      }
    }

    // Check for nutrient balance
    let heavyFeeders = 0;
    let lightFeeders = 0;
    let nitrogenFixers = 0;

    sequence.forEach(item => {
      const crop = cropDatabase[item.crop];
      if (crop) {
        if (crop.nutrient_demand === 'heavy') heavyFeeders++;
        else if (crop.nutrient_demand === 'light') lightFeeders++;
        if (crop.nitrogen_fixer) nitrogenFixers++;
      }
    });

    const totalCrops = sequence.length;
    if (nitrogenFixers / totalCrops < 0.2) {
      recommendations.push('Consider adding more nitrogen-fixing crops (legumes) to improve soil fertility');
    }

    if (heavyFeeders / totalCrops > 0.6) {
      recommendations.push('Too many heavy feeders may deplete soil nutrients. Balance with light feeders and nitrogen fixers');
    }

    // Check for root depth variation
    const rootDepths = sequence.map(item => cropDatabase[item.crop]?.root_depth).filter(Boolean);
    const uniqueDepths = new Set(rootDepths);
    if (uniqueDepths.size < 2) {
      recommendations.push('Include crops with varying root depths (shallow and deep) to improve soil structure');
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Get rotation recommendations by crop family
   */
  getRotationRecommendationsByCropFamily(cropFamily: string): {
    follow_with: string[];
    avoid_after: string[];
    rationale: MultiLanguageText;
  } {
    const recommendations: Record<string, any> = {
      Legumes: {
        follow_with: ['Brassicas', 'Solanaceae', 'Cucurbits'],
        avoid_after: ['Legumes'],
        rationale: {
          en: 'Legumes fix nitrogen in soil. Follow with nitrogen-demanding crops like brassicas or solanaceae to utilize the enriched soil.',
          hi: 'फलियां मिट्टी में नाइट्रोजन स्थिर करती हैं। समृद्ध मिट्टी का उपयोग करने के लिए नाइट्रोजन की मांग वाली फसलों जैसे ब्रैसिका या सोलानेसी के साथ अनुसरण करें।',
        },
      },
      Brassicas: {
        follow_with: ['Legumes', 'Alliums'],
        avoid_after: ['Brassicas'],
        rationale: {
          en: 'Brassicas are heavy feeders. Follow with nitrogen-fixing legumes to restore soil fertility.',
          hi: 'ब्रैसिका भारी पोषक तत्वों की मांग करते हैं। मिट्टी की उर्वरता बहाल करने के लिए नाइट्रोजन स्थिरीकरण फलियों के साथ अनुसरण करें।',
        },
      },
      Solanaceae: {
        follow_with: ['Legumes', 'Grasses'],
        avoid_after: ['Solanaceae'],
        rationale: {
          en: 'Solanaceae crops deplete soil nutrients. Follow with legumes or grasses to replenish and prevent disease buildup.',
          hi: 'सोलानेसी फसलें मिट्टी के पोषक तत्वों को कम करती हैं। पुनः भरने और रोग संचय को रोकने के लिए फलियों या घासों के साथ अनुसरण करें।',
        },
      },
      Cucurbits: {
        follow_with: ['Legumes', 'Root vegetables'],
        avoid_after: ['Cucurbits'],
        rationale: {
          en: 'Cucurbits are moderate feeders. Follow with legumes to restore nitrogen or root vegetables for soil structure.',
          hi: 'कुकुरबिट मध्यम पोषक तत्वों की मांग करते हैं। नाइट्रोजन बहाल करने के लिए फलियों या मिट्टी की संरचना के लिए जड़ वाली सब्जियों के साथ अनुसरण करें।',
        },
      },
      Grasses: {
        follow_with: ['Legumes', 'Brassicas'],
        avoid_after: ['Grasses'],
        rationale: {
          en: 'Grasses (cereals) are heavy feeders. Follow with nitrogen-fixing legumes to restore soil health.',
          hi: 'घास (अनाज) भारी पोषक तत्वों की मांग करते हैं। मिट्टी के स्वास्थ्य को बहाल करने के लिए नाइट्रोजन स्थिरीकरण फलियों के साथ अनुसरण करें।',
        },
      },
    };

    return recommendations[cropFamily] || {
      follow_with: [],
      avoid_after: [],
      rationale: { en: 'No specific recommendations available', hi: 'कोई विशिष्ट सिफारिश उपलब्ध नहीं' },
    };
  }

  /**
   * Calculate soil nutrient balance over rotation cycle
   */
  calculateSoilNutrientBalance(sequence: RotationSequenceItem[]): {
    nitrogen_balance: number;
    phosphorus_balance: number;
    potassium_balance: number;
    organic_matter_change: number;
    overall_health_score: number;
  } {
    const cropDatabase = this.getCropDatabase();
    let nitrogenBalance = 0;
    let phosphorusBalance = 0;
    let potassiumBalance = 0;
    let organicMatterChange = 0;

    sequence.forEach(item => {
      const crop = cropDatabase[item.crop];
      if (crop) {
        // Nitrogen balance
        if (crop.nitrogen_fixer) {
          nitrogenBalance += 30; // Legumes add nitrogen
        } else if (crop.nutrient_demand === 'heavy') {
          nitrogenBalance -= 20;
        } else if (crop.nutrient_demand === 'moderate') {
          nitrogenBalance -= 10;
        } else {
          nitrogenBalance -= 5;
        }

        // Phosphorus and Potassium (simplified model)
        if (crop.nutrient_demand === 'heavy') {
          phosphorusBalance -= 15;
          potassiumBalance -= 15;
        } else if (crop.nutrient_demand === 'moderate') {
          phosphorusBalance -= 8;
          potassiumBalance -= 8;
        } else {
          phosphorusBalance -= 3;
          potassiumBalance -= 3;
        }

        // Organic matter (deep-rooted crops add more)
        if (crop.root_depth === 'deep') {
          organicMatterChange += 5;
        } else {
          organicMatterChange += 2;
        }
      }
    });

    // Calculate overall health score (0-100)
    const nitrogenScore = Math.max(0, Math.min(100, 50 + nitrogenBalance));
    const phosphorusScore = Math.max(0, Math.min(100, 50 + phosphorusBalance / 2));
    const potassiumScore = Math.max(0, Math.min(100, 50 + potassiumBalance / 2));
    const organicMatterScore = Math.max(0, Math.min(100, 50 + organicMatterChange));

    const overallHealthScore = Math.round(
      (nitrogenScore + phosphorusScore + potassiumScore + organicMatterScore) / 4
    );

    return {
      nitrogen_balance: nitrogenBalance,
      phosphorus_balance: phosphorusBalance,
      potassium_balance: potassiumBalance,
      organic_matter_change: organicMatterChange,
      overall_health_score: overallHealthScore,
    };
  }

  // ============================================================================
  // Private Helper Methods for Crop Rotation
  // ============================================================================

  private getCropDatabase(): Record<string, any> {
    return {
      rice: {
        family: 'Grasses',
        nutrient_demand: 'heavy',
        nitrogen_fixer: false,
        root_depth: 'shallow',
        season: 'kharif',
        suitable_soils: ['clay', 'loam'],
        suitable_regions: ['all'],
        avg_yield_per_acre: 2500,
        avg_price_per_kg: 20,
        investment_per_acre: 25000,
      },
      wheat: {
        family: 'Grasses',
        nutrient_demand: 'heavy',
        nitrogen_fixer: false,
        root_depth: 'moderate',
        season: 'rabi',
        suitable_soils: ['loam', 'clay-loam'],
        suitable_regions: ['all'],
        avg_yield_per_acre: 2000,
        avg_price_per_kg: 22,
        investment_per_acre: 20000,
      },
      maize: {
        family: 'Grasses',
        nutrient_demand: 'heavy',
        nitrogen_fixer: false,
        root_depth: 'deep',
        season: 'kharif',
        suitable_soils: ['loam', 'sandy-loam'],
        suitable_regions: ['all'],
        avg_yield_per_acre: 2200,
        avg_price_per_kg: 18,
        investment_per_acre: 22000,
      },
      pulses: {
        family: 'Legumes',
        nutrient_demand: 'light',
        nitrogen_fixer: true,
        root_depth: 'moderate',
        season: 'rabi',
        suitable_soils: ['loam', 'sandy-loam', 'clay-loam'],
        suitable_regions: ['all'],
        avg_yield_per_acre: 800,
        avg_price_per_kg: 60,
        investment_per_acre: 15000,
      },
      soybean: {
        family: 'Legumes',
        nutrient_demand: 'light',
        nitrogen_fixer: true,
        root_depth: 'deep',
        season: 'kharif',
        suitable_soils: ['loam', 'clay-loam'],
        suitable_regions: ['all'],
        avg_yield_per_acre: 1200,
        avg_price_per_kg: 40,
        investment_per_acre: 18000,
      },
      mustard: {
        family: 'Brassicas',
        nutrient_demand: 'moderate',
        nitrogen_fixer: false,
        root_depth: 'moderate',
        season: 'rabi',
        suitable_soils: ['loam', 'sandy-loam'],
        suitable_regions: ['all'],
        avg_yield_per_acre: 1000,
        avg_price_per_kg: 50,
        investment_per_acre: 12000,
      },
      cotton: {
        family: 'Malvaceae',
        nutrient_demand: 'heavy',
        nitrogen_fixer: false,
        root_depth: 'deep',
        season: 'kharif',
        suitable_soils: ['clay', 'clay-loam'],
        suitable_regions: ['Maharashtra', 'Gujarat', 'Telangana', 'Punjab'],
        avg_yield_per_acre: 800,
        avg_price_per_kg: 60,
        investment_per_acre: 30000,
      },
      sugarcane: {
        family: 'Grasses',
        nutrient_demand: 'heavy',
        nitrogen_fixer: false,
        root_depth: 'deep',
        season: 'annual',
        suitable_soils: ['loam', 'clay-loam'],
        suitable_regions: ['Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu'],
        avg_yield_per_acre: 35000,
        avg_price_per_kg: 3,
        investment_per_acre: 40000,
      },
      vegetables: {
        family: 'Various',
        nutrient_demand: 'moderate',
        nitrogen_fixer: false,
        root_depth: 'shallow',
        season: 'both',
        suitable_soils: ['loam', 'sandy-loam'],
        suitable_regions: ['all'],
        avg_yield_per_acre: 5000,
        avg_price_per_kg: 25,
        investment_per_acre: 35000,
      },
    };
  }

  private filterSuitableCrops(
    cropDatabase: Record<string, any>,
    soilType: string,
    region: string
  ): Record<string, any> {
    const suitable: Record<string, any> = {};

    for (const [cropName, cropData] of Object.entries(cropDatabase)) {
      const soilMatch = cropData.suitable_soils.includes(soilType) || cropData.suitable_soils.includes('all');
      const regionMatch = cropData.suitable_regions.includes(region) || cropData.suitable_regions.includes('all');

      if (soilMatch && regionMatch) {
        suitable[cropName] = cropData;
      }
    }

    return suitable;
  }

  private generateRotationSequence(
    suitableCrops: Record<string, any>,
    numSeasons: number,
    currentCrop?: string,
    _previousCrops: string[] = [],
    farmerGoals: string[] = []
  ): RotationSequenceItem[] {
    const sequence: RotationSequenceItem[] = [];
    const cropNames = Object.keys(suitableCrops);

    // Track previous crop family to avoid repetition
    let lastCropFamily = currentCrop ? suitableCrops[currentCrop]?.family : null;

    for (let i = 0; i < numSeasons; i++) {
      const year = Math.floor(i / 2) + 1;
      const season = i % 2 === 0 ? 'kharif' : 'rabi';

      // Filter crops by season
      const seasonCrops = cropNames.filter(crop => {
        const cropData = suitableCrops[crop];
        return cropData.season === season || cropData.season === 'both' || cropData.season === 'annual';
      });

      // Select crop based on rotation principles
      let selectedCrop: string | null = null;

      // Priority 1: Avoid same family as last crop
      const differentFamilyCrops = seasonCrops.filter(crop => {
        return suitableCrops[crop].family !== lastCropFamily;
      });

      // Priority 2: Balance nitrogen fixers and heavy feeders
      const needNitrogenFixer = i > 0 && i % 3 === 0; // Every 3rd season
      if (needNitrogenFixer) {
        const nitrogenFixers = differentFamilyCrops.filter(crop => suitableCrops[crop].nitrogen_fixer);
        if (nitrogenFixers.length > 0) {
          selectedCrop = nitrogenFixers[Math.floor(Math.random() * nitrogenFixers.length)];
        }
      }

      // Priority 3: Select based on farmer goals
      if (!selectedCrop && farmerGoals.includes('profit')) {
        // Sort by profitability
        const profitableCrops = differentFamilyCrops.sort((a, b) => {
          const profitA = suitableCrops[a].avg_yield_per_acre * suitableCrops[a].avg_price_per_kg - suitableCrops[a].investment_per_acre;
          const profitB = suitableCrops[b].avg_yield_per_acre * suitableCrops[b].avg_price_per_kg - suitableCrops[b].investment_per_acre;
          return profitB - profitA;
        });
        selectedCrop = profitableCrops[0];
      }

      // Default: Select randomly from different family crops
      if (!selectedCrop && differentFamilyCrops.length > 0) {
        selectedCrop = differentFamilyCrops[Math.floor(Math.random() * differentFamilyCrops.length)];
      }

      // Fallback: Select any available crop
      if (!selectedCrop && seasonCrops.length > 0) {
        selectedCrop = seasonCrops[Math.floor(Math.random() * seasonCrops.length)];
      }

      if (selectedCrop) {
        const cropData = suitableCrops[selectedCrop];
        lastCropFamily = cropData.family;

        const benefits: MultiLanguageText = this.getCropBenefits(selectedCrop, cropData, i, sequence);

        sequence.push({
          year,
          season,
          crop: selectedCrop,
          benefits,
          expected_yield: `${cropData.avg_yield_per_acre} kg/acre`,
        });
      }
    }

    return sequence;
  }

  private getCropBenefits(
    cropName: string,
    cropData: any,
    index: number,
    sequence: RotationSequenceItem[]
  ): MultiLanguageText {
    const benefits: string[] = [];
    const benefitsHi: string[] = [];

    if (cropData.nitrogen_fixer) {
      benefits.push('Fixes nitrogen in soil, improving fertility for next crop');
      benefitsHi.push('मिट्टी में नाइट्रोजन स्थिर करता है, अगली फसल के लिए उर्वरता में सुधार करता है');
    }

    if (cropData.root_depth === 'deep') {
      benefits.push('Deep roots improve soil structure and water retention');
      benefitsHi.push('गहरी जड़ें मिट्टी की संरचना और जल प्रतिधारण में सुधार करती हैं');
    }

    if (index > 0) {
      const prevCrop = sequence[index - 1];
      if (prevCrop.crop !== cropName) {
        benefits.push('Breaks pest and disease cycles from previous crop');
        benefitsHi.push('पिछली फसल से कीट और रोग चक्र को तोड़ता है');
      }
    }

    if (cropData.nutrient_demand === 'light') {
      benefits.push('Low nutrient demand allows soil to recover');
      benefitsHi.push('कम पोषक तत्व की मांग मिट्टी को ठीक होने देती है');
    }

    const profit = cropData.avg_yield_per_acre * cropData.avg_price_per_kg - cropData.investment_per_acre;
    if (profit > 30000) {
      benefits.push(`High profitability: ₹${profit.toLocaleString('en-IN')} per acre`);
      benefitsHi.push(`उच्च लाभप्रदता: ₹${profit.toLocaleString('en-IN')} प्रति एकड़`);
    }

    return {
      en: benefits.join('. '),
      hi: benefitsHi.join('. '),
    };
  }

  private calculateSoilHealthImprovement(
    sequence: RotationSequenceItem[],
    _cropDatabase: Record<string, any>
  ): SoilHealthImprovement {
    const balance = this.calculateSoilNutrientBalance(sequence);

    return {
      nitrogen_gain: balance.nitrogen_balance > 0 ? `+${balance.nitrogen_balance}%` : `${balance.nitrogen_balance}%`,
      phosphorus_gain: balance.phosphorus_balance > 0 ? `+${balance.phosphorus_balance}%` : `${balance.phosphorus_balance}%`,
      potassium_gain: balance.potassium_balance > 0 ? `+${balance.potassium_balance}%` : `${balance.potassium_balance}%`,
      organic_matter: balance.organic_matter_change > 0 ? `+${balance.organic_matter_change}%` : `${balance.organic_matter_change}%`,
      description: {
        en: `This rotation plan maintains soil health with an overall score of ${balance.overall_health_score}/100. ${
          balance.nitrogen_balance > 0
            ? 'Nitrogen-fixing crops improve soil fertility.'
            : 'Consider adding more legumes to improve nitrogen levels.'
        }`,
        hi: `यह फसल चक्र योजना ${balance.overall_health_score}/100 के समग्र स्कोर के साथ मिट्टी के स्वास्थ्य को बनाए रखती है। ${
          balance.nitrogen_balance > 0
            ? 'नाइट्रोजन स्थिरीकरण फसलें मिट्टी की उर्वरता में सुधार करती हैं।'
            : 'नाइट्रोजन स्तर में सुधार के लिए अधिक फलियां जोड़ने पर विचार करें।'
        }`,
      },
    };
  }

  private calculateFinancialBenefits(
    sequence: RotationSequenceItem[],
    cropDatabase: Record<string, any>
  ): FinancialBreakdown {
    const yearWiseBreakdown: Array<{ year: number; investment: number; revenue: number; profit: number }> = [];
    let totalInvestment = 0;
    let totalRevenue = 0;

    // Group by year
    const years = Math.ceil(sequence.length / 2);
    for (let year = 1; year <= years; year++) {
      const yearCrops = sequence.filter(item => item.year === year);
      let yearInvestment = 0;
      let yearRevenue = 0;

      yearCrops.forEach(item => {
        const cropData = cropDatabase[item.crop];
        if (cropData) {
          yearInvestment += cropData.investment_per_acre;
          yearRevenue += cropData.avg_yield_per_acre * cropData.avg_price_per_kg;
        }
      });

      yearWiseBreakdown.push({
        year,
        investment: yearInvestment,
        revenue: yearRevenue,
        profit: yearRevenue - yearInvestment,
      });

      totalInvestment += yearInvestment;
      totalRevenue += yearRevenue;
    }

    const totalProfit = totalRevenue - totalInvestment;
    const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1);

    return {
      total_investment: totalInvestment,
      expected_revenue: totalRevenue,
      profit_margin: `${profitMargin}%`,
      year_wise_breakdown: yearWiseBreakdown,
    };
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  /**
   * Get article analytics
   */
  async getArticleAnalytics(articleId: string): Promise<ArticleAnalytics> {
    const query = `
      SELECT 
        a.article_id,
        a.view_count,
        COALESCE(a.rating_sum::float / NULLIF(a.rating_count, 0), 0) as average_rating,
        a.rating_count,
        a.success_story_count,
        (SELECT COUNT(*) FROM article_questions WHERE article_id = a.article_id) as question_count,
        (SELECT COUNT(*) FROM article_ratings WHERE article_id = a.article_id AND implemented = true) as implementation_count
      FROM knowledge_articles a
      WHERE a.article_id = $1
    `;

    const result = await this.pool.query(query, [articleId]);
    const row = result.rows[0];

    // Calculate engagement score
    const engagementScore = 
      row.view_count * 0.1 +
      row.average_rating * 20 +
      row.success_story_count * 50 +
      row.question_count * 10 +
      row.implementation_count * 30;

    return {
      ...row,
      engagement_score: Math.round(engagementScore),
    };
  }

  /**
   * Get knowledge base statistics
   */
  async getKnowledgeBaseStats(): Promise<KnowledgeBaseStats> {
    const query = `
      SELECT 
        COUNT(*) as total_articles,
        COUNT(*) FILTER (WHERE status = 'published') as published_articles,
        COUNT(*) FILTER (WHERE verified_by IS NOT NULL) as verified_articles,
        SUM(view_count) as total_views,
        SUM(rating_count) as total_ratings,
        AVG(rating_sum::float / NULLIF(rating_count, 0)) as average_rating,
        SUM(success_story_count) as total_success_stories
      FROM knowledge_articles
    `;

    const result = await this.pool.query(query);
    const stats = result.rows[0];

    // Get articles by category
    const categoryQuery = `
      SELECT category, COUNT(*) as count
      FROM knowledge_articles
      WHERE status = 'published'
      GROUP BY category
    `;
    const categoryResult = await this.pool.query(categoryQuery);
    const articlesByCategory = Object.fromEntries(
      categoryResult.rows.map(row => [row.category, parseInt(row.count)])
    );

    // Get articles by evidence level
    const evidenceQuery = `
      SELECT evidence_level, COUNT(*) as count
      FROM knowledge_articles
      WHERE status = 'published'
      GROUP BY evidence_level
    `;
    const evidenceResult = await this.pool.query(evidenceQuery);
    const articlesByEvidenceLevel = Object.fromEntries(
      evidenceResult.rows.map(row => [row.evidence_level, parseInt(row.count)])
    );

    // Get articles by language
    const languageQuery = `
      SELECT unnest(available_languages) as language, COUNT(*) as count
      FROM knowledge_articles
      WHERE status = 'published'
      GROUP BY language
    `;
    const languageResult = await this.pool.query(languageQuery);
    const articlesByLanguage = Object.fromEntries(
      languageResult.rows.map(row => [row.language, parseInt(row.count)])
    );

    return {
      total_articles: parseInt(stats.total_articles),
      published_articles: parseInt(stats.published_articles),
      verified_articles: parseInt(stats.verified_articles),
      total_views: parseInt(stats.total_views) || 0,
      total_ratings: parseInt(stats.total_ratings) || 0,
      average_rating: parseFloat(stats.average_rating) || 0,
      total_success_stories: parseInt(stats.total_success_stories) || 0,
      articles_by_category: articlesByCategory as any,
      articles_by_evidence_level: articlesByEvidenceLevel as any,
      articles_by_language: articlesByLanguage as any,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Increment view count for an article
   */
  private async incrementViewCount(articleId: string): Promise<void> {
    const query = `
      UPDATE knowledge_articles
      SET view_count = view_count + 1
      WHERE article_id = $1
    `;
    await this.pool.query(query, [articleId]);
  }
  /**
     * Detect language of the query (simple heuristic)
     */
    private detectLanguage(query: string): 'en' | 'hi' {
      // Check for Devanagari script (Hindi)
      const hindiPattern = /[\u0900-\u097F]/;
      return hindiPattern.test(query) ? 'hi' : 'en';
    }

    /**
     * Parse natural language query to extract intent and entities
     */
    private parseNaturalLanguageQuery(
      query: string,
      _language?: SupportedLanguage
    ): {
      processedQuery: string;
      entities: {
        crops: string[];
        categories: string[];
        tags: string[];
      };
    } {
      const entities = {
        crops: [] as string[],
        categories: [] as string[],
        tags: [] as string[],
      };

      // Normalize query
      let processedQuery = query.toLowerCase().trim();

      // Remove stop words (English and Hindi)
      const stopWords = [
        'how', 'to', 'what', 'is', 'the', 'a', 'an', 'in', 'for', 'of', 'and', 'or',
        'कैसे', 'क्या', 'है', 'में', 'के', 'लिए', 'और', 'या'
      ];

      const words = processedQuery.split(/\s+/);
      const filteredWords = words.filter(word => !stopWords.includes(word));
      processedQuery = filteredWords.join(' ');

      // Extract crop entities
      const cropKeywords: Record<string, string[]> = {
        'rice': ['rice', 'paddy', 'धान', 'चावल'],
        'wheat': ['wheat', 'गेहूं'],
        'maize': ['maize', 'corn', 'मक्का'],
        'cotton': ['cotton', 'कपास'],
        'sugarcane': ['sugarcane', 'गन्ना'],
        'soybean': ['soybean', 'सोयाबीन'],
        'pulses': ['pulses', 'lentils', 'दाल'],
        'vegetables': ['vegetables', 'vegetable', 'सब्जी', 'सब्जियां'],
        'fruits': ['fruits', 'fruit', 'फल'],
      };

      for (const [crop, keywords] of Object.entries(cropKeywords)) {
        if (keywords.some(keyword => query.toLowerCase().includes(keyword))) {
          entities.crops.push(crop);
        }
      }

      // Extract category entities
      const categoryKeywords: Record<string, string[]> = {
        'pest_management': [
          'pest', 'insect', 'control', 'disease', 'कीट', 'नियंत्रण', 'रोग'
        ],
        'organic_farming': [
          'organic', 'natural', 'जैविक', 'प्राकृतिक'
        ],
        'water_management': [
          'water', 'irrigation', 'saving', 'पानी', 'सिंचाई', 'बचत'
        ],
        'soil_conservation': [
          'soil', 'fertility', 'health', 'मिट्टी', 'उर्वरता', 'स्वास्थ्य'
        ],
        'crop_rotation': [
          'rotation', 'sequence', 'फसल', 'चक्र'
        ],
      };

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => query.toLowerCase().includes(keyword))) {
          entities.categories.push(category);
        }
      }

      // Extract tag entities
      const tagKeywords: Record<string, string[]> = {
        'fertilizer': ['fertilizer', 'fertiliser', 'उर्वरक', 'खाद'],
        'natural_methods': ['natural', 'organic', 'प्राकृतिक', 'जैविक'],
        'techniques': ['technique', 'method', 'way', 'तकनीक', 'विधि'],
        'conservation': ['conservation', 'saving', 'संरक्षण', 'बचत'],
        'best_practices': ['best', 'good', 'effective', 'सर्वोत्तम', 'अच्छा'],
      };

      for (const [tag, keywords] of Object.entries(tagKeywords)) {
        if (keywords.some(keyword => query.toLowerCase().includes(keyword))) {
          entities.tags.push(tag);
        }
      }

      return {
        processedQuery,
        entities,
      };
    }

    /**
     * Expand query with synonyms for better matching
     */
    private expandQueryWithSynonyms(query: string): string {
      const synonymMap: Record<string, string[]> = {
        'pest': ['pest', 'insect', 'bug'],
        'paddy': ['paddy', 'rice'],
        'fertilizer': ['fertilizer', 'fertiliser', 'manure'],
        'organic': ['organic', 'natural', 'bio'],
        'water': ['water', 'irrigation', 'moisture'],
        'soil': ['soil', 'earth', 'land'],
        'control': ['control', 'manage', 'prevent'],
        'technique': ['technique', 'method', 'practice', 'way'],
        'save': ['save', 'conserve', 'reduce'],
        'improve': ['improve', 'enhance', 'increase', 'boost'],
      };

      let expandedQuery = query;

      for (const [word, synonyms] of Object.entries(synonymMap)) {
        if (query.includes(word)) {
          // Add synonyms to the query
          expandedQuery += ' ' + synonyms.join(' ');
        }
      }

      return expandedQuery;
    }



  /**
   * Map database row to KnowledgeArticle object
   */
  private mapArticleFromDb(row: any, _preferredLanguage?: SupportedLanguage): KnowledgeArticle {
    const article: KnowledgeArticle = {
      article_id: row.article_id,
      title: typeof row.title === 'string' ? JSON.parse(row.title) : row.title,
      content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
      summary: row.summary ? (typeof row.summary === 'string' ? JSON.parse(row.summary) : row.summary) : undefined,
      category: row.category,
      subcategory: row.subcategory,
      tags: row.tags || [],
      media: typeof row.media === 'string' ? JSON.parse(row.media) : row.media,
      evidence_level: row.evidence_level,
      scientific_references: typeof row.scientific_references === 'string' 
        ? JSON.parse(row.scientific_references) 
        : row.scientific_references,
      implementation_guide: row.implementation_guide 
        ? (typeof row.implementation_guide === 'string' ? JSON.parse(row.implementation_guide) : row.implementation_guide)
        : undefined,
      benefits: row.benefits 
        ? (typeof row.benefits === 'string' ? JSON.parse(row.benefits) : row.benefits)
        : undefined,
      view_count: row.view_count,
      rating_sum: row.rating_sum,
      rating_count: row.rating_count,
      average_rating: row.rating_count > 0 ? row.rating_sum / row.rating_count : 0,
      success_story_count: row.success_story_count,
      verified_by: row.verified_by,
      verification_date: row.verification_date,
      verification_notes: row.verification_notes,
      applicable_crops: row.applicable_crops || [],
      applicable_regions: row.applicable_regions || [],
      applicable_seasons: row.applicable_seasons || [],
      available_languages: row.available_languages || ['en'],
      primary_language: row.primary_language || 'en',
      status: row.status,
      published_at: row.published_at,
      author_id: row.author_id,
      author_type: row.author_type,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    return article;
  }
}
