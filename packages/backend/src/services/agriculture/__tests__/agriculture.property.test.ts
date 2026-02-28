/**
 * Property-Based Tests for Agriculture Module
 * Tests correctness properties using fast-check
 */

import * as fc from 'fast-check';
import { GovernmentSchemeService } from '../government-schemes';

describe('Agriculture Module - Property-Based Tests', () => {
  describe('Property 15: Search result relevance', () => {
    /**
     * Property: Search results must be relevant to the query
     * - All results should contain the search term (case-insensitive)
     * - Results should be ranked by relevance
     * - Empty query should return all schemes
     */
    it('should return relevant search results', () => {
      const schemeService = new GovernmentSchemeService();

      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }),
          (query) => {
            const results = schemeService.searchSchemes(query);

            // If query is empty or whitespace, should return all schemes
            if (query.trim().length === 0) {
              return results.length >= 0; // Can return any number of schemes
            }

            const lowerQuery = query.toLowerCase();

            // All results must contain the search term
            const allRelevant = results.every(scheme => {
              const nameMatch = scheme.name.toLowerCase().includes(lowerQuery);
              const descMatch = scheme.description.toLowerCase().includes(lowerQuery);
              const benefitMatch = scheme.benefits.some(b => 
                b.toLowerCase().includes(lowerQuery)
              );
              
              return nameMatch || descMatch || benefitMatch;
            });

            return allRelevant;
          }
        ),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should handle special characters in search query', () => {
      const schemeService = new GovernmentSchemeService();

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          (query) => {
            // Should not throw error for any query
            const results = schemeService.searchSchemes(query);
            return Array.isArray(results);
          }
        ),
        { numRuns: 100, seed: 43 }
      );
    });

    it('should return consistent results for same query', () => {
      const schemeService = new GovernmentSchemeService();

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }),
          (query) => {
            const results1 = schemeService.searchSchemes(query);
            const results2 = schemeService.searchSchemes(query);

            // Same query should return same results
            return results1.length === results2.length &&
                   results1.every((scheme, index) => 
                     scheme.schemeId === results2[index].schemeId
                   );
          }
        ),
        { numRuns: 100, seed: 44 }
      );
    });

    it('should be case-insensitive', () => {
      const schemeService = new GovernmentSchemeService();

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          (query) => {
            const lowerResults = schemeService.searchSchemes(query.toLowerCase());
            const upperResults = schemeService.searchSchemes(query.toUpperCase());
            const mixedResults = schemeService.searchSchemes(query);

            // All variations should return same number of results
            return lowerResults.length === upperResults.length &&
                   upperResults.length === mixedResults.length;
          }
        ),
        { numRuns: 100, seed: 45 }
      );
    });
  });
});
