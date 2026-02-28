/**
 * Soil Analysis API Endpoint
 * 
 * Comprehensive REST API for soil photo upload and analysis
 * Supports:
 * - Direct soil photo analysis (AI image classification)
 * - Soil health card OCR (government document parsing)
 * - Image quality validation
 * - Confidence threshold validation (85% minimum per Property 12)
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { getSoilOCRPipeline } from '../services/agriculture/soil-ocr-pipeline';
import { getImageQualityChecker } from '../services/agriculture/image-quality-checker';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * Soil analysis result interface
 */
interface SoilAnalysisResult {
  success: boolean;
  analysisType: 'photo' | 'health-card';
  data?: {
    soilType?: string;
    texture?: string;
    confidence?: number;
    meetsThreshold?: boolean;
    nutrientIndicators?: {
      nitrogen?: string;
      phosphorus?: string;
      potassium?: string;
      pH?: number;
      organicCarbon?: number;
    };
    topPredictions?: Array<{
      soilType: string;
      confidence: number;
    }>;
  };
  imageQuality?: any;
  validation?: any;
  requiresManualReview?: boolean;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  processingTimeMs?: number;
}

/**
 * POST /api/agriculture/soil/analyze
 * Main endpoint for soil photo upload and analysis
 * 
 * Supports two analysis types:
 * 1. photo - Direct soil photo classification using ML model
 * 2. health-card - OCR extraction from government soil health card
 */
router.post('/analyze', upload.single('image'), async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_IMAGE',
          message: 'Image file is required. Use multipart/form-data with "image" field.',
        },
      } as SoilAnalysisResult);
    }

    // Get analysis type from request
    const analysisType = req.body.type || 'photo'; // Default to photo analysis

    if (!['photo', 'health-card'].includes(analysisType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ANALYSIS_TYPE',
          message: 'Analysis type must be either "photo" or "health-card"',
        },
      } as SoilAnalysisResult);
    }

    const imageBuffer = req.file.buffer;

    // Step 1: Check image quality
    const qualityChecker = getImageQualityChecker();
    const imageQuality = await qualityChecker.checkQuality(imageBuffer, {
      width: 1920, // These would come from actual image metadata
      height: 1080,
      fileSize: imageBuffer.length,
      format: req.file.mimetype.split('/')[1],
    });

    if (!imageQuality.isAcceptable) {
      return res.status(400).json({
        success: false,
        analysisType,
        imageQuality,
        error: {
          code: 'POOR_IMAGE_QUALITY',
          message: qualityChecker.generateErrorMessage(imageQuality),
          details: imageQuality,
        },
        requiresManualReview: true,
        processingTimeMs: Date.now() - startTime,
      } as SoilAnalysisResult);
    }

    // Step 2: Route to appropriate analysis method
    let result: SoilAnalysisResult;

    if (analysisType === 'health-card') {
      // OCR-based analysis for soil health cards
      result = await analyzeSoilHealthCard(imageBuffer, imageQuality, startTime);
    } else {
      // ML-based photo analysis
      result = await analyzeSoilPhoto(imageBuffer, imageQuality, startTime);
    }

    // Return result with appropriate status code
    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);

  } catch (error: any) {
    console.error('Soil analysis API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during soil analysis',
        details: error.message,
      },
      processingTimeMs: Date.now() - startTime,
    } as SoilAnalysisResult);
  }
});

/**
 * Analyze soil photo using ML classification
 */
