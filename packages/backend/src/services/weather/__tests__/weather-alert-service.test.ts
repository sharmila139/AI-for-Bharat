/**
 * Unit tests for Weather Alert Service
 */

import { WeatherAlertService } from '../weather-alert-service';
import { WeatherService, WeatherLocation, WeatherData } from '../weather-service';

describe('WeatherAlertService', () => {
  let weatherService: WeatherService;
  let alertService: WeatherAlertService;
  let mockLocation: WeatherLocation;

  beforeEach(() => {
    weatherService = new WeatherService({
      openWeatherApiKey: 'test-key',
      cacheEnabled: false
    });
    alertService = new WeatherAlertService(weatherService);
    mockLocation = {
      latitude: 28.6139,
      longitude: 77.2090,
      name: 'New Delhi'
    };
  });

  afterEach(() => {
    alertService.clear();
  });

  describe('Frost Alert Generation', () => {
    it('should generate critical frost alert when temperature drops below -2°C', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: -3,
        hourlyTemps: Array(24).fill(-3)
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);
      const frostAlerts = alerts.filter(a => a.type === 'frost');

      expect(frostAlerts).toHaveLength(1);
      expect(frostAlerts[0].type).toBe('frost');
      expect(frostAlerts[0].severity).toBe('critical');
      expect(frostAlerts[0].title).toBe('Critical Frost Alert');
      expect(frostAlerts[0].advisories).toContain('Cover sensitive crops with protective sheets or plastic');
      expect(frostAlerts[0].metadata.affectedCrops).toContain('tomatoes');
    });

    it('should generate warning frost alert when temperature is between -2°C and 2°C', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: 1,
        hourlyTemps: Array(24).fill(1)
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);
      const frostAlerts = alerts.filter(a => a.type === 'frost');

      expect(frostAlerts).toHaveLength(1);
      expect(frostAlerts[0].type).toBe('frost');
      expect(frostAlerts[0].severity).toBe('warning');
    });

    it('should not generate frost alert when temperature is above threshold', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: 15,
        hourlyTemps: Array(24).fill(15)
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);

      const frostAlerts = alerts.filter(a => a.type === 'frost');
      expect(frostAlerts).toHaveLength(0);
    });
  });

  describe('Heavy Rain Alert Generation', () => {
    it('should generate critical alert for >50mm rainfall in 24 hours', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: 25,
        hourlyRainfall: Array(24).fill(3) // 72mm total
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);

      const rainAlerts = alerts.filter(a => a.type === 'heavy_rain');
      expect(rainAlerts).toHaveLength(1);
      expect(rainAlerts[0].severity).toBe('critical');
      expect(rainAlerts[0].description).toContain('72.0mm');
      expect(rainAlerts[0].advisories).toContain('Ensure proper drainage in fields to prevent waterlogging');
    });

    it('should generate warning alert for 30-50mm rainfall in 24 hours', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: 25,
        hourlyRainfall: Array(24).fill(1.5) // 36mm total
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);

      const rainAlerts = alerts.filter(a => a.type === 'heavy_rain');
      expect(rainAlerts).toHaveLength(1);
      expect(rainAlerts[0].severity).toBe('warning');
    });

    it('should generate alert for >100mm rainfall in 72 hours', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: 25,
        dailyRainfall: [40, 40, 30, 0, 0, 0, 0] // 110mm in 3 days
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);

      const rainAlerts = alerts.filter(a => a.type === 'heavy_rain');
      expect(rainAlerts).toHaveLength(1);
      expect(rainAlerts[0].severity).toBe('critical');
      expect(rainAlerts[0].description).toContain('72 hours');
    });

    it('should not generate alert for light rainfall', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: 25,
        hourlyRainfall: Array(24).fill(0.5) // 12mm total
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);

      const rainAlerts = alerts.filter(a => a.type === 'heavy_rain');
      expect(rainAlerts).toHaveLength(0);
    });
  });

  describe('High Temperature Alert Generation', () => {
    it('should generate critical alert when temperature exceeds 40°C', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: 42,
        dailyMaxTemps: [42, 41, 40]
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);

      const tempAlerts = alerts.filter(a => a.type === 'high_temperature');
      expect(tempAlerts).toHaveLength(1);
      expect(tempAlerts[0].severity).toBe('critical');
      expect(tempAlerts[0].advisories).toContain('Increase irrigation frequency to prevent heat stress');
    });

    it('should generate warning alert when temperature is 35-40°C', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: 37,
        dailyMaxTemps: [37, 36, 35]
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);

      const tempAlerts = alerts.filter(a => a.type === 'high_temperature');
      expect(tempAlerts).toHaveLength(1);
      expect(tempAlerts[0].severity).toBe('warning');
    });
  });

  describe('Strong Wind Alert Generation', () => {
    it('should generate critical alert for wind speed ≥15 m/s', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: 25,
        windSpeed: 16
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);

      const windAlerts = alerts.filter(a => a.type === 'strong_winds');
      expect(windAlerts).toHaveLength(1);
      expect(windAlerts[0].severity).toBe('critical');
      expect(windAlerts[0].advisories).toContain('Stake tall crops to prevent lodging');
    });

    it('should generate warning alert for wind speed 10-15 m/s', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: 25,
        windSpeed: 12
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);

      const windAlerts = alerts.filter(a => a.type === 'strong_winds');
      expect(windAlerts).toHaveLength(1);
      expect(windAlerts[0].severity).toBe('warning');
    });
  });

  describe('Drought Alert Generation', () => {
    it('should generate critical drought alert when rainfall is very low', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: 30,
        dailyRainfall: [0, 0, 0, 0, 0, 1, 0] // Only 1mm in 7 days
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);

      const droughtAlerts = alerts.filter(a => a.type === 'drought');
      expect(droughtAlerts).toHaveLength(1);
      expect(droughtAlerts[0].severity).toBe('critical');
      expect(droughtAlerts[0].advisories).toContain('Implement water conservation measures');
    });

    it('should generate warning drought alert for moderate rainfall', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: 30,
        dailyRainfall: [0, 0, 0, 0, 0, 3, 3] // 6mm in 7 days
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);

      const droughtAlerts = alerts.filter(a => a.type === 'drought');
      expect(droughtAlerts).toHaveLength(1);
      expect(droughtAlerts[0].severity).toBe('warning');
    });

    it('should not generate drought alert when rainfall is adequate', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: 30,
        dailyRainfall: [5, 3, 4, 2, 3, 5, 4] // Good rainfall
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);

      const droughtAlerts = alerts.filter(a => a.type === 'drought');
      expect(droughtAlerts).toHaveLength(0);
    });
  });

  describe('Heatwave Alert Generation', () => {
    it('should generate heatwave alert for 3+ consecutive days above 38°C', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: 39,
        dailyMaxTemps: [39, 40, 39, 38, 35, 34, 33]
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);

      const heatwaveAlerts = alerts.filter(a => a.type === 'heatwave');
      expect(heatwaveAlerts).toHaveLength(1);
      expect(heatwaveAlerts[0].severity).toBe('critical');
      expect(heatwaveAlerts[0].description).toContain('consecutive days');
    });

    it('should not generate heatwave alert for non-consecutive hot days', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: 39,
        dailyMaxTemps: [39, 40, 32, 39, 35, 34, 33] // Broken by day 3
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);

      const heatwaveAlerts = alerts.filter(a => a.type === 'heatwave');
      expect(heatwaveAlerts).toHaveLength(0);
    });
  });

  describe('Pest Risk Alert Generation', () => {
    it('should generate pest risk alert when humidity is 80-100% and temp is 25-35°C', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: 28,
        humidity: 85
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);

      const pestAlerts = alerts.filter(a => a.type === 'pest_risk');
      expect(pestAlerts).toHaveLength(1);
      expect(pestAlerts[0].severity).toBe('warning');
      expect(pestAlerts[0].advisories).toContain('Monitor crops regularly for pest infestation');
    });

    it('should not generate pest risk alert when conditions are not favorable', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: 20, // Too cold
        humidity: 85
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);

      const pestAlerts = alerts.filter(a => a.type === 'pest_risk');
      expect(pestAlerts).toHaveLength(0);
    });
  });

  describe('Alert Management', () => {
    it('should store active alerts', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: -3,
        hourlyTemps: Array(24).fill(-3)
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      await alertService.checkAndGenerateAlerts(mockLocation);

      const activeAlerts = alertService.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThan(0);
    });

    it('should filter active alerts by location', async () => {
      const location1 = { latitude: 28.6139, longitude: 77.2090, name: 'Delhi' };
      const location2 = { latitude: 19.0760, longitude: 72.8777, name: 'Mumbai' };

      const mockWeatherData1: WeatherData = createMockWeatherData(location1, {
        currentTemp: -3,
        hourlyTemps: Array(24).fill(-3)
      });

      const mockWeatherData2: WeatherData = createMockWeatherData(location2, {
        currentTemp: 42,
        dailyMaxTemps: [42, 41, 40]
      });

      jest.spyOn(weatherService, 'getWeather')
        .mockResolvedValueOnce(mockWeatherData1)
        .mockResolvedValueOnce(mockWeatherData2);

      await alertService.checkAndGenerateAlerts(location1);
      await alertService.checkAndGenerateAlerts(location2);

      const delhiAlerts = alertService.getActiveAlerts(location1);
      const mumbaiAlerts = alertService.getActiveAlerts(location2);

      expect(delhiAlerts.some(a => a.type === 'frost')).toBe(true);
      expect(mumbaiAlerts.some(a => a.type === 'high_temperature')).toBe(true);
    });

    it('should maintain alert history', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: -3,
        hourlyTemps: Array(24).fill(-3)
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      await alertService.checkAndGenerateAlerts(mockLocation);

      const history = alertService.getAlertHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should clear expired alerts', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: -3,
        hourlyTemps: Array(24).fill(-3)
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);
      
      // Manually expire the alert
      alerts[0].validUntil = new Date(Date.now() - 1000);
      
      const clearedCount = alertService.clearExpiredAlerts();
      expect(clearedCount).toBeGreaterThan(0);
    });
  });

  describe('Threshold Configuration', () => {
    it('should allow updating thresholds', () => {
      alertService.updateThresholds({
        frost: {
          critical: -5,
          warning: 0,
          leadTimeHours: 48
        }
      });

      const thresholds = alertService.getThresholds();
      expect(thresholds.frost.critical).toBe(-5);
      expect(thresholds.frost.warning).toBe(0);
      expect(thresholds.frost.leadTimeHours).toBe(48);
    });

    it('should allow enabling/disabling alert types', () => {
      alertService.setEnabledAlertTypes(['frost', 'heavy_rain']);

      const enabledTypes = alertService.getEnabledAlertTypes();
      expect(enabledTypes).toContain('frost');
      expect(enabledTypes).toContain('heavy_rain');
      expect(enabledTypes).not.toContain('high_temperature');
    });

    it('should not generate alerts for disabled types', async () => {
      alertService.setEnabledAlertTypes(['frost']); // Only frost enabled

      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: 42, // Should trigger high temp alert
        dailyMaxTemps: [42, 41, 40]
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);

      const tempAlerts = alerts.filter(a => a.type === 'high_temperature');
      expect(tempAlerts).toHaveLength(0);
    });
  });

  describe('Alert Metadata', () => {
    it('should include correct metadata in alerts', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: -3,
        hourlyTemps: Array(24).fill(-3)
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);
      const frostAlert = alerts.find(a => a.type === 'frost');

      expect(frostAlert).toBeDefined();
      expect(frostAlert!.metadata.currentValue).toBeLessThanOrEqual(-2);
      expect(frostAlert!.metadata.threshold).toBe(-2);
      expect(frostAlert!.metadata.unit).toBe('°C');
      expect(frostAlert!.metadata.affectedCrops).toBeDefined();
    });

    it('should include valid timestamp and expiry', async () => {
      const mockWeatherData: WeatherData = createMockWeatherData(mockLocation, {
        currentTemp: -3,
        hourlyTemps: Array(24).fill(-3)
      });

      jest.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);

      const alerts = await alertService.checkAndGenerateAlerts(mockLocation);
      const alert = alerts[0];

      expect(alert.timestamp).toBeInstanceOf(Date);
      expect(alert.validUntil).toBeInstanceOf(Date);
      expect(alert.validUntil.getTime()).toBeGreaterThan(alert.timestamp.getTime());
    });
  });
});

