/**
 * Soil OCR API Endpoint
 * 
 * REST API for processing soil health card images with OCR
 */

import { Router, Request, Response } from 'express';
import { getSoilOCRPipeline } from '../services/agriculture/soil-ocr-pipeline';

const router = Router();

/**
 * POST /api/agriculture/ocr/soil-health-card
 * Process a soil health card image
 */
router.post('/soil-health-card', async (req: Request, res: Response) => {
  try {
    // In production, use multer or similar for file upload handling
    const imageBuffer = req.body.image; // Assuming base64 or buffer

    if (!imageBuffer) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_IMAGE',
          message: 'Image data is required',
        },
      });
    }

    // Process image through OCR pipeline
    const pipeline = getSoilOCRPipeline();
    const result = await pipeline.processWithRetry(imageBuffer);

    // Return result
    return res.status(result.success ? 200 : 400).json(result);

  } catch (error: any) {
    console.error('Soil OCR API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error.message,
      },
    });
  }
});

/**
 * POST /api/agriculture/ocr/soil-health-card/batch
 * Process multiple soil health card images
 */
router.post('/soil-health-card/batch', async (req: Request, res: Response) => {
  try {
    const images = req.body.images; // Array of image buffers

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_IMAGES',
          message: 'Array of images is required',
        },
      });
    }

    if (images.length > 10) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_IMAGES',
          message: 'Maximum 10 images per batch',
        },
      });
    }

    // Process images through OCR pipeline
    const pipeline = getSoilOCRPipeline();
    const results = await pipeline.processBatch(images);

    return res.status(200).json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        needsReview: results.filter(r => r.needsManualReview).length,
      },
    });

  } catch (error: any) {
    console.error('Soil OCR batch API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error.message,
      },
    });
  }
});

/**
 * GET /api/agriculture/ocr/validation-ranges
 * Get validation ranges for soil parameters
 */
router.get('/validation-ranges', async (req: Request, res: Response) => {
  try {
    const { getOCRValidator } = await import('../services/agriculture/ocr-validator');
    const validator = getOCRValidator();
    const ranges = validator.getValidationRanges();

    return res.status(200).json({
      success: true,
      ranges,
    });

  } catch (error: any) {
    console.error('Validation ranges API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve validation ranges',
      },
    });
  }
});

/**
 * POST /api/agriculture/ocr/manual-entry
 * Save manually entered soil health data
 */
router.post('/manual-entry', async (req: Request, res: Response) => {
  try {
    const soilData = req.body;

    // Validate the data
    const { getOCRValidator } = await import('../services/agriculture/ocr-validator');
    const validator = getOCRValidator();
    
    const validation = validator.validate({
      ...soilData,
      confidence: 100, // Manual entry has 100% confidence
      rawText: 'Manual entry',
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        validation,
        error: {
          code: 'INVALID_DATA',
          message: 'Soil data validation failed',
        },
      });
    }

    // Map the fields
    const { getSoilFieldMapper } = await import('../services/agriculture/soil-field-mapper');
    const mapper = getSoilFieldMapper();
    const mappedData = mapper.mapFields({
      ...soilData,
      confidence: 100,
      rawText: 'Manual entry',
    });

    // In production, save to database here

    return res.status(200).json({
      success: true,
      data: mappedData,
      validation,
    });

  } catch (error: any) {
    console.error('Manual entry API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process manual entry',
      },
    });
  }
});

export default router;
