/**
 * AI Image Classifier Service
 * Uses AWS Bedrock Claude 3 for intelligent category detection from grievance photos
 * Provides fallback to keyword-based classification if AI fails
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type GrievanceCategory = 
  | 'roads' 
  | 'water' 
  | 'electricity' 
  | 'drainage' 
  | 'waste' 
  | 'streetlights' 
  | 'public_property' 
  | 'health_facility' 
  | 'education_facility';

export interface ImageInput {
  buffer?: Buffer;
  s3Url?: string;
  mimeType?: string;
}

export interface ClassificationResult {
  category: GrievanceCategory;
  confidence: number;
  detectedFeatures: string[];
  method: 'ai' | 'keyword';
  reasoning?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_KEYWORDS: Record<GrievanceCategory, string[]> = {
  roads: ['pothole', 'road', 'street', 'pavement', 'crack', 'damage', 'highway', 'path', 'asphalt'],
  water: ['water', 'pipe', 'leak', 'supply', 'tap', 'broken pipe', 'water supply'],
  electricity: ['power', 'electricity', 'light', 'pole', 'wire', 'transformer', 'outage', 'blackout', 'electric pole'],
  drainage: ['drainage', 'drain', 'clog', 'blocked', 'overflow', 'sewer', 'manhole'],
  waste: ['garbage', 'waste', 'trash', 'dump', 'litter', 'rubbish', 'refuse'],
  streetlights: ['streetlight', 'street light', 'lamp', 'lighting', 'light post', 'street lamp'],
  public_property: ['park', 'bench', 'playground', 'public', 'vandalism', 'graffiti', 'building'],
  health_facility: ['hospital', 'clinic', 'doctor', 'medicine', 'health', 'medical', 'phc', 'dispensary'],
  education_facility: ['school', 'teacher', 'classroom', 'education', 'student', 'college', 'library']
};

const CATEGORY_DESCRIPTIONS: Record<GrievanceCategory, string> = {
  roads: 'Road infrastructure issues including potholes, cracks, damaged pavement, or road surface problems',
  water: 'Water supply issues including leaking pipes, broken taps, or water supply disruptions',
  electricity: 'Electrical infrastructure issues including power outages, damaged poles, exposed wires, or transformer problems',
  drainage: 'Drainage and sewage issues including blocked drains, overflowing sewers, or clogged manholes',
  waste: 'Waste management issues including garbage accumulation, overflowing bins, or illegal dumping',
  streetlights: 'Street lighting issues including non-functional lights, damaged lamp posts, or inadequate lighting',
  public_property: 'Public property damage including vandalized parks, broken benches, damaged playgrounds, or graffiti',
  health_facility: 'Healthcare facility issues including hospital infrastructure, medical equipment, or clinic maintenance',
  education_facility: 'Educational facility issues including school infrastructure, classroom conditions, or library maintenance'
};

const MINIMUM_CONFIDENCE_THRESHOLD = 85;

// ============================================================================
// AI IMAGE CLASSIFIER SERVICE
// ============================================================================

export class AIImageClassifier {
  private s3Client?: S3Client;
  private classificationCache = new Map<string, ClassificationResult>();

  constructor(s3Config?: { region: string }) {
    if (s3Config) {
      this.s3Client = new S3Client({ region: s3Config.region });
    }
  }

  /**
   * Main classification function - classifies grievance image using AI
   * Falls back to keyword-based classification if AI fails or confidence is low
   */
  async classifyGrievanceImage(
    image: ImageInput,
    description: string
  ): Promise<ClassificationResult> {
    // Check cache first
    const cacheKey = this.getCacheKey(image, description);
    const cached = this.classificationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Try AI classification first
      const aiResult = await this.classifyWithBedrock(image, description);
      
      // If AI confidence is high enough, use it
      if (aiResult.confidence >= MINIMUM_CONFIDENCE_THRESHOLD) {
        this.classificationCache.set(cacheKey, aiResult);
        return aiResult;
      }

      // If AI confidence is low, fall back to keyword classification
      console.log(`AI confidence ${aiResult.confidence}% below threshold, falling back to keyword classification`);
      const keywordResult = await this.fallbackToKeywordClassification(description);
      
      // Cache and return keyword result
      this.classificationCache.set(cacheKey, keywordResult);
      return keywordResult;

    } catch (error) {
      console.error('AI classification failed, using keyword fallback:', error);
      
      // Fall back to keyword classification on error
      const keywordResult = await this.fallbackToKeywordClassification(description);
      this.classificationCache.set(cacheKey, keywordResult);
      return keywordResult;
    }
  }

  /**
   * Classify image using AWS Bedrock Claude 3
   */
  private async classifyWithBedrock(
    image: ImageInput,
    description: string
  ): Promise<ClassificationResult> {
    // Get image buffer
    const imageBuffer = await this.getImageBuffer(image);
    
    // Convert image to base64
    const base64Image = imageBuffer.toString('base64');
    const mimeType = image.mimeType || 'image/jpeg';

    // Build structured prompt for category detection
    const prompt = this.buildClassificationPrompt(description);

    // Call Bedrock with image analysis
    const response = await this.analyzeImageWithBedrock(base64Image, mimeType, prompt);

    // Parse response to extract category and confidence
    return this.parseBedrockResponse(response);
  }

  /**
   * Build classification prompt for Bedrock
   */
  private buildClassificationPrompt(description: string): string {
    const categoriesList = Object.entries(CATEGORY_DESCRIPTIONS)
      .map(([cat, desc]) => `- ${cat}: ${desc}`)
      .join('\n');

    return `You are analyzing a photo of an infrastructure issue reported by a citizen. 

DESCRIPTION PROVIDED BY REPORTER:
"${description}"

AVAILABLE CATEGORIES:
${categoriesList}

TASK:
1. Analyze the image carefully to identify the type of infrastructure issue
2. Consider both the visual content and the description
3. Select the MOST APPROPRIATE category from the list above
4. Provide a confidence score (0-100) for your classification
5. List specific visual features you detected that support your classification

RESPONSE FORMAT (JSON):
{
  "category": "one of the categories above",
  "confidence": 95,
  "detectedFeatures": ["feature1", "feature2", "feature3"],
  "reasoning": "Brief explanation of why you chose this category"
}

IMPORTANT:
- Only use categories from the list provided
- Be conservative with confidence scores - only give 85+ if you're very certain
- If the image is unclear or doesn't match any category well, give a lower confidence score
- Consider both visual evidence and the description text`;
  }

  /**
   * Call Bedrock API with image for analysis
   */
  private async analyzeImageWithBedrock(
    base64Image: string,
    mimeType: string,
    prompt: string
  ): Promise<string> {
    // Use Bedrock's vision capabilities with Claude 3
    const { BedrockRuntimeClient, InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    
    // Get the underlying Bedrock runtime client
    const bedrockClient = new BedrockRuntimeClient({
      region: process.env.BEDROCK_REGION || 'us-east-1'
    });
    
    const body = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1024,
      temperature: 0.3, // Lower temperature for more consistent classification
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    };

    try {
      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0', // Claude 3 Sonnet supports vision
        body: JSON.stringify(body)
      });

      const response = await bedrockClient.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));
      
      return result.content[0].text;
    } catch (error: any) {
      console.error('Bedrock vision API error:', error);
      throw new Error(`Failed to analyze image with Bedrock: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Parse Bedrock response to extract classification result
   */
  private parseBedrockResponse(response: string): ClassificationResult {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(jsonStr);

      // Validate category
      const category = this.normalizeCategory(parsed.category);
      if (!category) {
        throw new Error(`Invalid category: ${parsed.category}`);
      }

      // Validate confidence
      const confidence = Math.max(0, Math.min(100, parsed.confidence || 0));

      return {
        category,
        confidence,
        detectedFeatures: parsed.detectedFeatures || [],
        method: 'ai',
        reasoning: parsed.reasoning
      };

    } catch (error) {
      console.error('Failed to parse Bedrock response:', error);
      console.error('Response was:', response);
      throw new Error('Failed to parse AI classification response');
    }
  }

  /**
   * Normalize category name to match our enum
   */
  private normalizeCategory(category: string): GrievanceCategory | null {
    const normalized = category.toLowerCase().replace(/\s+/g, '_');
    
    const validCategories: GrievanceCategory[] = [
      'roads', 'water', 'electricity', 'drainage', 'waste', 
      'streetlights', 'public_property', 'health_facility', 'education_facility'
    ];

    if (validCategories.includes(normalized as GrievanceCategory)) {
      return normalized as GrievanceCategory;
    }

    return null;
  }

  /**
   * Fallback to keyword-based classification
   */
  async fallbackToKeywordClassification(description: string): Promise<ClassificationResult> {
    const descriptionLower = description.toLowerCase();
    const categoryScores: Record<GrievanceCategory, number> = {
      roads: 0,
      water: 0,
      electricity: 0,
      drainage: 0,
      waste: 0,
      streetlights: 0,
      public_property: 0,
      health_facility: 0,
      education_facility: 0
    };

    const matchedKeywords: string[] = [];

    // Score each category based on keyword matches
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (descriptionLower.includes(keyword)) {
          categoryScores[category as GrievanceCategory] += 1;
          matchedKeywords.push(keyword);
        }
      }
    }

    // Find category with highest score
    let maxScore = 0;
    let detectedCategory: GrievanceCategory = 'public_property'; // Default fallback

    for (const [category, score] of Object.entries(categoryScores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedCategory = category as GrievanceCategory;
      }
    }

    // Calculate confidence based on keyword matches
    // More matches = higher confidence, but cap at 80% for keyword-based
    const confidence = maxScore > 0 ? Math.min(60 + maxScore * 5, 80) : 50;

    return {
      category: detectedCategory,
      confidence,
      detectedFeatures: matchedKeywords,
      method: 'keyword'
    };
  }

  /**
   * Get image buffer from various input sources
   */
  private async getImageBuffer(image: ImageInput): Promise<Buffer> {
    if (image.buffer) {
      return image.buffer;
    }

    if (image.s3Url && this.s3Client) {
      return await this.downloadFromS3(image.s3Url);
    }

    throw new Error('No valid image source provided (buffer or s3Url required)');
  }

  /**
   * Download image from S3
   */
  private async downloadFromS3(s3Url: string): Promise<Buffer> {
    if (!this.s3Client) {
      throw new Error('S3 client not configured');
    }

    // Parse S3 URL to extract bucket and key
    const url = new URL(s3Url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const bucket = pathParts[0];
    const key = pathParts.slice(1).join('/');

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    const response = await this.s3Client.send(command);
    
    // Convert stream to buffer
    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];
    
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  /**
   * Generate cache key for classification result
   */
  private getCacheKey(image: ImageInput, description: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    
    if (image.buffer) {
      hash.update(image.buffer);
    } else if (image.s3Url) {
      hash.update(image.s3Url);
    }
    
    hash.update(description);
    return hash.digest('hex');
  }

  /**
   * Clear classification cache
   */
  clearCache(): void {
    this.classificationCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.classificationCache.size,
      maxSize: 1000 // Limit cache size
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

let classifierInstance: AIImageClassifier | null = null;

export function getAIImageClassifier(s3Config?: { region: string }): AIImageClassifier {
  if (!classifierInstance) {
    classifierInstance = new AIImageClassifier(s3Config);
  }
  return classifierInstance;
}
