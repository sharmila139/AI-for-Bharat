/**
 * Location Service
 * Handles GPS extraction from EXIF metadata, reverse geocoding, and location utilities
 */

import ExifParser from 'exif-parser';
import axios from 'axios';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

export interface Address {
  road?: string;
  suburb?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  postcode?: string;
  formattedAddress: string;
}

export interface ReverseGeocodeResult {
  address: Address;
  displayName: string;
  latitude: number;
  longitude: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Nominatim API configuration
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const NOMINATIM_USER_AGENT = 'RuralConnect-AI/1.0';
const NOMINATIM_RATE_LIMIT_MS = 1000; // 1 request per second

// Valid coordinate ranges
const VALID_LATITUDE_RANGE = { min: -90, max: 90 };
const VALID_LONGITUDE_RANGE = { min: -180, max: 180 };

// Earth radius in meters (for distance calculations)
const EARTH_RADIUS_METERS = 6371000;

// ============================================================================
// LOCATION SERVICE
// ============================================================================

export class LocationService {
  private lastReverseGeocodeTime = 0;
  private geocodeCache = new Map<string, ReverseGeocodeResult>();

  /**
   * Extract GPS coordinates from EXIF metadata in photo buffer
   * Supports both decimal degrees and DMS (Degrees, Minutes, Seconds) formats
   */
  extractGPSFromEXIF(photoBuffer: Buffer): GPSCoordinates | null {
    try {
      // Parse EXIF data from buffer
      const parser = ExifParser.create(photoBuffer);
      const result = parser.parse();

      // Check if GPS data exists
      if (!result.tags || !result.tags.GPSLatitude || !result.tags.GPSLongitude) {
        return null;
      }

      const tags = result.tags;

      // Extract latitude (with type guard)
      const latValue = tags.GPSLatitude;
      const lonValue = tags.GPSLongitude;
      
      if (latValue === undefined || lonValue === undefined) {
        return null;
      }

      const latitude = this.parseGPSCoordinate(
        latValue,
        tags.GPSLatitudeRef
      );

      // Extract longitude
      const longitude = this.parseGPSCoordinate(
        lonValue,
        tags.GPSLongitudeRef
      );

      // Validate coordinates
      if (!this.validateCoordinates(latitude, longitude)) {
        console.warn('Invalid GPS coordinates extracted from EXIF:', { latitude, longitude });
        return null;
      }

      // Extract optional altitude
      const altitude = tags.GPSAltitude || undefined;

      // Extract optional accuracy (DOP - Dilution of Precision)
      const accuracy = tags.GPSDOP || undefined;

      return {
        latitude,
        longitude,
        altitude,
        accuracy
      };
    } catch (error) {
      console.error('Error extracting GPS from EXIF:', error);
      return null;
    }
  }

  /**
   * Parse GPS coordinate from EXIF format
   * Handles both decimal degrees and DMS (Degrees, Minutes, Seconds)
   */
  private parseGPSCoordinate(coordinate: number | number[], ref?: string): number {
    // If coordinate is already in decimal format
    if (typeof coordinate === 'number') {
      // Apply hemisphere reference
      if (ref === 'S' || ref === 'W') {
        return -Math.abs(coordinate);
      }
      return Math.abs(coordinate);
    }

    // If coordinate is in DMS format (array of [degrees, minutes, seconds])
    if (Array.isArray(coordinate) && coordinate.length === 3) {
      const [degrees, minutes, seconds] = coordinate;
      let decimal = degrees + minutes / 60 + seconds / 3600;

      // Apply hemisphere reference
      if (ref === 'S' || ref === 'W') {
        decimal = -decimal;
      }

      return decimal;
    }

    // Fallback: return as-is if it's a number, otherwise 0
    return typeof coordinate === 'number' ? coordinate : 0;
  }

  /**
   * Validate GPS coordinates are within valid ranges
   * Latitude: -90 to 90, Longitude: -180 to 180
   */
  validateCoordinates(latitude: number, longitude: number): boolean {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return false;
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      return false;
    }

    if (latitude < VALID_LATITUDE_RANGE.min || latitude > VALID_LATITUDE_RANGE.max) {
      return false;
    }

    if (longitude < VALID_LONGITUDE_RANGE.min || longitude > VALID_LONGITUDE_RANGE.max) {
      return false;
    }

    return true;
  }

  /**
   * Reverse geocode coordinates to human-readable address
   * Uses OpenStreetMap Nominatim API with rate limiting and caching
   */
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<ReverseGeocodeResult | null> {
    // Validate coordinates
    if (!this.validateCoordinates(latitude, longitude)) {
      throw new Error('Invalid coordinates provided for reverse geocoding');
    }

    // Check cache first (round to 4 decimal places for cache key ~11m precision)
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    if (this.geocodeCache.has(cacheKey)) {
      return this.geocodeCache.get(cacheKey)!;
    }

    // Implement rate limiting (1 request per second)
    await this.enforceRateLimit();

    try {
      // Call Nominatim reverse geocoding API
      const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1,
          zoom: 18 // Maximum detail level
        },
        headers: {
          'User-Agent': NOMINATIM_USER_AGENT
        },
        timeout: 10000 // 10 second timeout
      });

      if (!response.data || response.data.error) {
        console.warn('Reverse geocoding failed:', response.data?.error);
        return null;
      }

      const data = response.data;
      const addressData = data.address || {};

      // Parse address components
      const address: Address = {
        road: addressData.road || addressData.street,
        suburb: addressData.suburb || addressData.neighbourhood,
        city: addressData.city || addressData.town || addressData.village,
        district: addressData.state_district || addressData.county,
        state: addressData.state,
        country: addressData.country,
        postcode: addressData.postcode,
        formattedAddress: data.display_name
      };

      const result: ReverseGeocodeResult = {
        address,
        displayName: data.display_name,
        latitude: parseFloat(data.lat),
        longitude: parseFloat(data.lon)
      };

      // Cache the result
      this.geocodeCache.set(cacheKey, result);

      return result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Reverse geocoding API error:', {
          status: error.response?.status,
          message: error.message
        });
      } else {
        console.error('Reverse geocoding error:', error);
      }
      return null;
    }
  }

  /**
   * Enforce rate limiting for Nominatim API (1 request per second)
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastReverseGeocodeTime;

    if (timeSinceLastRequest < NOMINATIM_RATE_LIMIT_MS) {
      const waitTime = NOMINATIM_RATE_LIMIT_MS - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastReverseGeocodeTime = Date.now();
  }

  /**
   * Calculate distance between two GPS points using Haversine formula
   * Returns distance in meters
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Validate all coordinates
    if (!this.validateCoordinates(lat1, lon1) || !this.validateCoordinates(lat2, lon2)) {
      throw new Error('Invalid coordinates provided for distance calculation');
    }

    // Convert degrees to radians
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const lat1Rad = toRadians(lat1);
    const lat2Rad = toRadians(lat2);

    // Haversine formula
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Distance in meters
    const distance = EARTH_RADIUS_METERS * c;

    return distance;
  }

  /**
   * Clear geocoding cache
   */
  clearCache(): void {
    this.geocodeCache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.geocodeCache.size;
  }
}

/**
 * Create singleton instance
 */
let locationServiceInstance: LocationService | null = null;

export function getLocationService(): LocationService {
  if (!locationServiceInstance) {
    locationServiceInstance = new LocationService();
  }
  return locationServiceInstance;
}

/**
 * Export for testing
 */
export function createLocationService(): LocationService {
  return new LocationService();
}
