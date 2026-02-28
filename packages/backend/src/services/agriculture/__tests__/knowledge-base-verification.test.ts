/**
 * Unit Tests for Knowledge Base Verification Workflow
 * Tests verification operations for agricultural officers
 */

import { Pool, QueryResult } from 'pg';
import { KnowledgeBaseService } from '../knowledge-base-service';
import {
  SuccessStory,
  ArticleAnswer,
} from '../knowledge-base-types';

// Mock pg Pool
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('KnowledgeBaseService - Verification Workflow', () => {
  let service: KnowledgeBaseService;
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    mockPool = new Pool() as jest.Mocked<Pool>;
    service = new KnowledgeBaseService(mockPool);
    jest.clearAllMocks();
  });

  describe('verifyArticle', () => {
    it('should verify an article with verification notes', async () => {
      const mockArticle = {
        article_id: 'article-123',
        title: JSON.stringify({ en: 'Test Article' }),
        content: JSON.stringify({ en: 'Test content' }),
        category: 'organic_farming',
        evidence_level: 'moderate',
        scientific_references: JSON.stringify([]),
        tags: [],
        media: JSON.stringify({ images: [], videos: [], audio: [] }),
        view_count: 0,
        rating_sum: 0,
        rating_count: 0,
        success_story_count: 0,
        verified_by: 'officer-123',
        verification_date: new Date(),
        verification_notes: 'Approved after review',
        applicable_crops: [],
        applicable_regions: [],
        applicable_seasons: [],
        available_languages: ['en'],
        primary_language: 'en',
        status: 'published',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockArticle],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await service.verifyArticle({
        article_id: 'article-123',
        verified_by: 'officer-123',
        verification_notes: 'Approved after review',
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE knowledge_articles'),
        ['officer-123', 'Approved after review', 'article-123']
      );
      expect(result.article_id).toBe('article-123');
      expect(result.verified_by).toBe('officer-123');
    });

    it('should verify an article without verification notes', async () => {
      const mockArticle = {
        article_id: 'article-123',
        title: JSON.stringify({ en: 'Test Article' }),
        content: JSON.stringify({ en: 'Test content' }),
        category: 'organic_farming',
        evidence_level: 'moderate',
        scientific_references: JSON.stringify([]),
        tags: [],
        media: JSON.stringify({ images: [], videos: [], audio: [] }),
        view_count: 0,
        rating_sum: 0,
        rating_count: 0,
        success_story_count: 0,
        verified_by: 'officer-123',
        verification_date: new Date(),
        verification_notes: null,
        applicable_crops: [],
        applicable_regions: [],
        applicable_seasons: [],
        available_languages: ['en'],
        primary_language: 'en',
        status: 'published',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockArticle],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await service.verifyArticle({
        article_id: 'article-123',
        verified_by: 'officer-123',
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE knowledge_articles'),
        ['officer-123', null, 'article-123']
      );
      expect(result.verified_by).toBe('officer-123');
    });
  });

  describe('rejectArticle', () => {
    it('should reject an article with rejection reason', async () => {
      const mockArticle = {
        article_id: 'article-123',
        title: JSON.stringify({ en: 'Test Article' }),
        content: JSON.stringify({ en: 'Test content' }),
        category: 'organic_farming',
        evidence_level: 'moderate',
        scientific_references: JSON.stringify([]),
        tags: [],
        media: JSON.stringify({ images: [], videos: [], audio: [] }),
        view_count: 0,
        rating_sum: 0,
        rating_count: 0,
        success_story_count: 0,
        verified_by: null,
        verification_date: null,
        verification_notes: 'Rejected by officer-123: Insufficient evidence',
        applicable_crops: [],
        applicable_regions: [],
        applicable_seasons: [],
        available_languages: ['en'],
        primary_language: 'en',
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockArticle],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await service.rejectArticle(
        'article-123',
        'officer-123',
        'Insufficient evidence'
      );

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE knowledge_articles'),
        [expect.stringContaining('Rejected by officer-123: Insufficient evidence'), 'article-123']
      );
      expect(result.status).toBe('draft');
      expect(result.verification_notes).toContain('Rejected');
    });
  });

  describe('verifyAnswer', () => {
    it('should verify an answer as expert-reviewed', async () => {
      const mockAnswer: ArticleAnswer = {
        answer_id: 'answer-123',
        question_id: 'question-123',
        user_id: 'user-123',
        answer_text: 'This is an expert answer',
        is_expert_answer: true,
        verified_by: 'officer-123',
        upvote_count: 0,
        is_accepted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockAnswer],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await service.verifyAnswer('answer-123', 'officer-123');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE article_answers'),
        ['officer-123', 'answer-123']
      );
      expect(result.verified_by).toBe('officer-123');
      expect(result.is_expert_answer).toBe(true);
    });

    it('should throw error if answer not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        command: 'UPDATE',
        rowCount: 0,
        oid: 0,
        fields: [],
      } as QueryResult);

      await expect(
        service.verifyAnswer('nonexistent-answer', 'officer-123')
      ).rejects.toThrow('Answer not found');
    });
  });

  describe('verifySuccessStory', () => {
    it('should verify and approve a success story', async () => {
      const mockStory: SuccessStory = {
        story_id: 'story-123',
        article_id: 'article-123',
        user_id: 'user-123',
        title: { en: 'My Success Story' },
        story_text: { en: 'This technique worked great!' },
        images: [],
        videos: [],
        verified: true,
        verified_by: 'officer-123',
        verification_date: new Date(),
        helpful_count: 0,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockStory],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await service.verifySuccessStory(
        'story-123',
        'officer-123',
        'Great story with good evidence'
      );

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE success_stories'),
        ['officer-123', 'story-123']
      );
      expect(result.verified).toBe(true);
      expect(result.status).toBe('approved');
      expect(result.verified_by).toBe('officer-123');
    });

    it('should throw error if success story not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        command: 'UPDATE',
        rowCount: 0,
        oid: 0,
        fields: [],
      } as QueryResult);

      await expect(
        service.verifySuccessStory('nonexistent-story', 'officer-123')
      ).rejects.toThrow('Success story not found');
    });
  });

  describe('rejectSuccessStory', () => {
    it('should reject a success story with reason', async () => {
      const mockStory: SuccessStory = {
        story_id: 'story-123',
        article_id: 'article-123',
        user_id: 'user-123',
        title: { en: 'My Success Story' },
        story_text: { en: 'This technique worked great!' },
        images: [],
        videos: [],
        verified: false,
        verified_by: 'officer-123',
        verification_date: new Date(),
        helpful_count: 0,
        status: 'rejected',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockStory],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await service.rejectSuccessStory(
        'story-123',
        'officer-123',
        'Lacks sufficient evidence'
      );

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE success_stories'),
        ['officer-123', 'story-123']
      );
      expect(result.status).toBe('rejected');
      expect(result.verified).toBe(false);
    });

    it('should throw error if success story not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        command: 'UPDATE',
        rowCount: 0,
        oid: 0,
        fields: [],
      } as QueryResult);

      await expect(
        service.rejectSuccessStory('nonexistent-story', 'officer-123', 'reason')
      ).rejects.toThrow('Success story not found');
    });
  });

  describe('getPendingVerificationItems', () => {
    it('should return all pending verification items', async () => {
      const mockArticle = {
        article_id: 'article-123',
        title: JSON.stringify({ en: 'Pending Article' }),
        content: JSON.stringify({ en: 'Content' }),
        category: 'organic_farming',
        evidence_level: 'moderate',
        scientific_references: JSON.stringify([]),
        tags: [],
        media: JSON.stringify({ images: [], videos: [], audio: [] }),
        view_count: 0,
        rating_sum: 0,
        rating_count: 0,
        success_story_count: 0,
        verified_by: null,
        verification_date: null,
        verification_notes: null,
        applicable_crops: [],
        applicable_regions: [],
        applicable_seasons: [],
        available_languages: ['en'],
        primary_language: 'en',
        status: 'review',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockStory: SuccessStory = {
        story_id: 'story-123',
        article_id: 'article-123',
        user_id: 'user-123',
        title: { en: 'Pending Story' },
        story_text: { en: 'Story content' },
        images: [],
        videos: [],
        verified: false,
        helpful_count: 0,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockAnswer: ArticleAnswer = {
        answer_id: 'answer-123',
        question_id: 'question-123',
        user_id: 'user-123',
        answer_text: 'Expert answer',
        is_expert_answer: true,
        verified_by: undefined,
        upvote_count: 0,
        is_accepted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock three queries: articles, stories, answers
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [mockArticle],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        } as QueryResult)
        .mockResolvedValueOnce({
          rows: [mockStory],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        } as QueryResult)
        .mockResolvedValueOnce({
          rows: [mockAnswer],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        } as QueryResult);

      const result = await service.getPendingVerificationItems();

      expect(result.articles).toHaveLength(1);
      expect(result.success_stories).toHaveLength(1);
      expect(result.answers).toHaveLength(1);
      expect(result.articles[0].status).toBe('review');
      expect(result.success_stories[0].status).toBe('pending');
      expect(result.answers[0].is_expert_answer).toBe(true);
    });

    it('should return empty arrays when no pending items', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] } as QueryResult)
        .mockResolvedValueOnce({ rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] } as QueryResult)
        .mockResolvedValueOnce({ rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] } as QueryResult);

      const result = await service.getPendingVerificationItems();

      expect(result.articles).toHaveLength(0);
      expect(result.success_stories).toHaveLength(0);
      expect(result.answers).toHaveLength(0);
    });
  });

  describe('getVerificationHistory', () => {
    it('should return verification history for an officer', async () => {
      const mockArticle = {
        article_id: 'article-123',
        title: JSON.stringify({ en: 'Verified Article' }),
        content: JSON.stringify({ en: 'Content' }),
        category: 'organic_farming',
        evidence_level: 'moderate',
        scientific_references: JSON.stringify([]),
        tags: [],
        media: JSON.stringify({ images: [], videos: [], audio: [] }),
        view_count: 0,
        rating_sum: 0,
        rating_count: 0,
        success_story_count: 0,
        verified_by: 'officer-123',
        verification_date: new Date(),
        verification_notes: 'Approved',
        applicable_crops: [],
        applicable_regions: [],
        applicable_seasons: [],
        available_languages: ['en'],
        primary_language: 'en',
        status: 'published',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockStory: SuccessStory = {
        story_id: 'story-123',
        article_id: 'article-123',
        user_id: 'user-123',
        title: { en: 'Verified Story' },
        story_text: { en: 'Story content' },
        images: [],
        videos: [],
        verified: true,
        verified_by: 'officer-123',
        verification_date: new Date(),
        helpful_count: 0,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockAnswer: ArticleAnswer = {
        answer_id: 'answer-123',
        question_id: 'question-123',
        user_id: 'user-123',
        answer_text: 'Verified answer',
        is_expert_answer: true,
        verified_by: 'officer-123',
        upvote_count: 0,
        is_accepted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [mockArticle],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        } as QueryResult)
        .mockResolvedValueOnce({
          rows: [mockStory],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        } as QueryResult)
        .mockResolvedValueOnce({
          rows: [mockAnswer],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        } as QueryResult);

      const result = await service.getVerificationHistory('officer-123', 50);

      expect(result.verified_articles).toHaveLength(1);
      expect(result.verified_stories).toHaveLength(1);
      expect(result.verified_answers).toHaveLength(1);
      expect(result.verified_articles[0].verified_by).toBe('officer-123');
      expect(result.verified_stories[0].verified_by).toBe('officer-123');
      expect(result.verified_answers[0].verified_by).toBe('officer-123');
    });
  });

  describe('getVerificationStats', () => {
    it('should return verification statistics for an officer', async () => {
      const mockStats = {
        total_articles: '15',
        total_stories: '8',
        total_answers: '12',
        articles_this_month: '3',
        stories_this_month: '2',
        answers_this_month: '4',
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockStats],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await service.getVerificationStats('officer-123');

      expect(result.total_articles_verified).toBe(15);
      expect(result.total_stories_verified).toBe(8);
      expect(result.total_answers_verified).toBe(12);
      expect(result.articles_this_month).toBe(3);
      expect(result.stories_this_month).toBe(2);
      expect(result.answers_this_month).toBe(4);
    });

    it('should handle zero statistics', async () => {
      const mockStats = {
        total_articles: '0',
        total_stories: '0',
        total_answers: '0',
        articles_this_month: '0',
        stories_this_month: '0',
        answers_this_month: '0',
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockStats],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await service.getVerificationStats('new-officer');

      expect(result.total_articles_verified).toBe(0);
      expect(result.total_stories_verified).toBe(0);
      expect(result.total_answers_verified).toBe(0);
      expect(result.articles_this_month).toBe(0);
      expect(result.stories_this_month).toBe(0);
      expect(result.answers_this_month).toBe(0);
    });
  });
});
