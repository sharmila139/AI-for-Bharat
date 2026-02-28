/**
 * Unit Tests for Knowledge Base Community Engagement Features
 * Tests for ratings, Q&A, success stories, and voting functionality
 */

import { Pool } from 'pg';
import { KnowledgeBaseService } from '../knowledge-base-service';
import {
  ArticleRating,
  ArticleQuestion,
  ArticleAnswer,
  SuccessStory,
} from '../knowledge-base-types';

// Mock pg Pool
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('KnowledgeBaseService - Community Engagement', () => {
  let service: KnowledgeBaseService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = new Pool();
    service = new KnowledgeBaseService(mockPool);
    jest.clearAllMocks();
  });

  // ============================================================================
  // Article Ratings Tests
  // ============================================================================

  describe('rateArticle', () => {
    it('should create a new rating for an article', async () => {
      const mockRating: ArticleRating = {
        rating_id: 'rating-1',
        article_id: 'article-1',
        user_id: 'user-1',
        rating: 5,
        review_text: 'Very helpful article!',
        implemented: false,
        implementation_date: undefined,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockRating],
        command: 'INSERT',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await service.rateArticle('article-1', 'user-1', 5, 'Very helpful article!');

      expect(result).toEqual(mockRating);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO article_ratings'),
        ['article-1', 'user-1', 5, 'Very helpful article!']
      );
    });

    it('should update existing rating if user already rated', async () => {
      const mockRating: ArticleRating = {
        rating_id: 'rating-1',
        article_id: 'article-1',
        user_id: 'user-1',
        rating: 4,
        review_text: 'Updated review',
        implemented: false,
        implementation_date: undefined,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockRating],
        command: 'INSERT',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await service.rateArticle('article-1', 'user-1', 4, 'Updated review');

      expect(result.rating).toBe(4);
      expect(result.review_text).toBe('Updated review');
    });

    it('should handle rating without review text', async () => {
      const mockRating: ArticleRating = {
        rating_id: 'rating-1',
        article_id: 'article-1',
        user_id: 'user-1',
        rating: 3,
        review_text: undefined,
        implemented: false,
        implementation_date: undefined,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockRating],
        command: 'INSERT',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await service.rateArticle('article-1', 'user-1', 3);

      expect(result.review_text).toBeUndefined();
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['article-1', 'user-1', 3, null]
      );
    });
  });

  describe('getArticleRatings', () => {
    it('should retrieve ratings for an article', async () => {
      const mockRatings: ArticleRating[] = [
        {
          rating_id: 'rating-1',
          article_id: 'article-1',
          user_id: 'user-1',
          rating: 5,
          review_text: 'Excellent!',
          implemented: true,
          implementation_date: new Date('2024-01-15'),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          rating_id: 'rating-2',
          article_id: 'article-1',
          user_id: 'user-2',
          rating: 4,
          review_text: 'Very good',
          implemented: false,
          implementation_date: undefined,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockRatings,
        command: 'SELECT',
        oid: 0,
        fields: [],
        rowCount: 2,
      });

      const result = await service.getArticleRatings('article-1', 10);

      expect(result).toEqual(mockRatings);
      expect(result).toHaveLength(2);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM article_ratings'),
        ['article-1', 10]
      );
    });

    it('should respect limit parameter', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        oid: 0,
        fields: [],
        rowCount: 0,
      });

      await service.getArticleRatings('article-1', 5);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['article-1', 5]
      );
    });
  });

  // ============================================================================
  // Q&A Tests
  // ============================================================================

  describe('askQuestion', () => {
    it('should create a new question', async () => {
      const mockQuestion: ArticleQuestion = {
        question_id: 'question-1',
        article_id: 'article-1',
        user_id: 'user-1',
        question_text: 'How do I implement this technique?',
        is_answered: false,
        upvote_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockQuestion],
        command: 'INSERT',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await service.askQuestion(
        'article-1',
        'user-1',
        'How do I implement this technique?'
      );

      expect(result).toEqual(mockQuestion);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO article_questions'),
        ['article-1', 'user-1', 'How do I implement this technique?']
      );
    });
  });

  describe('answerQuestion', () => {
    it('should create a new answer', async () => {
      const mockAnswer: ArticleAnswer = {
        answer_id: 'answer-1',
        question_id: 'question-1',
        user_id: 'user-2',
        answer_text: 'Here is how you do it...',
        is_expert_answer: false,
        verified_by: undefined,
        upvote_count: 0,
        is_accepted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockAnswer],
        command: 'INSERT',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await service.answerQuestion(
        'question-1',
        'user-2',
        'Here is how you do it...',
        false
      );

      expect(result).toEqual(mockAnswer);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO article_answers'),
        ['question-1', 'user-2', 'Here is how you do it...', false]
      );
    });

    it('should mark answer as expert answer when specified', async () => {
      const mockAnswer: ArticleAnswer = {
        answer_id: 'answer-1',
        question_id: 'question-1',
        user_id: 'expert-1',
        answer_text: 'Expert advice here...',
        is_expert_answer: true,
        verified_by: undefined,
        upvote_count: 0,
        is_accepted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockAnswer],
        command: 'INSERT',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await service.answerQuestion(
        'question-1',
        'expert-1',
        'Expert advice here...',
        true
      );

      expect(result.is_expert_answer).toBe(true);
    });
  });

  describe('getArticleQA', () => {
    it('should retrieve questions with their answers', async () => {
      const mockQuestions = [
        {
          question_id: 'question-1',
          article_id: 'article-1',
          user_id: 'user-1',
          question_text: 'How to start?',
          is_answered: true,
          upvote_count: 5,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mockAnswers = [
        {
          answer_id: 'answer-1',
          question_id: 'question-1',
          user_id: 'user-2',
          answer_text: 'Start by...',
          is_expert_answer: false,
          verified_by: undefined,
          upvote_count: 3,
          is_accepted: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPool.query
        .mockResolvedValueOnce({
          rows: mockQuestions,
          command: 'SELECT',
          oid: 0,
          fields: [],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: mockAnswers,
          command: 'SELECT',
          oid: 0,
          fields: [],
          rowCount: 1,
        });

      const result = await service.getArticleQA('article-1', 10);

      expect(result).toHaveLength(1);
      expect(result[0].question_id).toBe('question-1');
      expect(result[0].answers).toHaveLength(1);
      expect(result[0].answers[0].answer_id).toBe('answer-1');
    });

    it('should return questions with no answers', async () => {
      const mockQuestions = [
        {
          question_id: 'question-1',
          article_id: 'article-1',
          user_id: 'user-1',
          question_text: 'Unanswered question?',
          is_answered: false,
          upvote_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPool.query
        .mockResolvedValueOnce({
          rows: mockQuestions,
          command: 'SELECT',
          oid: 0,
          fields: [],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          command: 'SELECT',
          oid: 0,
          fields: [],
          rowCount: 0,
        });

      const result = await service.getArticleQA('article-1', 10);

      expect(result).toHaveLength(1);
      expect(result[0].answers).toHaveLength(0);
      expect(result[0].is_answered).toBe(false);
    });
  });

  describe('upvoteQuestion', () => {
    it('should increment question upvote count', async () => {
      const mockQuestion: ArticleQuestion = {
        question_id: 'question-1',
        article_id: 'article-1',
        user_id: 'user-1',
        question_text: 'Good question?',
        is_answered: false,
        upvote_count: 6,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockQuestion],
        command: 'UPDATE',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await service.upvoteQuestion('question-1', 'user-2');

      expect(result.upvote_count).toBe(6);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE article_questions'),
        ['question-1']
      );
    });

    it('should throw error if question not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'UPDATE',
        oid: 0,
        fields: [],
        rowCount: 0,
      });

      await expect(service.upvoteQuestion('invalid-id', 'user-1'))
        .rejects.toThrow('Question not found');
    });
  });

  describe('upvoteAnswer', () => {
    it('should increment answer upvote count', async () => {
      const mockAnswer: ArticleAnswer = {
        answer_id: 'answer-1',
        question_id: 'question-1',
        user_id: 'user-2',
        answer_text: 'Helpful answer',
        is_expert_answer: false,
        verified_by: undefined,
        upvote_count: 10,
        is_accepted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockAnswer],
        command: 'UPDATE',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await service.upvoteAnswer('answer-1', 'user-3');

      expect(result.upvote_count).toBe(10);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE article_answers'),
        ['answer-1']
      );
    });

    it('should throw error if answer not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'UPDATE',
        oid: 0,
        fields: [],
        rowCount: 0,
      });

      await expect(service.upvoteAnswer('invalid-id', 'user-1'))
        .rejects.toThrow('Answer not found');
    });
  });

  describe('acceptAnswer', () => {
    it('should accept an answer and unaccept others', async () => {
      const mockVerifyResult = {
        user_id: 'user-1',
        question_id: 'question-1',
      };

      const mockAnswer: ArticleAnswer = {
        answer_id: 'answer-1',
        question_id: 'question-1',
        user_id: 'user-2',
        answer_text: 'Accepted answer',
        is_expert_answer: false,
        verified_by: undefined,
        upvote_count: 5,
        is_accepted: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query
        .mockResolvedValueOnce({
          rows: [mockVerifyResult],
          command: 'SELECT',
          oid: 0,
          fields: [],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          command: 'UPDATE',
          oid: 0,
          fields: [],
          rowCount: 0,
        })
        .mockResolvedValueOnce({
          rows: [mockAnswer],
          command: 'UPDATE',
          oid: 0,
          fields: [],
          rowCount: 1,
        });

      const result = await service.acceptAnswer('answer-1', 'user-1');

      expect(result.is_accepted).toBe(true);
      expect(mockPool.query).toHaveBeenCalledTimes(3);
    });

    it('should throw error if user is not question owner', async () => {
      const mockVerifyResult = {
        user_id: 'user-1',
        question_id: 'question-1',
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockVerifyResult],
        command: 'SELECT',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      await expect(service.acceptAnswer('answer-1', 'user-2'))
        .rejects.toThrow('Only the question owner can accept an answer');
    });

    it('should throw error if answer not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        oid: 0,
        fields: [],
        rowCount: 0,
      });

      await expect(service.acceptAnswer('invalid-id', 'user-1'))
        .rejects.toThrow('Answer not found');
    });
  });

  // ============================================================================
  // Success Stories Tests
  // ============================================================================

  describe('submitSuccessStory', () => {
    it('should create a new success story', async () => {
      const storyInput: Omit<SuccessStory, 'story_id' | 'created_at' | 'updated_at'> = {
        article_id: 'article-1',
        user_id: 'user-1',
        title: { en: 'My Success', hi: 'मेरी सफलता' },
        story_text: { en: 'I implemented this...', hi: 'मैंने इसे लागू किया...' },
        results_achieved: {
          yield_increase: '30%',
          cost_reduction: '25%',
        },
        images: ['image1.jpg', 'image2.jpg'],
        videos: [],
        location_district: 'Pune',
        location_state: 'Maharashtra',
        verified: false,
        verified_by: undefined,
        verification_date: undefined,
        helpful_count: 0,
        status: 'pending',
      };

      const mockStory: SuccessStory = {
        story_id: 'story-1',
        ...storyInput,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockStory],
        command: 'INSERT',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await service.submitSuccessStory(storyInput);

      expect(result.story_id).toBe('story-1');
      expect(result.status).toBe('pending');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO success_stories'),
        expect.arrayContaining([
          'article-1',
          'user-1',
          JSON.stringify(storyInput.title),
          JSON.stringify(storyInput.story_text),
        ])
      );
    });
  });

  describe('getSuccessStories', () => {
    it('should retrieve approved success stories', async () => {
      const mockStories: SuccessStory[] = [
        {
          story_id: 'story-1',
          article_id: 'article-1',
          user_id: 'user-1',
          title: { en: 'Success 1' },
          story_text: { en: 'Story 1' },
          results_achieved: undefined,
          images: [],
          videos: [],
          location_district: 'District 1',
          location_state: 'State 1',
          verified: true,
          verified_by: 'officer-1',
          verification_date: new Date(),
          helpful_count: 10,
          status: 'approved',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockStories,
        command: 'SELECT',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await service.getSuccessStories('article-1', 10);

      expect(result).toEqual(mockStories);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'approved'"),
        ['article-1', 10]
      );
    });
  });

  describe('markStoryHelpful', () => {
    it('should increment helpful count', async () => {
      const mockStory: SuccessStory = {
        story_id: 'story-1',
        article_id: 'article-1',
        user_id: 'user-1',
        title: { en: 'Success' },
        story_text: { en: 'Story' },
        results_achieved: undefined,
        images: [],
        videos: [],
        location_district: undefined,
        location_state: undefined,
        verified: false,
        verified_by: undefined,
        verification_date: undefined,
        helpful_count: 15,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockStory],
        command: 'UPDATE',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await service.markStoryHelpful('story-1', 'user-2');

      expect(result.helpful_count).toBe(15);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE success_stories'),
        ['story-1']
      );
    });

    it('should throw error if story not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'UPDATE',
        oid: 0,
        fields: [],
        rowCount: 0,
      });

      await expect(service.markStoryHelpful('invalid-id', 'user-1'))
        .rejects.toThrow('Success story not found');
    });
  });

  // ============================================================================
  // User Activity Tests
  // ============================================================================

  describe('getUserQuestions', () => {
    it('should retrieve questions by user', async () => {
      const mockQuestions: ArticleQuestion[] = [
        {
          question_id: 'question-1',
          article_id: 'article-1',
          user_id: 'user-1',
          question_text: 'Question 1',
          is_answered: true,
          upvote_count: 5,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          question_id: 'question-2',
          article_id: 'article-2',
          user_id: 'user-1',
          question_text: 'Question 2',
          is_answered: false,
          upvote_count: 2,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockQuestions,
        command: 'SELECT',
        oid: 0,
        fields: [],
        rowCount: 2,
      });

      const result = await service.getUserQuestions('user-1', 20);

      expect(result).toEqual(mockQuestions);
      expect(result).toHaveLength(2);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM article_questions'),
        ['user-1', 20]
      );
    });
  });

  describe('getUserAnswers', () => {
    it('should retrieve answers by user', async () => {
      const mockAnswers: ArticleAnswer[] = [
        {
          answer_id: 'answer-1',
          question_id: 'question-1',
          user_id: 'user-1',
          answer_text: 'Answer 1',
          is_expert_answer: false,
          verified_by: undefined,
          upvote_count: 10,
          is_accepted: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockAnswers,
        command: 'SELECT',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await service.getUserAnswers('user-1', 20);

      expect(result).toEqual(mockAnswers);
      expect(result).toHaveLength(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM article_answers'),
        ['user-1', 20]
      );
    });
  });
});
