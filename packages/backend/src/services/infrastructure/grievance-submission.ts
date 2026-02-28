/**
 * Grievance Submission Service
 * Handles infrastructure issue reporting with photo upload, AI classification,
 * duplicate detection, and automatic assignment
 */

import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import crypto from 'crypto';
import { getAIImageClassifier } from './ai-image-classifier';
import { getLocationService } from './location-service';
import { getImageSimilarityService } from './image-similarity';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type GrievanceCategory = 
  | 'road' 
  | 'water' 
  | 'electricity' 
  | 'sanitation' 
  | 'healthcare' 
  | 'education' 
  | 'public_safety' 
  | 'other';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type GrievanceStatus = 
  | 'submitted' 
  | 'acknowledged' 
  | 'in_progress' 
  | 'resolved' 
  | 'closed' 
  | 'rejected';

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface PhotoUpload {
  filename: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
  exifData?: any;
}

export interface GrievanceSubmissionInput {
  userId?: string; // Optional for anonymous submissions
  title: string;
  description: string;
  category?: GrievanceCategory; // Optional, can be auto-detected
  subcategory?: string;
  location?: GPSLocation; // Optional, can be extracted from photo
  address?: string;
  district?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  photos: PhotoUpload[];
  isAnonymous?: boolean;
  reporterContact?: string; // For anonymous follow-up
}

export interface AIClassificationResult {
  category: GrievanceCategory;
  confidence: number;
  severity: SeverityLevel;
  keywords: string[];
}

export interface DuplicateGrievance {
  grievanceId: string;
  ticketNumber: string;
  similarity: number;
  distance: number; // meters
  createdAt: Date;
}

export interface AuthorityAssignment {
  authority: string;
  department: string;
  officerId?: string;
}

export interface GrievanceSubmissionResult {
  grievanceId: string;
  ticketNumber: string;
  category: GrievanceCategory;
  severity: SeverityLevel;
  assignedAuthority: string;
  slaDeadline: Date;
  isDuplicate: boolean;
  duplicateOf?: string;
  photoUrls: string[];
  estimatedResolutionDays: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SEVERITY_KEYWORDS = {
  critical: ['emergency', 'urgent', 'dangerous', 'life-threatening', 'severe', 'major accident'],
  high: ['serious', 'important', 'significant', 'major', 'broken', 'not working'],
  medium: ['moderate', 'needs attention', 'problem', 'issue', 'concern'],
  low: ['minor', 'small', 'slight', 'cosmetic', 'improvement']
};

// SLA deadlines in hours based on category and severity
const SLA_MATRIX: Record<GrievanceCategory, Record<SeverityLevel, number>> = {
  road: { critical: 4, high: 24, medium: 72, low: 168 },
  water: { critical: 2, high: 12, medium: 48, low: 120 },
  electricity: { critical: 2, high: 8, medium: 48, low: 120 },
  sanitation: { critical: 8, high: 24, medium: 72, low: 168 },
  healthcare: { critical: 1, high: 4, medium: 24, low: 72 },
  education: { critical: 24, high: 72, medium: 168, low: 336 },
  public_safety: { critical: 1, high: 2, medium: 12, low: 48 },
  other: { critical: 24, high: 72, medium: 168, low: 336 }
};

// Authority mapping by category
const AUTHORITY_MAPPING: Record<GrievanceCategory, { authority: string; department: string }> = {
  road: { authority: 'Public Works Department', department: 'Roads & Highways' },
  water: { authority: 'Water Supply Department', department: 'Water Resources' },
  electricity: { authority: 'Electricity Board', department: 'Power Distribution' },
  sanitation: { authority: 'Municipal Corporation', department: 'Sanitation & Waste Management' },
  healthcare: { authority: 'Health Department', department: 'Primary Healthcare' },
  education: { authority: 'Education Department', department: 'School Administration' },
  public_safety: { authority: 'Police Department', department: 'Public Safety' },
  other: { authority: 'District Administration', department: 'General Administration' }
};

// ============================================================================
// GRIEVANCE SUBMISSION SERVICE
// ============================================================================

export class GrievanceSubmissionService {
  private s3Client?: S3Client;
  private bucketName: string;
  private cdnUrl: string;
  private aiClassifier = getAIImageClassifier();
  private locationService = getLocationService();
  private imageSimilarityService = getImageSimilarityService();

  constructor(
    private pool: Pool,
    s3Config?: {
      region: string;
      credentials: { accessKeyId: string; secretAccessKey: string };
      bucketName: string;
      cdnUrl: string;
    }
  ) {
    // Initialize S3 client (use mock for development if config not provided)
    if (s3Config) {
      this.s3Client = new S3Client({
        region: s3Config.region,
        credentials: s3Config.credentials,
      });
      this.bucketName = s3Config.bucketName;
      this.cdnUrl = s3Config.cdnUrl;
      
      // Initialize AI classifier with S3 config
      this.aiClassifier = getAIImageClassifier({ region: s3Config.region });
    } else {
      // Mock configuration for development
      this.bucketName = 'ruralconnect-dev';
      this.cdnUrl = 'https://cdn.ruralconnect.dev';
    }
  }

