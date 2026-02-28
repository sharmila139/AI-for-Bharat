/**
 * OCR Service Tests
 * 
 * Unit tests for soil health card OCR functionality
 */

import { OCRService } from '../ocr-service';
import { OCRValidator } from '../ocr-validator';
import { SoilFieldMapper } from '../soil-field-mapper';
import { ImageQualityChecker } from '../image-quality-checker';
import { SoilOCRPipeline } from '../soil-ocr-pipeline';

describe('OCRService', () => {
  let ocrService: OCRService;

  beforeAll(() => {
    ocrService = new OCRService();
  });

  afterAll(async () => {
    await ocrService.terminate();
  });

  describe('parseSoilHealthCard', () => {
    it('should extract pH value from OCR text', () => {
      const ocrResult = {
        text: 'pH: 6.8\nNitrogen: 245 kg/ha',
        confidence: 85,
        words: [],
      };

      const result = ocrService.parseSoilHealthCard(ocrResult);

      expect(result.pH).toBe(6.8);
      expect(result.confidence).toBe(85);
    });

    it('should extract NPK values', () => {
      const ocrResult = {
        text: 'Nitrogen: 245\nPhosphorus: 18\nPotassium: 156',
        confidence: 90,
        words: [],
      };

      const result = ocrService.parseSoilHealthCard(ocrResult);

      expect(result.nitrogen).toBe(245);
      expect(result.phosphorus).toBe(18);
      expect(result.potassium).toBe(156);
    });

    it('should handle missing values gracefully', () => {
      const ocrResult = {
        text: 'pH: 7.2',
        confidence: 75,
        words: [],
      };

      const result = ocrService.parseSoilHealthCard(ocrResult);

      expect(result.pH).toBe(7.2);
      expect(result.nitrogen).toBeUndefined();
      expect(result.phosphorus).toBeUndefined();
    });

    it('should extract micronutrients', () => {
      const ocrResult = {
        text: 'Zinc: 0.8 ppm\nIron: 8.5 ppm\nCopper: 0.3 ppm',
        confidence: 88,
        words: [],
      };

      const result = ocrService.parseSoilHealthCard(ocrResult);

      expect(result.zinc).toBe(0.8);
      expect(result.iron).toBe(8.5);
      expect(result.copper).toBe(0.3);
    });
  });
});

