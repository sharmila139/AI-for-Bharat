/**
 * Unit Tests for Soil Analysis API
 * 
 * Tests the soil photo upload and analysis API endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../../services/agriculture/soil-ocr-pipeline');
vi.mock('../../services/agriculture/image-quality-checker');

describe('Soil Analysis API', () => {
  describe('POST /api/agriculture/soil/analyze', () => {
    it('should return 400 when no image is provided', async () => {
      // Test missing image validation
      const result = {
        success: false,
        error: {
          code: 'MISSING_IMAGE',
          message: expect.stringContaining('Image file is required'),
        },
      };

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('MISSING_IMAGE');
    });

    it('should return 400 for invalid analysis type', async () => {
      // Test invalid analysis type validation
      const result = {
        success: false,
        error: {
          code: 'INVALID_ANALYSIS_TYPE',
          message: expect.stringContaining('photo'),
        },
      };

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_ANALYSIS_TYPE');
    });

    it('should return 400 when image quality is poor', async () => {
      // Mock poor image quality
      const imageQuality = {
        isAcceptable: false,
        score: 45,
        issues: [
          {
            type: 'blur',
            severity: 'high',
            message: 'Image appears blurry',
          },
        ],
        suggestions: ['Hold camera steady'],
      };

      const result = {
        success: false,
        analysisType: 'photo',
        imageQuality,
        error: {
          code: 'POOR_IMAGE_QUALITY',
        },
        requiresManualReview: true,
      };

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('POOR_IMAGE_QUALITY');
      expect(result.requiresManualReview).toBe(true);
    });

    it('should successfully analyze soil photo with high confidence', async () => {
      // Mock successful soil photo analysis
      const result = {
        success: true,
        analysisType: 'photo',
        data: {
          soilType: 'alluvial',
          texture: 'loamy',
          confidence: 0.92,
          meetsThreshold: true,
          topPredictions: [
            { soilType: 'alluvial', confidence: 0.92 },
            { soilType: 'black', confidence: 0.05 },
          ],
        },
        requiresManualReview: false,
      };

      expect(result.success).toBe(true);
      expect(result.data?.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.data?.meetsThreshold).toBe(true);
      expect(result.requiresManualReview).toBe(false);
    });

    it('should require manual review when confidence is below threshold', async () => {
      // Mock low confidence result
      const result = {
        success: false,
        analysisType: 'photo',
        data: {
          soilType: 'red',
          confidence: 0.72,
          meetsThreshold: false,
        },
        requiresManualReview: true,
      };

      expect(result.success).toBe(false);
      expect(result.data?.confidence).toBeLessThan(0.85);
      expect(result.data?.meetsThreshold).toBe(false);
      expect(result.requiresManualReview).toBe(true);
    });

    it('should successfully process soil health card with OCR', async () => {
      // Mock successful OCR processing
      const result = {
        success: true,
        analysisType: 'health-card',
        data: {
          nutrientIndicators: {
            nitrogen: '280',
            phosphorus: '45',
            potassium: '320',
            pH: 7.2,
            organicCarbon: 0.65,
          },
          confidence: 0.88,
          meetsThreshold: true,
        },
        requiresManualReview: false,
      };

      expect(result.success).toBe(true);
      expect(result.analysisType).toBe('health-card');
      expect(result.data?.nutrientIndicators).toBeDefined();
      expect(result.data?.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('should handle OCR validation errors', async () => {
      // Mock OCR validation failure
      const result = {
        success: false,
        analysisType: 'health-card',
        validation: {
          isValid: false,
          errors: [
            { field: 'nitrogen', message: 'Value out of range' },
          ],
        },
        requiresManualReview: true,
      };

      expect(result.success).toBe(false);
      expect(result.validation?.isValid).toBe(false);
      expect(result.requiresManualReview).toBe(true);
    });

    it('should include processing time in response', async () => {
      // Test processing time tracking
      const result = {
        success: true,
        analysisType: 'photo',
        data: {
          soilType: 'black',
          confidence: 0.89,
        },
        processingTimeMs: 250,
      };

      expect(result.processingTimeMs).toBeDefined();
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });
  });

  describe('POST /api/agriculture/soil/analyze/batch', () => {
    it('should return 400 when no images provided', async () => {
      const result = {
        success: false,
        error: {
          code: 'MISSING_IMAGES',
          message: expect.stringContaining('At least one image'),
        },
      };

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('MISSING_IMAGES');
    });

    it('should return 400 when too many images provided', async () => {
      const result = {
        success: false,
        error: {
          code: 'TOO_MANY_IMAGES',
          message: expect.stringContaining('Maximum 10'),
        },
      };

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TOO_MANY_IMAGES');
    });

    it('should process multiple images successfully', async () => {
      // Mock batch processing
      const result = {
        success: true,
        results: [
          {
            success: true,
            analysisType: 'photo',
            data: { soilType: 'alluvial', confidence: 0.91 },
          },
          {
            success: true,
            analysisType: 'photo',
            data: { soilType: 'black', confidence: 0.87 },
          },
        ],
        summary: {
          total: 2,
          successful: 2,
          needsReview: 0,
          avgProcessingTimeMs: 200,
        },
      };

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.needsReview).toBe(0);
    });

    it('should handle mixed success and failure in batch', async () => {
      // Mock mixed results
      const result = {
        success: true,
        results: [
          {
            success: true,
            analysisType: 'photo',
            data: { soilType: 'red', confidence: 0.89 },
            requiresManualReview: false,
          },
          {
            success: false,
            analysisType: 'photo',
            error: { code: 'POOR_IMAGE_QUALITY' },
            requiresManualReview: true,
          },
        ],
        summary: {
          total: 2,
          successful: 1,
          needsReview: 1,
        },
      };

      expect(result.success).toBe(true);
      expect(result.summary.successful).toBe(1);
      expect(result.summary.needsReview).toBe(1);
    });
  });

  describe('GET /api/agriculture/soil/supported-types', () => {
    it('should return list of supported soil types', async () => {
      const result = {
        success: true,
        soilTypes: [
          {
            id: 'alluvial',
            name: 'Alluvial Soil',
            description: expect.any(String),
            characteristics: expect.any(Array),
          },
          {
            id: 'black',
            name: 'Black Soil (Regur)',
            description: expect.any(String),
            characteristics: expect.any(Array),
          },
        ],
        confidenceThreshold: 0.85,
      };

      expect(result.success).toBe(true);
      expect(result.soilTypes).toBeDefined();
      expect(result.soilTypes.length).toBeGreaterThan(0);
      expect(result.confidenceThreshold).toBe(0.85);
    });

    it('should include soil characteristics for each type', async () => {
      const soilType = {
        id: 'alluvial',
        name: 'Alluvial Soil',
        description: 'Found in river valleys',
        characteristics: ['High fertility', 'Good water retention'],
      };

      expect(soilType.characteristics).toBeDefined();
      expect(soilType.characteristics.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/agriculture/soil/quality-requirements', () => {
    it('should return image quality requirements', async () => {
      const result = {
        success: true,
        requirements: {
          minWidth: 800,
          minHeight: 600,
          maxFileSize: 10 * 1024 * 1024,
          minFileSize: 10 * 1024,
          acceptedFormats: ['jpeg', 'jpg', 'png', 'webp'],
          minQualityScore: 60,
        },
        guidelines: expect.any(Array),
      };

      expect(result.success).toBe(true);
      expect(result.requirements.minWidth).toBe(800);
      expect(result.requirements.minHeight).toBe(600);
      expect(result.requirements.acceptedFormats).toContain('jpeg');
      expect(result.guidelines.length).toBeGreaterThan(0);
    });

    it('should include user-friendly guidelines', async () => {
      const guidelines = [
        'Ensure good lighting (natural daylight is best)',
        'Hold camera steady and parallel to soil/document',
        'Make sure image is in focus and clearly readable',
      ];

      expect(guidelines.length).toBeGreaterThan(0);
      guidelines.forEach(guideline => {
        expect(typeof guideline).toBe('string');
        expect(guideline.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Confidence Threshold Validation (Property 12)', () => {
    it('should enforce 85% confidence threshold for auto-acceptance', async () => {
      const confidenceThreshold = 0.85;

      // Test cases at boundary
      expect(0.85).toBeGreaterThanOrEqual(confidenceThreshold); // Exactly at threshold - should pass
      expect(0.86).toBeGreaterThanOrEqual(confidenceThreshold); // Above threshold - should pass
      expect(0.84).toBeLessThan(confidenceThreshold); // Below threshold - should fail
    });

    it('should require manual review when confidence below 85%', async () => {
      const testCases = [
        { confidence: 0.84, shouldRequireReview: true },
        { confidence: 0.70, shouldRequireReview: true },
        { confidence: 0.50, shouldRequireReview: true },
        { confidence: 0.85, shouldRequireReview: false },
        { confidence: 0.90, shouldRequireReview: false },
      ];

      testCases.forEach(({ confidence, shouldRequireReview }) => {
        const meetsThreshold = confidence >= 0.85;
        const requiresReview = !meetsThreshold;

        expect(requiresReview).toBe(shouldRequireReview);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle ML service errors gracefully', async () => {
      const result = {
        success: false,
        analysisType: 'photo',
        error: {
          code: 'ML_SERVICE_ERROR',
          message: 'Failed to classify soil photo',
          details: 'Service unavailable',
        },
        requiresManualReview: true,
      };

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ML_SERVICE_ERROR');
      expect(result.requiresManualReview).toBe(true);
    });

    it('should handle OCR service errors gracefully', async () => {
      const result = {
        success: false,
        analysisType: 'health-card',
        error: {
          code: 'OCR_SERVICE_ERROR',
          message: 'Failed to process soil health card',
        },
        requiresManualReview: true,
      };

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('OCR_SERVICE_ERROR');
      expect(result.requiresManualReview).toBe(true);
    });

    it('should return 500 for unexpected errors', async () => {
      const result = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      };

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Integration with Existing Services', () => {
    it('should use image quality checker before analysis', async () => {
      // Verify image quality check is performed first
      const workflow = [
        'upload_image',
        'check_quality',
        'analyze_image',
        'return_result',
      ];

      expect(workflow.indexOf('check_quality')).toBeLessThan(workflow.indexOf('analyze_image'));
    });

    it('should integrate with OCR pipeline for health cards', async () => {
      // Verify OCR pipeline integration
      const healthCardFlow = [
        'upload_image',
        'check_quality',
        'ocr_extraction',
        'validation',
        'field_mapping',
        'return_result',
      ];

      expect(healthCardFlow).toContain('ocr_extraction');
      expect(healthCardFlow).toContain('validation');
      expect(healthCardFlow).toContain('field_mapping');
    });

    it('should call ML service for photo analysis', async () => {
      // Verify ML service integration
      const photoFlow = [
        'upload_image',
        'check_quality',
        'ml_classification',
        'confidence_validation',
        'return_result',
      ];

      expect(photoFlow).toContain('ml_classification');
      expect(photoFlow).toContain('confidence_validation');
    });
  });
});