  /**
   * Submit a new grievance
   * Main entry point for grievance submission
   */
  async submitGrievance(input: GrievanceSubmissionInput): Promise<GrievanceSubmissionResult> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Extract GPS from photos if not provided
      let location = input.location;
      if (!location && input.photos.length > 0) {
        const extractedLocation = await this.extractGPSFromPhoto(input.photos[0]);
        if (extractedLocation) {
          location = extractedLocation;
        }
      }

      // 2. Upload photos to S3
      const photoUrls = await this.uploadPhotos(input.photos);

      // 3. Calculate perceptual hash for first photo (for duplicate detection)
      const imageHash = await this.imageSimilarityService.calculatePerceptualHash(input.photos[0].buffer);

      // 4. AI classification of category and severity
      const aiClassification = await this.classifyImageCategory(
        input.photos[0],
        input.description,
        input.category
      );

      // 5. Calculate severity if not from AI
      const severity = aiClassification.severity;

      // 6. Check for duplicates using spatial clustering and image similarity
      const duplicates = location 
        ? await this.detectDuplicates(location, input.photos[0].buffer, aiClassification.category, client)
        : [];
      
      const isDuplicate = duplicates.length > 0;
      const parentGrievanceId = isDuplicate ? duplicates[0].grievanceId : null;

      // 7. Assign to responsible authority
      const assignment = this.assignAuthority(aiClassification.category, location);

      // 8. Calculate SLA deadline
      const slaDeadline = this.calculateSLADeadline(aiClassification.category, severity);

      // 9. Generate anonymous ID if needed
      const anonymousId = input.isAnonymous ? this.generateAnonymousId() : null;

      // 9. Encrypt reporter contact if anonymous
      const encryptedContact = input.isAnonymous && input.reporterContact
        ? this.encryptContact(input.reporterContact)
        : null;

      // 10. Insert grievance into database
      const insertQuery = `
        INSERT INTO grievances (
          grievance_id,
          user_id,
          title,
          description,
          category,
          subcategory,
          latitude,
          longitude,
          address,
          district,
          state,
          pincode,
          landmark,
          photos,
          image_hash,
          ai_category,
          ai_confidence,
          ai_severity,
          assigned_authority,
          assigned_department,
          priority,
          sla_deadline,
          is_anonymous,
          reporter_contact_encrypted,
          is_duplicate,
          parent_grievance_id,
          status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
        ) RETURNING grievance_id, ticket_number
      `;

      const grievanceId = uuidv4();
      const priority = this.severityToPriority(severity);

      const result = await client.query(insertQuery, [
        grievanceId,
        input.isAnonymous ? null : input.userId,
        input.title,
        input.description,
        aiClassification.category,
        input.subcategory,
        location?.latitude,
        location?.longitude,
        input.address,
        input.district,
        input.state,
        input.pincode,
        input.landmark,
        photoUrls,
        imageHash.hash, // Store perceptual hash for future duplicate detection
        aiClassification.category,
        aiClassification.confidence,
        severity,
        assignment.authority,
        assignment.department,
        priority,
        slaDeadline,
        input.isAnonymous || false,
        encryptedContact,
        isDuplicate,
        parentGrievanceId,
        'submitted'
      ]);

      const ticketNumber = result.rows[0].ticket_number;

      // 11. Create initial status update
      await this.createStatusUpdate(
        grievanceId,
        'status_change',
        'Grievance submitted successfully',
        'system',
        client
      );

      await client.query('COMMIT');

      // 12. Send notification (async, don't wait)
      this.sendSubmissionNotification(ticketNumber, input.userId, anonymousId).catch(err => {
        console.error('Failed to send notification:', err);
      });

