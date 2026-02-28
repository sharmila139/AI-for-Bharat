/**
 * OCR Property-Based Tests
 * 
 * Property tests to verify correctness properties across random inputs
 */

import * as fc from 'fast-check';
import { OCRValidator } from '../ocr-validator';
import { SoilFieldMapper } from '../soil-field-mapper';
import { SoilHealthCardData } from '../ocr-service';

describe('OCR Property-Based Tests', () => {
  const validator = new OCRValidator();
  const mapper = new SoilFieldMapper();

  /**
   * Property 1: Validation ranges are always respected
   * For any soil parameter value, if validation passes, the value must be within the defined range
   */
  describe('Property 1: Validation Range Enforcement', () => {
    it('should only accept pH values within valid range (3.5-10.5)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -5, max: 15, noNaN: true }),
          fc.integer({ min: 85, max: 100 }),
          (pH, confidence) => {
            const data: SoilHealthCardData = {
              pH,
              nitrogen: 300,
              phosphorus: 20,
              potassium: 200,
              confidence,
              rawText: 'test',
            };

            const result = validator.validate(data);

            // If pH is out of range, validation should fail
            if (pH < 3.5 || pH > 10.5) {
              expect(result.isValid).toBe(false);
              expect(result.errors.some(e => e.includes('pH'))).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only accept nitrogen values within valid range (0-1000)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -100, max: 1500, noNaN: true }),
          fc.integer({ min: 85, max: 100 }),
          (nitrogen, confidence) => {
            const data: SoilHealthCardData = {
              pH: 7.0,
              nitrogen,
              phosphorus: 20,
              potassium: 200,
              confidence,
              rawText: 'test',
            };

            const result = validator.validate(data);

            // If nitrogen is out of range, validation should fail
            if (nitrogen < 0 || nitrogen > 1000) {
              expect(result.isValid).toBe(false);
              expect(result.errors.some(e => e.includes('Nitrogen'))).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Health score is always 0-100
   * For any valid soil data, the calculated health score must be between 0 and 100 inclusive
   */
  describe('Property 2: Health Score Bounds', () => {
    it('should always produce health scores between 0-100', () => {
      fc.assert(
        fc.property(
          fc.record({
            pH: fc.option(fc.float({ min: 3.5, max: 10.5, noNaN: true }), { nil: undefined }),
            nitrogen: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: undefined }),
            phosphorus: fc.option(fc.float({ min: 0, max: 200, noNaN: true }), { nil: undefined }),
            potassium: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: undefined }),
            organicCarbon: fc.option(fc.float({ min: 0, max: 5, noNaN: true }), { nil: undefined }),
            electricalConductivity: fc.option(fc.float({ min: 0, max: 16, noNaN: true }), { nil: undefined }),
          }),
          fc.integer({ min: 0, max: 100 }),
          (soilData, confidence) => {
            const data: SoilHealthCardData = {
              ...soilData,
              confidence,
              rawText: 'test',
            };

            const mapped = mapper.mapFields(data);

            expect(mapped.overallHealthScore).toBeGreaterThanOrEqual(0);
            expect(mapped.overallHealthScore).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Confidence threshold enforcement
   * For any OCR result with confidence < 85%, manual review should be required
   */
  describe('Property 3: Confidence Threshold (Property 12 from Design)', () => {
    it('should require manual review when confidence < 85%', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 84 }),
          fc.record({
            pH: fc.float({ min: 3.5, max: 10.5, noNaN: true }),
            nitrogen: fc.float({ min: 0, max: 1000, noNaN: true }),
            phosphorus: fc.float({ min: 0, max: 200, noNaN: true }),
            potassium: fc.float({ min: 0, max: 1000, noNaN: true }),
          }),
          (confidence, soilData) => {
            const data: SoilHealthCardData = {
              ...soilData,
              confidence,
              rawText: 'test',
            };

            const result = validator.validate(data);

            // Low confidence should trigger manual review
            expect(result.needsManualReview).toBe(true);
            expect(result.warnings.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not require manual review when confidence >= 85% and data is valid', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 85, max: 100 }),
          (confidence) => {
            const data: SoilHealthCardData = {
              pH: 7.0,
              nitrogen: 300,
              phosphorus: 20,
              potassium: 200,
              confidence,
              rawText: 'test',
            };

            const result = validator.validate(data);

            // High confidence with valid data should not require manual review
            if (result.isValid && result.errors.length === 0) {
              expect(result.needsManualReview).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Field mapping consistency
   * For any valid nutrient value, the mapped status should be consistent with the value
   */
  describe('Property 4: Field Mapping Consistency', () => {
    it('should consistently map nitrogen status based on value', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1000, noNaN: true }),
          (nitrogen) => {
            const data: SoilHealthCardData = {
              nitrogen,
              confidence: 90,
              rawText: 'test',
            };

            const mapped = mapper.mapFields(data);

            // Verify status matches value ranges
            if (nitrogen < 280) {
              expect(mapped.nitrogen.status).toBe('low');
            } else if (nitrogen < 560) {
              expect(mapped.nitrogen.status).toBe('medium');
            } else {
              expect(mapped.nitrogen.status).toBe('high');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should consistently map pH status based on value', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 3.5, max: 10.5, noNaN: true }),
          (pH) => {
            const data: SoilHealthCardData = {
              pH,
              confidence: 90,
              rawText: 'test',
            };

            const mapped = mapper.mapFields(data);

            // Verify status matches value ranges
            if (pH < 6.5) {
              expect(mapped.pH.status).toBe('acidic');
            } else if (pH <= 7.5) {
              expect(mapped.pH.status).toBe('neutral');
            } else {
              expect(mapped.pH.status).toBe('alkaline');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Extracted fields count accuracy
   * The count of extracted fields should match the number of non-undefined values
   */
  describe('Property 5: Extracted Fields Count', () => {
    it('should accurately count extracted fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            pH: fc.option(fc.float({ min: 3.5, max: 10.5, noNaN: true }), { nil: undefined }),
            nitrogen: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: undefined }),
            phosphorus: fc.option(fc.float({ min: 0, max: 200, noNaN: true }), { nil: undefined }),
            potassium: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: undefined }),
            organicCarbon: fc.option(fc.float({ min: 0, max: 5, noNaN: true }), { nil: undefined }),
            zinc: fc.option(fc.float({ min: 0, max: 50, noNaN: true }), { nil: undefined }),
          }),
          (soilData) => {
            const data: SoilHealthCardData = {
              ...soilData,
              confidence: 90,
              rawText: 'test',
            };

            const mapped = mapper.mapFields(data);

            // Count non-undefined fields
            const expectedCount = Object.entries(soilData).filter(
              ([_, value]) => value !== undefined
            ).length;

            expect(mapped.extractedFieldsCount).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Validation errors are descriptive
   * For any invalid data, error messages should contain the field name
   */
  describe('Property 6: Descriptive Error Messages', () => {
    it('should include field name in error messages', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.record({ pH: fc.float({ min: 15, max: 20 }) }),
            fc.record({ nitrogen: fc.float({ min: 1500, max: 2000 }) }),
            fc.record({ phosphorus: fc.float({ min: 300, max: 400 }) })
          ),
          (invalidData) => {
            const data: SoilHealthCardData = {
              ...invalidData,
              confidence: 90,
              rawText: 'test',
            };

            const result = validator.validate(data);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);

            // Error message should mention the invalid field
            const fieldName = Object.keys(invalidData)[0];
            const hasFieldInError = result.errors.some(e =>
              e.toLowerCase().includes(fieldName.toLowerCase())
            );
            expect(hasFieldInError).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 7: Recommendations are always provided
   * For any mapped field with a value, a recommendation should be provided
   */
  describe('Property 7: Recommendations Completeness', () => {
    it('should provide recommendations for all mapped nutrients', () => {
      fc.assert(
        fc.property(
          fc.record({
            nitrogen: fc.float({ min: 0, max: 1000, noNaN: true }),
            phosphorus: fc.float({ min: 0, max: 200, noNaN: true }),
            potassium: fc.float({ min: 0, max: 1000, noNaN: true }),
          }),
          (soilData) => {
            const data: SoilHealthCardData = {
              ...soilData,
              confidence: 90,
              rawText: 'test',
            };

            const mapped = mapper.mapFields(data);

            // All nutrients should have recommendations
            expect(mapped.nitrogen.recommendation).toBeTruthy();
            expect(mapped.nitrogen.recommendation.length).toBeGreaterThan(0);
            expect(mapped.phosphorus.recommendation).toBeTruthy();
            expect(mapped.phosphorus.recommendation.length).toBeGreaterThan(0);
            expect(mapped.potassium.recommendation).toBeTruthy();
            expect(mapped.potassium.recommendation.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
