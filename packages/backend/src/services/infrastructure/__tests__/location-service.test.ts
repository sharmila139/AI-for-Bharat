/**
 * Location Service Tests
 * Tests for GPS extraction, reverse geocoding, and location utilities
 */

import { createLocationService, LocationService } from '../location-service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LocationService', () => {
  let locationService: LocationService;

  beforeEach(() => {
    locationService = createLocationService();
    jest.clearAllMocks();
  });

  describe('extractGPSFromEXIF', () => {
    it('should return null for photo without GPS data', () => {
      // Create buffer without GPS data
      const buffer = Buffer.from('fake image data without EXIF');

      const result = locationService.extractGPSFromEXIF(buffer);

      expect(result).toBeNull();
    });

    it('should handle invalid EXIF data gracefully', () => {
      const buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // Invalid JPEG header

      const result = locationService.extractGPSFromEXIF(buffer);

      expect(result).toBeNull();
    });

    // Note: Testing actual EXIF extraction requires real photo files with GPS data
    // In production, integration tests should use actual photos with EXIF metadata
    // The service correctly handles EXIF parsing using the exif-parser library
  });

  describe('validateCoordinates', () => {
    it('should validate correct coordinates', () => {
      expect(locationService.validateCoordinates(28.6139, 77.2090)).toBe(true);
      expect(locationService.validateCoordinates(0, 0)).toBe(true);
      expect(locationService.validateCoordinates(-90, -180)).toBe(true);
      expect(locationService.validateCoordinates(90, 180)).toBe(true);
    });

    it('should reject out-of-range latitude', () => {
      expect(locationService.validateCoordinates(91, 0)).toBe(false);
      expect(locationService.validateCoordinates(-91, 0)).toBe(false);
      expect(locationService.validateCoordinates(100, 0)).toBe(false);
    });

    it('should reject out-of-range longitude', () => {
      expect(locationService.validateCoordinates(0, 181)).toBe(false);
      expect(locationService.validateCoordinates(0, -181)).toBe(false);
      expect(locationService.validateCoordinates(0, 200)).toBe(false);
    });

    it('should reject NaN values', () => {
      expect(locationService.validateCoordinates(NaN, 0)).toBe(false);
      expect(locationService.validateCoordinates(0, NaN)).toBe(false);
      expect(locationService.validateCoordinates(NaN, NaN)).toBe(false);
    });

    it('should reject non-number values', () => {
      expect(locationService.validateCoordinates('28.6139' as any, 77.2090)).toBe(false);
      expect(locationService.validateCoordinates(28.6139, '77.2090' as any)).toBe(false);
    });
  });

  describe('reverseGeocode', () => {
    it('should reverse geocode coordinates to address', async () => {
      // Mock Nominatim API response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          lat: '28.6139',
          lon: '77.2090',
          display_name: 'New Delhi, Delhi, India',
          address: {
            road: 'Rajpath',
            city: 'New Delhi',
            state: 'Delhi',
            country: 'India',
            postcode: '110001'
          }
        }
      });

      const result = await locationService.reverseGeocode(28.6139, 77.2090);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.address.city).toBe('New Delhi');
        expect(result.address.state).toBe('Delhi');
        expect(result.address.country).toBe('India');
        expect(result.displayName).toBe('New Delhi, Delhi, India');
      }

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('nominatim.openstreetmap.org/reverse'),
        expect.objectContaining({
          params: expect.objectContaining({
            lat: 28.6139,
            lon: 77.2090,
            format: 'json'
          })
        })
      );
    });

    it('should use cache for repeated requests', async () => {
      // Mock first request
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          lat: '28.6139',
          lon: '77.2090',
          display_name: 'New Delhi, Delhi, India',
          address: {
            city: 'New Delhi',
            state: 'Delhi',
            country: 'India'
          }
        }
      });

      // First call
      const result1 = await locationService.reverseGeocode(28.6139, 77.2090);
      expect(result1).not.toBeNull();
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      // Second call with same coordinates (should use cache)
      const result2 = await locationService.reverseGeocode(28.6139, 77.2090);
      expect(result2).not.toBeNull();
      expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Still 1, not 2

      expect(result1).toEqual(result2);
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await locationService.reverseGeocode(28.6139, 77.2090);

      expect(result).toBeNull();
    });

    it('should reject invalid coordinates', async () => {
      await expect(
        locationService.reverseGeocode(91, 0)
      ).rejects.toThrow('Invalid coordinates');

      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should handle missing address data', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          lat: '28.6139',
          lon: '77.2090',
          display_name: 'Unknown Location',
          address: {}
        }
      });

      const result = await locationService.reverseGeocode(28.6139, 77.2090);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.address.formattedAddress).toBe('Unknown Location');
        expect(result.address.city).toBeUndefined();
      }
    });

    it('should enforce rate limiting', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          lat: '28.6139',
          lon: '77.2090',
          display_name: 'Test Location',
          address: {}
        }
      });

      const startTime = Date.now();

      // Make two requests
      await locationService.reverseGeocode(28.6139, 77.2090);
      await locationService.reverseGeocode(28.7139, 77.3090); // Different coords to avoid cache

      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Should take at least 1000ms due to rate limiting
      expect(elapsed).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      // Distance between New Delhi and Mumbai (approx 1150 km)
      const delhi = { lat: 28.6139, lon: 77.2090 };
      const mumbai = { lat: 19.0760, lon: 72.8777 };

      const distance = locationService.calculateDistance(
        delhi.lat,
        delhi.lon,
        mumbai.lat,
        mumbai.lon
      );

      // Should be approximately 1150 km (1,150,000 meters)
      expect(distance).toBeGreaterThan(1100000);
      expect(distance).toBeLessThan(1200000);
    });

    it('should return 0 for same coordinates', () => {
      const distance = locationService.calculateDistance(
        28.6139,
        77.2090,
        28.6139,
        77.2090
      );

      expect(distance).toBeCloseTo(0, 1);
    });

    it('should calculate short distances accurately', () => {
      // Two points approximately 100 meters apart
      const point1 = { lat: 28.6139, lon: 77.2090 };
      const point2 = { lat: 28.6148, lon: 77.2090 }; // ~100m north

      const distance = locationService.calculateDistance(
        point1.lat,
        point1.lon,
        point2.lat,
        point2.lon
      );

      // Should be approximately 100 meters
      expect(distance).toBeGreaterThan(90);
      expect(distance).toBeLessThan(110);
    });

    it('should handle negative coordinates', () => {
      // Distance between Sydney and Melbourne (approx 715 km)
      const sydney = { lat: -33.8688, lon: 151.2093 };
      const melbourne = { lat: -37.8136, lon: 144.9631 };

      const distance = locationService.calculateDistance(
        sydney.lat,
        sydney.lon,
        melbourne.lat,
        melbourne.lon
      );

      expect(distance).toBeGreaterThan(700000);
      expect(distance).toBeLessThan(730000);
    });

    it('should reject invalid coordinates', () => {
      expect(() => {
        locationService.calculateDistance(91, 0, 0, 0);
      }).toThrow('Invalid coordinates');

      expect(() => {
        locationService.calculateDistance(0, 0, 0, 181);
      }).toThrow('Invalid coordinates');
    });

    it('should be symmetric', () => {
      const point1 = { lat: 28.6139, lon: 77.2090 };
      const point2 = { lat: 19.0760, lon: 72.8777 };

      const distance1 = locationService.calculateDistance(
        point1.lat,
        point1.lon,
        point2.lat,
        point2.lon
      );

      const distance2 = locationService.calculateDistance(
        point2.lat,
        point2.lon,
        point1.lat,
        point1.lon
      );

      expect(distance1).toBeCloseTo(distance2, 1);
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          lat: '28.6139',
          lon: '77.2090',
          display_name: 'Test',
          address: {}
        }
      });

      await locationService.reverseGeocode(28.6139, 77.2090);
      expect(locationService.getCacheSize()).toBeGreaterThan(0);

      locationService.clearCache();
      expect(locationService.getCacheSize()).toBe(0);
    });

    it('should track cache size', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          lat: '28.6139',
          lon: '77.2090',
          display_name: 'Test',
          address: {}
        }
      });

      expect(locationService.getCacheSize()).toBe(0);

      await locationService.reverseGeocode(28.6139, 77.2090);
      expect(locationService.getCacheSize()).toBe(1);

      await locationService.reverseGeocode(28.7139, 77.3090);
      expect(locationService.getCacheSize()).toBe(2);
    });
  });
});