describe('OCRValidator', () => {
  let validator: OCRValidator;

  beforeAll(() => {
    validator = new OCRValidator();
  });

  describe('validate', () => {
    it('should pass validation for valid data with high confidence', () => {
      const data = {
        pH: 6.8,
        nitrogen: 245,
        phosphorus: 18,
        potassium: 156,
        confidence: 92,
        rawText: 'test',
      };

      const result = validator.validate(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.needsManualReview).toBe(false);
    });

    it('should flag low confidence for manual review', () => {
      const data = {
        pH: 6.8,
        nitrogen: 245,
        confidence: 75,
        rawText: 'test',
      };

      const result = validator.validate(data);

      expect(result.needsManualReview).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should reject out-of-range pH values', () => {
      const data = {
        pH: 12.5, // Invalid
        confidence: 90,
        rawText: 'test',
      };

      const result = validator.validate(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('pH');
    });

    it('should reject out-of-range nitrogen values', () => {
      const data = {
        nitrogen: 1500, // Invalid
        confidence: 90,
        rawText: 'test',
      };

      const result = validator.validate(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require minimum number of fields', () => {
      const data = {
        pH: 6.8,
        confidence: 90,
        rawText: 'test',
      };

      const result = validator.validate(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('field'))).toBe(true);
    });
  });
});

describe('SoilFieldMapper', () => {
  let mapper: SoilFieldMapper;

  beforeAll(() => {
    mapper = new SoilFieldMapper();
  });

  describe('mapFields', () => {
    it('should map nitrogen values with status and recommendations', () => {
      const data = {
        nitrogen: 245,
        confidence: 90,
        rawText: 'test',
      };

      const result = mapper.mapFields(data);

      expect(result.nitrogen.value).toBe(245);
      expect(result.nitrogen.unit).toBe('kg/ha');
      expect(result.nitrogen.status).toBe('low');
      expect(result.nitrogen.recommendation).toBeTruthy();
    });

    it('should classify pH correctly', () => {
      const acidicData = { pH: 5.5, confidence: 90, rawText: 'test' };
      const neutralData = { pH: 7.0, confidence: 90, rawText: 'test' };
      const alkalineData = { pH: 8.5, confidence: 90, rawText: 'test' };

      expect(mapper.mapFields(acidicData).pH.status).toBe('acidic');
      expect(mapper.mapFields(neutralData).pH.status).toBe('neutral');
      expect(mapper.mapFields(alkalineData).pH.status).toBe('alkaline');
    });

    it('should calculate overall health score', () => {
      const data = {
        pH: 7.0,
        nitrogen: 400,
        phosphorus: 20,
        potassium: 200,
        organicCarbon: 0.8,
        confidence: 90,
        rawText: 'test',
      };

      const result = mapper.mapFields(data);

      expect(result.overallHealthScore).toBeGreaterThan(0);
      expect(result.overallHealthScore).toBeLessThanOrEqual(100);
    });

    it('should handle missing values gracefully', () => {
      const data = {
        pH: 6.8,
        confidence: 90,
        rawText: 'test',
      };

      const result = mapper.mapFields(data);

      expect(result.nitrogen.value).toBeNull();
      expect(result.nitrogen.status).toBe('unknown');
      expect(result.phosphorus.value).toBeNull();
    });

    it('should map micronutrients with deficiency status', () => {
      const data = {
        zinc: 0.4, // Deficient
        iron: 8.0, // Sufficient
        confidence: 90,
        rawText: 'test',
      };

      const result = mapper.mapFields(data);

      expect(result.micronutrients.zinc.status).toBe('deficient');
      expect(result.micronutrients.iron.status).toBe('sufficient');
    });
  });
});

describe('ImageQualityChecker', () => {
  let checker: ImageQualityChecker;

  beforeAll(() => {
    checker = new ImageQualityChecker();
  });

  describe('checkQuality', () => {
    it('should accept high-quality images', async () => {
      const mockBuffer = Buffer.from('mock-image-data');
      const mockMetadata = {
        width: 1920,
        height: 1080,
        fileSize: 500 * 1024, // 500KB
        format: 'jpeg',
      };

      const result = await checker.checkQuality(mockBuffer, mockMetadata);

      expect(result.isAcceptable).toBe(true);
      expect(result.score).toBeGreaterThan(60);
    });

    it('should reject low-resolution images', async () => {
      const mockBuffer = Buffer.from('mock-image-data');
      const mockMetadata = {
        width: 640,
        height: 480,
        fileSize: 100 * 1024,
        format: 'jpeg',
      };

      const result = await checker.checkQuality(mockBuffer, mockMetadata);

      expect(result.isAcceptable).toBe(false);
      expect(result.issues.some(i => i.type === 'low-resolution')).toBe(true);
    });

    it('should provide actionable suggestions', async () => {
      const mockBuffer = Buffer.from('mock-image-data');
      const mockMetadata = {
        width: 640,
        height: 480,
        fileSize: 100 * 1024,
        format: 'jpeg',
      };

      const result = await checker.checkQuality(mockBuffer, mockMetadata);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]).toBeTruthy();
    });
  });

  describe('generateErrorMessage', () => {
    it('should generate user-friendly error messages', () => {
      const result = {
        isAcceptable: false,
        score: 45,
        issues: [
          {
            type: 'low-resolution' as const,
            severity: 'high' as const,
            message: 'Image resolution is too low',
          },
        ],
        suggestions: ['Use a higher resolution camera'],
      };

      const message = checker.generateErrorMessage(result);

      expect(message).toContain('Critical Issues');
      expect(message).toContain('Suggestions');
      expect(message).toContain('resolution');
    });
  });
});

describe('SoilOCRPipeline', () => {
  let pipeline: SoilOCRPipeline;

  beforeAll(() => {
    pipeline = new SoilOCRPipeline();
  });

  afterAll(async () => {
    await pipeline.cleanup();
  });

  describe('getStatistics', () => {
    it('should extract statistics from result', () => {
      const result = {
        success: true,
        data: {
          extractedFieldsCount: 5,
          overallHealthScore: 75,
        } as any,
        rawData: {
          confidence: 88,
        } as any,
        imageQuality: {
          score: 92,
        } as any,
        needsManualReview: false,
        processingTimeMs: 1234,
      };

      const stats = pipeline.getStatistics(result);

      expect(stats.extractedFields).toBe(5);
      expect(stats.confidence).toBe(88);
      expect(stats.qualityScore).toBe(92);
      expect(stats.processingTime).toBe(1234);
      expect(stats.needsReview).toBe(false);
    });
  });
});
