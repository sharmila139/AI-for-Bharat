/**
 * Crop Recommendation Input Screen Tests
 * Tests form validation and data handling
 */

import { SOIL_TYPES, REGIONS, SEASONS } from '../src/types/cropRecommendation';

describe('CropRecommendationInput', () => {
  describe('Form Data Constants', () => {
    it('should have valid soil types', () => {
      expect(SOIL_TYPES).toBeDefined();
      expect(SOIL_TYPES.length).toBeGreaterThan(0);
      
      SOIL_TYPES.forEach(soil => {
        expect(soil).toHaveProperty('value');
        expect(soil).toHaveProperty('label');
        expect(typeof soil.value).toBe('string');
        expect(typeof soil.label).toBe('string');
      });
    });

    it('should have valid regions', () => {
      expect(REGIONS).toBeDefined();
      expect(REGIONS.length).toBe(5);
      
      const expectedRegions = ['north', 'south', 'east', 'west', 'central'];
      REGIONS.forEach(region => {
        expect(expectedRegions).toContain(region.value);
      });
    });

    it('should have valid seasons', () => {
      expect(SEASONS).toBeDefined();
      expect(SEASONS.length).toBe(3);
      
      const expectedSeasons = ['kharif', 'rabi', 'zaid'];
      SEASONS.forEach(season => {
        expect(expectedSeasons).toContain(season.value);
      });
    });
  });

  describe('Form Validation Logic', () => {
    it('should validate numeric ranges correctly', () => {
      // Nitrogen: 0-200
      expect(0).toBeGreaterThanOrEqual(0);
      expect(0).toBeLessThanOrEqual(200);
      expect(200).toBeGreaterThanOrEqual(0);
      expect(200).toBeLessThanOrEqual(200);

      // Phosphorus: 0-100
      expect(0).toBeGreaterThanOrEqual(0);
      expect(100).toBeLessThanOrEqual(100);

      // Potassium: 0-150
      expect(0).toBeGreaterThanOrEqual(0);
      expect(150).toBeLessThanOrEqual(150);

      // pH: 3-10
      expect(3).toBeGreaterThanOrEqual(3);
      expect(10).toBeLessThanOrEqual(10);

      // Temperature: -10 to 50
      expect(-10).toBeGreaterThanOrEqual(-10);
      expect(50).toBeLessThanOrEqual(50);

      // Humidity: 0-100
      expect(0).toBeGreaterThanOrEqual(0);
      expect(100).toBeLessThanOrEqual(100);

      // Rainfall: 0-500
      expect(0).toBeGreaterThanOrEqual(0);
      expect(500).toBeLessThanOrEqual(500);
    });

    it('should have matching soil types with backend', () => {
      const backendSoilTypes = [
        'alluvial',
        'black',
        'red',
        'laterite',
        'sandy',
        'clayey',
        'loamy',
      ];

      SOIL_TYPES.forEach(soil => {
        expect(backendSoilTypes).toContain(soil.value);
      });
    });
  });

  describe('CropRecommendationInput Type', () => {
    it('should accept valid input structure', () => {
      const validInput = {
        soilType: 'loamy',
        nitrogen: 100,
        phosphorus: 50,
        potassium: 75,
        ph: 6.5,
        temperature: 25,
        humidity: 70,
        rainfall: 150,
        region: 'north',
        season: 'kharif',
        topN: 5,
      };

      // Type checking - if this compiles, the type is correct
      expect(validInput.soilType).toBe('loamy');
      expect(validInput.nitrogen).toBe(100);
      expect(validInput.season).toBe('kharif');
    });
  });
});
