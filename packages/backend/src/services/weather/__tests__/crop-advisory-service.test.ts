/**
 * Unit tests for Crop Advisory Service
 */

import { CropAdvisoryService, CropInfo } from '../crop-advisory-service';
import { WeatherAlert, AlertSeverity } from '../weather-alert-service';
import { WeatherData, WeatherLocation } from '../weather-service';

describe('CropAdvisoryService', () => {
  let service: CropAdvisoryService;
  let mockLocation: WeatherLocation;
  let mockWeatherData: WeatherData;

  beforeEach(() => {
    service = new CropAdvisoryService();
    
    mockLocation = {
      latitude: 28.6139,
      longitude: 77.2090,
      name: 'Delhi'
    };

    mockWeatherData = {
      location: mockLocation,
      current: {
        temperature: 25,
        feelsLike: 26,
        humidity: 70,
        pressure: 1013,
        windSpeed: 5,
        windDirection: 180,
        description: 'Clear sky',
        icon: '01d',
        timestamp: new Date()
      },
      hourlyForecast: Array(48).fill(null).map((_, i) => ({
        date: new Date(Date.now() + i * 3600000),
        rainfall: 0,
        temperature: { min: 20, max: 30 },
        humidity: 70,
        evapotranspiration: 3,
        windSpeed: 5
      })),
      dailyForecast: Array(14).fill(null).map((_, i) => ({
        date: new Date(Date.now() + i * 86400000),
        rainfall: 0,
        temperature: { min: 20, max: 30 },
        humidity: 70,
        evapotranspiration: 4
      })),
      source: 'openweathermap',
      fetchedAt: new Date()
    };
  });

  describe('generateAdvisory', () => {
    it('should generate advisory for frost alert on tomatoes', () => {
      const cropInfo: CropInfo = {
        type: 'tomatoes',
        growthStage: 'flowering'
      };

      const alert: WeatherAlert = {
        id: 'ALERT-frost-001',
        type: 'frost',
        severity: 'critical',
        location: mockLocation,
        title: 'Critical Frost Alert',
        description: 'Temperature expected to drop to -3°C',
        advisories: ['Cover plants', 'Water before sunset'],
        timestamp: new Date(),
        validUntil: new Date(Date.now() + 24 * 3600000),
        metadata: {
          currentValue: -3,
          threshold: -2,
          unit: '°C',
          affectedCrops: ['tomatoes', 'peppers']
        }
      };

      // Set cold weather
      mockWeatherData.current.temperature = -3;
      mockWeatherData.hourlyForecast.forEach(f => {
        f.temperature = { min: -3, max: 0 };
      });

      const advisory = service.generateAdvisory(alert, cropInfo, mockWeatherData);

      expect(advisory).toBeDefined();
      expect(advisory.cropType).toBe('tomatoes');
      expect(advisory.growthStage).toBe('flowering');
      expect(advisory.alertType).toBe('frost');
      expect(advisory.severity).toBe('critical');
      expect(advisory.immediateActions.length).toBeGreaterThan(0);
      expect(advisory.preventiveMeasures.length).toBeGreaterThan(0);
      expect(advisory.warnings.length).toBeGreaterThan(0);
      expect(advisory.metadata.riskLevel).toBeGreaterThan(70);
    });

    it('should generate advisory for heavy rain on wheat', () => {
      const cropInfo: CropInfo = {
        type: 'wheat',
        growthStage: 'vegetative'
      };

      const alert: WeatherAlert = {
        id: 'ALERT-rain-001',
        type: 'heavy_rain',
        severity: 'warning',
        location: mockLocation,
        title: 'Heavy Rain Warning',
        description: 'Expected rainfall of 60mm in 24 hours',
        advisories: ['Ensure drainage', 'Stop irrigation'],
        timestamp: new Date(),
        validUntil: new Date(Date.now() + 24 * 3600000),
        metadata: {
          currentValue: 60,
          threshold: 50,
          unit: 'mm'
        }
      };

      // Set heavy rain
      mockWeatherData.hourlyForecast.forEach((f, i) => {
        if (i < 24) f.rainfall = 2.5; // 60mm total
      });

      const advisory = service.generateAdvisory(alert, cropInfo, mockWeatherData);

      expect(advisory.cropType).toBe('wheat');
      expect(advisory.alertType).toBe('heavy_rain');
      expect(advisory.immediateActions).toContain('Ensure drainage channels are clear and functional');
      expect(advisory.immediateActions).toContain('Stop all irrigation immediately');
    });

    it('should generate advisory for heatwave on rice during flowering', () => {
      const cropInfo: CropInfo = {
        type: 'rice',
        growthStage: 'flowering'
      };

      const alert: WeatherAlert = {
        id: 'ALERT-heat-001',
        type: 'heatwave',
        severity: 'critical',
        location: mockLocation,
        title: 'Heatwave Alert',
        description: '3 consecutive days above 38°C',
        advisories: ['Increase irrigation', 'Provide shade'],
        timestamp: new Date(),
        validUntil: new Date(Date.now() + 72 * 3600000),
        metadata: {
          currentValue: 3,
          threshold: 3,
          unit: 'days'
        }
      };

      // Set high temperature
      mockWeatherData.current.temperature = 40;
      mockWeatherData.dailyForecast.forEach((f, i) => {
        if (i < 3) f.temperature = { min: 35, max: 42 };
      });

      const advisory = service.generateAdvisory(alert, cropInfo, mockWeatherData);

      expect(advisory.severity).toBe('critical');
      expect(advisory.warnings).toContain('High temperatures during flowering cause pollen sterility and yield loss');
      expect(advisory.immediateActions).toContain('Irrigate during flowering hours to prevent pollen sterility');
    });
  });

  describe('generateAdvisories', () => {
    it('should generate advisories for multiple crops', () => {
      const crops: CropInfo[] = [
        { type: 'wheat', growthStage: 'vegetative' },
        { type: 'tomatoes', growthStage: 'flowering' },
        { type: 'rice', growthStage: 'fruiting' }
      ];

      const alert: WeatherAlert = {
        id: 'ALERT-wind-001',
        type: 'strong_winds',
        severity: 'warning',
        location: mockLocation,
        title: 'Strong Wind Warning',
        description: 'Wind speeds up to 18 m/s expected',
        advisories: ['Stake plants', 'Secure structures'],
        timestamp: new Date(),
        validUntil: new Date(Date.now() + 24 * 3600000),
        metadata: {
          currentValue: 18,
          threshold: 15,
          unit: 'm/s'
        }
      };

      mockWeatherData.current.windSpeed = 18;

      const advisories = service.generateAdvisories(alert, crops, mockWeatherData);

      expect(advisories).toHaveLength(3);
      expect(advisories[0].cropType).toBe('wheat');
      expect(advisories[1].cropType).toBe('tomatoes');
      expect(advisories[2].cropType).toBe('rice');
      
      // Flowering stage should have staking advice
      expect(advisories[1].immediateActions).toContain('Stake tall plants and provide support structures immediately');
    });
  });

  describe('pest risk advisory', () => {
    it('should generate pest risk advisory for tomatoes', () => {
      const cropInfo: CropInfo = {
        type: 'tomatoes',
        growthStage: 'vegetative'
      };

      const alert: WeatherAlert = {
        id: 'ALERT-pest-001',
        type: 'pest_risk',
        severity: 'warning',
        location: mockLocation,
        title: 'Pest Risk Advisory',
        description: 'Favorable conditions for pest activity',
        advisories: ['Monitor crops', 'Apply preventive measures'],
        timestamp: new Date(),
        validUntil: new Date(Date.now() + 48 * 3600000),
        metadata: {
          currentValue: 85,
          threshold: 80,
          unit: '%'
        }
      };

      mockWeatherData.current.temperature = 28;
      mockWeatherData.current.humidity = 85;

      const advisory = service.generateAdvisory(alert, cropInfo, mockWeatherData);

      expect(advisory.alertType).toBe('pest_risk');
      expect(advisory.immediateActions).toContain('Apply neem oil spray as preventive measure');
      expect(advisory.warnings).toContain('High risk of aphids, whiteflies, and fruit borers');
    });
  });

  describe('drought advisory', () => {
    it('should generate critical drought advisory for flowering stage', () => {
      const cropInfo: CropInfo = {
        type: 'wheat',
        growthStage: 'flowering'
      };

      const alert: WeatherAlert = {
        id: 'ALERT-drought-001',
        type: 'drought',
        severity: 'critical',
        location: mockLocation,
        title: 'Critical Drought Alert',
        description: 'Only 3mm rainfall expected in next 7 days',
        advisories: ['Conserve water', 'Use drip irrigation'],
        timestamp: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 3600000),
        metadata: {
          currentValue: 3,
          threshold: 10,
          unit: 'mm'
        }
      };

      // Set low rainfall
      mockWeatherData.dailyForecast.forEach(f => {
        f.rainfall = 0.4; // ~3mm total over 7 days
      });

      const advisory = service.generateAdvisory(alert, cropInfo, mockWeatherData);

      expect(advisory.severity).toBe('critical');
      expect(advisory.expectedImpact).toContain('Critical growth stage');
      expect(advisory.warnings).toContain('Water stress during critical stages causes severe yield reduction');
    });
  });

  describe('severity determination', () => {
    it('should determine correct severity levels', () => {
      const cropInfo: CropInfo = {
        type: 'peppers',
        growthStage: 'fruiting'
      };

      const createAlert = (severity: AlertSeverity): WeatherAlert => ({
        id: 'ALERT-test-001',
        type: 'frost',
        severity,
        location: mockLocation,
        title: 'Test Alert',
        description: 'Test',
        advisories: [],
        timestamp: new Date(),
        validUntil: new Date(Date.now() + 24 * 3600000),
        metadata: {}
      });

      // Test different temperature scenarios
      // Peppers: frost critical=2, min=5, max=10
      const scenarios = [
        { temp: -5, expectedSeverity: 'critical' }, // Well below critical
        { temp: 1, expectedSeverity: 'critical' },  // Below critical
        { temp: 8, expectedSeverity: 'high' },      // Between min and max
        { temp: 15, expectedSeverity: 'low' }       // Well above max
      ];

      scenarios.forEach(({ temp, expectedSeverity }) => {
        mockWeatherData.current.temperature = temp;
        mockWeatherData.hourlyForecast.forEach(f => {
          f.temperature = { min: temp, max: temp + 5 };
        });

        const alert = createAlert('warning');
        const advisory = service.generateAdvisory(alert, cropInfo, mockWeatherData);

        expect(advisory.severity).toBe(expectedSeverity);
      });
    });
  });

  describe('growth stage specific advisories', () => {
    it('should provide harvest-specific advice during harvest stage', () => {
      const cropInfo: CropInfo = {
        type: 'wheat',
        growthStage: 'harvest'
      };

      const alert: WeatherAlert = {
        id: 'ALERT-rain-002',
        type: 'heavy_rain',
        severity: 'warning',
        location: mockLocation,
        title: 'Heavy Rain Warning',
        description: 'Heavy rain expected',
        advisories: [],
        timestamp: new Date(),
        validUntil: new Date(Date.now() + 24 * 3600000),
        metadata: {}
      };

      mockWeatherData.hourlyForecast.forEach((f, i) => {
        if (i < 24) f.rainfall = 2;
      });

      const advisory = service.generateAdvisory(alert, cropInfo, mockWeatherData);

      expect(advisory.immediateActions).toContain('Harvest mature crops before heavy rain if possible');
    });

    it('should provide seedling-specific advice during seedling stage', () => {
      const cropInfo: CropInfo = {
        type: 'tomatoes',
        growthStage: 'seedling'
      };

      const alert: WeatherAlert = {
        id: 'ALERT-frost-002',
        type: 'frost',
        severity: 'critical',
        location: mockLocation,
        title: 'Frost Alert',
        description: 'Frost expected',
        advisories: [],
        timestamp: new Date(),
        validUntil: new Date(Date.now() + 24 * 3600000),
        metadata: {}
      };

      mockWeatherData.current.temperature = 0;

      const advisory = service.generateAdvisory(alert, cropInfo, mockWeatherData);

      expect(advisory.immediateActions).toContain('Cover plants immediately with frost cloth or plastic sheets');
    });
  });

  describe('timeframe calculation', () => {
    it('should calculate correct timeframes', () => {
      const cropInfo: CropInfo = {
        type: 'rice',
        growthStage: 'vegetative'
      };

      const scenarios = [
        { hours: 3, expected: 'Immediate action required (within 6 hours)' },
        { hours: 12, expected: 'Action required within 24 hours' },
        { hours: 36, expected: 'Action required within 48 hours' },
        { hours: 96, expected: 'Action required within 4 days' }
      ];

      scenarios.forEach(({ hours, expected }) => {
        const alert: WeatherAlert = {
          id: 'ALERT-test',
          type: 'high_temperature',
          severity: 'warning',
          location: mockLocation,
          title: 'Test',
          description: 'Test',
          advisories: [],
          timestamp: new Date(),
          validUntil: new Date(Date.now() + hours * 3600000),
          metadata: {}
        };

        const advisory = service.generateAdvisory(alert, cropInfo, mockWeatherData);
        expect(advisory.timeframe).toBe(expected);
      });
    });
  });

  describe('yield impact estimation', () => {
    it('should estimate yield impact correctly', () => {
      const cropInfo: CropInfo = {
        type: 'wheat',
        growthStage: 'flowering'
      };

      const alert: WeatherAlert = {
        id: 'ALERT-test',
        type: 'frost',
        severity: 'critical',
        location: mockLocation,
        title: 'Test',
        description: 'Test',
        advisories: [],
        timestamp: new Date(),
        validUntil: new Date(Date.now() + 24 * 3600000),
        metadata: {}
      };

      // Critical frost
      mockWeatherData.current.temperature = -5;
      mockWeatherData.hourlyForecast.forEach(f => {
        f.temperature = { min: -5, max: 0 };
      });

      const advisory = service.generateAdvisory(alert, cropInfo, mockWeatherData);

      expect(advisory.metadata.affectedYield).toContain('yield');
      // Expected impact should mention loss or reduction
      expect(advisory.expectedImpact.toLowerCase()).toMatch(/loss|reduction|impact/);
    });
  });

  describe('crop-specific sensitivities', () => {
    it('should apply different sensitivities for different crops', () => {
      const alert: WeatherAlert = {
        id: 'ALERT-frost-003',
        type: 'frost',
        severity: 'warning',
        location: mockLocation,
        title: 'Frost Warning',
        description: 'Temperature dropping to 3°C',
        advisories: [],
        timestamp: new Date(),
        validUntil: new Date(Date.now() + 24 * 3600000),
        metadata: {}
      };

      mockWeatherData.current.temperature = 3;
      mockWeatherData.hourlyForecast.forEach(f => {
        f.temperature = { min: 3, max: 8 };
      });

      // Tomatoes are more frost-sensitive than wheat
      const tomatoAdvisory = service.generateAdvisory(
        alert,
        { type: 'tomatoes', growthStage: 'flowering' },
        mockWeatherData
      );

      const wheatAdvisory = service.generateAdvisory(
        alert,
        { type: 'wheat', growthStage: 'flowering' },
        mockWeatherData
      );

      // Tomatoes should have higher risk level at same temperature
      expect(tomatoAdvisory.metadata.riskLevel).toBeGreaterThan(wheatAdvisory.metadata.riskLevel);
    });
  });

  describe('edge cases', () => {
    it('should handle missing weather data gracefully', () => {
      const cropInfo: CropInfo = {
        type: 'rice',
        growthStage: 'vegetative'
      };

      const alert: WeatherAlert = {
        id: 'ALERT-test',
        type: 'strong_winds',
        severity: 'warning',
        location: mockLocation,
        title: 'Test',
        description: 'Test',
        advisories: [],
        timestamp: new Date(),
        validUntil: new Date(Date.now() + 24 * 3600000),
        metadata: {}
      };

      // Empty forecast data
      mockWeatherData.hourlyForecast = [];
      mockWeatherData.dailyForecast = [];

      const advisory = service.generateAdvisory(alert, cropInfo, mockWeatherData);

      expect(advisory).toBeDefined();
      expect(advisory.immediateActions.length).toBeGreaterThan(0);
    });

    it('should handle unknown crop types with default sensitivities', () => {
      const cropInfo: CropInfo = {
        type: 'beans',
        growthStage: 'vegetative'
      };

      const alert: WeatherAlert = {
        id: 'ALERT-test',
        type: 'frost',
        severity: 'warning',
        location: mockLocation,
        title: 'Test',
        description: 'Test',
        advisories: [],
        timestamp: new Date(),
        validUntil: new Date(Date.now() + 24 * 3600000),
        metadata: {}
      };

      const advisory = service.generateAdvisory(alert, cropInfo, mockWeatherData);

      expect(advisory).toBeDefined();
      expect(advisory.cropType).toBe('beans');
    });
  });
});
