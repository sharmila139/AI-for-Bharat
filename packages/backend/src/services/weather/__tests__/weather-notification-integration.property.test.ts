/**
 * Property-based tests for Weather Notification Integration Service
 * Uses fast-check for comprehensive input coverage
 */

import * as fc from 'fast-check';
import { WeatherNotificationIntegration } from '../weather-notification-integration';
import { WeatherAlertService, WeatherAlert, AlertSeverity, AlertType } from '../weather-alert-service';
import { NotificationService, NotificationPriority } from '../../notifications/notification-service';
import { WeatherService } from '../weather-service';

describe('WeatherNotificationIntegration - Property Tests', () => {
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

  // Generators
  const userIdArb = fc.string({ minLength: 1, maxLength: 50 });
  
  const locationArb = fc.record({
    latitude: fc.double({ min: -90, max: 90 }),
    longitude: fc.double({ min: -180, max: 180 })
  });

  const cropsArb = fc.array(
    fc.constantFrom('wheat', 'rice', 'corn', 'tomatoes', 'peppers', 'cucumbers', 'beans', 'potatoes'),
    { minLength: 0, maxLength: 5 }
  );

  const userPreferencesArb = fc.record({
    userId: userIdArb,
    location: locationArb,
    crops: fc.option(cropsArb, { nil: undefined }),
    enableWeatherAlerts: fc.boolean()
  });

  const alertSeverityArb = fc.constantFrom<AlertSeverity>('info', 'warning', 'critical');
  
  const alertTypeArb = fc.constantFrom<AlertType>(
    'frost',
    'heavy_rain',
    'high_temperature',
    'strong_winds',
    'drought',
    'heatwave',
    'pest_risk'
  );

  const weatherAlertArb = fc.record({
    id: fc.string({ minLength: 1 }),
    type: alertTypeArb,
    severity: alertSeverityArb,
    location: locationArb,
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 1, maxLength: 500 }),
    advisories: fc.array(fc.string({ minLength: 1, maxLength: 200 }), { minLength: 0, maxLength: 10 }),
    timestamp: fc.date(),
    validUntil: fc.date(),
    metadata: fc.record({
      currentValue: fc.option(fc.double(), { nil: undefined }),
      threshold: fc.option(fc.double(), { nil: undefined }),
      unit: fc.option(fc.string(), { nil: undefined }),
      affectedCrops: fc.option(fc.array(fc.string()), { nil: undefined })
    })
  });

  /**
   * Property 1: User Registration Idempotence
   * For any user preferences, registering twice should result in the same state
   */
  test('Property 1: User registration is idempotent', () => {
    fc.assert(
      fc.property(userPreferencesArb, (preferences) => {
        integration.registerUser(preferences);
        const first = integration.getUserPreferences(preferences.userId);
        
        integration.registerUser(preferences);
        const second = integration.getUserPreferences(preferences.userId);
        
        expect(first).toEqual(second);
        
        integration.clear();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Severity to Priority Mapping Consistency
   * For any alert severity, the mapped priority should be consistent and valid
   * **Validates: Requirements 5.4**
   */
  test('Property 2: Alert severity maps to valid notification priority', () => {
    fc.assert(
      fc.property(alertSeverityArb, (severity) => {
        // Access private method through type assertion for testing
        const priority = (integration as any).mapSeverityToPriority(severity);

        // Verify priority is valid
        expect(['critical', 'high', 'normal', 'low']).toContain(priority);

        // Verify mapping rules
        if (severity === 'critical') {
          expect(priority).toBe('critical');
        } else if (severity === 'warning') {
          expect(priority).toBe('high');
        } else if (severity === 'info') {
          expect(priority).toBe('normal');
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Notification Payload Completeness
   * For any alert, the formatted notification payload should have all required fields
   */
  test('Property 3: Notification payload has all required fields', () => {
    fc.assert(
      fc.property(userIdArb, weatherAlertArb, (userId, alert) => {
        const priority: NotificationPriority = 'normal';
        const payload = (integration as any).formatNotificationPayload(userId, alert, priority);

        // Verify all required fields are present
        expect(payload).toHaveProperty('userId');
        expect(payload).toHaveProperty('category');
        expect(payload).toHaveProperty('priority');
        expect(payload).toHaveProperty('title');
        expect(payload).toHaveProperty('body');
        expect(payload).toHaveProperty('data');
        expect(payload).toHaveProperty('actionUrl');
        expect(payload).toHaveProperty('expiresAt');

        // Verify field types
        expect(typeof payload.userId).toBe('string');
        expect(payload.category).toBe('weather');
        expect(['critical', 'high', 'normal', 'low']).toContain(payload.priority);
        expect(typeof payload.title).toBe('string');
        expect(typeof payload.body).toBe('string');
        expect(typeof payload.data).toBe('object');
        expect(typeof payload.actionUrl).toBe('string');
        expect(payload.expiresAt).toBeInstanceOf(Date);

        // Verify data object has alert information
        expect(payload.data).toHaveProperty('alertId');
        expect(payload.data).toHaveProperty('alertType');
        expect(payload.data).toHaveProperty('severity');
        expect(payload.data).toHaveProperty('advisories');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Concise Message Length
   * For any alert, the concise message should be SMS-friendly (< 300 characters)
   */
  test('Property 4: Concise messages are SMS-friendly', () => {
    fc.assert(
      fc.property(weatherAlertArb, (alert) => {
        const message = integration.formatConciseMessage(alert);

        // SMS-friendly length
        expect(message.length).toBeLessThan(300);
        
        // Should contain key information
        expect(message).toContain(alert.title);
        expect(message).toContain(alert.description);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Duplicate Alert Prevention
   * For any user and alert, sending the same alert twice should only deliver once
   */
  test('Property 5: Duplicate alerts are prevented', async () => {
    await fc.assert(
      fc.asyncProperty(userPreferencesArb, weatherAlertArb, async (preferences, alert) => {
        // Only test with enabled alerts
        if (!preferences.enableWeatherAlerts) {
          return;
        }

        integration.registerUser(preferences);

        // Mock the alert service to return the same alert
        jest.spyOn(weatherAlertService, 'checkAndGenerateAlerts')
          .mockResolvedValue([alert]);

        const sendSpy = jest.spyOn(notificationService, 'sendNotification');

        // First check
        await integration.checkAndNotifyUser(preferences.userId);
        const firstCallCount = sendSpy.mock.calls.length;

        // Second check with same alert
        await integration.checkAndNotifyUser(preferences.userId);
        const secondCallCount = sendSpy.mock.calls.length;

        // Should not send duplicate
        expect(secondCallCount).toBe(firstCallCount);

        integration.clear();
        sendSpy.mockRestore();
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 6: Disabled Alerts Respect
   * For any user with disabled alerts, no notifications should be sent
   */
  test('Property 6: Disabled alerts are respected', async () => {
    await fc.assert(
      fc.asyncProperty(userPreferencesArb, async (preferences) => {
        // Force disable alerts
        const disabledPreferences = { ...preferences, enableWeatherAlerts: false };
        integration.registerUser(disabledPreferences);

        const sendSpy = jest.spyOn(notificationService, 'sendNotification');

        await integration.checkAndNotifyUser(disabledPreferences.userId);

        // Should not send any notifications
        expect(sendSpy).not.toHaveBeenCalled();

        integration.clear();
        sendSpy.mockRestore();
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 7: Statistics Consistency
   * For any set of users, statistics should accurately reflect the state
   */
  test('Property 7: Statistics are consistent with state', () => {
    fc.assert(
      fc.property(fc.array(userPreferencesArb, { minLength: 0, maxLength: 10 }), (usersList) => {
        // Register all users
        usersList.forEach(prefs => integration.registerUser(prefs));

        const stats = integration.getStatistics();

        // Total users should match registered users
        expect(stats.totalUsers).toBe(usersList.length);

        // Users with alerts should be <= total users
        expect(stats.usersWithAlerts).toBeLessThanOrEqual(stats.totalUsers);

        // Total alerts sent should be >= 0
        expect(stats.totalAlertsSent).toBeGreaterThanOrEqual(0);

        integration.clear();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: User Unregistration Cleanup
   * For any user, unregistering should remove all associated data
   */
  test('Property 8: Unregistration cleans up all user data', async () => {
    await fc.assert(
      fc.asyncProperty(userPreferencesArb, async (preferences) => {
        integration.registerUser(preferences);

        // Send some alerts
        if (preferences.enableWeatherAlerts) {
          const mockAlert: WeatherAlert = {
            id: 'test-alert',
            type: 'frost',
            severity: 'warning',
            location: preferences.location,
            title: 'Test',
            description: 'Test',
            advisories: [],
            timestamp: new Date(),
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
            metadata: {}
          };

          jest.spyOn(weatherAlertService, 'checkAndGenerateAlerts')
            .mockResolvedValue([mockAlert]);

          await integration.checkAndNotifyUser(preferences.userId);
        }

        // Unregister
        integration.unregisterUser(preferences.userId);

        // Verify cleanup
        expect(integration.getUserPreferences(preferences.userId)).toBeUndefined();
        
        const stats = integration.getStatistics();
        expect(stats.totalUsers).toBe(0);

        integration.clear();
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 9: Crop Filtering Correctness
   * For any user with specific crops, only relevant alerts should be considered
   */
  test('Property 9: Crop filtering works correctly', () => {
    fc.assert(
      fc.property(
        userPreferencesArb,
        fc.array(weatherAlertArb, { minLength: 1, maxLength: 5 }),
        (preferences, alerts) => {
          // Only test with crops specified
          if (!preferences.crops || preferences.crops.length === 0) {
            return;
          }

          const filtered = (integration as any).filterRelevantAlerts(alerts, preferences);

          // All filtered alerts should be relevant
          filtered.forEach((alert: WeatherAlert) => {
            const affectedCrops = alert.metadata.affectedCrops || [];
            
            // If no affected crops specified, alert is relevant to all
            if (affectedCrops.length === 0) {
              return;
            }

            // If 'all crops' is in affected crops, alert is relevant
            if (affectedCrops.some(c => c.toLowerCase() === 'all crops')) {
              return;
            }

            // Otherwise, at least one user crop should be in affected crops
            const hasMatchingCrop = preferences.crops!.some(userCrop =>
              affectedCrops.some(affectedCrop => 
                affectedCrop.toLowerCase() === userCrop.toLowerCase()
              )
            );

            expect(hasMatchingCrop).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10: Registered Users List Consistency
   * For any set of users, the registered users list should match exactly
   */
  test('Property 10: Registered users list is consistent', () => {
    fc.assert(
      fc.property(fc.array(userPreferencesArb, { minLength: 0, maxLength: 20 }), (usersList) => {
        // Register all users
        usersList.forEach(prefs => integration.registerUser(prefs));

        const registeredUsers = integration.getRegisteredUsers();

        // Should have correct count (accounting for duplicate userIds)
        const uniqueUserIds = new Set(usersList.map(u => u.userId));
        expect(registeredUsers.length).toBe(uniqueUserIds.size);

        // All registered users should be in the list
        registeredUsers.forEach(userId => {
          expect(integration.getUserPreferences(userId)).toBeDefined();
        });

        integration.clear();
      }),
      { numRuns: 100 }
    );
  });
});
