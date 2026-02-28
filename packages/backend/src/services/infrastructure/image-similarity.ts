/**
 * Image Similarity Service
 * Implements perceptual hashing (pHash) for image similarity detection
 * Used for duplicate grievance detection
 */

import sharp from 'sharp';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ImageHash {
  hash: string; // 64-bit hash as hex string
  algorithm: 'phash';
}

export interface ImageSimilarityResult {
  similarity: number; // 0-100 percentage
  hammingDistance: number; // 0-64
  hash1: string;
  hash2: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PHASH_SIZE = 32; // Resize images to 32x32 for DCT
const HASH_BITS = 64; // 64-bit hash (8x8 DCT low-frequency components)

// ============================================================================
// IMAGE SIMILARITY SERVICE
// ============================================================================

export class ImageSimilarityService {
  /**
   * Calculate perceptual hash (pHash) for an image
   * 
   * Algorithm:
   * 1. Convert to grayscale
   * 2. Resize to 32x32 pixels
   * 3. Apply Discrete Cosine Transform (DCT)
   * 4. Extract 8x8 low-frequency components (top-left corner)
   * 5. Calculate median of these 64 values
   * 6. Generate 64-bit hash: 1 if value > median, 0 otherwise
   * 
   * @param imageBuffer - Image buffer (any format supported by sharp)
   * @returns ImageHash object with hex string representation
   */
  async calculatePerceptualHash(imageBuffer: Buffer): Promise<ImageHash> {
    try {
      // Step 1 & 2: Convert to grayscale and resize to 32x32
      const pixels = await sharp(imageBuffer)
        .grayscale()
        .resize(PHASH_SIZE, PHASH_SIZE, {
          fit: 'fill',
          kernel: sharp.kernel.lanczos3
        })
        .raw()
        .toBuffer();

      // Convert buffer to 2D array for DCT
      const pixelMatrix: number[][] = [];
      for (let i = 0; i < PHASH_SIZE; i++) {
        pixelMatrix[i] = [];
        for (let j = 0; j < PHASH_SIZE; j++) {
          pixelMatrix[i][j] = pixels[i * PHASH_SIZE + j];
        }
      }

      // Step 3: Apply DCT
      const dctMatrix = this.applyDCT(pixelMatrix);

      // Step 4: Extract 8x8 low-frequency components (top-left, excluding DC component at [0,0])
      const lowFreq: number[] = [];
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          lowFreq.push(dctMatrix[i][j]);
        }
      }

      // Step 5: Calculate median
      const sortedFreq = [...lowFreq].sort((a, b) => a - b);
      const median = sortedFreq[Math.floor(sortedFreq.length / 2)];

      // Step 6: Generate 64-bit hash
      let hashBits = '';
      for (const value of lowFreq) {
        hashBits += value > median ? '1' : '0';
      }

      // Convert binary string to hex
      const hash = this.binaryToHex(hashBits);

      return {
        hash,
        algorithm: 'phash'
      };
    } catch (error) {
      throw new Error(`Failed to calculate perceptual hash: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Compare two image hashes and calculate similarity
   * 
   * @param hash1 - First image hash (hex string)
   * @param hash2 - Second image hash (hex string)
   * @returns Similarity result with percentage and Hamming distance
   */
  compareImageHashes(hash1: string, hash2: string): ImageSimilarityResult {
    // Convert hex to binary
    const binary1 = this.hexToBinary(hash1);
    const binary2 = this.hexToBinary(hash2);

    // Calculate Hamming distance (number of differing bits)
    let hammingDistance = 0;
    for (let i = 0; i < binary1.length; i++) {
      if (binary1[i] !== binary2[i]) {
        hammingDistance++;
      }
    }

    // Calculate similarity percentage
    // Similarity = (64 - hamming_distance) / 64 * 100
    const similarity = ((HASH_BITS - hammingDistance) / HASH_BITS) * 100;

    return {
      similarity,
      hammingDistance,
      hash1,
      hash2
    };
  }

  /**
   * Calculate similarity between two images directly
   * Convenience method that combines hashing and comparison
   * 
   * @param imageBuffer1 - First image buffer
   * @param imageBuffer2 - Second image buffer
   * @returns Similarity percentage (0-100)
   */
  async calculateImageSimilarity(
    imageBuffer1: Buffer,
    imageBuffer2: Buffer
  ): Promise<number> {
    const hash1 = await this.calculatePerceptualHash(imageBuffer1);
    const hash2 = await this.calculatePerceptualHash(imageBuffer2);
    const result = this.compareImageHashes(hash1.hash, hash2.hash);
    return result.similarity;
  }

  /**
   * Apply Discrete Cosine Transform (DCT) to a 2D matrix
   * Uses separable 2D DCT (apply 1D DCT to rows, then to columns)
   * 
   * @param matrix - 2D pixel matrix
   * @returns DCT coefficients matrix
   */
  private applyDCT(matrix: number[][]): number[][] {
    const N = matrix.length;
    const dctMatrix: number[][] = [];

    // Initialize result matrix
    for (let i = 0; i < N; i++) {
      dctMatrix[i] = new Array(N).fill(0);
    }

    // Apply 2D DCT
    for (let u = 0; u < N; u++) {
      for (let v = 0; v < N; v++) {
        let sum = 0;
        for (let i = 0; i < N; i++) {
          for (let j = 0; j < N; j++) {
            sum += matrix[i][j] *
              Math.cos(((2 * i + 1) * u * Math.PI) / (2 * N)) *
              Math.cos(((2 * j + 1) * v * Math.PI) / (2 * N));
          }
        }

        // Apply normalization factors
        const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
        const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
        dctMatrix[u][v] = (2 / N) * cu * cv * sum;
      }
    }

    return dctMatrix;
  }

  /**
   * Convert binary string to hexadecimal string
   * 
   * @param binary - Binary string (e.g., "1010101...")
   * @returns Hex string (e.g., "a5...")
   */
  private binaryToHex(binary: string): string {
    let hex = '';
    for (let i = 0; i < binary.length; i += 4) {
      const chunk = binary.substr(i, 4);
      const value = parseInt(chunk, 2);
      hex += value.toString(16);
    }
    return hex;
  }

  /**
   * Convert hexadecimal string to binary string
   * 
   * @param hex - Hex string (e.g., "a5...")
   * @returns Binary string (e.g., "1010101...")
   */
  private hexToBinary(hex: string): string {
    let binary = '';
    for (const char of hex) {
      const value = parseInt(char, 16);
      binary += value.toString(2).padStart(4, '0');
    }
    return binary;
  }
}

/**
 * Singleton instance
 */
let imageSimilarityService: ImageSimilarityService | null = null;

/**
 * Get or create ImageSimilarityService instance
 */
export function getImageSimilarityService(): ImageSimilarityService {
  if (!imageSimilarityService) {
    imageSimilarityService = new ImageSimilarityService();
  }
  return imageSimilarityService;
}
