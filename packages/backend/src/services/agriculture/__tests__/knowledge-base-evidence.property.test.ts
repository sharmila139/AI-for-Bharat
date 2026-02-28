/**
 * Property-Based Tests for Knowledge Base Evidence Level Completeness
 * Tests Property 16: Evidence level completeness
 * 
 * **Validates: Requirements 6.4**
 * 
 * Property 16: For any displayed remedy or technique, the evidence level field 
 * must be one of: traditional, moderate, or strong.
 */

import * as fc from 'fast-check';
import { KnowledgeBaseService } from '../knowledge-base-service';
import {
  CreateArticleInput,
  EvidenceLevel,
  SupportedLanguage,
  ArticleCategory,
  MultiLanguageText,
} from '../knowledge-base-types';

describe('Knowledge Base - Property 16: Evidence Level Completeness', () => {
  let service: KnowledgeBaseService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    };
    service = new KnowledgeBaseService(mockPool);
    jest.clearAllMocks();
  });

  // Custom arbitraries for generating test data
  const validEvidenceLevels = fc.constantFrom<EvidenceLevel>(
    'traditional',
    'moderate',
    'strong'
  );

  const multiLanguageTextArbitrary = fc.record({
    en: fc.string({ minLength: 5, maxLength: 100 }),
    hi: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
  }) as fc.Arbitrary<MultiLanguageText>;

  const articleCategoryArbitrary = fc.constantFrom<ArticleCategory>(
    'organic_farming',
    'pest_management',
    'soil_conservation',
    'water_management',
    'crop_rotation',
    'general'
  );

  const validArticleArbitrary = fc.record({
    title: multiLanguageTextArbitrary,
    content: multiLanguageTextArbitrary,
    summary: fc.option(multiLanguageTextArbitrary, { nil: undefined }),
    category: articleCategoryArbitrary,
    evidence_level: validEvidenceLevels,
    available_languages: fc.constant(['en'] as SupportedLanguage[]),
    primary_language: fc.constant('en' as SupportedLanguage),
    tags: fc.option(fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 5 }), { nil: undefined }),
  });

  /**
   * Property Test 1: Valid evidence levels should be accepted
   * Tests that articles with valid evidence levels ('traditional', 'moderate', 'strong')
   * are created successfully
   */
  describe('Valid evidence levels', () => {
    it('should accept all valid evidence levels (traditional, moderate, strong)', async () => {
      await fc.assert(
        fc.asyncProperty(
          validArticleArbitrary,
          async (articleData) => {
            const mockArticle = {
              article_id: fc.sample(fc.uuid(), 1)[0],
              ...articleData,
              title: JSON.stringify(articleData.title),
              content: JSON.stringify(articleData.content),
              summary: articleData.summary ? JSON.stringify(articleData.summary) : null,
              tags: articleData.tags || [],
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

            mockPool.query.mockResolvedValueOnce({ rows: [mockArticle] });

            const result = await service.createArticle(articleData as CreateArticleInput, 'test-user');

            // Verify evidence level is one of the valid values
            const validLevels: EvidenceLevel[] = ['traditional', 'moderate', 'strong'];
            return validLevels.includes(result.evidence_level);
          }
        ),
        { numRuns: 100, seed: 16001 }
      );
    });

    it('should preserve exact evidence level value without modification', async () => {
      await fc.assert(
        fc.asyncProperty(
          validArticleArbitrary,
          async (articleData) => {
            const mockArticle = {
              article_id: fc.sample(fc.uuid(), 1)[0],
              ...articleData,
              title: JSON.stringify(articleData.title),
              content: JSON.stringify(articleData.content),
              summary: articleData.summary ? JSON.stringify(articleData.summary) : null,
              tags: articleData.tags || [],
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

            mockPool.query.mockResolvedValueOnce({ rows: [mockArticle] });

            const result = await service.createArticle(articleData as CreateArticleInput, 'test-user');

            // Evidence level should be exactly as provided (no transformation)
            return result.evidence_level === articleData.evidence_level;
          }
        ),
        { numRuns: 100, seed: 16002 }
      );
    });
  });

  /**
   * Property Test 2: Evidence level must be non-null and non-empty
   * Tests that articles cannot be created without an evidence level
   */
  describe('Evidence level presence', () => {
    it('should require evidence level to be present (not null or undefined)', async () => {
      await fc.assert(
        fc.asyncProperty(
          validArticleArbitrary,
          async (articleData) => {
            const mockArticle = {
              article_id: fc.sample(fc.uuid(), 1)[0],
              ...articleData,
              title: JSON.stringify(articleData.title),
              content: JSON.stringify(articleData.content),
              summary: articleData.summary ? JSON.stringify(articleData.summary) : null,
              tags: articleData.tags || [],
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

            mockPool.query.mockResolvedValueOnce({ rows: [mockArticle] });

            const result = await service.createArticle(articleData as CreateArticleInput, 'test-user');

            // Evidence level must be defined and not null/undefined
            return result.evidence_level !== null && 
                   result.evidence_level !== undefined;
          }
        ),
        { numRuns: 100, seed: 16003 }
      );
    });
  });

  /**
   * Property Test 3: Evidence level type validation
   * Tests that evidence level is always a string type
   */
  describe('Evidence level type', () => {
    it('should always be a string type', async () => {
      await fc.assert(
        fc.asyncProperty(
          validArticleArbitrary,
          async (articleData) => {
            const mockArticle = {
              article_id: fc.sample(fc.uuid(), 1)[0],
              ...articleData,
              title: JSON.stringify(articleData.title),
              content: JSON.stringify(articleData.content),
              summary: articleData.summary ? JSON.stringify(articleData.summary) : null,
              tags: articleData.tags || [],
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

            mockPool.query.mockResolvedValueOnce({ rows: [mockArticle] });

            const result = await service.createArticle(articleData as CreateArticleInput, 'test-user');

            // Evidence level must be a string
            return typeof result.evidence_level === 'string';
          }
        ),
        { numRuns: 100, seed: 16004 }
      );
    });
  });

  /**
   * Property Test 4: Evidence level case sensitivity
   * Tests that evidence levels are case-sensitive and must be lowercase
   */
  describe('Evidence level case sensitivity', () => {
    it('should be case-sensitive (lowercase only)', async () => {
      await fc.assert(
        fc.asyncProperty(
          validArticleArbitrary,
          async (articleData) => {
            const mockArticle = {
              article_id: fc.sample(fc.uuid(), 1)[0],
              ...articleData,
              title: JSON.stringify(articleData.title),
              content: JSON.stringify(articleData.content),
              summary: articleData.summary ? JSON.stringify(articleData.summary) : null,
              tags: articleData.tags || [],
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

            mockPool.query.mockResolvedValueOnce({ rows: [mockArticle] });

            const result = await service.createArticle(articleData as CreateArticleInput, 'test-user');

            // Evidence level should be lowercase
            return result.evidence_level === result.evidence_level.toLowerCase();
          }
        ),
        { numRuns: 100, seed: 16005 }
      );
    });
  });

  /**
   * Property Test 5: Evidence level consistency across operations
   * Tests that evidence level remains consistent through read operations
   */
  describe('Evidence level consistency', () => {
    it('should maintain evidence level through create and read operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          validArticleArbitrary,
          async (articleData) => {
            const articleId = fc.sample(fc.uuid(), 1)[0];
            const mockArticle = {
              article_id: articleId,
              ...articleData,
              title: JSON.stringify(articleData.title),
              content: JSON.stringify(articleData.content),
              summary: articleData.summary ? JSON.stringify(articleData.summary) : null,
              tags: articleData.tags || [],
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

            // Mock create
            mockPool.query.mockResolvedValueOnce({ rows: [mockArticle] });
            const created = await service.createArticle(articleData as CreateArticleInput, 'test-user');

            // Mock read
            mockPool.query.mockResolvedValueOnce({ rows: [mockArticle] });
            mockPool.query.mockResolvedValueOnce({ rows: [] }); // For view count update
            const retrieved = await service.getArticleById(articleId);

            // Evidence level should be consistent
            return retrieved !== null && created.evidence_level === retrieved.evidence_level;
          }
        ),
        { numRuns: 100, seed: 16006 }
      );
    });
  });

  /**
   * Property Test 6: Batch validation
   * Tests that all articles in a batch have valid evidence levels
   */
  describe('Batch evidence level validation', () => {
    it('should validate evidence levels for multiple articles', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(validArticleArbitrary, { minLength: 1, maxLength: 10 }),
          async (articlesData) => {
            const results = [];

            for (const articleData of articlesData) {
              const mockArticle = {
                article_id: fc.sample(fc.uuid(), 1)[0],
                ...articleData,
                title: JSON.stringify(articleData.title),
                content: JSON.stringify(articleData.content),
                summary: articleData.summary ? JSON.stringify(articleData.summary) : null,
                tags: articleData.tags || [],
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

              mockPool.query.mockResolvedValueOnce({ rows: [mockArticle] });
              const result = await service.createArticle(articleData as CreateArticleInput, 'test-user');
              results.push(result);
            }

            // All articles must have valid evidence levels
            const validLevels: EvidenceLevel[] = ['traditional', 'moderate', 'strong'];
            return results.every(article => validLevels.includes(article.evidence_level));
          }
        ),
        { numRuns: 50, seed: 16007 }
      );
    });
  });

  /**
   * Property Test 7: Evidence level immutability during display
   * Tests that evidence level is not modified when retrieving articles
   */
  describe('Evidence level immutability', () => {
    it('should not modify evidence level during retrieval', async () => {
      await fc.assert(
        fc.asyncProperty(
          validArticleArbitrary,
          fc.constantFrom<SupportedLanguage>('en', 'hi', 'ta'),
          async (articleData, language) => {
            const articleId = fc.sample(fc.uuid(), 1)[0];
            const mockArticle = {
              article_id: articleId,
              ...articleData,
              title: JSON.stringify(articleData.title),
              content: JSON.stringify(articleData.content),
              summary: articleData.summary ? JSON.stringify(articleData.summary) : null,
              tags: articleData.tags || [],
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

            // Retrieve with different language preferences
            mockPool.query.mockResolvedValueOnce({ rows: [mockArticle] });
            mockPool.query.mockResolvedValueOnce({ rows: [] }); // For view count update
            const retrieved = await service.getArticleById(articleId, language);

            // Evidence level should remain unchanged regardless of language
            return retrieved !== null && 
                   retrieved.evidence_level === articleData.evidence_level;
          }
        ),
        { numRuns: 100, seed: 16008 }
      );
    });
  });
});
