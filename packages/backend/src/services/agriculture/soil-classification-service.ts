/**
 * Soil Classification Service
 * 
 * Integration service that connects the backend API to the Python ML service
 * for soil type classification from photos.
 */

import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

export interface SoilClassificationResult {
  soilType: string;
  texture: string;
  confidence: number;
  meetsThreshold: boolean;
  topPredictions: Array<{
    soilType: string;
    confidence: number;
  }>;
  nutrientIndicators?: {
    nitrogen?: string;
    phosphorus?: string;
    potassium?: string;
  };
  validationStatus: string;
  requiresManualReview: boolean;
  autoAccepted: boolean;
}

export interface ClassificationError {
  code: string;
  message: string;
  details?: any;
}

export class SoilClassificationService {
  private readonly confidenceThreshold = 0.85;
  private readonly mlServicePath: string;
  private readonly modelPath: string;

  constructor() {
    // Path to Python ML service
    this.mlServicePath = join(process.cwd(), 'packages/ml-services/soil_classification/inference.py');
    this.modelPath = join(process.cwd(), 'packages/ml-services/soil_classification/models/soil_classifier.h5');
  }

  /**
   * Classify soil type from image buffer
   */
  async classify(imageBuffer: Buffer): Promise<SoilClassificationResult> {
    let tempImagePath: string | null = null;

    try {
      // Save image to temporary file
      tempImagePath = await this.saveTempImage(imageBuffer);

      // Call Python ML service
      const mlResult = await this.callMLService(tempImagePath);

      // Map texture based on soil type (simplified mapping)
      const texture = this.inferTexture(mlResult.soil_type);

      // Infer nutrient indicators based on soil type
      const nutrientIndicators = this.inferNutrientIndicators(mlResult.soil_type);

      return {
        soilType: mlResult.soil_type,
        texture,
        confidence: mlResult.confidence,
        meetsThreshold: mlResult.meets_threshold,
        topPredictions: mlResult.top_predictions,
        nutrientIndicators,
        validationStatus: mlResult.validation_status,
        requiresManualReview: mlResult.requires_manual_review,
        autoAccepted: mlResult.auto_accepted,
      };

    } finally {
      // Clean up temporary file
      if (tempImagePath) {
        await this.cleanupTempFile(tempImagePath);
      }
    }
  }

  /**
   * Classify multiple images in batch
   */
  async classifyBatch(imageBuffers: Buffer[]): Promise<SoilClassificationResult[]> {
    const results: SoilClassificationResult[] = [];

    // Process sequentially to avoid overwhelming the system
    for (const imageBuffer of imageBuffers) {
      try {
        const result = await this.classify(imageBuffer);
        results.push(result);
      } catch (error: any) {
        // Add error result for failed classification
        results.push({
          soilType: 'unknown',
          texture: 'unknown',
          confidence: 0,
          meetsThreshold: false,
          topPredictions: [],
          validationStatus: 'error',
          requiresManualReview: true,
          autoAccepted: false,
        });
      }
    }

    return results;
  }

  /**
   * Save image buffer to temporary file
   */
  private async saveTempImage(imageBuffer: Buffer): Promise<string> {
    const tempDir = tmpdir();
    const fileName = `soil_${randomBytes(16).toString('hex')}.jpg`;
    const filePath = join(tempDir, fileName);

    await writeFile(filePath, imageBuffer);

    return filePath;
  }

  /**
   * Call Python ML service for classification
   */
  private async callMLService(imagePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Spawn Python process
      const pythonProcess = spawn('python3', [
        this.mlServicePath,
        '--model', this.modelPath,
        '--image', imagePath,
        '--threshold', this.confidenceThreshold.toString(),
      ]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ML service failed with code ${code}: ${stderr}`));
          return;
        }

        try {
          // Parse JSON output from Python service
          // The Python service should output JSON to stdout
          const lines = stdout.split('\n');
          const jsonLine = lines.find(line => line.trim().startsWith('{'));
          
          if (!jsonLine) {
            reject(new Error('No JSON output from ML service'));
            return;
          }

          const result = JSON.parse(jsonLine);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse ML service output: ${error}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to spawn ML service: ${error.message}`));
      });

      // Set timeout (30 seconds)
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('ML service timeout'));
      }, 30000);
    });
  }

  /**
   * Clean up temporary file
   */
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
    } catch (error) {
      // Ignore cleanup errors
      console.warn(`Failed to cleanup temp file ${filePath}:`, error);
    }
  }

  /**
   * Infer soil texture based on soil type
   */
  private inferTexture(soilType: string): string {
    const textureMap: Record<string, string> = {
      alluvial: 'loamy',
      black: 'clayey',
      red: 'sandy-loam',
      laterite: 'clayey',
      desert: 'sandy',
      mountain: 'variable',
    };

    return textureMap[soilType] || 'unknown';
  }

  /**
   * Infer nutrient indicators based on soil type
   */
  private inferNutrientIndicators(soilType: string): {
    nitrogen?: string;
    phosphorus?: string;
    potassium?: string;
  } {
    // Simplified nutrient indicator mapping
    const nutrientMap: Record<string, any> = {
      alluvial: {
        nitrogen: 'high',
        phosphorus: 'medium',
        potassium: 'high',
      },
      black: {
        nitrogen: 'medium',
        phosphorus: 'low',
        potassium: 'high',
      },
      red: {
        nitrogen: 'low',
        phosphorus: 'low',
        potassium: 'low',
      },
      laterite: {
        nitrogen: 'low',
        phosphorus: 'low',
        potassium: 'low',
      },
      desert: {
        nitrogen: 'very-low',
        phosphorus: 'low',
        potassium: 'medium',
      },
      mountain: {
        nitrogen: 'medium',
        phosphorus: 'medium',
        potassium: 'medium',
      },
    };

    return nutrientMap[soilType] || {};
  }

  /**
   * Get confidence threshold
   */
  getConfidenceThreshold(): number {
    return this.confidenceThreshold;
  }

  /**
   * Check if ML service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Check if Python is available
      const pythonProcess = spawn('python3', ['--version']);
      
      return new Promise((resolve) => {
        pythonProcess.on('close', (code) => {
          resolve(code === 0);
        });

        pythonProcess.on('error', () => {
          resolve(false);
        });

        setTimeout(() => {
          pythonProcess.kill();
          resolve(false);
        }, 5000);
      });
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
let serviceInstance: SoilClassificationService | null = null;

export function getSoilClassificationService(): SoilClassificationService {
  if (!serviceInstance) {
    serviceInstance = new SoilClassificationService();
  }
  return serviceInstance;
}
