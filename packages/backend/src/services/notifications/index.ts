/**
 * Notifications Module
 * Multi-channel notification delivery and irrigation reminder system
 */

export {
  NotificationService,
  NotificationChannel,
  NotificationPriority,
  NotificationCategory,
  NotificationPreferences,
  NotificationPayload,
  NotificationResult,
  NotificationDeliveryLog
} from './notification-service';

export {
  IrrigationReminderService,
  ReminderConfig,
  ReminderSchedule
} from './irrigation-reminder-service';
