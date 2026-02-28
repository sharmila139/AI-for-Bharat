/**
 * Image Quality Checker
 * 
 * Analyzes image quality before OCR processing to detect issues that
 * may lead to poor extraction results. Provides actionable feedback
 * for users to retake photos.
 */

export interface ImageQualityResult {
  isAcceptable: boolean;
  score: number; // 0-100
  issues: ImageQualityIssue[];
  suggestions: string[];
}

export interface ImageQualityIssue {
  type: 'blur' | 'low-resolution' | 'poor-lighting' | 'skew' | 'noise' | 'file-size';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  fileSize: number;
  format: string;
}

export class ImageQualityChecker {
  // Minimum acceptable dimensions
  private readonly MIN_WIDTH = 800;
  private readonly MIN_HEIGHT = 600;
  
  // Maximum file size (10MB)
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;
  
  // Minimum file size (10KB) - too small likely means poor quality
  private readonly MIN_FILE_SIZE = 10 * 1024;
  
  // Minimum acceptable quality score
  private readonly MIN_QUALITY_SCORE = 60;

  /**
   * Check image quality and provide feedback
   */
  async checkQuality(imageBuffer: Buffer, metadata?: ImageMetadata): Promise<ImageQualityResult> {
    const issues: ImageQualityIssue[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Get or extract metadata
    const imgMetadata = metadata || await this.extractMetadata(imageBuffer);

    // Check resolution
    if (imgMetadata.width < this.MIN_WIDTH || imgMetadata.height < this.MIN_HEIGHT) {
      issues.push({
        type: 'low-resolution',
        severity: 'high',
        message: `Image resolution (${imgMetadata.width}x${imgMetadata.height}) is too low. Minimum ${this.MIN_WIDTH}x${this.MIN_HEIGHT} required.`,
      });
      suggestions.push('Use a higher resolution camera or move closer to the document');
      score -= 30;
    }

    // Check file size
    if (imgMetadata.fileSize > this.MAX_FILE_SIZE) {
      issues.push({
        type: 'file-size',
        severity: 'medium',
        message: `File size (${(imgMetadata.fileSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum (10MB).`,
      });
      suggestions.push('Compress the image or reduce camera resolution slightly');
      score -= 10;
    } else if (imgMetadata.fileSize < this.MIN_FILE_SIZE) {
      issues.push({
        type: 'file-size',
        severity: 'high',
        message: `File size (${(imgMetadata.fileSize / 1024).toFixed(2)}KB) is too small, indicating poor quality.`,
      });
      suggestions.push('Use a better quality camera or increase image quality settings');
      score -= 25;
    }

    // Check format
    const acceptableFormats = ['jpeg', 'jpg', 'png', 'webp'];
    if (!acceptableFormats.includes(imgMetadata.format.toLowerCase())) {
      issues.push({
        type: 'noise',
        severity: 'medium',
        message: `Image format '${imgMetadata.format}' may not be optimal. JPEG or PNG recommended.`,
      });
      suggestions.push('Save image as JPEG or PNG format');
      score -= 10;
    }

    // Perform basic image analysis
    const analysisResult = await this.analyzeImageContent(imageBuffer);
    
    if (analysisResult.isBlurry) {
      issues.push({
        type: 'blur',
        severity: 'high',
        message: 'Image appears blurry or out of focus.',
      });
      suggestions.push('Hold the camera steady and ensure the document is in focus');
      score -= 25;
    }

    if (analysisResult.hasLowContrast) {
      issues.push({
        type: 'poor-lighting',
        severity: 'medium',
        message: 'Image has low contrast, making text difficult to read.',
      });
      suggestions.push('Improve lighting conditions or adjust camera exposure');
      score -= 15;
    }

    if (analysisResult.isSkewed) {
      issues.push({
        type: 'skew',
        severity: 'low',
        message: 'Document appears tilted or skewed.',
      });
      suggestions.push('Align the camera parallel to the document surface');
      score -= 10;
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    // Determine if image is acceptable
    const isAcceptable = score >= this.MIN_QUALITY_SCORE && issues.filter(i => i.severity === 'high').length === 0;

    return {
      isAcceptable,
      score,
      issues,
      suggestions,
    };
  }

  /**
   * Extract basic metadata from image buffer
   */
  private async extractMetadata(imageBuffer: Buffer): Promise<ImageMetadata> {
    // Simple metadata extraction without external dependencies
    // In production, you might use 'sharp' or 'jimp' for more accurate analysis
    
    const fileSize = imageBuffer.length;
    
    // Detect format from magic bytes
    let format = 'unknown';
    if (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8) {
      format = 'jpeg';
    } else if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
      format = 'png';
    } else if (imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49) {
      format = 'webp';
    }

    // For dimensions, we'll use placeholder values
    // In production, use proper image processing library
    const width = 1920; // Placeholder
    const height = 1080; // Placeholder

    return {
      width,
      height,
      fileSize,
      format,
    };
  }

  /**
   * Analyze image content for quality issues
   */
  private async analyzeImageContent(imageBuffer: Buffer): Promise<{
    isBlurry: boolean;
    hasLowContrast: boolean;
    isSkewed: boolean;
  }> {
    // Simplified analysis without external dependencies
    // In production, implement proper image analysis using 'sharp' or 'opencv'
    
    // For now, use heuristics based on file characteristics
    const fileSize = imageBuffer.length;
    const sizeRatio = fileSize / (1920 * 1080); // Assuming typical resolution

    // Very low compression ratio might indicate blur or low detail
    const isBlurry = sizeRatio < 0.05;

    // Check for low contrast (simplified)
    const hasLowContrast = false; // Would need proper histogram analysis

    // Check for skew (simplified)
    const isSkewed = false; // Would need edge detection

    return {
      isBlurry,
      hasLowContrast,
      isSkewed,
    };
  }

  /**
   * Generate user-friendly error message with suggestions
   */
  generateErrorMessage(result: ImageQualityResult): string {
    if (result.isAcceptable) {
      return 'Image quality is acceptable for OCR processing.';
    }

    const highSeverityIssues = result.issues.filter(i => i.severity === 'high');
    
    let message = 'Image quality is not suitable for accurate text extraction.\n\n';
    
    if (highSeverityIssues.length > 0) {
      message += 'Critical Issues:\n';
      highSeverityIssues.forEach(issue => {
        message += `• ${issue.message}\n`;
      });
      message += '\n';
    }

    if (result.suggestions.length > 0) {
      message += 'Suggestions to improve image quality:\n';
      result.suggestions.forEach(suggestion => {
        message += `• ${suggestion}\n`;
      });
    }

    message += '\nPlease retake the photo following these guidelines:\n';
    message += '• Ensure good lighting (natural daylight is best)\n';
    message += '• Hold camera steady and parallel to document\n';
    message += '• Make sure text is in focus and clearly readable\n';
    message += '• Avoid shadows, glare, or reflections\n';
    message += '• Capture the entire document within the frame\n';

    return message;
  }

  /**
   * Get quality score threshold
   */
  getMinimumQualityScore(): number {
    return this.MIN_QUALITY_SCORE;
  }
}

// Singleton instance
let qualityCheckerInstance: ImageQualityChecker | null = null;

export function getImageQualityChecker(): ImageQualityChecker {
  if (!qualityCheckerInstance) {
    qualityCheckerInstance = new ImageQualityChecker();
  }
  return qualityCheckerInstance;
}