      return {
        grievanceId,
        ticketNumber,
        category: aiClassification.category,
        severity,
        assignedAuthority: assignment.authority,
        slaDeadline,
        isDuplicate,
        duplicateOf: parentGrievanceId || undefined,
        photoUrls,
        estimatedResolutionDays: Math.ceil(SLA_MATRIX[aiClassification.category][severity] / 24)
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error submitting grievance:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Extract GPS location from photo EXIF metadata and perform reverse geocoding
   */
  async extractGPSFromPhoto(photo: PhotoUpload): Promise<GPSLocation | null> {
    try {
      // Extract GPS coordinates from EXIF
      const coordinates = this.locationService.extractGPSFromEXIF(photo.buffer);
      
      if (!coordinates) {
        return null;
      }

      // Perform reverse geocoding to get address (optional, for enrichment)
      // This is done asynchronously and doesn't block if it fails
      try {
        const geocodeResult = await this.locationService.reverseGeocode(
          coordinates.latitude,
          coordinates.longitude
        );
        
        if (geocodeResult) {
          console.log('Reverse geocoded address:', geocodeResult.address.formattedAddress);
        }
      } catch (error) {
        console.warn('Reverse geocoding failed, continuing with coordinates only:', error);
      }

      return {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        accuracy: coordinates.accuracy
      };
    } catch (error) {
      console.error('Error extracting GPS from photo:', error);
      return null;
    }
  }

  /**
   * AI image classification to detect category with confidence
   * Uses AWS Bedrock for intelligent classification with keyword fallback
   */
  async classifyImageCategory(
    photo: PhotoUpload,
    description: string,
    userCategory?: GrievanceCategory
  ): Promise<AIClassificationResult> {
    // If user provided category, use it with high confidence
    if (userCategory) {
      const severity = this.calculateSeverity(userCategory, description);
      return {
        category: userCategory,
        confidence: 95,
        severity,
        keywords: []
      };
    }

    // Use AI classifier
    const result = await this.aiClassifier.classifyGrievanceImage(
      { buffer: photo.buffer, mimeType: photo.mimeType },
      description
    );

    // Map AI classifier category to our GrievanceCategory type
    const category = this.mapAICategory(result.category);
    const severity = this.calculateSeverity(category, description);

    return {
      category,
      confidence: result.confidence,
      severity,
      keywords: result.detectedFeatures
    };
  }

  /**
   * Map AI classifier category names to GrievanceCategory enum
   */
  private mapAICategory(aiCategory: string): GrievanceCategory {
    const mapping: Record<string, GrievanceCategory> = {
      'roads': 'road',
      'water': 'water',
      'electricity': 'electricity',
      'drainage': 'water', // Map drainage to water category
      'waste': 'sanitation',
      'streetlights': 'electricity', // Map streetlights to electricity
      'public_property': 'other', // Map public_property to other
      'health_facility': 'healthcare',
      'education_facility': 'education'
    };

    return mapping[aiCategory] || 'other';
  }

  /**
   * Calculate severity level based on category and description
   */
  calculateSeverity(category: GrievanceCategory, description: string): SeverityLevel {
    const descriptionLower = description.toLowerCase();
    
    // Check for severity keywords
    for (const [level, keywords] of Object.entries(SEVERITY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (descriptionLower.includes(keyword)) {
          return level as SeverityLevel;
        }
      }
    }

    // Default severity based on category
    const defaultSeverity: Record<GrievanceCategory, SeverityLevel> = {
      road: 'medium',
      water: 'high',
      electricity: 'high',
      sanitation: 'medium',
      healthcare: 'high',
      education: 'medium',
      public_safety: 'critical',
      other: 'medium'
    };

    return defaultSeverity[category];
  }

  /**
   * Detect duplicate grievances within 50-meter radius
   * Property 28: Duplicate Grievance Detection
   * 
   * Uses spatial clustering (PostGIS) and image similarity (perceptual hashing)
   * to identify potential duplicates within 50-meter radius with >85% similarity
   */
  async detectDuplicates(
    location: GPSLocation,
    photoBuffer: Buffer,
    category: GrievanceCategory,
    client: any
  ): Promise<DuplicateGrievance[]> {
    // Calculate perceptual hash for the new image
    const newImageHash = await this.imageSimilarityService.calculatePerceptualHash(photoBuffer);

    // Query for grievances within approximate radius using bounding box
    // This is more efficient than calculating distance for all records
    const latDelta = 50 / 111000; // ~50 meters in latitude degrees
    const lonDelta = 50 / (111000 * Math.cos(location.latitude * Math.PI / 180)); // ~50 meters in longitude degrees

    const query = `
      SELECT 
        grievance_id,
        ticket_number,
        latitude,
        longitude,
        photos,
        image_hash,
        created_at
      FROM grievances
      WHERE 
        category = $1
        AND status NOT IN ('resolved', 'closed', 'rejected')
        AND latitude BETWEEN $2 AND $3
        AND longitude BETWEEN $4 AND $5
        AND created_at > NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const result = await client.query(query, [
      category,
      location.latitude - latDelta,
      location.latitude + latDelta,
      location.longitude - lonDelta,
      location.longitude + lonDelta
    ]);

    const duplicates: DuplicateGrievance[] = [];

    for (const row of result.rows) {
      // Calculate exact distance using Haversine formula
      const distance = this.locationService.calculateDistance(
        location.latitude,
        location.longitude,
        row.latitude,
        row.longitude
      );

      // Only consider if within 50 meters
      if (distance <= 50) {
        // Calculate image similarity using perceptual hashing
        let similarity = 0;
        
        if (row.image_hash) {
          // Use cached hash if available
          const comparisonResult = this.imageSimilarityService.compareImageHashes(
            newImageHash.hash,
            row.image_hash
          );
          similarity = comparisonResult.similarity;
        } else {
          // Fallback: fetch image and calculate hash (slower)
          try {
            const existingImageBuffer = await this.fetchImageFromUrl(row.photos[0]);
            similarity = await this.imageSimilarityService.calculateImageSimilarity(
              photoBuffer,
              existingImageBuffer
            );
          } catch (error) {
            console.warn(`Failed to fetch image for comparison: ${error}`);
            continue; // Skip this grievance if we can't fetch the image
          }
        }

        // Consider duplicate if similarity > 85%
        if (similarity > 85) {
          duplicates.push({
            grievanceId: row.grievance_id,
            ticketNumber: row.ticket_number,
            similarity,
            distance,
            createdAt: row.created_at
          });
        }
      }
    }

    return duplicates;
  }

  /**
   * Fetch image from URL (S3 or CDN)
   * Helper method for image similarity comparison
   */
  private async fetchImageFromUrl(url: string): Promise<Buffer> {
    if (!this.s3Client) {
      // Mock for development - return empty buffer
      throw new Error('S3 client not configured');
    }

    // Extract key from URL
    const key = url.replace(this.cdnUrl + '/', '');

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('Empty response body from S3');
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  /**
   * Assign grievance to responsible authority based on category and location
   */
  assignAuthority(
    category: GrievanceCategory,
    _location?: GPSLocation | null
  ): AuthorityAssignment {
    // Get authority mapping for category
    const mapping = AUTHORITY_MAPPING[category];

    // In production, this would consider location to assign specific officers
    // For now, return department-level assignment
    return {
      authority: mapping.authority,
      department: mapping.department
    };
  }

  /**
   * Calculate SLA deadline based on category and severity
   */
  calculateSLADeadline(category: GrievanceCategory, severity: SeverityLevel): Date {
    const hoursToResolve = SLA_MATRIX[category][severity];
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + hoursToResolve);
    return deadline;
  }

  /**
   * Generate anonymous reporter ID
   */
  generateAnonymousId(): string {
    const randomBytes = crypto.randomBytes(8);
    return 'ANON-' + randomBytes.toString('hex').toUpperCase();
  }

  /**
   * Encrypt reporter contact for anonymous submissions
   */
  private encryptContact(contact: string): string {
    // Use AES-256-GCM encryption
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || '0'.repeat(64), 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(contact, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Upload photos to S3
   */
  private async uploadPhotos(photos: PhotoUpload[]): Promise<string[]> {
    const urls: string[] = [];

    for (const photo of photos) {
      // Compress image
      const compressed = await sharp(photo.buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Generate unique filename
      const photoId = uuidv4();
      const fileKey = `grievances/${photoId}.jpg`;

      // Upload to S3
      const url = await this.uploadToS3(fileKey, compressed, 'image/jpeg');
      urls.push(url);
    }

    return urls;
  }

  /**
   * Upload file to S3
   */
  private async uploadToS3(
    key: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    if (!this.s3Client) {
      // Mock upload for development
      return `${this.cdnUrl}/${key}`;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return `${this.cdnUrl}/${key}`;
  }

  /**
   * Convert severity to priority
   */
  private severityToPriority(severity: SeverityLevel): string {
    const mapping: Record<SeverityLevel, string> = {
      critical: 'urgent',
      high: 'high',
      medium: 'medium',
      low: 'low'
    };
    return mapping[severity];
  }

  /**
   * Create status update entry
   */
  private async createStatusUpdate(
    grievanceId: string,
    updateType: string,
    updateText: string,
    updatedByRole: string,
    client: any
  ): Promise<void> {
    const query = `
      INSERT INTO grievance_updates (
        update_id,
        grievance_id,
        update_type,
        update_text,
        updated_by_role,
        is_public
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await client.query(query, [
      uuidv4(),
      grievanceId,
      updateType,
      updateText,
      updatedByRole,
      true
    ]);
  }

  /**
   * Send submission notification
   */
  private async sendSubmissionNotification(
    ticketNumber: string,
    userId?: string,
    anonymousId?: string | null
  ): Promise<void> {
    // This would integrate with notification service
    // For now, just log
    console.log('Sending notification for grievance:', {
      ticketNumber,
      userId,
      anonymousId
    });
  }
}

/**
 * Create service instance
 */
export function createGrievanceSubmissionService(
  pool: Pool,
  s3Config?: {
    region: string;
    credentials: { accessKeyId: string; secretAccessKey: string };
    bucketName: string;
    cdnUrl: string;
  }
): GrievanceSubmissionService {
  return new GrievanceSubmissionService(pool, s3Config);
}
