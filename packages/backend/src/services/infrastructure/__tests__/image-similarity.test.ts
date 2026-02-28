/**
 * Unit tests for Image Similarity Service
 * Tests perceptual hashing and image similarity detection
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import sharp from 'sharp';
import { ImageSimilarityService, getImageSimilarityService } from '../image-similarity';

describe('ImageSimilarityService', () => {
  let service: ImageSimilarityService;

  beforeAll(() => {
    service = getImageSimilarityService();
  });

  describe('calculatePerceptualHash', () => {
    it('should generate a 16-character hex hash for an image', async () => {
      // Create a simple test image (100x100 red square)
      const imageBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      })
        .png()
        .toBuffer();

      const result = await service.calculatePerceptualHash(imageBuffer);

      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('algorithm', 'phash');
      expect(result.hash).toHaveLength(16); // 64 bits = 16 hex characters
      expect(result.hash).toMatch(/^[0-9a-f]{16}$/); // Valid hex string
    });

    it('should generate consistent hashes for the same image', async () => {
      const imageBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 0, g: 255, b: 0 }
        }
      })
        .png()
        .toBuffer();

      const hash1 = await service.calculatePerceptualHash(imageBuffer);
      const hash2 = await service.calculatePerceptualHash(imageBuffer);

      expect(hash1.hash).toBe(hash2.hash);
    });

    it('should generate similar hashes for slightly modified images', async () => {
      // Original image
      const original = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 128, g: 128, b: 128 }
        }
      })
        .png()
        .toBuffer();

      // Slightly modified (add very slight brightness adjustment)
      const modified = await sharp(original)
        .modulate({ brightness: 1.01 }) // Very slight change
        .toBuffer();

      const hash1 = await service.calculatePerceptualHash(original);
      const hash2 = await service.calculatePerceptualHash(modified);

      // Hashes should be similar but not identical
      const comparison = service.compareImageHashes(hash1.hash, hash2.hash);
      expect(comparison.similarity).toBeGreaterThan(50); // Moderate similarity
      expect(comparison.hammingDistance).toBeLessThan(32); // Less than half different
    });

    it('should generate different hashes for completely different images', async () => {
      // Red image
      const redImage = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      })
        .png()
        .toBuffer();

      // Blue image
      const blueImage = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 0, g: 0, b: 255 }
        }
      })
        .png()
        .toBuffer();

      const hash1 = await service.calculatePerceptualHash(redImage);
      const hash2 = await service.calculatePerceptualHash(blueImage);

      expect(hash1.hash).not.toBe(hash2.hash);
    });

    it('should handle different image formats', async () => {
      const baseImage = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 100, g: 150, b: 200 }
        }
      })
        .png()
        .toBuffer();

      // Convert to JPEG
      const jpegImage = await sharp(baseImage).jpeg().toBuffer();

      const pngHash = await service.calculatePerceptualHash(baseImage);
      const jpegHash = await service.calculatePerceptualHash(jpegImage);

      // Should be very similar despite format difference
      const comparison = service.compareImageHashes(pngHash.hash, jpegHash.hash);
      expect(comparison.similarity).toBeGreaterThan(90);
    });

    it('should handle different image sizes', async () => {
      // Small image
      const smallImage = await sharp({
        create: {
          width: 50,
          height: 50,
          channels: 3,
          background: { r: 128, g: 128, b: 128 }
        }
      })
        .png()
        .toBuffer();

      // Large image with same content
      const largeImage = await sharp({
        create: {
          width: 500,
          height: 500,
          channels: 3,
          background: { r: 128, g: 128, b: 128 }
        }
      })
        .png()
        .toBuffer();

      const smallHash = await service.calculatePerceptualHash(smallImage);
      const largeHash = await service.calculatePerceptualHash(largeImage);

      // Should be very similar despite size difference
      const comparison = service.compareImageHashes(smallHash.hash, largeHash.hash);
      expect(comparison.similarity).toBeGreaterThan(95);
    });
  });

  describe('compareImageHashes', () => {
    it('should return 100% similarity for identical hashes', () => {
      const hash = 'a1b2c3d4e5f6g7h8';
      const result = service.compareImageHashes(hash, hash);

      expect(result.similarity).toBe(100);
      expect(result.hammingDistance).toBe(0);
      expect(result.hash1).toBe(hash);
      expect(result.hash2).toBe(hash);
    });

    it('should calculate correct Hamming distance', () => {
      // Binary: 0000 vs 1111 = 4 bits different per hex char
      const hash1 = '0000000000000000'; // All zeros
      const hash2 = 'ffffffffffffffff'; // All ones

      const result = service.compareImageHashes(hash1, hash2);

      expect(result.hammingDistance).toBe(64); // All 64 bits different
      expect(result.similarity).toBe(0); // 0% similarity
    });

    it('should calculate correct similarity percentage', () => {
      // Create hashes with known Hamming distance
      const hash1 = '0000000000000000'; // Binary: 0000...
      const hash2 = '000000000000000f'; // Binary: 0000...1111 (4 bits different)

      const result = service.compareImageHashes(hash1, hash2);

      expect(result.hammingDistance).toBe(4);
      expect(result.similarity).toBeCloseTo(93.75, 1); // (64-4)/64 * 100 = 93.75%
    });

    it('should handle partial similarity', () => {
      const hash1 = 'a5a5a5a5a5a5a5a5'; // Binary: 1010...
      const hash2 = '5a5a5a5a5a5a5a5a'; // Binary: 0101... (inverted)

      const result = service.compareImageHashes(hash1, hash2);

      expect(result.hammingDistance).toBe(64); // All bits flipped
      expect(result.similarity).toBe(0);
    });
  });

  describe('calculateImageSimilarity', () => {
    it('should return 100% similarity for identical images', async () => {
      const imageBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 200, g: 100, b: 50 }
        }
      })
        .png()
        .toBuffer();

      const similarity = await service.calculateImageSimilarity(imageBuffer, imageBuffer);

      expect(similarity).toBe(100);
    });

    it('should return high similarity for nearly identical images', async () => {
      const original = await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 3,
          background: { r: 150, g: 150, b: 150 }
        }
      })
        .png()
        .toBuffer();

      // Compress to JPEG (lossy compression, but content is same)
      const compressed = await sharp(original)
        .jpeg({ quality: 95 })
        .toBuffer();

      const similarity = await service.calculateImageSimilarity(original, compressed);

      expect(similarity).toBeGreaterThan(85); // Should be > 85% for near-duplicates
    });

    it('should return low similarity for completely different images', async () => {
      const image1 = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      })
        .png()
        .toBuffer();

      const image2 = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 0, g: 0, b: 255 }
        }
      })
        .png()
        .toBuffer();

      const similarity = await service.calculateImageSimilarity(image1, image2);

      expect(similarity).toBeLessThan(85); // Should be < 85% for non-duplicates
    });

    it('should handle resized versions of the same image', async () => {
      const original = await sharp({
        create: {
          width: 400,
          height: 400,
          channels: 3,
          background: { r: 128, g: 128, b: 128 }
        }
      })
        .png()
        .toBuffer();

      const resized = await sharp(original)
        .resize(100, 100)
        .toBuffer();

      const similarity = await service.calculateImageSimilarity(original, resized);

      expect(similarity).toBeGreaterThan(95); // Very high similarity
    });

    it('should handle cropped versions with reasonable similarity', async () => {
      // Create an image with a pattern
      const original = await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 3,
          background: { r: 100, g: 100, b: 100 }
        }
      })
        .png()
        .toBuffer();

      // Crop to center
      const cropped = await sharp(original)
        .extract({ left: 50, top: 50, width: 100, height: 100 })
        .toBuffer();

      const similarity = await service.calculateImageSimilarity(original, cropped);

      // Cropped images may have lower similarity but should still be detectable
      expect(similarity).toBeGreaterThan(50);
    });
  });

  describe('Edge cases', () => {
    it('should handle very small images', async () => {
      const tinyImage = await sharp({
        create: {
          width: 10,
          height: 10,
          channels: 3,
          background: { r: 128, g: 128, b: 128 }
        }
      })
        .png()
        .toBuffer();

      const hash = await service.calculatePerceptualHash(tinyImage);

      expect(hash.hash).toHaveLength(16);
      expect(hash.algorithm).toBe('phash');
    });

    it('should handle grayscale images', async () => {
      const grayImage = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 128, g: 128, b: 128 }
        }
      })
        .grayscale()
        .png()
        .toBuffer();

      const hash = await service.calculatePerceptualHash(grayImage);

      expect(hash.hash).toHaveLength(16);
    });

    it('should handle images with transparency', async () => {
      const transparentImage = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 0.5 }
        }
      })
        .png()
        .toBuffer();

      const hash = await service.calculatePerceptualHash(transparentImage);

      expect(hash.hash).toHaveLength(16);
    });
  });

  describe('Duplicate detection threshold (85%)', () => {
    it('should identify nearly identical images as duplicates', async () => {
      const original = await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 3,
          background: { r: 150, g: 150, b: 150 }
        }
      })
        .png()
        .toBuffer();

      // Convert to JPEG (lossy but should still be very similar)
      const nearDuplicate = await sharp(original)
        .jpeg({ quality: 90 })
        .toBuffer();

      const similarity = await service.calculateImageSimilarity(original, nearDuplicate);

      expect(similarity).toBeGreaterThan(85);
    });

    it('should not identify significantly different images as duplicates', async () => {
      const image1 = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 200, g: 50, b: 50 }
        }
      })
        .png()
        .toBuffer();

      const image2 = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 50, g: 50, b: 200 }
        }
      })
        .png()
        .toBuffer();

      const similarity = await service.calculateImageSimilarity(image1, image2);

      expect(similarity).toBeLessThan(85);
    });
  });

  describe('Singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = getImageSimilarityService();
      const instance2 = getImageSimilarityService();

      expect(instance1).toBe(instance2);
    });
  });
});
