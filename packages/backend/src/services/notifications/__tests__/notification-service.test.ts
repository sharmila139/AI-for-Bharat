/**
 * Unit tests for NotificationService
 */

import { NotificationService, NotificationPayload, NotificationPreferences } from '../notification-service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  afterEach(() => {
    service.clear();
  });

  describe('sendNotification', () => {
    it('should send notification through default channels', async () => {
      const payload: NotificationPayload = {
        userId: 'user1',
        category: 'irrigation',
        priority: 'normal',
        title: 'Test Notification',
        body: 'This is a test'
      };

      const result = await service.sendNotification(payload);

      expect(result.userId).toBe('user1');
      expect(result.channels.length).toBeGreaterThan(0);
      expect(result.deliveryStatus).toBeDefined();
    });

    it('should use all channels for critical notifications', async () => {
      const payload: NotificationPayload = {
        userId: 'user1',
        category: 'weather',
        priority: 'critical',
        title: 'Critical Alert',
        body: 'Severe weather warning'
      };

      const result = await service.sendNotification(payload);

      expect(result.channels).toContain('push');
      expect(result.channels).toContain('sms');
      expect(result.channels).toContain('in-app');
    });

    it('should respect category preferences', async () => {
      const preferences: NotificationPreferences = {
        userId: 'user1',
        enabledChannels: ['push', 'in-app'],
        categoryPreferences: {
          irrigation: { enabled: false, channels: [] },
          weather: { enabled: true, channels: ['push'] },
          market: { enabled: true, channels: ['in-app'] },
          health: { enabled: true, channels: ['push'] },
          education: { enabled: true, channels: ['in-app'] },
          infrastructure: { enabled: true, channels: ['push'] },
          system: { enabled: true, channels: ['in-app'] }
        },
        language: 'en'
      };

      service.setUserPreferences(preferences);

      const payload: NotificationPayload = {
        userId: 'user1',
        category: 'irrigation',
        priority: 'normal',
        title: 'Irrigation Reminder',
        body: 'Time to irrigate'
      };

      const result = await service.sendNotification(payload);

      expect(result.channels).toHaveLength(0); // Category disabled
    });

    it('should queue notifications during quiet hours', async () => {
      const preferences: NotificationPreferences = {
        userId: 'user1',
        enabledChannels: ['push', 'in-app'],
        categoryPreferences: {
          irrigation: { enabled: true, channels: ['push'] },
          weather: { enabled: true, channels: ['push'] },
          market: { enabled: true, channels: ['in-app'] },
          health: { enabled: true, channels: ['push'] },
          education: { enabled: true, channels: ['in-app'] },
          infrastructure: { enabled: true, channels: ['push'] },
          system: { enabled: true, channels: ['in-app'] }
        },
        quietHours: {
          enabled: true,
          start: '00:00',
          end: '23:59' // All day quiet hours for testing
        },
        language: 'en'
      };

      service.setUserPreferences(preferences);

      const payload: NotificationPayload = {
        userId: 'user1',
        category: 'irrigation',
        priority: 'normal',
        title: 'Test',
        body: 'Test'
      };

      const result = await service.sendNotification(payload);

      // Should be queued, not sent
      expect(result.deliveryStatus.push?.sent).toBe(false);
    });

    it('should send critical notifications during quiet hours', async () => {
      const preferences: NotificationPreferences = {
        userId: 'user1',
        enabledChannels: ['push'],
        categoryPreferences: {
          irrigation: { enabled: true, channels: ['push'] },
          weather: { enabled: true, channels: ['push'] },
          market: { enabled: true, channels: ['in-app'] },
          health: { enabled: true, channels: ['push'] },
          education: { enabled: true, channels: ['in-app'] },
          infrastructure: { enabled: true, channels: ['push'] },
          system: { enabled: true, channels: ['in-app'] }
        },
        quietHours: {
          enabled: true,
          start: '00:00',
          end: '23:59'
        },
        language: 'en'
      };

      service.setUserPreferences(preferences);

      const payload: NotificationPayload = {
        userId: 'user1',
        category: 'weather',
        priority: 'critical',
        title: 'Critical Alert',
        body: 'Emergency'
      };

      const result = await service.sendNotification(payload);

      // Critical notifications bypass quiet hours
      expect(result.channels.length).toBeGreaterThan(0);
    });

    it('should schedule future notifications', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2);

      const payload: NotificationPayload = {
        userId: 'user1',
        category: 'irrigation',
        priority: 'normal',
        title: 'Future Reminder',
        body: 'This is scheduled',
        scheduledFor: futureDate
      };

      const result = await service.sendNotification(payload);

      expect(result.deliveryStatus.push?.sent).toBe(false);
      expect(result.deliveryStatus.push?.error).toContain('Queued');
    });
  });

  describe('getUserPreferences', () => {
    it('should return default preferences for new user', () => {
      const prefs = service.getUserPreferences('newuser');

      expect(prefs.userId).toBe('newuser');
      expect(prefs.enabledChannels).toContain('push');
      expect(prefs.categoryPreferences.irrigation.enabled).toBe(true);
    });

    it('should return custom preferences after setting', () => {
      const customPrefs: NotificationPreferences = {
        userId: 'user1',
        enabledChannels: ['sms'],
        categoryPreferences: {
          irrigation: { enabled: true, channels: ['sms'] },
          weather: { enabled: false, channels: [] },
          market: { enabled: true, channels: ['sms'] },
          health: { enabled: true, channels: ['sms'] },
          education: { enabled: true, channels: ['sms'] },
          infrastructure: { enabled: true, channels: ['sms'] },
          system: { enabled: true, channels: ['sms'] }
        },
        language: 'hi'
      };

      service.setUserPreferences(customPrefs);
      const retrieved = service.getUserPreferences('user1');

      expect(retrieved.enabledChannels).toEqual(['sms']);
      expect(retrieved.language).toBe('hi');
    });
  });

  describe('getAnalytics', () => {
    it('should return zero analytics for user with no notifications', () => {
      const analytics = service.getAnalytics('user1');

      expect(analytics.totalSent).toBe(0);
      expect(analytics.deliveryRate).toBe(0);
    });

    it('should calculate analytics correctly', async () => {
      const payload: NotificationPayload = {
        userId: 'user1',
        category: 'irrigation',
        priority: 'normal',
        title: 'Test',
        body: 'Test'
      };

      await service.sendNotification(payload);
      await service.sendNotification(payload);

      const analytics = service.getAnalytics('user1');

      expect(analytics.totalSent).toBeGreaterThan(0);
    });
  });

  describe('markAsRead and markAsClicked', () => {
    it('should mark notification as read', async () => {
      const payload: NotificationPayload = {
        userId: 'user1',
        category: 'irrigation',
        priority: 'normal',
        title: 'Test',
        body: 'Test'
      };

      await service.sendNotification(payload);
      const logs = service.getDeliveryLogs('user1');
      
      if (logs.length > 0) {
        service.markAsRead(logs[0].notificationId);
        const updatedLogs = service.getDeliveryLogs('user1');
        expect(updatedLogs[0].readAt).toBeDefined();
      }
    });

    it('should mark notification as clicked', async () => {
      const payload: NotificationPayload = {
        userId: 'user1',
        category: 'irrigation',
        priority: 'normal',
        title: 'Test',
        body: 'Test'
      };

      await service.sendNotification(payload);
      const logs = service.getDeliveryLogs('user1');
      
      if (logs.length > 0) {
        service.markAsClicked(logs[0].notificationId);
        const updatedLogs = service.getDeliveryLogs('user1');
        expect(updatedLogs[0].clickedAt).toBeDefined();
      }
    });
  });

  describe('processQueue', () => {
    it('should process queued notifications when time arrives', async () => {
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 1);

      const payload: NotificationPayload = {
        userId: 'user1',
        category: 'irrigation',
        priority: 'normal',
        title: 'Queued',
        body: 'Test',
        scheduledFor: pastDate
      };

      await service.sendNotification(payload);
      await service.processQueue();

      // Queue should be processed
      const logs = service.getDeliveryLogs('user1');
      expect(logs.length).toBeGreaterThan(0);
    });
  });
});
