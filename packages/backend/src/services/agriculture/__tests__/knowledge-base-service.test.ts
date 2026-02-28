/**
 * Unit Tests for Knowledge Base Service
 */

import { KnowledgeBaseService } from '../knowledge-base-service';
import {
  CreateArticleInput,
  ArticleCategory,
  EvidenceLevel,
  SupportedLanguage,
} from '../knowledge-base-types';

describe('KnowledgeBaseService', () => {
  let service: KnowledgeBaseService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    };
    service = new KnowledgeBaseService(mockPool);
    jest.clearAllMocks();
  });

  describe('createArticle', () => {
    it('should create a new article with required fields', async () => {
      const input: CreateArticleInput = {
        title: { en: 'Organic Pest Control', hi: 'जैविक कीट नियंत्रण' },
        content: { en: 'Use neem oil...', hi: 'नीम का तेल उपयोग करें...' },
        summary: { en: 'Natural pest control methods', hi: 'प्राकृतिक कीट नियंत्रण विधियाँ' },
        category: 'pest_management' as ArticleCategory,
        evidence_level: 'strong' as EvidenceLevel,
        available_languages: ['en', 'hi'] as SupportedLanguage[],
        primary_language: 'en' as SupportedLanguage,
      };

      const mockArticle = {
        article_id: '123e4567-e89b-12d3-a456-426614174000',
        ...input,
        title: JSON.stringify(input.title),
        content: JSON.stringify(input.content),
        summary: JSON.stringify(input.summary),
        tags: [],
        media: { images: [], videos: [], audio: [] },
        scientific_references: [],
        view_count: 0,
        rating_sum: 0,
        rating_count: 0,
        success_story_count: 0,
        applicable_crops: [],
        applicable_regions: [],
        applicable_seasons: [],
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockArticle] } as any);

      const result = await service.createArticle(input, 'user-123');

      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(result.article_id).toBe(mockArticle.article_id);
      expect(result.title).toEqual(input.title);
      expect(result.status).toBe('draft');
    });

    it('should create article with implementation guide', async () => {
      const input: CreateArticleInput = {
        title: { en: 'Composting Guide' },
        content: { en: 'How to make compost...' },
        category: 'organic_farming' as ArticleCategory,
        evidence_level: 'moderate' as EvidenceLevel,
        implementation_guide: {
          steps: [
            {
              step: 1,
              description: { en: 'Collect organic waste' },
              duration: '10 minutes',
            },
          ],
          materials: [
            {
              name: { en: 'Organic waste' },
              quantity: '5 kg',
            },
          ],
          tools: [
            {
              name: { en: 'Compost bin' },
            },
          ],
          timeline: '3 months',
        },
        available_languages: ['en'],
        primary_language: 'en' as SupportedLanguage,
      };

      const mockArticle = {
        article_id: '123e4567-e89b-12d3-a456-426614174001',
        ...input,
        title: JSON.stringify(input.title),
        content: JSON.stringify(input.content),
        implementation_guide: JSON.stringify(input.implementation_guide),
        tags: [],
        media: { images: [], videos: [], audio: [] },
        scientific_references: [],
        view_count: 0,
        rating_sum: 0,
        rating_count: 0,
        success_story_count: 0,
        applicable_crops: [],
        applicable_regions: [],
        applicable_seasons: [],
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockArticle] } as any);

      const result = await service.createArticle(input, 'user-123');

      expect(result.implementation_guide).toBeDefined();
      expect(result.implementation_guide?.steps).toHaveLength(1);
      expect(result.implementation_guide?.materials).toHaveLength(1);
    });
  });

  describe('getArticleById', () => {
    it('should return article by ID', async () => {
      const mockArticle = {
        article_id: '123e4567-e89b-12d3-a456-426614174000',
        title: JSON.stringify({ en: 'Test Article' }),
        content: JSON.stringify({ en: 'Test content' }),
        category: 'organic_farming',
        evidence_level: 'strong',
        tags: [],
        media: { images: [], videos: [], audio: [] },
        scientific_references: [],
        view_count: 10,
        rating_sum: 20,
        rating_count: 5,
        success_story_count: 2,
        applicable_crops: [],
        applicable_regions: [],
        applicable_seasons: [],
        available_languages: ['en'],
        primary_language: 'en',
        status: 'published',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockArticle] } as any);
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any); // For view count update

      const result = await service.getArticleById('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toBeDefined();
      expect(result?.article_id).toBe(mockArticle.article_id);
      expect(result?.view_count).toBe(10);
      expect(result?.average_rating).toBe(4); // 20/5
    });

    it('should return null for non-existent article', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.getArticleById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('searchArticles', () => {
    it('should search articles with filters', async () => {
      const mockArticles = [
        {
          article_id: '1',
          title: JSON.stringify({ en: 'Article 1' }),
          content: JSON.stringify({ en: 'Content 1' }),
          category: 'pest_management',
          evidence_level: 'strong',
          tags: ['organic'],
          media: { images: [], videos: [], audio: [] },
          scientific_references: [],
          view_count: 100,
          rating_sum: 40,
          rating_count: 10,
          success_story_count: 5,
          applicable_crops: ['rice'],
          applicable_regions: ['punjab'],
          applicable_seasons: ['kharif'],
          available_languages: ['en', 'hi'],
          primary_language: 'en',
          status: 'published',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: [{ total: '1' }] } as any);
      mockPool.query.mockResolvedValueOnce({ rows: mockArticles } as any);

      const result = await service.searchArticles({
        filters: {
          category: 'pest_management' as ArticleCategory,
          tags: ['organic'],
        },
        page: 1,
        limit: 20,
      });

      expect(result.articles).toHaveLength(1);
      expect(result.total_count).toBe(1);
      expect(result.page).toBe(1);
      expect(result.has_more).toBe(false);
    });

    it('should search with natural language query', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ total: '0' }] } as any);
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.searchArticles({
        query: 'organic pest control',
        page: 1,
        limit: 20,
      });

      expect(result.articles).toHaveLength(0);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should extract crop entities from natural language query', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ total: '0' }] } as any);
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      await service.searchArticles({
        query: 'How to control pests in rice naturally?',
        page: 1,
        limit: 20,
      });

      // Verify that the query was processed and entities extracted
      expect(mockPool.query).toHaveBeenCalledTimes(2);
      const queryCall = mockPool.query.mock.calls[0];
      expect(queryCall[0]).toContain('applicable_crops');
    });

    it('should handle Hindi language queries', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ total: '0' }] } as any);
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      await service.searchArticles({
        query: 'धान में कीट नियंत्रण',
        page: 1,
        limit: 20,
      });

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      // Verify that Hindi text search configuration is used
      const queryCall = mockPool.query.mock.calls[0];
      expect(queryCall[0]).toContain("to_tsvector('simple'");
    });

    it('should apply relevance ranking with multiple factors', async () => {
      const mockArticles = [
        {
          article_id: '1',
          title: JSON.stringify({ en: 'Organic Pest Control in Rice' }),
          content: JSON.stringify({ en: 'Natural methods for pest control...' }),
          category: 'pest_management',
          evidence_level: 'strong',
          tags: ['organic', 'natural_methods'],
          media: { images: [], videos: [], audio: [] },
          scientific_references: [],
          view_count: 500,
          rating_sum: 45,
          rating_count: 10,
          success_story_count: 8,
          applicable_crops: ['rice'],
          applicable_regions: [],
          applicable_seasons: [],
          available_languages: ['en', 'hi'],
          primary_language: 'en',
          status: 'published',
          published_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: [{ total: '1' }] } as any);
      mockPool.query.mockResolvedValueOnce({ rows: mockArticles } as any);

      const result = await service.searchArticles({
        query: 'organic pest control rice',
        sort_by: 'relevance',
        page: 1,
        limit: 20,
      });

      expect(result.articles).toHaveLength(1);
      // Verify that ranking expression includes multiple factors
      const queryCall = mockPool.query.mock.calls[1];
      expect(queryCall[0]).toContain('ts_rank');
      expect(queryCall[0]).toContain('evidence_level');
      expect(queryCall[0]).toContain('published_at');
      expect(queryCall[0]).toContain('rating_sum');
      expect(queryCall[0]).toContain('view_count');
    });

    it('should expand query with synonyms', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ total: '0' }] } as any);
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      await service.searchArticles({
        query: 'pest control',
        page: 1,
        limit: 20,
      });

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      // The query should be expanded with synonyms
      const queryCall = mockPool.query.mock.calls[0];
      const queryParams = queryCall[1];
      // Check that the expanded query includes synonyms
      expect(queryParams.some((param: string) => 
        typeof param === 'string' && param.includes('insect')
      )).toBe(true);
    });

    it('should extract category from conversational query', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ total: '0' }] } as any);
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      await service.searchArticles({
        query: 'Best organic fertilizer for wheat',
        page: 1,
        limit: 20,
      });

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      // Verify that category filter is applied
      const queryCall = mockPool.query.mock.calls[0];
      expect(queryCall[0]).toContain('category = ANY');
    });

    it('should handle water management queries', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ total: '0' }] } as any);
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      await service.searchArticles({
        query: 'Water saving techniques',
        page: 1,
        limit: 20,
      });

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      const queryCall = mockPool.query.mock.calls[0];
      // Should extract water_management category
      expect(queryCall[0]).toContain('category = ANY');
    });

    it('should prioritize title matches over content matches', async () => {
      const mockArticles = [
        {
          article_id: '1',
          title: JSON.stringify({ en: 'Pest Control Methods' }),
          content: JSON.stringify({ en: 'Various techniques...' }),
          category: 'pest_management',
          evidence_level: 'strong',
          tags: [],
          media: { images: [], videos: [], audio: [] },
          scientific_references: [],
          view_count: 100,
          rating_sum: 20,
          rating_count: 5,
          success_story_count: 2,
          applicable_crops: [],
          applicable_regions: [],
          applicable_seasons: [],
          available_languages: ['en'],
          primary_language: 'en',
          status: 'published',
          published_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: [{ total: '1' }] } as any);
      mockPool.query.mockResolvedValueOnce({ rows: mockArticles } as any);

      await service.searchArticles({
        query: 'pest control',
        sort_by: 'relevance',
        page: 1,
        limit: 20,
      });

      const queryCall = mockPool.query.mock.calls[1];
      // Verify title has 4x weight
      expect(queryCall[0]).toContain('4.0 * ts_rank');
    });

    it('should apply evidence level bonus in ranking', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ total: '0' }] } as any);
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      await service.searchArticles({
        query: 'organic farming',
        sort_by: 'relevance',
        page: 1,
        limit: 20,
      });

      const queryCall = mockPool.query.mock.calls[1];
      // Verify evidence level bonus is applied
      expect(queryCall[0]).toContain("WHEN 'strong' THEN 0.3");
      expect(queryCall[0]).toContain("WHEN 'moderate' THEN 0.2");
      expect(queryCall[0]).toContain("WHEN 'traditional' THEN 0.1");
    });

    it('should apply recency bonus for recent articles', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ total: '0' }] } as any);
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      await service.searchArticles({
        query: 'farming techniques',
        sort_by: 'relevance',
        page: 1,
        limit: 20,
      });

      const queryCall = mockPool.query.mock.calls[1];
      // Verify recency bonus is applied
      expect(queryCall[0]).toContain("INTERVAL '30 days'");
      expect(queryCall[0]).toContain("INTERVAL '90 days'");
    });

    it('should handle multi-language content search', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ total: '0' }] } as any);
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      await service.searchArticles({
        query: 'pest control',
        language: 'hi' as SupportedLanguage,
        page: 1,
        limit: 20,
      });

      const queryCall = mockPool.query.mock.calls[0];
      // Should search both English and Hindi content
      expect(queryCall[0]).toContain("title->>'en'");
      expect(queryCall[0]).toContain("title->>'hi'");
      expect(queryCall[0]).toContain("content->>'en'");
      expect(queryCall[0]).toContain("content->>'hi'");
    });
  });

  describe('rateArticle', () => {
    it('should add rating to article', async () => {
      const mockRating = {
        rating_id: 'rating-123',
        article_id: 'article-123',
        user_id: 'user-123',
        rating: 5,
        review_text: 'Very helpful!',
        implemented: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockRating] } as any);

      const result = await service.rateArticle('article-123', 'user-123', 5, 'Very helpful!');

      expect(result.rating).toBe(5);
      expect(result.review_text).toBe('Very helpful!');
    });
  });

  describe('verifyArticle', () => {
    it('should verify article by extension officer', async () => {
      const mockArticle = {
        article_id: 'article-123',
        title: JSON.stringify({ en: 'Test Article' }),
        content: JSON.stringify({ en: 'Test content' }),
        category: 'organic_farming',
        evidence_level: 'strong',
        verified_by: 'officer-123',
        verification_date: new Date(),
        verification_notes: 'Verified by expert',
        tags: [],
        media: { images: [], videos: [], audio: [] },
        scientific_references: [],
        view_count: 0,
        rating_sum: 0,
        rating_count: 0,
        success_story_count: 0,
        applicable_crops: [],
        applicable_regions: [],
        applicable_seasons: [],
        available_languages: ['en'],
        primary_language: 'en',
        status: 'published',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockArticle] } as any);

      const result = await service.verifyArticle({
        article_id: 'article-123',
        verified_by: 'officer-123',
        verification_notes: 'Verified by expert',
      });

      expect(result.verified_by).toBe('officer-123');
      expect(result.verification_notes).toBe('Verified by expert');
    });
  });

  describe('publishArticle', () => {
    it('should publish article', async () => {
      const mockArticle = {
        article_id: 'article-123',
        title: JSON.stringify({ en: 'Test Article' }),
        content: JSON.stringify({ en: 'Test content' }),
        category: 'organic_farming',
        evidence_level: 'strong',
        status: 'published',
        published_at: new Date(),
        tags: [],
        media: { images: [], videos: [], audio: [] },
        scientific_references: [],
        view_count: 0,
        rating_sum: 0,
        rating_count: 0,
        success_story_count: 0,
        applicable_crops: [],
        applicable_regions: [],
        applicable_seasons: [],
        available_languages: ['en'],
        primary_language: 'en',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockArticle] } as any);

      const result = await service.publishArticle({ article_id: 'article-123' });

      expect(result.status).toBe('published');
      expect(result.published_at).toBeDefined();
    });
  });

  describe('getKnowledgeBaseStats', () => {
    it('should return knowledge base statistics', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            total_articles: '100',
            published_articles: '80',
            verified_articles: '60',
            total_views: '5000',
            total_ratings: '500',
            average_rating: '4.2',
            total_success_stories: '50',
          },
        ],
      } as any);

      mockPool.query.mockResolvedValueOnce({
        rows: [
          { category: 'organic_farming', count: '30' },
          { category: 'pest_management', count: '25' },
        ],
      } as any);

      mockPool.query.mockResolvedValueOnce({
        rows: [
          { evidence_level: 'strong', count: '40' },
          { evidence_level: 'moderate', count: '30' },
        ],
      } as any);

      mockPool.query.mockResolvedValueOnce({
        rows: [
          { language: 'en', count: '80' },
          { language: 'hi', count: '60' },
        ],
      } as any);

      const result = await service.getKnowledgeBaseStats();

      expect(result.total_articles).toBe(100);
      expect(result.published_articles).toBe(80);
      expect(result.verified_articles).toBe(60);
      expect(result.total_views).toBe(5000);
      expect(result.average_rating).toBe(4.2);
    });
  });
});
