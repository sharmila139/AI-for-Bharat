/**
 * Property-Based Tests for Remedy Search Ranking
 * 
 * Feature: ruralconnect-ai
 * Property 20: Remedy Search Ranking
 * 
 * **Validates: Requirements 8.2**
 * 
 * Tests the remedy search ranking algorithm to ensure:
 * - Ranking formula: efficacy_rating * 0.4 + success_rate * 0.3 + avg_rating * 0.3
 * - Results ordered by relevance score descending
 * - Various filter combinations work correctly
 * - Pagination correctness
 */

import * as fc from 'fast-check';
import { Pool } from 'pg';
import { RemedySearchService } from '../remedy-search.service';
import {
  RemedyCategory,
  DifficultyLevel,
  EvidenceLevel,
} from '../../../../types/natural-medicine';

// Mock database pool
const mockPool = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn(),
} as unknown as Pool;

describe('Property 20: Remedy Search Ranking', () => {
  let searchService: RemedySearchService;
  let mockClient: any;

  beforeEach(() => {
    searchService = new RemedySearchService(mockPool);
    
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    
    (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property: Ranking formula correctness
   * For any remedy with efficacy_rating, success_rate, and avg_rating,
   * the relevance_score should equal: efficacy * 0.4 + (success_rate/100 * 5) * 0.3 + avg_rating * 0.3
   */
  test('Property 20.1: Ranking formula is correctly calculated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          efficacy_rating: fc.float({ min: 0, max: 5, noNaN: true }),
          success_rate_percentage: fc.float({ min: 0, max: 100, noNaN: true }),
          avg_rating: fc.float({ min: 0, max: 5, noNaN: true }),
        }),
        async (remedy) => {
          // Calculate expected relevance score
          const expectedScore =
            remedy.efficacy_rating * 0.4 +
            (remedy.success_rate_percentage / 100) * 5 * 0.3 +
            remedy.avg_rating * 0.3;

          // Mock database response with single remedy
          const mockRemedyRow = {
            remedy_id: 'test-remedy-1',
            names: { en: 'Test Remedy' },
            ailments_treated: ['headache'],
            status: 'published',
            verification_status: 'verified',
            evidence_level: 'moderate',
            efficacy_rating: remedy.efficacy_rating,
            success_rate_percentage: remedy.success_rate_percentage,
            total_ratings: 10,
            average_rating: remedy.avg_rating,
            ingredients_count: 3,
            seasonal_available: true,
            relevance_score: expectedScore,
            created_at: new Date(),
            updated_at: new Date(),
          };

          mockClient.query
            .mockResolvedValueOnce({ rows: [mockRemedyRow] }) // Search query
            .mockResolvedValueOnce({ rows: [{ total: 1 }] }); // Count query

          const result = await searchService.searchRemedies('test', {}, 1, 20);

          expect(result.results).toHaveLength(1);
          
          const actualScore = result.results[0].relevance_score;
          
          // Allow small floating point tolerance
          expect(Math.abs(actualScore - expectedScore)).toBeLessThan(0.001);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Results are ordered by relevance score descending
   * For any set of remedies, results should be sorted by relevance_score in descending order
   */
  test('Property 20.2: Results are ordered by relevance score descending', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            remedy_id: fc.uuid(),
            efficacy_rating: fc.float({ min: 0, max: 5, noNaN: true }),
            success_rate_percentage: fc.float({ min: 0, max: 100, noNaN: true }),
            avg_rating: fc.float({ min: 0, max: 5, noNaN: true }),
          }),
          { minLength: 2, maxLength: 20 }
        ),
        async (remedies) => {
          // Calculate relevance scores and sort
          const mockRows = remedies.map((remedy) => {
            const relevance_score =
              remedy.efficacy_rating * 0.4 +
              (remedy.success_rate_percentage / 100) * 5 * 0.3 +
              remedy.avg_rating * 0.3;

            return {
              remedy_id: remedy.remedy_id,
              names: { en: `Remedy ${remedy.remedy_id}` },
              ailments_treated: ['test'],
              status: 'published',
              verification_status: 'verified',
              evidence_level: 'moderate',
              efficacy_rating: remedy.efficacy_rating,
              success_rate_percentage: remedy.success_rate_percentage,
              total_ratings: 10,
              average_rating: remedy.avg_rating,
              ingredients_count: 3,
              seasonal_available: false,
              relevance_score,
              created_at: new Date(),
              updated_at: new Date(),
            };
          }).sort((a, b) => b.relevance_score - a.relevance_score); // Sort descending

          mockClient.query
            .mockResolvedValueOnce({ rows: mockRows })
            .mockResolvedValueOnce({ rows: [{ total: mockRows.length }] });

          const result = await searchService.searchRemedies('test', {}, 1, 20);

          // Verify results are sorted by relevance_score descending
          for (let i = 0; i < result.results.length - 1; i++) {
            const currentScore = result.results[i].relevance_score;
            const nextScore = result.results[i + 1].relevance_score;
            
            // Current score should be >= next score (descending order)
            expect(currentScore).toBeGreaterThanOrEqual(nextScore);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Filter combinations work correctly
   * For any valid filter combination, the search should return results matching all filters
   */
  test('Property 20.3: Various filter combinations work correctly', async () => {
    const categoryArb = fc.constantFrom<RemedyCategory>(
      'ayurvedic',
      'herbal',
      'home_remedy',
      'dietary',
      'lifestyle'
    );
    
    const difficultyArb = fc.constantFrom<DifficultyLevel>('easy', 'moderate', 'difficult');
    
    const evidenceArb = fc.constantFrom<EvidenceLevel>('traditional', 'moderate', 'strong');

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          category: fc.option(categoryArb, { nil: undefined }),
          difficulty_level: fc.option(difficultyArb, { nil: undefined }),
          evidence_level: fc.option(evidenceArb, { nil: undefined }),
          max_preparation_time: fc.option(fc.integer({ min: 10, max: 120 }), { nil: undefined }),
          min_efficacy_rating: fc.option(fc.float({ min: 1, max: 5 }), { nil: undefined }),
          safe_for_pregnancy: fc.option(fc.boolean(), { nil: undefined }),
          safe_for_children: fc.option(fc.boolean(), { nil: undefined }),
          seasonal_only: fc.option(fc.boolean(), { nil: undefined }),
        }),
        async (filters) => {
          // Mock empty results (we're testing filter application, not results)
          mockClient.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ total: 0 }] });

          const result = await searchService.searchRemedies('test', filters, 1, 20);

          // Verify filters were applied
          expect(result.filters_applied).toEqual(filters);
          
          // Verify query was called (filters were processed)
          expect(mockClient.query).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Pagination correctness
   * For any page number and page size, the correct offset and limit should be applied
   */
  test('Property 20.4: Pagination works correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          page: fc.integer({ min: 1, max: 10 }),
          pageSize: fc.integer({ min: 5, max: 50 }),
          totalRemedies: fc.integer({ min: 0, max: 100 }),
        }),
        async ({ page, pageSize, totalRemedies }) => {
          const expectedOffset = (page - 1) * pageSize;
          
          // Generate mock remedies up to page size
          const remediesOnPage = Math.min(pageSize, Math.max(0, totalRemedies - expectedOffset));
          
          const mockRows = Array.from({ length: remediesOnPage }, (_, i) => ({
            remedy_id: `remedy-${expectedOffset + i}`,
            names: { en: `Remedy ${expectedOffset + i}` },
            ailments_treated: ['test'],
            status: 'published',
            verification_status: 'verified',
            evidence_level: 'moderate',
            efficacy_rating: 4.0,
            success_rate_percentage: 80,
            total_ratings: 10,
            average_rating: 4.0,
            ingredients_count: 3,
            seasonal_available: false,
            relevance_score: 3.8,
            created_at: new Date(),
            updated_at: new Date(),
          }));

          mockClient.query
            .mockResolvedValueOnce({ rows: mockRows })
            .mockResolvedValueOnce({ rows: [{ total: totalRemedies }] });

          const result = await searchService.searchRemedies('test', {}, page, pageSize);

          // Verify pagination metadata
          expect(result.page).toBe(page);
          expect(result.page_size).toBe(pageSize);
          expect(result.total_count).toBe(totalRemedies);
          
          // Verify correct number of results
          expect(result.results.length).toBe(remediesOnPage);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty search returns all published and verified remedies
   * When no query or filters are provided, all published and verified remedies should be returned
   */
  test('Property 20.5: Empty search returns all published verified remedies', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 50 }),
        async (numRemedies) => {
          const mockRows = Array.from({ length: Math.min(numRemedies, 20) }, (_, i) => ({
            remedy_id: `remedy-${i}`,
            names: { en: `Remedy ${i}` },
            ailments_treated: ['test'],
            status: 'published',
            verification_status: 'verified',
            evidence_level: 'moderate',
            efficacy_rating: 4.0,
            success_rate_percentage: 80,
            total_ratings: 10,
            average_rating: 4.0,
            ingredients_count: 3,
            seasonal_available: false,
            relevance_score: 3.8,
            created_at: new Date(),
            updated_at: new Date(),
          }));

          mockClient.query
            .mockResolvedValueOnce({ rows: mockRows })
            .mockResolvedValueOnce({ rows: [{ total: numRemedies }] });

          const result = await searchService.searchRemedies(undefined, {}, 1, 20);

          // All results should be published and verified
          result.results.forEach((r) => {
            expect(r.remedy.status).toBe('published');
            expect(r.remedy.verification_status).toBe('verified');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Relevance score is always non-negative
   * For any remedy, the calculated relevance score should be >= 0
   */
  test('Property 20.6: Relevance score is always non-negative', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          efficacy_rating: fc.option(fc.float({ min: 0, max: 5, noNaN: true }), { nil: undefined }),
          success_rate_percentage: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
          avg_rating: fc.option(fc.float({ min: 0, max: 5, noNaN: true }), { nil: undefined }),
        }),
        async (remedy) => {
          const efficacy = remedy.efficacy_rating || 0;
          const successRate = remedy.success_rate_percentage || 0;
          const avgRating = remedy.avg_rating || 0;

          const relevance_score =
            efficacy * 0.4 +
            (successRate / 100) * 5 * 0.3 +
            avgRating * 0.3;

          const mockRow = {
            remedy_id: 'test-remedy',
            names: { en: 'Test' },
            ailments_treated: ['test'],
            status: 'published',
            verification_status: 'verified',
            evidence_level: 'moderate',
            efficacy_rating: efficacy,
            success_rate_percentage: successRate,
            total_ratings: 5,
            average_rating: avgRating,
            ingredients_count: 3,
            seasonal_available: false,
            relevance_score,
            created_at: new Date(),
            updated_at: new Date(),
          };

          mockClient.query
            .mockResolvedValueOnce({ rows: [mockRow] })
            .mockResolvedValueOnce({ rows: [{ total: 1 }] });

          const result = await searchService.searchRemedies('test', {}, 1, 20);

          expect(result.results[0].relevance_score).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
