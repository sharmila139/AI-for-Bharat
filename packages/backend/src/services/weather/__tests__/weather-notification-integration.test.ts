/**
 * Unit tests for Weather Notification Integration Service
 */

import { WeatherNotificationIntegration, UserWeatherPreferences } from '../weather-notification-integration';
import { WeatherAlertService, WeatherAlert } from '../weather-alert-service';
import { NotificationService, NotificationPayload } from '../../notifications/notification-service';
import { WeatherService } from '../weather-service';

describe('WeatherNotificationIntegration', () => {
  let weatherService: WeatherService;
  let weatherAlertService: WeatherAlertService;
  let notificationService: NotificationService;
  let integration: WeatherNotificationIntegration;

  beforeEach(() => {
    weatherService = new WeatherService({
      openWeatherApiKey: 'test-key',
      cacheEnabled: false
    });
    weatherAlertService = new WeatherAlertService(weatherService);
    notificationService = new NotificationService();
    integration = new WeatherNotificationIntegration(
      weatherAlertService,
      notificationService
    );
  });

  afterEach(() => {
    integration.clear();
    weatherAlertService.clear();
    notificationService.clear();
    jest.restoreAllMocks();
  });

  // Helper to create mock alert
  const createMockAlert = (overrides?: Partial<WeatherAlert>): WeatherAlert => ({
    id: 'alert-1',
    type: 'frost',
    severity: 'critical',
    location: { latitude: 28.6139, longitude: 77.2090 },
    title: 'Critical Frost Alert',
    description: 'Temperature dropping to -3°C',
    advisories: ['Cover crops', 'Water before sunset', 'Use heaters'],
    timestamp: new Date(),
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    metadata: {
      currentValue: -3,
      threshold: -2,
      unit: '°C',
      affectedCrops: ['tomatoes', 'peppers']
    },
    ...overrides
  });

  describe('User Registration', () => {
    it('should register user with weather preferences', () => {
      const preferences: UserWeatherPreferences = {
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        crops: ['wheat', 'rice'],
        enableWeatherAlerts: true
      };

      integration.registerUser(preferences);

      const registered = integration.getUserPreferences('user1');
      expect(registered).toEqual(preferences);
    });

    it('should update user preferences', () => {
      const preferences: UserWeatherPreferences = {
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        crops: ['wheat'],
        enableWeatherAlerts: true
      };

      integration.registerUser(preferences);
      integration.updateUserPreferences('user1', { crops: ['rice', 'corn'] });

      const updated = integration.getUserPreferences('user1');
      expect(updated?.crops).toEqual(['rice', 'corn']);
    });

    it('should unregister user', () => {
      const preferences: UserWeatherPreferences = {
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        enableWeatherAlerts: true
      };

      integration.registerUser(preferences);
      integration.unregisterUser('user1');

      const registered = integration.getUserPreferences('user1');
      expect(registered).toBeUndefined();
    });

    it('should list all registered users', () => {
      integration.registerUser({
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        enableWeatherAlerts: true
      });
      integration.registerUser({
        userId: 'user2',
        location: { latitude: 19.0760, longitude: 72.8777 },
        enableWeatherAlerts: true
      });

      const users = integration.getRegisteredUsers();
      expect(users).toHaveLength(2);
      expect(users).toContain('user1');
      expect(users).toContain('user2');
    });
  });

  describe('Alert Severity to Priority Mapping', () => {
    it('should map critical severity to critical priority', async () => {
      const preferences: UserWeatherPreferences = {
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        enableWeatherAlerts: true
      };

      integration.registerUser(preferences);

      const mockAlert = createMockAlert({ severity: 'critical' });
      jest.spyOn(weatherAlertService, 'checkAndGenerateAlerts').mockResolvedValue([mockAlert]);
      const sendSpy = jest.spyOn(notificationService, 'sendNotification');

      await integration.checkAndNotifyUser('user1');

      expect(sendSpy).toHaveBeenCalled();
      const payload = sendSpy.mock.calls[0][0] as NotificationPayload;
      expect(payload.priority).toBe('critical');
      expect(payload.category).toBe('weather');
    });

    it('should map warning severity to high priority', async () => {
      const preferences: UserWeatherPreferences = {
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        enableWeatherAlerts: true
      };

      integration.registerUser(preferences);

      const mockAlert = createMockAlert({ severity: 'warning' });
      jest.spyOn(weatherAlertService, 'checkAndGenerateAlerts').mockResolvedValue([mockAlert]);
      const sendSpy = jest.spyOn(notificationService, 'sendNotification');

      await integration.checkAndNotifyUser('user1');

      expect(sendSpy).toHaveBeenCalled();
      const payload = sendSpy.mock.calls[0][0] as NotificationPayload;
      expect(payload.priority).toBe('high');
    });

    it('should map info severity to normal priority', async () => {
      const preferences: UserWeatherPreferences = {
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        enableWeatherAlerts: true
      };

      integration.registerUser(preferences);

      const mockAlert = createMockAlert({ severity: 'info' });
      jest.spyOn(weatherAlertService, 'checkAndGenerateAlerts').mockResolvedValue([mockAlert]);
      const sendSpy = jest.spyOn(notificationService, 'sendNotification');

      await integration.checkAndNotifyUser('user1');

      expect(sendSpy).toHaveBeenCalled();
      const payload = sendSpy.mock.calls[0][0] as NotificationPayload;
      expect(payload.priority).toBe('normal');
    });
  });

  describe('Notification Formatting', () => {
    it('should format notification with alert details', async () => {
      const preferences: UserWeatherPreferences = {
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        enableWeatherAlerts: true
      };

      integration.registerUser(preferences);

      const mockAlert = createMockAlert();
      jest.spyOn(weatherAlertService, 'checkAndGenerateAlerts').mockResolvedValue([mockAlert]);
      const sendSpy = jest.spyOn(notificationService, 'sendNotification');

      await integration.checkAndNotifyUser('user1');

      expect(sendSpy).toHaveBeenCalled();
      const payload = sendSpy.mock.calls[0][0] as NotificationPayload;
      
      expect(payload.title).toContain('Frost');
      expect(payload.body).toContain('Temperature');
      expect(payload.body).toContain('Recommended actions');
      expect(payload.data).toHaveProperty('alertId');
      expect(payload.data).toHaveProperty('alertType');
      expect(payload.data).toHaveProperty('severity');
      expect(payload.data).toHaveProperty('advisories');
    });

    it('should include top 3 advisories in notification body', async () => {
      const preferences: UserWeatherPreferences = {
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        enableWeatherAlerts: true
      };

      integration.registerUser(preferences);

      const mockAlert = createMockAlert({
        advisories: ['Advisory 1', 'Advisory 2', 'Advisory 3', 'Advisory 4', 'Advisory 5']
      });
      jest.spyOn(weatherAlertService, 'checkAndGenerateAlerts').mockResolvedValue([mockAlert]);
      const sendSpy = jest.spyOn(notificationService, 'sendNotification');

      await integration.checkAndNotifyUser('user1');

      const payload = sendSpy.mock.calls[0][0] as NotificationPayload;
      const advisoryMatches = payload.body.match(/\d+\./g);
      expect(advisoryMatches).toBeTruthy();
      expect(advisoryMatches!.length).toBeLessThanOrEqual(3);
      expect(payload.body).toContain('and 2 more');
    });

    it('should format concise message for SMS/Voice', () => {
      const alert = createMockAlert();
      const message = integration.formatConciseMessage(alert);
      
      expect(message).toContain('Critical Frost Alert');
      expect(message).toContain('Temperature dropping to -3°C');
      expect(message).toContain('Action: Cover crops');
      expect(message.length).toBeLessThan(200);
    });
  });

  describe('Crop-Specific Filtering', () => {
    it('should send alerts for user\'s crops', async () => {
      const preferences: UserWeatherPreferences = {
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        crops: ['tomatoes', 'peppers'],
        enableWeatherAlerts: true
      };

      integration.registerUser(preferences);

      const mockAlert = createMockAlert({
        metadata: {
          affectedCrops: ['tomatoes', 'peppers', 'cucumbers']
        }
      });
      jest.spyOn(weatherAlertService, 'checkAndGenerateAlerts').mockResolvedValue([mockAlert]);
      const sendSpy = jest.spyOn(notificationService, 'sendNotification');

      await integration.checkAndNotifyUser('user1');

      expect(sendSpy).toHaveBeenCalled();
    });

    it('should not send alerts for unrelated crops', async () => {
      const preferences: UserWeatherPreferences = {
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        crops: ['wheat', 'rice'],
        enableWeatherAlerts: true
      };

      integration.registerUser(preferences);

      const mockAlert = createMockAlert({
        metadata: {
          affectedCrops: ['tomatoes', 'peppers']
        }
      });
      jest.spyOn(weatherAlertService, 'checkAndGenerateAlerts').mockResolvedValue([mockAlert]);
      const sendSpy = jest.spyOn(notificationService, 'sendNotification');

      await integration.checkAndNotifyUser('user1');

      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('should send alerts affecting all crops', async () => {
      const preferences: UserWeatherPreferences = {
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        crops: ['wheat'],
        enableWeatherAlerts: true
      };

      integration.registerUser(preferences);

      const mockAlert = createMockAlert({
        type: 'heavy_rain',
        metadata: {
          affectedCrops: ['all crops']
        }
      });
      jest.spyOn(weatherAlertService, 'checkAndGenerateAlerts').mockResolvedValue([mockAlert]);
      const sendSpy = jest.spyOn(notificationService, 'sendNotification');

      await integration.checkAndNotifyUser('user1');

      expect(sendSpy).toHaveBeenCalled();
    });

    it('should send alerts with no crop specification to all users', async () => {
      const preferences: UserWeatherPreferences = {
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        crops: ['wheat'],
        enableWeatherAlerts: true
      };

      integration.registerUser(preferences);

      const mockAlert = createMockAlert({
        metadata: {
          affectedCrops: undefined
        }
      });
      jest.spyOn(weatherAlertService, 'checkAndGenerateAlerts').mockResolvedValue([mockAlert]);
      const sendSpy = jest.spyOn(notificationService, 'sendNotification');

      await integration.checkAndNotifyUser('user1');

      expect(sendSpy).toHaveBeenCalled();
    });
  });

  describe('Duplicate Alert Prevention', () => {
    it('should not send same alert twice to same user', async () => {
      const preferences: UserWeatherPreferences = {
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        enableWeatherAlerts: true
      };

      integration.registerUser(preferences);

      const mockAlert = createMockAlert();
      jest.spyOn(weatherAlertService, 'checkAndGenerateAlerts').mockResolvedValue([mockAlert]);
      const sendSpy = jest.spyOn(notificationService, 'sendNotification');

      await integration.checkAndNotifyUser('user1');
      expect(sendSpy).toHaveBeenCalledTimes(1);

      await integration.checkAndNotifyUser('user1');
      expect(sendSpy).toHaveBeenCalledTimes(1);
    });

    it('should clear sent alerts history', async () => {
      const preferences: UserWeatherPreferences = {
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        enableWeatherAlerts: true
      };

      integration.registerUser(preferences);

      const mockAlert = createMockAlert();
      jest.spyOn(weatherAlertService, 'checkAndGenerateAlerts').mockResolvedValue([mockAlert]);
      const sendSpy = jest.spyOn(notificationService, 'sendNotification');

      await integration.checkAndNotifyUser('user1');
      expect(sendSpy).toHaveBeenCalledTimes(1);

      integration.clearSentAlerts('user1');

      await integration.checkAndNotifyUser('user1');
      expect(sendSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Disabled Alerts', () => {
    it('should not send alerts when disabled', async () => {
      const preferences: UserWeatherPreferences = {
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        enableWeatherAlerts: false
      };

      integration.registerUser(preferences);

      const mockAlert = createMockAlert();
      jest.spyOn(weatherAlertService, 'checkAndGenerateAlerts').mockResolvedValue([mockAlert]);
      const sendSpy = jest.spyOn(notificationService, 'sendNotification');

      await integration.checkAndNotifyUser('user1');

      expect(sendSpy).not.toHaveBeenCalled();
    });
  });

  describe('Batch Processing', () => {
    it('should check alerts for all users', async () => {
      integration.registerUser({
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        enableWeatherAlerts: true
      });
      integration.registerUser({
        userId: 'user2',
        location: { latitude: 19.0760, longitude: 72.8777 },
        enableWeatherAlerts: true
      });

      const mockAlert = createMockAlert();
      jest.spyOn(weatherAlertService, 'checkAndGenerateAlerts').mockResolvedValue([mockAlert]);
      const sendSpy = jest.spyOn(notificationService, 'sendNotification');

      await integration.checkAndNotifyAllUsers();

      expect(sendSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle errors for individual users gracefully', async () => {
      integration.registerUser({
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        enableWeatherAlerts: true
      });
      integration.registerUser({
        userId: 'user2',
        location: { latitude: 19.0760, longitude: 72.8777 },
        enableWeatherAlerts: true
      });

      jest.spyOn(weatherAlertService, 'checkAndGenerateAlerts')
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce([]);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await integration.checkAndNotifyAllUsers();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Statistics', () => {
    it('should track statistics', async () => {
      integration.registerUser({
        userId: 'user1',
        location: { latitude: 28.6139, longitude: 77.2090 },
        enableWeatherAlerts: true
      });
      integration.registerUser({
        userId: 'user2',
        location: { latitude: 19.0760, longitude: 72.8777 },
        enableWeatherAlerts: true
      });

      const mockAlert = createMockAlert();
      jest.spyOn(weatherAlertService, 'checkAndGenerateAlerts').mockResolvedValue([mockAlert]);

      await integration.checkAndNotifyUser('user1');

      const stats = integration.getStatistics();
      expect(stats.totalUsers).toBe(2);
      expect(stats.usersWithAlerts).toBe(1);
      expect(stats.totalAlertsSent).toBeGreaterThan(0);
    });
  });
});