// Helper function to create mock weather data
function createMockWeatherData(
  location: WeatherLocation,
  options: {
    currentTemp?: number;
    humidity?: number;
    windSpeed?: number;
    hourlyTemps?: number[];
    hourlyRainfall?: number[];
    dailyMaxTemps?: number[];
    dailyRainfall?: number[];
  }
): WeatherData {
  const {
    currentTemp = 25,
    humidity = 60,
    windSpeed = 5,
    hourlyTemps = Array(48).fill(25),
    hourlyRainfall = Array(48).fill(0),
    dailyMaxTemps = Array(14).fill(30),
    dailyRainfall = Array(14).fill(0)
  } = options;

  return {
    location,
    current: {
      temperature: currentTemp,
      feelsLike: currentTemp,
      humidity,
      pressure: 1013,
      windSpeed,
      windDirection: 180,
      description: 'clear sky',
      icon: '01d',
      timestamp: new Date()
    },
    hourlyForecast: hourlyTemps.map((temp, i) => ({
      date: new Date(Date.now() + i * 60 * 60 * 1000),
      rainfall: hourlyRainfall[i] || 0,
      temperature: {
        min: temp - 2,
        max: temp + 2
      },
      humidity,
      evapotranspiration: 3,
      windSpeed,
      windDirection: 180,
      pressure: 1013,
      description: 'clear sky',
      icon: '01d'
    })),
    dailyForecast: dailyMaxTemps.map((maxTemp, i) => ({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
      rainfall: dailyRainfall[i] || 0,
      temperature: {
        min: maxTemp - 10,
        max: maxTemp
      },
      humidity,
      evapotranspiration: 5,
      windSpeed,
      windDirection: 180,
      pressure: 1013,
      description: 'clear sky',
      icon: '01d'
    })),
    source: 'openweathermap',
    fetchedAt: new Date(),
    cacheExpiry: new Date(Date.now() + 3600000)
  };
}