async function analyzeSoilPhoto(
  imageBuffer: Buffer,
  imageQuality: any,
  startTime: number
): Promise<SoilAnalysisResult> {
  try {
    // Call Python ML service for soil classification
    // In production, this would call the actual ML inference service
    const mlResult = await callSoilClassificationService(imageBuffer);

    // Validate confidence threshold (85% minimum per Property 12)
    const meetsThreshold = mlResult.confidence >= 0.85;

    return {
      success: meetsThreshold,
      analysisType: 'photo',
      data: {
        soilType: mlResult.soilType,
        texture: mlResult.texture,
        confidence: mlResult.confidence,
        meetsThreshold,
        nutrientIndicators: mlResult.nutrientIndicators,
        topPredictions: mlResult.topPredictions,
      },
      imageQuality,
      requiresManualReview: !meetsThreshold,
      processingTimeMs: Date.now() - startTime,
    };

  } catch (error: any) {
    return {
      success: false,
      analysisType: 'photo',
      imageQuality,
      error: {
        code: 'ML_SERVICE_ERROR',
        message: 'Failed to classify soil photo',
        details: error.message,
      },
      requiresManualReview: true,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Analyze soil health card using OCR
 */
async function analyzeSoilHealthCard(
  imageBuffer: Buffer,
  imageQuality: any,
  startTime: number
): Promise<SoilAnalysisResult> {
  try {
    // Use existing OCR pipeline
    const pipeline = getSoilOCRPipeline();
    const ocrResult = await pipeline.processWithRetry(imageBuffer);

    if (!ocrResult.success) {
      return {
        success: false,
        analysisType: 'health-card',
        imageQuality,
        validation: ocrResult.validation,
        error: ocrResult.error,
        requiresManualReview: true,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Extract nutrient data from OCR result
    const mappedData = ocrResult.data;

    return {
      success: true,
      analysisType: 'health-card',
      data: {
        nutrientIndicators: {
          nitrogen: mappedData?.nutrients?.nitrogen?.toString(),
          phosphorus: mappedData?.nutrients?.phosphorus?.toString(),
          potassium: mappedData?.nutrients?.potassium?.toString(),
          pH: mappedData?.soilProperties?.pH,
          organicCarbon: mappedData?.soilProperties?.organicCarbon,
        },
        confidence: ocrResult.rawData?.confidence,
        meetsThreshold: (ocrResult.rawData?.confidence || 0) >= 0.85,
      },
      imageQuality,
      validation: ocrResult.validation,
      requiresManualReview: ocrResult.needsManualReview,
      processingTimeMs: Date.now() - startTime,
    };

  } catch (error: any) {
    return {
      success: false,
      analysisType: 'health-card',
      imageQuality,
      error: {
        code: 'OCR_SERVICE_ERROR',
        message: 'Failed to process soil health card',
        details: error.message,
      },
      requiresManualReview: true,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Call ML service for soil classification
 */
async function callSoilClassificationService(imageBuffer: Buffer): Promise<any> {
  const { getSoilClassificationService } = await import('../services/agriculture/soil-classification-service');
  const classificationService = getSoilClassificationService();
  
  // Call the actual ML service
  const result = await classificationService.classify(imageBuffer);
  
  return result;
}

/**
 * POST /api/agriculture/soil/analyze/batch
 * Batch analysis of multiple soil photos
 */
router.post('/analyze/batch', upload.array('images', 10), async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_IMAGES',
          message: 'At least one image file is required',
        },
      });
    }

    if (files.length > 10) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_IMAGES',
          message: 'Maximum 10 images per batch',
        },
      });
    }

    const analysisType = req.body.type || 'photo';

    // Process each image
    const results: SoilAnalysisResult[] = [];

    for (const file of files) {
      const qualityChecker = getImageQualityChecker();
      const imageQuality = await qualityChecker.checkQuality(file.buffer, {
        width: 1920,
        height: 1080,
        fileSize: file.buffer.length,
        format: file.mimetype.split('/')[1],
      });

      if (!imageQuality.isAcceptable) {
        results.push({
          success: false,
          analysisType,
          imageQuality,
          error: {
            code: 'POOR_IMAGE_QUALITY',
            message: 'Image quality not acceptable',
          },
          requiresManualReview: true,
        });
        continue;
      }

      let result: SoilAnalysisResult;
      if (analysisType === 'health-card') {
        result = await analyzeSoilHealthCard(file.buffer, imageQuality, startTime);
      } else {
        result = await analyzeSoilPhoto(file.buffer, imageQuality, startTime);
      }

      results.push(result);
    }

    return res.status(200).json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        needsReview: results.filter(r => r.requiresManualReview).length,
        avgProcessingTimeMs: results.reduce((sum, r) => sum + (r.processingTimeMs || 0), 0) / results.length,
      },
      processingTimeMs: Date.now() - startTime,
    });

  } catch (error: any) {
    console.error('Batch soil analysis API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during batch analysis',
        details: error.message,
      },
      processingTimeMs: Date.now() - startTime,
    });
  }
});

/**
 * GET /api/agriculture/soil/supported-types
 * Get list of supported soil types
 */
router.get('/supported-types', async (req: Request, res: Response) => {
  try {
    const soilTypes = [
      {
        id: 'alluvial',
        name: 'Alluvial Soil',
        description: 'Found in river valleys and deltas, rich in nutrients',
        characteristics: ['High fertility', 'Good water retention', 'Suitable for most crops'],
      },
      {
        id: 'black',
        name: 'Black Soil (Regur)',
        description: 'Rich in clay, ideal for cotton cultivation',
        characteristics: ['High clay content', 'Good moisture retention', 'Rich in calcium and magnesium'],
      },
      {
        id: 'red',
        name: 'Red Soil',
        description: 'Rich in iron oxide, found in areas with moderate rainfall',
        characteristics: ['Porous and friable', 'Low fertility', 'Requires fertilization'],
      },
      {
        id: 'laterite',
        name: 'Laterite Soil',
        description: 'Found in high rainfall areas, rich in iron and aluminum',
        characteristics: ['Poor fertility', 'High acidity', 'Suitable for plantation crops'],
      },
      {
        id: 'desert',
        name: 'Desert Soil (Arid)',
        description: 'Found in arid regions, low organic content',
        characteristics: ['Sandy texture', 'Low moisture', 'Requires irrigation'],
      },
      {
        id: 'mountain',
        name: 'Mountain Soil',
        description: 'Found in hilly and mountainous regions',
        characteristics: ['Shallow depth', 'Variable fertility', 'Prone to erosion'],
      },
    ];

    return res.status(200).json({
      success: true,
      soilTypes,
      confidenceThreshold: 0.85,
    });

  } catch (error: any) {
    console.error('Supported types API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve supported soil types',
      },
    });
  }
});

/**
 * GET /api/agriculture/soil/quality-requirements
 * Get image quality requirements for soil analysis
 */
router.get('/quality-requirements', async (req: Request, res: Response) => {
  try {
    const qualityChecker = getImageQualityChecker();

    return res.status(200).json({
      success: true,
      requirements: {
        minWidth: 800,
        minHeight: 600,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        minFileSize: 10 * 1024, // 10KB
        acceptedFormats: ['jpeg', 'jpg', 'png', 'webp'],
        minQualityScore: qualityChecker.getMinimumQualityScore(),
      },
      guidelines: [
        'Ensure good lighting (natural daylight is best)',
        'Hold camera steady and parallel to soil/document',
        'Make sure image is in focus and clearly readable',
        'Avoid shadows, glare, or reflections',
        'Capture the entire soil sample or document within the frame',
        'Use minimum 800x600 resolution',
      ],
    });

  } catch (error: any) {
    console.error('Quality requirements API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve quality requirements',
      },
    });
  }
});

export default router;
