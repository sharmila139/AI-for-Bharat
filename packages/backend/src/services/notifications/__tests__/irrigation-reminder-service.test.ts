/**
 * Unit tests for IrrigationReminderService
 */

import { IrrigationReminderService, ReminderConfig } from '../irrigation-reminder-service';
import { NotificationService } from '../notification-service';
import { IrrigationSchedule, IrrigationEvent, WeatherForecast } from '../../agriculture/irrigation-schedule';

describe('IrrigationReminderService', () => {
  let reminderService: IrrigationReminderService;
  let notificationService: NotificationService;

  beforeEach(() => {
    notificationService = new NotificationService();
    reminderService = new IrrigationReminderService(notificationService);
  });

  afterEach(() => {
    reminderService.clear();
    notificationService.clear();
  });

  const createMockSchedule = (): IrrigationSchedule => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const events: IrrigationEvent[] = [
      {
        id: 'IRR-1',
        scheduledDate: tomorrow,
        amount: 50,
        duration: 120,
        method: 'drip',
        status: 'scheduled',
        reason: 'Regular irrigation'
      },
      {
        id: 'IRR-2',
        scheduledDate: dayAfter,
        amount: 50,
        duration: 120,
        method: 'drip',
        status: 'scheduled',
        reason: 'Regular irrigation'
      }
    ];

    return {
      cropId: 'crop-123',
      cropName: 'Rice',
      plantingDate: new Date(),
      soilType: 'loamy',
      irrigationType: 'drip',
      landArea: 2,
      events,
      totalWaterRequired: 300,
      totalWaterScheduled: 100,
      efficiency: 90,
      nextIrrigation: events[0],
      recommendations: [],
      generatedAt: new Date(),
      lastUpdated: new Date()
    };
  };

  describe('createReminderConfig', () => {
    it('should create reminder configuration', () => {
      const config: ReminderConfig = {
        userId: 'user1',
        scheduleId: 'crop-123',
        enabled: true,
        advanceNoticeHours: 2,
        reminderChannels: ['push', 'sms'],
        skipOnRainfall: true,
        rainfallThreshold: 10,
        recurringReminders: true
      };

      reminderService.createReminderConfig(config);
      const retrieved = reminderService.getReminderConfig('user1', 'crop-123');

      expect(retrieved).toEqual(config);
    });

    it('should update existing configuration', () => {
      const config: ReminderConfig = {
        userId: 'user1',
        scheduleId: 'crop-123',
        enabled: true,
        advanceNoticeHours: 2,
        reminderChannels: ['push'],
        skipOnRainfall: true,
        rainfallThreshold: 10,
        recurringReminders: true
      };

      reminderService.createReminderConfig(config);
      reminderService.updateReminderConfig('user1', 'crop-123', {
        advanceNoticeHours: 4,
        reminderChannels: ['push', 'sms', 'in-app']
      });

      const updated = reminderService.getReminderConfig('user1', 'crop-123');
      expect(updated?.advanceNoticeHours).toBe(4);
      expect(updated?.reminderChannels).toHaveLength(3);
    });
  });

  describe('scheduleReminders', () => {
    it('should schedule reminders for all upcoming irrigation events', () => {
      const config: ReminderConfig = {
        userId: 'user1',
        scheduleId: 'crop-123',
        enabled: true,
        advanceNoticeHours: 2,
        reminderChannels: ['push'],
        skipOnRainfall: false,
        rainfallThreshold: 10,
        recurringReminders: true
      };

      reminderService.createReminderConfig(config);
      const schedule = createMockSchedule();
      const reminders = reminderService.scheduleReminders('user1', schedule);

      expect(reminders.length).toBe(2);
      expect(reminders[0].status).toBe('pending');
      expect(reminders[0].userId).toBe('user1');
    });

    it('should not schedule reminders if config is disabled', () => {
      const config: ReminderConfig = {
        userId: 'user1',
        scheduleId: 'crop-123',
        enabled: false,
        advanceNoticeHours: 2,
        reminderChannels: ['push'],
        skipOnRainfall: false,
        rainfallThreshold: 10,
        recurringReminders: true
      };

      reminderService.createReminderConfig(config);
      const schedule = createMockSchedule();
      const reminders = reminderService.scheduleReminders('user1', schedule);

      expect(reminders.length).toBe(0);
    });

    it('should skip reminders when rainfall exceeds threshold', () => {
      const config: ReminderConfig = {
        userId: 'user1',
        scheduleId: 'crop-123',
        enabled: true,
        advanceNoticeHours: 2,
        reminderChannels: ['push'],
        skipOnRainfall: true,
        rainfallThreshold: 10,
        recurringReminders: true
      };

      reminderService.createReminderConfig(config);
      const schedule = createMockSchedule();

      // Create weather forecast with heavy rainfall
      const forecast: WeatherForecast[] = [
        {
          date: schedule.events[0].scheduledDate,
          rainfall: 15, // Exceeds threshold
          temperature: { min: 20, max: 30 },
          humidity: 80
        }
      ];

      const reminders = reminderService.scheduleReminders('user1', schedule, forecast);

      expect(reminders[0].status).toBe('skipped');
      expect(reminders[0].skipReason).toContain('Rainfall forecast');
    });

    it('should not skip reminders when rainfall is below threshold', () => {
      const config: ReminderConfig = {
        userId: 'user1',
        scheduleId: 'crop-123',
        enabled: true,
        advanceNoticeHours: 2,
        reminderChannels: ['push'],
        skipOnRainfall: true,
        rainfallThreshold: 10,
        recurringReminders: true
      };

      reminderService.createReminderConfig(config);
      const schedule = createMockSchedule();

      // Create weather forecast with light rainfall
      const forecast: WeatherForecast[] = [
        {
          date: schedule.events[0].scheduledDate,
          rainfall: 5, // Below threshold
          temperature: { min: 20, max: 30 },
          humidity: 80
        }
      ];

      const reminders = reminderService.scheduleReminders('user1', schedule, forecast);

      expect(reminders[0].status).toBe('pending');
      expect(reminders[0].skipReason).toBeUndefined();
    });

    it('should calculate reminder time correctly', () => {
      const config: ReminderConfig = {
        userId: 'user1',
        scheduleId: 'crop-123',
        enabled: true,
        advanceNoticeHours: 3,
        reminderChannels: ['push'],
        skipOnRainfall: false,
        rainfallThreshold: 10,
        recurringReminders: true
      };

      reminderService.createReminderConfig(config);
      const schedule = createMockSchedule();
      const reminders = reminderService.scheduleReminders('user1', schedule);

      const expectedReminderTime = new Date(schedule.events[0].scheduledDate);
      expectedReminderTime.setHours(expectedReminderTime.getHours() - 3);

      expect(reminders[0].reminderTime.getTime()).toBe(expectedReminderTime.getTime());
    });
  });

  describe('processPendingReminders', () => {
    it('should send due reminders', async () => {
      // Create a schedule with an event happening in 30 minutes
      const now = new Date();
      const soonDate = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
      
      const schedule = createMockSchedule();
      schedule.events[0].scheduledDate = soonDate;

      const config: ReminderConfig = {
        userId: 'user1',
        scheduleId: 'crop-123',
        enabled: true,
        advanceNoticeHours: 1, // Reminder should be 30 minutes ago (already due)
        reminderChannels: ['push'],
        skipOnRainfall: false,
        rainfallThreshold: 10,
        recurringReminders: true
      };

      reminderService.createReminderConfig(config);
      const reminders = reminderService.scheduleReminders('user1', schedule);

      // Manually set reminder time to past to simulate due reminder
      if (reminders.length > 0) {
        reminders[0].reminderTime = new Date(now.getTime() - 1000); // 1 second ago
      }

      await reminderService.processPendingReminders();

      const history = reminderService.getReminderHistory('user1');
      expect(history.length).toBeGreaterThan(0);
      expect(history.some(h => h.status === 'sent')).toBe(true);
    });
  });

  describe('cancelReminder', () => {
    it('should cancel a specific reminder', () => {
      const config: ReminderConfig = {
        userId: 'user1',
        scheduleId: 'crop-123',
        enabled: true,
        advanceNoticeHours: 2,
        reminderChannels: ['push'],
        skipOnRainfall: false,
        rainfallThreshold: 10,
        recurringReminders: true
      };

      reminderService.createReminderConfig(config);
      const schedule = createMockSchedule();
      const reminders = reminderService.scheduleReminders('user1', schedule);

      reminderService.cancelReminder(reminders[0].reminderId);

      const upcoming = reminderService.getUpcomingReminders('user1');
      const cancelled = upcoming.find(r => r.reminderId === reminders[0].reminderId);
      expect(cancelled).toBeUndefined();
    });

    it('should cancel all reminders for a schedule', () => {
      const config: ReminderConfig = {
        userId: 'user1',
        scheduleId: 'crop-123',
        enabled: true,
        advanceNoticeHours: 2,
        reminderChannels: ['push'],
        skipOnRainfall: false,
        rainfallThreshold: 10,
        recurringReminders: true
      };

      reminderService.createReminderConfig(config);
      const schedule = createMockSchedule();
      reminderService.scheduleReminders('user1', schedule);

      reminderService.cancelScheduleReminders('user1', 'crop-123');

      const upcoming = reminderService.getUpcomingReminders('user1');
      expect(upcoming.length).toBe(0);
    });
  });

  describe('getUpcomingReminders', () => {
    it('should return reminders within specified days', () => {
      const config: ReminderConfig = {
        userId: 'user1',
        scheduleId: 'crop-123',
        enabled: true,
        advanceNoticeHours: 2,
        reminderChannels: ['push'],
        skipOnRainfall: false,
        rainfallThreshold: 10,
        recurringReminders: true
      };

      reminderService.createReminderConfig(config);
      const schedule = createMockSchedule();
      reminderService.scheduleReminders('user1', schedule);

      const upcoming = reminderService.getUpcomingReminders('user1', 7);
      expect(upcoming.length).toBeGreaterThan(0);
      expect(upcoming[0].status).toBe('pending');
    });
  });

  describe('getReminderStats', () => {
    it('should calculate reminder statistics', async () => {
      const config: ReminderConfig = {
        userId: 'user1',
        scheduleId: 'crop-123',
        enabled: true,
        advanceNoticeHours: 0,
        reminderChannels: ['push'],
        skipOnRainfall: true,
        rainfallThreshold: 10,
        recurringReminders: true
      };

      reminderService.createReminderConfig(config);
      const schedule = createMockSchedule();

      // Create forecast that will skip first reminder only
      const forecast: WeatherForecast[] = [
        {
          date: schedule.events[0].scheduledDate,
          rainfall: 15, // Exceeds threshold
          temperature: { min: 20, max: 30 },
          humidity: 80
        },
        {
          date: schedule.events[1].scheduledDate,
          rainfall: 5, // Below threshold
          temperature: { min: 20, max: 30 },
          humidity: 80
        }
      ];

      reminderService.scheduleReminders('user1', schedule, forecast);

      const stats = reminderService.getReminderStats('user1');
      expect(stats.totalScheduled).toBe(2);
      expect(stats.skipped).toBeGreaterThanOrEqual(1);
      expect(stats.skipRate).toBeGreaterThan(0);
    });
  });

  describe('updateRemindersForSchedule', () => {
    it('should cancel old reminders and create new ones', () => {
      const config: ReminderConfig = {
        userId: 'user1',
        scheduleId: 'crop-123',
        enabled: true,
        advanceNoticeHours: 2,
        reminderChannels: ['push'],
        skipOnRainfall: false,
        rainfallThreshold: 10,
        recurringReminders: true
      };

      reminderService.createReminderConfig(config);
      const schedule = createMockSchedule();
      reminderService.scheduleReminders('user1', schedule);

      const initialCount = reminderService.getUpcomingReminders('user1').length;

      // Update schedule
      reminderService.updateRemindersForSchedule('user1', schedule);

      const updatedCount = reminderService.getUpcomingReminders('user1').length;
      expect(updatedCount).toBe(initialCount);
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = reminderService.getDefaultConfig('user1', 'crop-123');

      expect(config.enabled).toBe(true);
      expect(config.advanceNoticeHours).toBe(2);
      expect(config.skipOnRainfall).toBe(true);
      expect(config.rainfallThreshold).toBe(10);
    });
  });
});
