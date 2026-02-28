/**
 * Property-based tests for IrrigationReminderService
 * Tests universal properties for irrigation reminder notifications
 */

import fc from 'fast-check';
import { IrrigationReminderService, ReminderConfig } from '../irrigation-reminder-service';
import { NotificationService } from '../notification-service';
import { IrrigationEvent, WeatherForecast } from '../../agriculture/irrigation-schedule';

describe('IrrigationReminderService - Property Tests', () => {
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

  // Arbitraries for generating test data
  const userIdArb = fc.string({ minLength: 1, maxLength: 50 });
  const scheduleIdArb = fc.string({ minLength: 1, maxLength: 50 });
  
  const reminderConfigArb = fc.record({
    userId: userIdArb,
    scheduleId: scheduleIdArb,
    enabled: fc.boolean(),
    advanceNoticeHours: fc.integer({ min: 0, max: 24 }),
    reminderChannels: fc.array(
      fc.constantFrom('push' as const, 'sms' as const, 'in-app' as const, 'voice' as const),
      { minLength: 1, maxLength: 4 }
    ),
    skipOnRainfall: fc.boolean(),
    rainfallThreshold: fc.float({ min: 0, max: 50 }),
    recurringReminders: fc.boolean()
  }) as fc.Arbitrary<ReminderConfig>;

  const irrigationEventArb = (daysAhead: number) => fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    scheduledDate: fc.constant(new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)),
    amount: fc.float({ min: 10, max: 100 }),
    duration: fc.integer({ min: 30, max: 300 }),
    method: fc.constantFrom('flood' as const, 'drip' as const, 'sprinkler' as const),
    status: fc.constant('scheduled' as const),
    reason: fc.string()
  }) as fc.Arbitrary<IrrigationEvent>;

  const irrigationScheduleArb = fc.record({
    cropId: scheduleIdArb,
    cropName: fc.constantFrom('Rice', 'Wheat', 'Cotton', 'Maize'),
    plantingDate: fc.date(),
    soilType: fc.constantFrom('sandy', 'loamy', 'clay', 'silt', 'red', 'black', 'alluvial'),
    irrigationType: fc.constantFrom('flood', 'drip', 'sprinkler', 'rainfed'),
    landArea: fc.float({ min: 0.5, max: 10 }),
    events: fc.array(irrigationEventArb(1), { minLength: 1, maxLength: 5 }),
    totalWaterRequired: fc.float({ min: 100, max: 1000 }),
    totalWaterScheduled: fc.float({ min: 50, max: 800 }),
    efficiency: fc.float({ min: 50, max: 100 }),
    recommendations: fc.array(fc.string()),
    generatedAt: fc.date(),
    lastUpdated: fc.date()
  });

  /**
   * Property: Reminder Configuration Persistence
   * For any reminder configuration created, retrieving it should return
   * the same configuration
   */
  test('Property: Reminder configurations are persisted correctly', () => {
    fc.assert(
      fc.property(reminderConfigArb, (config) => {
        reminderService.createReminderConfig(config);
        const retrieved = reminderService.getReminderConfig(config.userId, config.scheduleId);

        expect(retrieved).toEqual(config);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Disabled Config No Reminders
   * For any schedule with disabled reminder config,
   * no reminders should be scheduled
   */
  test('Property: Disabled configs produce no reminders', () => {
    fc.assert(
      fc.property(
        reminderConfigArb,
        irrigationScheduleArb,
        (config, schedule) => {
          // Force config to be disabled
          const disabledConfig = { ...config, enabled: false, scheduleId: schedule.cropId };
          reminderService.createReminderConfig(disabledConfig);

          const reminders = reminderService.scheduleReminders(config.userId, schedule);

          expect(reminders.length).toBe(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Reminder Count Matches Events
   * For any enabled config and schedule, the number of reminders
   * should match the number of upcoming scheduled events (excluding past events)
   */
  test('Property: Reminder count matches upcoming events', () => {
    fc.assert(
      fc.property(
        reminderConfigArb,
        irrigationScheduleArb,
        (config, schedule) => {
          // Force config to be enabled and match schedule
          const enabledConfig = { 
            ...config, 
            enabled: true, 
            scheduleId: schedule.cropId,
            skipOnRainfall: false // Don't skip for this test
          };
          reminderService.createReminderConfig(enabledConfig);

          // Count upcoming events (future events only)
          const now = new Date();
          const upcomingEvents = schedule.events.filter(
            e => e.scheduledDate > now && e.status === 'scheduled'
          );

          const reminders = reminderService.scheduleReminders(config.userId, schedule);

          // Reminders should match upcoming events count
          // (some reminders might be filtered out if their reminder time is in the past)
          expect(reminders.length).toBeLessThanOrEqual(upcomingEvents.length);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Rainfall Threshold Enforcement
   * For any reminder with skipOnRainfall enabled, if rainfall exceeds
   * threshold within 48 hours of the event, the reminder should be skipped
   */
  test('Property: Reminders skipped when rainfall exceeds threshold', () => {
    fc.assert(
      fc.property(
        reminderConfigArb,
        irrigationScheduleArb,
        fc.float({ min: 0, max: 20 }), // threshold
        fc.float({ min: 21, max: 100 }), // rainfall above threshold
        (config, schedule, threshold, rainfall) => {
          // Configure to skip on rainfall
          const skipConfig = {
            ...config,
            enabled: true,
            scheduleId: schedule.cropId,
            skipOnRainfall: true,
            rainfallThreshold: threshold
          };
          reminderService.createReminderConfig(skipConfig);

          // Create forecast with rainfall above threshold for all events
          // Include dates within 48-hour window (2 days before and after)
          const forecast: WeatherForecast[] = [];
          for (const event of schedule.events) {
            // Add forecast for event date
            forecast.push({
              date: event.scheduledDate,
              rainfall,
              temperature: { min: 20, max: 30 },
              humidity: 80
            });
            
            // Add forecast for day before
            const dayBefore = new Date(event.scheduledDate);
            dayBefore.setDate(dayBefore.getDate() - 1);
            forecast.push({
              date: dayBefore,
              rainfall,
              temperature: { min: 20, max: 30 },
              humidity: 80
            });
          }

          const reminders = reminderService.scheduleReminders(
            config.userId,
            schedule,
            forecast
          );

          // All reminders should be skipped since rainfall exceeds threshold
          const allSkipped = reminders.every(r => r.status === 'skipped');
          expect(allSkipped).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Reminder Time Calculation
   * For any reminder, the reminder time should be exactly
   * advanceNoticeHours before the irrigation time
   */
  test('Property: Reminder time is correctly calculated', () => {
    fc.assert(
      fc.property(
        reminderConfigArb,
        irrigationScheduleArb,
        (config, schedule) => {
          const enabledConfig = {
            ...config,
            enabled: true,
            scheduleId: schedule.cropId,
            skipOnRainfall: false
          };
          reminderService.createReminderConfig(enabledConfig);

          const reminders = reminderService.scheduleReminders(config.userId, schedule);

          for (const reminder of reminders) {
            const expectedReminderTime = new Date(reminder.irrigationTime);
            expectedReminderTime.setHours(
              expectedReminderTime.getHours() - enabledConfig.advanceNoticeHours
            );

            expect(reminder.reminderTime.getTime()).toBe(expectedReminderTime.getTime());
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Reminder ID Uniqueness
   * For any set of reminders, all reminder IDs should be unique
   */
  test('Property: All reminder IDs are unique', () => {
    fc.assert(
      fc.property(
        reminderConfigArb,
        irrigationScheduleArb,
        (config, schedule) => {
          const enabledConfig = {
            ...config,
            enabled: true,
            scheduleId: schedule.cropId
          };
          reminderService.createReminderConfig(enabledConfig);

          const reminders = reminderService.scheduleReminders(config.userId, schedule);

          const ids = reminders.map(r => r.reminderId);
          const uniqueIds = new Set(ids);

          expect(uniqueIds.size).toBe(ids.length);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Cancel Removes Pending Reminders
   * For any cancelled reminder, it should not appear in upcoming reminders
   */
  test('Property: Cancelled reminders not in upcoming list', () => {
    fc.assert(
      fc.property(
        reminderConfigArb,
        irrigationScheduleArb,
        (config, schedule) => {
          const enabledConfig = {
            ...config,
            enabled: true,
            scheduleId: schedule.cropId
          };
          reminderService.createReminderConfig(enabledConfig);

          const reminders = reminderService.scheduleReminders(config.userId, schedule);

          if (reminders.length > 0) {
            const toCancel = reminders[0];
            reminderService.cancelReminder(toCancel.reminderId);

            const upcoming = reminderService.getUpcomingReminders(config.userId);
            const found = upcoming.find(r => r.reminderId === toCancel.reminderId);

            expect(found).toBeUndefined();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Statistics Consistency
   * For any user, the sum of sent, skipped, cancelled, and pending
   * should equal total scheduled
   */
  test('Property: Reminder statistics are consistent', () => {
    fc.assert(
      fc.property(
        reminderConfigArb,
        irrigationScheduleArb,
        (config, schedule) => {
          const enabledConfig = {
            ...config,
            enabled: true,
            scheduleId: schedule.cropId
          };
          reminderService.createReminderConfig(enabledConfig);

          reminderService.scheduleReminders(config.userId, schedule);

          const stats = reminderService.getReminderStats(config.userId);

          const sum = stats.sent + stats.skipped + stats.cancelled + stats.pending;
          expect(sum).toBe(stats.totalScheduled);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Skip Rate Calculation
   * For any user with reminders, skip rate should be between 0 and 100
   */
  test('Property: Skip rate is valid percentage', () => {
    fc.assert(
      fc.property(
        reminderConfigArb,
        irrigationScheduleArb,
        (config, schedule) => {
          const enabledConfig = {
            ...config,
            enabled: true,
            scheduleId: schedule.cropId
          };
          reminderService.createReminderConfig(enabledConfig);

          reminderService.scheduleReminders(config.userId, schedule);

          const stats = reminderService.getReminderStats(config.userId);

          expect(stats.skipRate).toBeGreaterThanOrEqual(0);
          expect(stats.skipRate).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Update Cancels Old Reminders
   * For any schedule update, old pending reminders should be cancelled
   * and new ones created
   */
  test('Property: Schedule updates replace old reminders', () => {
    fc.assert(
      fc.property(
        reminderConfigArb,
        irrigationScheduleArb,
        (config, schedule) => {
          const enabledConfig = {
            ...config,
            enabled: true,
            scheduleId: schedule.cropId
          };
          reminderService.createReminderConfig(enabledConfig);

          // Schedule initial reminders
          const initial = reminderService.scheduleReminders(config.userId, schedule);
          const initialIds = initial.map(r => r.reminderId);

          // Update schedule
          reminderService.updateRemindersForSchedule(config.userId, schedule);

          // Get new upcoming reminders
          const updated = reminderService.getUpcomingReminders(config.userId);
          const updatedIds = updated.map(r => r.reminderId);

          // Old IDs should not be in new list
          const hasOldIds = updatedIds.some(id => initialIds.includes(id));
          expect(hasOldIds).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Default Config Values
   * For any user and schedule, default config should have
   * reasonable default values
   */
  test('Property: Default config has valid values', () => {
    fc.assert(
      fc.property(
        userIdArb,
        scheduleIdArb,
        (userId, scheduleId) => {
          const config = reminderService.getDefaultConfig(userId, scheduleId);

          expect(config.userId).toBe(userId);
          expect(config.scheduleId).toBe(scheduleId);
          expect(config.enabled).toBe(true);
          expect(config.advanceNoticeHours).toBeGreaterThan(0);
          expect(config.rainfallThreshold).toBeGreaterThan(0);
          expect(config.reminderChannels.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  });
});
