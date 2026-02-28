/**
 * Property-Based Tests for Grievance Duplicate Detection
 * Tests Property 28: Duplicate Grievance Detection
 * 
 * Property 28: For any new grievance submission, if an existing grievance exists 
 * within 50-meter radius with image similarity > 85%, it should be flagged as a 
 * potential duplicate.
 */

import * as fc from 'fast-check';
import { GrievanceSubmissionService, GPSLocation, GrievanceCategory } from '../grievance-submission';
import { ImageSimilarityService } from '../image-similarity';
import { Pool } from 'pg';

// Mock dependencies
jest.mock('pg');
jest.mock('../ai-image-classifier');
jest.mock('../location-service');
jest.mock('../image-similarity');

describe('Property 28: Duplicate Grievance Detection', () => {
  let service: GrievanceSubmissionService;
  let mockPool: jest.Mocked<Pool>;
  let mockImageSimilarity: jest.Mocked<ImageSimilarityService>;

  beforeEach(() => {
    mockPool = {
      connect: jest.fn(),
      query: jest.fn(),
      end: jest.fn(),
    } as any;

    mockImageSimilarity = {
      calculatePerceptualHash: jest.fn(),
      compareImageHashes: jest.fn(),
      calculateImageSimilarity: jest.fn(),
    } as any;

    service = new GrievanceSubmissionService(mockPool);
    (service as any).imageSimilarityService = mockImageSimilarity;
  });

  /**
   * Property 28.1: Grievances within 50m radius with >85% similarity are detected as duplicates
   */
  test('Property 28.1: Detects duplicates within 50m radius with >85% similarity', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Base location (reference point)
        fc.record({
          latitude: fc.double({ min: -90, max: 90 }),
          longitude: fc.double({ min: -180, max: 180 }),
        }),
        // Distance in meters (within 50m)
        fc.double({ min: 0, max: 50 }),
        // Image similarity percentage (>85%)
        fc.double({ min: 85.01, max: 100 }),
        // Category
        fc.constantFrom<GrievanceCategory>(
          'road', 'water', 'electricity', 'sanitation', 
          'healthcare', 'education', 'public_safety', 'other'
        ),
        async (baseLocation, distanceMeters, similarity, category) => {
          // Calculate nearby location within specified distance
          const nearbyLocation = calculateNearbyLocation(
            baseLocation.latitude,
            baseLocation.longitude,
            distanceMeters
          );

          // Mock database query to return existing grievance
          const mockClient = {
            query: jest.fn()
              .mockResolvedValueOnce({ rows: [] }) // BEGIN
              .mockResolvedValueOnce({
                rows: [{
                  grievance_id: 'existing-id',
                  ticket_number: 'GRV20240228001',
                  latitude: baseLocation.latitude,
                  longitude: baseLocation.longitude,
                  photos: ['photo1.jpg'],
                  image_hash: 'existing-hash',
                  created_at: new Date()
                }]
              }),
            release: jest.fn()
          };

          mockPool.connect = jest.fn().mockResolvedValue(mockClient);

          // Mock image similarity
          mockImageSimilarity.calculatePerceptualHash.mockResolvedValue({
            hash: 'new-hash',
            algorithm: 'phash'
          });

          mockImageSimilarity.compareImageHashes.mockReturnValue({
            similarity,
            hammingDistance: Math.round((100 - similarity) * 64 / 100),
            hash1: 'new-hash',
            hash2: 'existing-hash'
          });

          // Call detectDuplicates
          const duplicates = await (service as any).detectDuplicates(
            nearbyLocation,
            Buffer.from('test-image'),
            category,
            mockClient
          );

          // Property: Should detect as duplicate
          expect(duplicates.length).toBeGreaterThan(0);
          expect(duplicates[0].similarity).toBeGreaterThan(85);
          expect(duplicates[0].distance).toBeLessThanOrEqual(50);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 28.2: Grievances beyond 50m radius are NOT detected as duplicates
   */
  test('Property 28.2: Does not detect duplicates beyond 50m radius', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Base location
        fc.record({
          latitude: fc.double({ min: -90, max: 90 }),
          longitude: fc.double({ min: -180, max: 180 }),
        }),
        // Distance in meters (beyond 50m)
        fc.double({ min: 50.01, max: 500 }),
        // Image similarity (even if high)
        fc.double({ min: 85, max: 100 }),
        // Category
        fc.constantFrom<GrievanceCategory>(
          'road', 'water', 'electricity', 'sanitation'
        ),
        async (baseLocation, distanceMeters, _similarity, category) => {
          const farLocation = calculateNearbyLocation(
            baseLocation.latitude,
            baseLocation.longitude,
            distanceMeters
          );

          const mockClient = {
            query: jest.fn()
              .mockResolvedValueOnce({ rows: [] }) // BEGIN
              .mockResolvedValueOnce({
                rows: [{
                  grievance_id: 'existing-id',
                  ticket_number: 'GRV20240228001',
                  latitude: baseLocation.latitude,
                  longitude: baseLocation.longitude,
                  photos: ['photo1.jpg'],
                  image_hash: 'existing-hash',
                  created_at: new Date()
                }]
              }),
            release: jest.fn()
          };

          mockPool.connect = jest.fn().mockResolvedValue(mockClient);

          mockImageSimilarity.calculatePerceptualHash.mockResolvedValue({
            hash: 'new-hash',
            algorithm: 'phash'
          });

          const duplicates = await (service as any).detectDuplicates(
            farLocation,
            Buffer.from('test-image'),
            category,
            mockClient
          );

          // Property: Should NOT detect as duplicate (beyond radius)
          expect(duplicates.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 28.3: Grievances within 50m but with ≤85% similarity are NOT detected
   */
  test('Property 28.3: Does not detect duplicates with ≤85% similarity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          latitude: fc.double({ min: -90, max: 90 }),
          longitude: fc.double({ min: -180, max: 180 }),
        }),
        fc.double({ min: 0, max: 50 }), // Within radius
        fc.double({ min: 0, max: 85 }), // Low similarity
        fc.constantFrom<GrievanceCategory>('road', 'water', 'electricity'),
        async (baseLocation, distanceMeters, similarity, category) => {
          const nearbyLocation = calculateNearbyLocation(
            baseLocation.latitude,
            baseLocation.longitude,
            distanceMeters
          );

          const mockClient = {
            query: jest.fn()
              .mockResolvedValueOnce({ rows: [] })
              .mockResolvedValueOnce({
                rows: [{
                  grievance_id: 'existing-id',
                  ticket_number: 'GRV20240228001',
                  latitude: baseLocation.latitude,
                  longitude: baseLocation.longitude,
                  photos: ['photo1.jpg'],
                  image_hash: 'existing-hash',
                  created_at: new Date()
                }]
              }),
            release: jest.fn()
          };

          mockPool.connect = jest.fn().mockResolvedValue(mockClient);

          mockImageSimilarity.calculatePerceptualHash.mockResolvedValue({
            hash: 'new-hash',
            algorithm: 'phash'
          });

          mockImageSimilarity.compareImageHashes.mockReturnValue({
            similarity,
            hammingDistance: Math.round((100 - similarity) * 64 / 100),
            hash1: 'new-hash',
            hash2: 'existing-hash'
          });

          const duplicates = await (service as any).detectDuplicates(
            nearbyLocation,
            Buffer.from('test-image'),
            category,
            mockClient
          );

          // Property: Should NOT detect as duplicate (low similarity)
          expect(duplicates.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 28.4: Different categories are not considered duplicates
   */
  test('Property 28.4: Different categories are not duplicates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          latitude: fc.double({ min: -90, max: 90 }),
          longitude: fc.double({ min: -180, max: 180 }),
        }),
        fc.double({ min: 0, max: 50 }),
        fc.double({ min: 85, max: 100 }),
        fc.constantFrom<GrievanceCategory>('road', 'water', 'electricity'),
        fc.constantFrom<GrievanceCategory>('sanitation', 'healthcare', 'education'),
        async (baseLocation, distanceMeters, _similarity, category1, category2) => {
          // Ensure different categories
          fc.pre(category1 !== category2);

          const nearbyLocation = calculateNearbyLocation(
            baseLocation.latitude,
            baseLocation.longitude,
            distanceMeters
          );

          const mockClient = {
            query: jest.fn()
              .mockResolvedValueOnce({ rows: [] })
              .mockResolvedValueOnce({
                rows: [] // No results for different category
              }),
            release: jest.fn()
          };

          mockPool.connect = jest.fn().mockResolvedValue(mockClient);

          mockImageSimilarity.calculatePerceptualHash.mockResolvedValue({
            hash: 'new-hash',
            algorithm: 'phash'
          });

          const duplicates = await (service as any).detectDuplicates(
            nearbyLocation,
            Buffer.from('test-image'),
            category2, // Different category
            mockClient
          );

          // Property: Different categories should not be duplicates
          expect(duplicates.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 28.5: Similarity threshold is strictly enforced
   */
  test('Property 28.5: Similarity threshold at 85% is strictly enforced', async () => {
    const baseLocation = { latitude: 28.6139, longitude: 77.2090 };
    
    // Test cases with different similarity levels
    const testCases = [
      { similarity: 84.99, shouldDetect: false },
      { similarity: 85.00, shouldDetect: false },
      { similarity: 85.01, shouldDetect: true },
      { similarity: 90.00, shouldDetect: true },
    ];

    for (const testCase of testCases) {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({
            rows: [{
              grievance_id: 'existing-id',
              ticket_number: 'GRV20240228001',
              latitude: baseLocation.latitude,
              longitude: baseLocation.longitude,
              photos: ['photo1.jpg'],
              image_hash: 'existing-hash',
              created_at: new Date()
            }]
          }),
        release: jest.fn()
      };

      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      mockImageSimilarity.calculatePerceptualHash.mockResolvedValue({
        hash: 'new-hash',
        algorithm: 'phash'
      });

      mockImageSimilarity.compareImageHashes.mockReturnValue({
        similarity: testCase.similarity,
        hammingDistance: Math.round((100 - testCase.similarity) * 64 / 100),
        hash1: 'new-hash',
        hash2: 'existing-hash'
      });

      const duplicates = await (service as any).detectDuplicates(
        baseLocation,
        Buffer.from('test-image'),
        'road',
        mockClient
      );

      if (testCase.shouldDetect) {
        expect(duplicates.length).toBeGreaterThan(0);
        expect(duplicates[0].similarity).toBeGreaterThan(85);
      } else {
        expect(duplicates.length).toBe(0);
      }
    }
  });
});

/**
 * Helper function to calculate a nearby location at a specific distance
 * Uses simple approximation for testing purposes
 */
function calculateNearbyLocation(
  lat: number,
  lon: number,
  distanceMeters: number
): GPSLocation {
  // Simple approximation: 1 degree latitude ≈ 111km
  // 1 degree longitude ≈ 111km * cos(latitude)
  const latDelta = distanceMeters / 111000;
  const lonDelta = distanceMeters / (111000 * Math.cos(lat * Math.PI / 180));

  // Add random direction
  const angle = Math.random() * 2 * Math.PI;
  const newLat = lat + latDelta * Math.cos(angle);
  const newLon = lon + lonDelta * Math.sin(angle);

  return {
    latitude: Math.max(-90, Math.min(90, newLat)),
    longitude: Math.max(-180, Math.min(180, newLon))
  };
}
