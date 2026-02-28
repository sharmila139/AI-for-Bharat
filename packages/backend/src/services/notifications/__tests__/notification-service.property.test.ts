/**
 * Property-based tests for NotificationService
 * Tests universal properties that should hold for all valid inputs
 */

import fc from 'fast-check';
import { NotificationService, NotificationPayload, NotificationPreferences, NotificationChannel } from '../notification-service';

describe('NotificationService - Property Tests', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  afterEach(() => {
    service.clear();
  });

  // Arbitraries for generating test data
  const channelArb = fc.constantFrom<NotificationChannel>('push', 'sms', 'in-app', 'voice');
  const priorityArb = fc.constantFrom('critical', 'high', 'normal', 'low');
  const categoryArb = fc.constantFrom('irrigation', 'weather', 'market', 'health', 'education', 'infrastructure', 'system');

  const notificationPayloadArb = fc.record({
    userId: fc.string({ minLength: 1, maxLength: 50 }),
    category: categoryArb,
    priority: priorityArb,
    title: fc.string({ minLength: 1, maxLength: 100 }),
    body: fc.string({ minLength: 1, maxLength: 500 })
  }) as fc.Arbitrary<NotificationPayload>;

  const preferencesArb = fc.record({
    userId: fc.string({ minLength: 1, maxLength: 50 }),
    enabledChannels: fc.array(channelArb, { minLength: 1, maxLength: 4 }),
    categoryPreferences: fc.record({
      irrigation: fc.record({
        enabled: fc.boolean(),
        channels: fc.array(channelArb, { minLength: 0, maxLength: 4 })
      }),
      weather: fc.record({
        enabled: fc.boolean(),
        channels: fc.array(channelArb, { minLength: 0, maxLength: 4 })
      }),
      market: fc.record({
        enabled: fc.boolean(),
        channels: fc.array(channelArb, { minLength: 0, maxLength: 4 })
      }),
      health: fc.record({
        enabled: fc.boolean(),
        channels: fc.array(channelArb, { minLength: 0, maxLength: 4 })
      }),
      education: fc.record({
        enabled: fc.boolean(),
        channels: fc.array(channelArb, { minLength: 0, maxLength: 4 })
      }),
      infrastructure: fc.record({
        enabled: fc.boolean(),
        channels: fc.array(channelArb, { minLength: 0, maxLength: 4 })
      }),
      system: fc.record({
        enabled: fc.boolean(),
        channels: fc.array(channelArb, { minLength: 0, maxLength: 4 })
      })
    }),
    language: fc.constantFrom('en', 'hi', 'ta', 'te', 'bn')
  });

  /**
   * Property 38: Critical Notification Channels
   * For any notification with critical priority, the system should deliver via
   * all available channels (push, SMS, in-app) regardless of user preferences
   * 
   * **Validates: Requirements 17.2**
   */
  test('Property 38: Critical notifications use all available channels', async () => {
    await fc.assert(
      fc.asyncProperty(
        notificationPayloadArb,
        preferencesArb,
        async (payload, preferences) => {
          // Set up preferences
          service.setUserPreferences(preferences);

          // Make notification critical
          const criticalPayload: NotificationPayload = {
            ...payload,
            userId: preferences.userId,
            priority: 'critical'
          };

          const result = await service.sendNotification(criticalPayload);

          // Critical notifications should use push, sms, and in-app
          expect(result.channels).toContain('push');
          expect(result.channels).toContain('sms');
          expect(result.channels).toContain('in-app');
          expect(result.channels.length).toBeGreaterThanOrEqual(3);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 39: Quiet Hours Respect
   * For any non-critical notification during user's quiet hours,
   * the notification should be queued and not sent immediately
   * 
   * **Validates: Requirements 17.3**
   */
  test('Property 39: Non-critical notifications respect quiet hours', async () => {
    await fc.assert(
      fc.asyncProperty(
        notificationPayloadArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        async (payload, userId) => {
          // Set up preferences with all-day quiet hours
          const preferences: NotificationPreferences = {
            userId,
            enabledChannels: ['push', 'sms', 'in-app'],
            categoryPreferences: {
              irrigation: { enabled: true, channels: ['push'] },
              weather: { enabled: true, channels: ['push'] },
              market: { enabled: true, channels: ['push'] },
              health: { enabled: true, channels: ['push'] },
              education: { enabled: true, channels: ['push'] },
              infrastructure: { enabled: true, channels: ['push'] },
              system: { enabled: true, channels: ['push'] }
            },
            quietHours: {
              enabled: true,
              start: '00:00',
              end: '23:59'
            },
            language: 'en'
          };

          service.setUserPreferences(preferences);

          // Make notification non-critical
          const nonCriticalPayload: NotificationPayload = {
            ...payload,
            userId,
            priority: 'normal'
          };

          const result = await service.sendNotification(nonCriticalPayload);

          // During quiet hours, non-critical notifications should be queued
          if (result.channels.length > 0) {
            const allQueued = Object.values(result.deliveryStatus).every(
              status => !status.sent || status.error?.includes('Queued')
            );
            expect(allQueued).toBe(true);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Notification ID Uniqueness
   * For any set of notifications, all notification IDs should be unique
   */
  test('Property: All notification IDs are unique', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(notificationPayloadArb, { minLength: 2, maxLength: 10 }),
        async (payloads) => {
          const results = await Promise.all(
            payloads.map(p => service.sendNotification(p))
          );

          const ids = results.map(r => r.id);
          const uniqueIds = new Set(ids);

          expect(uniqueIds.size).toBe(ids.length);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Delivery Status Completeness
   * For any notification sent, the delivery status should include
   * an entry for each selected channel
   */
  test('Property: Delivery status includes all selected channels', async () => {
    await fc.assert(
      fc.asyncProperty(
        notificationPayloadArb,
        async (payload) => {
          const result = await service.sendNotification(payload);

          // Every channel in the result should have a delivery status
          for (const channel of result.channels) {
            expect(result.deliveryStatus[channel]).toBeDefined();
            expect(result.deliveryStatus[channel].timestamp).toBeInstanceOf(Date);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Language Preference Preservation
   * For any user preferences set, retrieving them should return
   * the same language preference
   */
  test('Property: Language preferences are preserved', async () => {
    await fc.assert(
      fc.asyncProperty(
        preferencesArb,
        async (preferences) => {
          service.setUserPreferences(preferences);
          const retrieved = service.getUserPreferences(preferences.userId);

          expect(retrieved.language).toBe(preferences.language);
        }
      ),
      { numRuns: 20 }
    );
  });
});
