/**
 * Unit tests for AI Image Classifier
 */

import { AIImageClassifier } from '../ai-image-classifier';

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime');

describe('AIImageClassifier', () => {
  let classifier: AIImageClassifier;
  let mockSend: jest.Mock;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock BedrockRuntimeClient
    mockSend = jest.fn();
    const { BedrockRuntimeClient } = await import('@aws-sdk/client-bedrock-runtime');
    (BedrockRuntimeClient as jest.Mock).mockImplementation(() => ({
      send: mockSend
    }));

    // Create classifier instance
    classifier = new AIImageClassifier();
  });

  describe('classifyGrievanceImage', () => {
    it('should classify image using AI when confidence is above threshold', async () => {
      // Mock Bedrock response
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              category: 'roads',
              confidence: 92,
              detectedFeatures: ['pothole', 'damaged pavement', 'road surface'],
              reasoning: 'Image shows clear pothole in road surface'
            })
          }]
        }))
      };

      mockSend.mockResolvedValue(mockResponse);

      const imageBuffer = Buffer.from('fake-image-data');
      const result = await classifier.classifyGrievanceImage(
        { buffer: imageBuffer, mimeType: 'image/jpeg' },
        'Large pothole on main street'
      );

      expect(result.category).toBe('roads');
      expect(result.confidence).toBe(92);
      expect(result.method).toBe('ai');
      expect(result.detectedFeatures).toContain('pothole');
    });

    it('should fall back to keyword classification when AI confidence is below threshold', async () => {
      // Mock Bedrock response with low confidence
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              category: 'roads',
              confidence: 70, // Below 85% threshold
              detectedFeatures: ['unclear'],
              reasoning: 'Image is unclear'
            })
          }]
        }))
      };

      mockSend.mockResolvedValue(mockResponse);

      const imageBuffer = Buffer.from('fake-image-data');
      const result = await classifier.classifyGrievanceImage(
        { buffer: imageBuffer, mimeType: 'image/jpeg' },
        'Broken water pipe leaking on street'
      );

      expect(result.method).toBe('keyword');
      expect(result.category).toBe('water');
      expect(result.detectedFeatures).toContain('water');
      expect(result.detectedFeatures).toContain('pipe');
    });

    it('should fall back to keyword classification when AI fails', async () => {
      // Mock Bedrock error
      mockSend.mockRejectedValue(new Error('Bedrock API error'));

      const imageBuffer = Buffer.from('fake-image-data');
      const result = await classifier.classifyGrievanceImage(
        { buffer: imageBuffer, mimeType: 'image/jpeg' },
        'Streetlight not working on park road'
      );

      expect(result.method).toBe('keyword');
      // Should match 'streetlight' keyword
      expect(['streetlights', 'roads']).toContain(result.category);
    });

    it('should cache classification results', async () => {
      // Mock Bedrock response
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              category: 'electricity',
              confidence: 88,
              detectedFeatures: ['power pole', 'wires'],
              reasoning: 'Damaged electrical infrastructure'
            })
          }]
        }))
      };

      mockSend.mockResolvedValue(mockResponse);

      const imageBuffer = Buffer.from('fake-image-data');
      const description = 'Damaged power pole';

      // First call
      const result1 = await classifier.classifyGrievanceImage(
        { buffer: imageBuffer, mimeType: 'image/jpeg' },
        description
      );

      // Second call with same inputs
      const result2 = await classifier.classifyGrievanceImage(
        { buffer: imageBuffer, mimeType: 'image/jpeg' },
        description
      );

      // Should only call Bedrock once due to caching
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });
  });

  describe('fallbackToKeywordClassification', () => {
    it('should classify based on keyword matches', async () => {
      const result = await classifier['fallbackToKeywordClassification'](
        'Large pothole on main road causing traffic issues'
      );

      expect(result.category).toBe('roads');
      expect(result.method).toBe('keyword');
      expect(result.detectedFeatures).toContain('pothole');
      expect(result.detectedFeatures).toContain('road');
    });

    it('should handle multiple keyword matches', async () => {
      const result = await classifier['fallbackToKeywordClassification'](
        'Garbage dump with overflowing trash bins and waste accumulation'
      );

      expect(result.category).toBe('waste');
      expect(result.method).toBe('keyword');
      expect(result.detectedFeatures.length).toBeGreaterThan(1);
    });

    it('should return default category when no keywords match', async () => {
      const result = await classifier['fallbackToKeywordClassification'](
        'Some random issue description'
      );

      expect(result.category).toBe('public_property');
      expect(result.method).toBe('keyword');
      expect(result.confidence).toBeLessThan(60);
    });

    it('should calculate confidence based on keyword matches', async () => {
      const result1 = await classifier['fallbackToKeywordClassification'](
        'water pipe leak'
      );

      const result2 = await classifier['fallbackToKeywordClassification'](
        'water supply pipe broken with major leak and overflow'
      );

      // More keywords should result in higher confidence
      expect(result2.confidence).toBeGreaterThan(result1.confidence);
    });

    it('should cap confidence at 80% for keyword-based classification', async () => {
      const result = await classifier['fallbackToKeywordClassification'](
        'water water water pipe pipe pipe leak leak leak supply supply supply'
      );

      expect(result.confidence).toBeLessThanOrEqual(80);
    });
  });

  describe('parseBedrockResponse', () => {
    it('should parse valid JSON response', () => {
      const response = JSON.stringify({
        category: 'drainage',
        confidence: 90,
        detectedFeatures: ['blocked drain', 'overflow'],
        reasoning: 'Clear drainage issue'
      });

      const result = classifier['parseBedrockResponse'](response);

      expect(result.category).toBe('drainage');
      expect(result.confidence).toBe(90);
      expect(result.method).toBe('ai');
    });

    it('should handle JSON wrapped in markdown code blocks', () => {
      const response = '```json\n{"category": "waste", "confidence": 85, "detectedFeatures": ["garbage"]}\n```';

      const result = classifier['parseBedrockResponse'](response);

      expect(result.category).toBe('waste');
      expect(result.confidence).toBe(85);
    });

    it('should normalize category names', () => {
      const response = JSON.stringify({
        category: 'Health Facility',
        confidence: 88,
        detectedFeatures: ['hospital']
      });

      const result = classifier['parseBedrockResponse'](response);

      expect(result.category).toBe('health_facility');
    });

    it('should clamp confidence to 0-100 range', () => {
      const response1 = JSON.stringify({
        category: 'roads',
        confidence: 150,
        detectedFeatures: []
      });

      const response2 = JSON.stringify({
        category: 'roads',
        confidence: -10,
        detectedFeatures: []
      });

      const result1 = classifier['parseBedrockResponse'](response1);
      const result2 = classifier['parseBedrockResponse'](response2);

      expect(result1.confidence).toBe(100);
      expect(result2.confidence).toBe(0);
    });

    it('should throw error for invalid category', () => {
      const response = JSON.stringify({
        category: 'invalid_category',
        confidence: 90,
        detectedFeatures: []
      });

      expect(() => classifier['parseBedrockResponse'](response)).toThrow('Failed to parse AI classification response');
    });

    it('should throw error for invalid JSON', () => {
      const response = 'not valid json';

      expect(() => classifier['parseBedrockResponse'](response)).toThrow();
    });
  });

  describe('normalizeCategory', () => {
    it('should normalize category with spaces', () => {
      expect(classifier['normalizeCategory']('Health Facility')).toBe('health_facility');
      expect(classifier['normalizeCategory']('Public Property')).toBe('public_property');
    });

    it('should handle lowercase input', () => {
      expect(classifier['normalizeCategory']('roads')).toBe('roads');
      expect(classifier['normalizeCategory']('water')).toBe('water');
    });

    it('should return null for invalid categories', () => {
      expect(classifier['normalizeCategory']('invalid')).toBeNull();
      expect(classifier['normalizeCategory']('random_category')).toBeNull();
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      // Mock Bedrock response
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              category: 'roads',
              confidence: 90,
              detectedFeatures: ['pothole']
            })
          }]
        }))
      };

      mockSend.mockResolvedValue(mockResponse);

      const imageBuffer = Buffer.from('fake-image-data');
      
      // Classify to populate cache
      await classifier.classifyGrievanceImage(
        { buffer: imageBuffer, mimeType: 'image/jpeg' },
        'Pothole on road'
      );

      // Clear cache
      classifier.clearCache();

      // Classify again - should call Bedrock again
      await classifier.classifyGrievanceImage(
        { buffer: imageBuffer, mimeType: 'image/jpeg' },
        'Pothole on road'
      );

      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should return cache statistics', () => {
      const stats = classifier.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats.maxSize).toBe(1000);
    });
  });

  describe('confidence threshold validation', () => {
    it('should accept AI classification when confidence >= 85%', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              category: 'electricity',
              confidence: 85,
              detectedFeatures: ['power pole']
            })
          }]
        }))
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await classifier.classifyGrievanceImage(
        { buffer: Buffer.from('test'), mimeType: 'image/jpeg' },
        'Damaged power pole'
      );

      expect(result.method).toBe('ai');
      expect(result.confidence).toBe(85);
    });

    it('should reject AI classification when confidence < 85%', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              category: 'roads',
              confidence: 84,
              detectedFeatures: ['unclear']
            })
          }]
        }))
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await classifier.classifyGrievanceImage(
        { buffer: Buffer.from('test'), mimeType: 'image/jpeg' },
        'Pothole on main street'
      );

      expect(result.method).toBe('keyword');
    });
  });

  describe('category coverage', () => {
    it('should support all 9 required categories', () => {
      const requiredCategories = [
        'roads',
        'water',
        'electricity',
        'drainage',
        'waste',
        'streetlights',
        'public_property',
        'health_facility',
        'education_facility'
      ];

      requiredCategories.forEach(category => {
        const normalized = classifier['normalizeCategory'](category);
        expect(normalized).not.toBeNull();
      });
    });
  });
});
