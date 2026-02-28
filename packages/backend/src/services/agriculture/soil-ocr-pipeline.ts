/**
 * Soil OCR Pipeline
 * 
 * Integrated pipeline that orchestrates image quality checking, OCR extraction,
 * validation, and field mapping for soil health card processing.
 */

import { getOCRService, SoilHealthCardData } from './ocr-service';
import { getOCRValidator, ValidationResult } from './ocr-validator';
import { getSoilFieldMapper, MappedSoilData } from './soil-field-mapper';
import { getImageQualityChecker, ImageQualityResult } from './image-quality-checker';

export interface OCRPipelineResult {
  success: boolean;
  data?: MappedSoilData;
  rawData?: SoilHealthCardData;
  validation?: ValidationResult;
  imageQuality?: ImageQualityResult;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  needsManualReview: boolean;
  processingTimeMs: number;
}

export class SoilOCRPipeline {
  private ocrService = getOCRService();
  private validator = getOCRValidator();
  private mapper = getSoilFieldMapper();
  private qualityChecker = getImageQualityChecker();

  /**
   * Process a soil health card image through the complete pipeline
   */
  async process(imageSource: string | Buffer): Promise<OCRPipelineResult> {
    const startTime = Date.now();

    try {
      // Step 1: Check image quality
      const imageBuffer = typeof imageSource === 'string' 
        ? await this.loadImageFromPath(imageSource)
        : imageSource;

      const imageQuality = await this.qualityChecker.checkQuality(imageBuffer);

      if (!imageQuality.isAcceptable) {
        return {
          success: false,
          imageQuality,
          error: {
            code: 'POOR_IMAGE_QUALITY',
            message: this.qualityChecker.generateErrorMessage(imageQuality),
            details: imageQuality,
          },
          needsManualReview: true,
          processingTimeMs: Date.now() - startTime,
        };
      }

      // Step 2: Initialize OCR service
      await this.ocrService.initialize();

      // Step 3: Extract text and parse soil health card data
      const rawData = await this.ocrService.processSoilHealthCard(imageSource);

      // Step 4: Validate extracted data
      const validation = this.validator.validate(rawData);

      // Step 5: Map fields to standardized format
      const mappedData = this.mapper.mapFields(rawData);

      // Determine if manual review is needed
      const needsManualReview = validation.needsManualReview || !validation.isValid;

      // Step 6: Return result
      return {
        success: validation.isValid,
        data: mappedData,
        rawData,
        validation,
        imageQuality,
        needsManualReview,
        processingTimeMs: Date.now() - startTime,
      };

    } catch (error: any) {
      console.error('OCR Pipeline error:', error);
      
      return {
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: error.message || 'An unexpected error occurred during OCR processing',
          details: error,
        },
        needsManualReview: true,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Process with retry logic for transient failures
   */
  async processWithRetry(
    imageSource: string | Buffer,
    maxRetries: number = 2
  ): Promise<OCRPipelineResult> {
    let lastError: OCRPipelineResult | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.process(imageSource);
        
        // If successful or image quality issue (no point retrying), return immediately
        if (result.success || result.error?.code === 'POOR_IMAGE_QUALITY') {
          return result;
        }

        // Store error for potential return
        lastError = result;

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }

      } catch (error: any) {
        console.error(`OCR attempt ${attempt + 1} failed:`, error);
        
        if (attempt === maxRetries) {
          return {
            success: false,
            error: {
              code: 'MAX_RETRIES_EXCEEDED',
              message: 'Failed to process image after multiple attempts',
              details: error,
            },
            needsManualReview: true,
            processingTimeMs: 0,
          };
        }
      }
    }

    return lastError || {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Processing failed for unknown reason',
      },
      needsManualReview: true,
      processingTimeMs: 0,
    };
  }

  /**
   * Batch process multiple images
   */
  async processBatch(imageSources: (string | Buffer)[]): Promise<OCRPipelineResult[]> {
    const results: OCRPipelineResult[] = [];

    // Process images sequentially to avoid overwhelming the system
    for (const imageSource of imageSources) {
      const result = await this.process(imageSource);
      results.push(result);
    }

    return results;
  }

  /**
   * Get processing statistics from a result
   */
  getStatistics(result: OCRPipelineResult): {
    extractedFields: number;
    confidence: number;
    qualityScore: number;
    processingTime: number;
    needsReview: boolean;
  } {
    return {
      extractedFields: result.data?.extractedFieldsCount || 0,
      confidence: result.rawData?.confidence || 0,
      qualityScore: result.imageQuality?.score || 0,
      processingTime: result.processingTimeMs,
      needsReview: result.needsManualReview,
    };
  }

  /**
   * Load image from file path
   */
  private async loadImageFromPath(path: string): Promise<Buffer> {
    const fs = await import('fs/promises');
    return await fs.readFile(path);
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.ocrService.terminate();
  }
}

// Singleton instance
let pipelineInstance: SoilOCRPipeline | null = null;

export function getSoilOCRPipeline(): SoilOCRPipeline {
  if (!pipelineInstance) {
    pipelineInstance = new SoilOCRPipeline();
  }
  return pipelineInstance;
}
