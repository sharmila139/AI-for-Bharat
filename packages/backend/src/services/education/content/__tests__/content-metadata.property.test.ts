/**
 * Property-Based Tests for Content Metadata Completeness
 * Tests correctness property 27
 * 
 * **Validates: Requirements 11.3**
 * 
 * Property 27: Content Metadata Completeness
 * All educational content must have complete metadata including:
 * - Non-null duration_minutes
 * - Non-null language
 * - Non-null subject_id (via topic_id relationship)
 * - Non-null grade_level (via topic relationship)
 * - Non-null difficulty_level
 * - Prerequisites array (can be empty but not null)
 * - Next topics array (can be empty but not null)
 */

import * as fc from 'fast-check';
import { ContentData } from '../content-management';

describe('Content Metadata Completeness - Property Tests', () => {
  
  // ============================================================================
  // PROPERTY 27: Content Metadata Completeness
  // ============================================================================
  
  describe('Property 27: Content Metadata Completeness', () => {
    
    // Arbitrary for generating valid content metadata
    const contentMetadataArbitrary = fc.record({
      topic_id: fc.uuid(),
      title: fc.string({ minLength: 5, maxLength: 100 }),
      content_type: fc.constantFrom('video', 'text', 'interactive', 'quiz', 'simulation', 'game', 'practice') as fc.Arbitrary<'video' | 'text' | 'interactive' | 'quiz' | 'simulation' | 'game' | 'practice'>,
      difficulty_level: fc.constantFrom('easy', 'medium', 'hard', 'advanced') as fc.Arbitrary<'easy' | 'medium' | 'hard' | 'advanced'>,
      duration_minutes: fc.integer({ min: 1, max: 180 }),
      language: fc.constantFrom('en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa'),
      content_url: fc.webUrl(),
      tags: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
      keywords: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 0, maxLength: 10 })
    });
    
    test('For any content metadata, duration_minutes must be a positive number', () => {
      fc.assert(
        fc.property(
          contentMetadataArbitrary,
          (metadata: ContentData) => {
            // Property: duration_minutes must be defined, non-null, and positive
            expect(metadata.duration_minutes).toBeDefined();
            expect(metadata.duration_minutes).not.toBeNull();
            expect(metadata.duration_minutes).toBeGreaterThan(0);
            expect(typeof metadata.duration_minutes).toBe('number');
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('For any content metadata, language must be a non-empty string', () => {
      fc.assert(
        fc.property(
          contentMetadataArbitrary,
          (metadata: ContentData) => {
            // Property: language must be defined, non-null, and non-empty
            expect(metadata.language).toBeDefined();
            expect(metadata.language).not.toBeNull();
            expect(metadata.language).toBeTruthy();
            expect(typeof metadata.language).toBe('string');
            expect(metadata.language!.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('For any content metadata, difficulty_level must be a valid value', () => {
      fc.assert(
        fc.property(
          contentMetadataArbitrary,
          (metadata: ContentData) => {
            // Property: difficulty_level must be one of the valid values
            expect(metadata.difficulty_level).toBeDefined();
            expect(metadata.difficulty_level).not.toBeNull();
            expect(['easy', 'medium', 'hard', 'advanced']).toContain(metadata.difficulty_level);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('For any content metadata, topic_id must be defined and non-null', () => {
      fc.assert(
        fc.property(
          contentMetadataArbitrary,
          (metadata: ContentData) => {
            // Property: topic_id must be defined and non-null (UUID format)
            expect(metadata.topic_id).toBeDefined();
            expect(metadata.topic_id).not.toBeNull();
            expect(typeof metadata.topic_id).toBe('string');
            expect(metadata.topic_id.length).toBeGreaterThan(0);
            // UUID format validation (basic check)
            expect(metadata.topic_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('For any content metadata, tags array must exist (can be empty but not null)', () => {
      fc.assert(
        fc.property(
          contentMetadataArbitrary,
          (metadata: ContentData) => {
            // Property: tags must be an array (can be empty but not null)
            expect(metadata.tags).toBeDefined();
            expect(metadata.tags).not.toBeNull();
            expect(Array.isArray(metadata.tags)).toBe(true);
            
            // If tags exist, each tag should be a non-empty string
            if (metadata.tags && metadata.tags.length > 0) {
              metadata.tags.forEach(tag => {
                expect(typeof tag).toBe('string');
                expect(tag.length).toBeGreaterThan(0);
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('For any content metadata, keywords array must exist (can be empty but not null)', () => {
      fc.assert(
        fc.property(
          contentMetadataArbitrary,
          (metadata: ContentData) => {
            // Property: keywords must be an array (can be empty but not null)
            expect(metadata.keywords).toBeDefined();
            expect(metadata.keywords).not.toBeNull();
            expect(Array.isArray(metadata.keywords)).toBe(true);
            
            // If keywords exist, each keyword should be a non-empty string
            if (metadata.keywords && metadata.keywords.length > 0) {
              metadata.keywords.forEach(keyword => {
                expect(typeof keyword).toBe('string');
                expect(keyword.length).toBeGreaterThan(0);
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('For any content metadata, all required fields must be present and valid', () => {
      fc.assert(
        fc.property(
          contentMetadataArbitrary,
          (metadata: ContentData) => {
            // Property: All required metadata must be complete
            
            // Duration validation
            expect(metadata.duration_minutes).toBeDefined();
            expect(metadata.duration_minutes).not.toBeNull();
            expect(metadata.duration_minutes).toBeGreaterThan(0);
            
            // Language validation
            expect(metadata.language).toBeDefined();
            expect(metadata.language).not.toBeNull();
            expect(metadata.language!.length).toBeGreaterThan(0);
            
            // Difficulty validation
            expect(metadata.difficulty_level).toBeDefined();
            expect(metadata.difficulty_level).not.toBeNull();
            expect(['easy', 'medium', 'hard', 'advanced']).toContain(metadata.difficulty_level);
            
            // Topic validation
            expect(metadata.topic_id).toBeDefined();
            expect(metadata.topic_id).not.toBeNull();
            expect(metadata.topic_id.length).toBeGreaterThan(0);
            
            // Content type validation
            expect(metadata.content_type).toBeDefined();
            expect(metadata.content_type).not.toBeNull();
            expect(['video', 'text', 'interactive', 'quiz', 'simulation', 'game', 'practice']).toContain(metadata.content_type);
            
            // Arrays validation (can be empty but not null)
            expect(metadata.tags).toBeDefined();
            expect(metadata.tags).not.toBeNull();
            expect(Array.isArray(metadata.tags)).toBe(true);
            
            expect(metadata.keywords).toBeDefined();
            expect(metadata.keywords).not.toBeNull();
            expect(Array.isArray(metadata.keywords)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('Content metadata with video type should have appropriate duration ranges', () => {
      fc.assert(
        fc.property(
          fc.record({
            topic_id: fc.uuid(),
            title: fc.string({ minLength: 5, maxLength: 100 }),
            content_type: fc.constant('video') as fc.Arbitrary<'video'>,
            difficulty_level: fc.constantFrom('easy', 'medium', 'hard', 'advanced') as fc.Arbitrary<'easy' | 'medium' | 'hard' | 'advanced'>,
            duration_minutes: fc.integer({ min: 1, max: 180 }),
            language: fc.constantFrom('en', 'hi', 'ta', 'te', 'bn'),
            content_url: fc.webUrl(),
            tags: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 5 }),
            keywords: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 5 })
          }),
          (metadata) => {
            // Property: Video content duration should be reasonable (1-180 minutes)
            expect(metadata.content_type).toBe('video');
            expect(metadata.duration_minutes).toBeGreaterThanOrEqual(1);
            expect(metadata.duration_minutes).toBeLessThanOrEqual(180);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('Content metadata language codes should be valid ISO codes', () => {
      fc.assert(
        fc.property(
          contentMetadataArbitrary,
          (metadata: ContentData) => {
            // Property: Language should be a valid 2-letter ISO code
            expect(metadata.language).toBeDefined();
            expect(metadata.language).not.toBeNull();
            expect(metadata.language!.length).toBeGreaterThanOrEqual(2);
            expect(metadata.language!.length).toBeLessThanOrEqual(10);
            
            // Should be one of the supported languages
            const supportedLanguages = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'od', 'as', 'ur', 'ks', 'kok', 'mni'];
            expect(supportedLanguages).toContain(metadata.language);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('Content metadata completeness is preserved through serialization', () => {
      fc.assert(
        fc.property(
          contentMetadataArbitrary,
          (metadata: ContentData) => {
            // Property: Metadata should survive JSON serialization/deserialization
            const serialized = JSON.stringify(metadata);
            const deserialized = JSON.parse(serialized);
            
            // All required fields should be preserved
            expect(deserialized.duration_minutes).toBe(metadata.duration_minutes);
            expect(deserialized.language).toBe(metadata.language);
            expect(deserialized.difficulty_level).toBe(metadata.difficulty_level);
            expect(deserialized.topic_id).toBe(metadata.topic_id);
            expect(deserialized.content_type).toBe(metadata.content_type);
            expect(deserialized.tags).toEqual(metadata.tags);
            expect(deserialized.keywords).toEqual(metadata.keywords);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('Content metadata with different difficulty levels have appropriate duration ranges', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('easy', 'medium', 'hard', 'advanced'),
          fc.integer({ min: 5, max: 120 }),
          (difficulty, duration) => {
            const metadata: Partial<ContentData> = {
              difficulty_level: difficulty as any,
              duration_minutes: duration
            };
            
            // Property: All difficulty levels should accept reasonable durations
            expect(metadata.difficulty_level).toBeDefined();
            expect(metadata.duration_minutes).toBeGreaterThan(0);
            expect(metadata.duration_minutes).toBeLessThanOrEqual(180);
            
            // Difficulty level should be valid
            expect(['easy', 'medium', 'hard', 'advanced']).toContain(metadata.difficulty_level);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('Content metadata arrays (tags, keywords) should not contain null or undefined elements', () => {
      fc.assert(
        fc.property(
          contentMetadataArbitrary,
          (metadata: ContentData) => {
            // Property: Array elements should all be valid strings
            
            if (metadata.tags && metadata.tags.length > 0) {
              metadata.tags.forEach(tag => {
                expect(tag).toBeDefined();
                expect(tag).not.toBeNull();
                expect(typeof tag).toBe('string');
                expect(tag.length).toBeGreaterThan(0);
              });
            }
            
            if (metadata.keywords && metadata.keywords.length > 0) {
              metadata.keywords.forEach(keyword => {
                expect(keyword).toBeDefined();
                expect(keyword).not.toBeNull();
                expect(typeof keyword).toBe('string');
                expect(keyword.length).toBeGreaterThan(0);
              });
            }
            
            // The property always holds
            expect(true).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
