/**
 * Irrigation Reminder Notification Service
 * Sends reminders to farmers when irrigation is due based on their schedules
 * Integrates with weather data to skip reminders when rainfall is expected
 */

import { NotificationService, NotificationPayload } from './notification-service';
import { 
  IrrigationSchedule, 
  IrrigationEvent,
  WeatherForecast 
} from '../agriculture/irrigation-schedule';

export interface ReminderConfig {
  userId: string;
  scheduleId: string;
  enabled: boolean;
  advanceNoticeHours: number; // How many hours before irrigation to send reminder
  reminderChannels: Array<'push' | 'sms' | 'in-app' | 'voice'>;
  skipOnRainfall: boolean; // Skip reminder if rainfall expected
  rainfallThreshold: number; // mm of rainfall to skip reminder
  recurringReminders: boolean; // Send reminders for all scheduled events
}

export interface ReminderSchedule {
  reminderId: string;
  userId: string;
  scheduleId: string;
  eventId: string;
  reminderTime: Date;
  irrigationTime: Date;
  status: 'pending' | 'sent' | 'skipped' | 'cancelled';
  skipReason?: string;
  sentAt?: Date;
  notificationId?: string;
}

export class IrrigationReminderService {
  private notificationService: NotificationService;
  private reminderConfigs: Map<string, ReminderConfig> = new Map();
  private reminderSchedules: ReminderSchedule[] = [];

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  /**
   * Create reminder configuration for a user's irrigation schedule
   */
  createReminderConfig(config: ReminderConfig): void {
    const key = `${config.userId}-${config.scheduleId}`;
    this.reminderConfigs.set(key, config);
  }

  /**
   * Get reminder configuration
   */
  getReminderConfig(userId: string, scheduleId: string): ReminderConfig | undefined {
    const key = `${userId}-${scheduleId}`;
    return this.reminderConfigs.get(key);
  }

  /**
   * Update reminder configuration
   */
  updateReminderConfig(userId: string, scheduleId: string, updates: Partial<ReminderConfig>): void {
    const key = `${userId}-${scheduleId}`;
    const existing = this.reminderConfigs.get(key);
    
    if (existing) {
      this.reminderConfigs.set(key, { ...existing, ...updates });
    }
  }

  /**
   * Schedule reminders for all irrigation events in a schedule
   */
  scheduleReminders(
    userId: string,
    schedule: IrrigationSchedule,
    weatherForecast?: WeatherForecast[]
  ): ReminderSchedule[] {
    const config = this.getReminderConfig(userId, schedule.cropId);
    
    if (!config || !config.enabled) {
      return [];
    }

    const reminders: ReminderSchedule[] = [];
    const now = new Date();

    // Get upcoming irrigation events
    const upcomingEvents = schedule.events.filter(
      event => event.scheduledDate > now && event.status === 'scheduled'
    );

    for (const event of upcomingEvents) {
      // Calculate reminder time
      const reminderTime = new Date(event.scheduledDate);
      reminderTime.setHours(reminderTime.getHours() - config.advanceNoticeHours);

      // Skip if reminder time is in the past
      if (reminderTime <= now) {
        continue;
      }

      // Check if should skip due to rainfall
      let skipReason: string | undefined;
      if (config.skipOnRainfall && weatherForecast) {
        const shouldSkip = this.shouldSkipDueToRainfall(
          event,
          weatherForecast,
          config.rainfallThreshold
        );
        
        if (shouldSkip.skip) {
          skipReason = shouldSkip.reason;
        }
      }

      const reminder: ReminderSchedule = {
        reminderId: this.generateReminderId(),
        userId,
        scheduleId: schedule.cropId,
        eventId: event.id,
        reminderTime,
        irrigationTime: event.scheduledDate,
        status: skipReason ? 'skipped' : 'pending',
        skipReason
      };

      reminders.push(reminder);
      this.reminderSchedules.push(reminder);
    }

    return reminders;
  }

  /**
   * Check if reminder should be skipped due to rainfall forecast
   * Weather-aware: Skip if rainfall exceeds threshold within 48 hours
   */
  private shouldSkipDueToRainfall(
    event: IrrigationEvent,
    forecast: WeatherForecast[],
    threshold: number
  ): { skip: boolean; reason?: string } {
    const eventDate = event.scheduledDate;
    const twoDaysBefore = new Date(eventDate);
    twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
    const twoDaysAfter = new Date(eventDate);
    twoDaysAfter.setDate(twoDaysAfter.getDate() + 2);

    // Calculate total rainfall in 48-hour window
    const relevantForecasts = forecast.filter(
      f => f.date >= twoDaysBefore && f.date <= twoDaysAfter
    );

    const totalRainfall = relevantForecasts.reduce((sum, f) => sum + f.rainfall, 0);

    if (totalRainfall >= threshold) {
      return {
        skip: true,
        reason: `Rainfall forecast: ${totalRainfall.toFixed(1)}mm expected. Irrigation not needed.`
      };
    }

    return { skip: false };
  }

  /**
   * Process pending reminders and send notifications
   */
  async processPendingReminders(): Promise<void> {
    const now = new Date();
    
    // Find reminders that are due
    const dueReminders = this.reminderSchedules.filter(
      reminder => 
        reminder.status === 'pending' && 
        reminder.reminderTime <= now
    );

    for (const reminder of dueReminders) {
      await this.sendReminder(reminder);
    }
  }

  /**
   * Send irrigation reminder notification
   */
  private async sendReminder(reminder: ReminderSchedule): Promise<void> {
    const config = this.getReminderConfig(reminder.userId, reminder.scheduleId);
    
    if (!config) {
      reminder.status = 'cancelled';
      return;
    }

    // Create notification payload
    const hoursUntil = Math.round(
      (reminder.irrigationTime.getTime() - new Date().getTime()) / (1000 * 60 * 60)
    );

    const payload: NotificationPayload = {
      userId: reminder.userId,
      category: 'irrigation',
      priority: hoursUntil <= 1 ? 'high' : 'normal',
      title: '💧 Irrigation Reminder',
      body: this.createReminderMessage(reminder, hoursUntil),
      data: {
        scheduleId: reminder.scheduleId,
        eventId: reminder.eventId,
        irrigationTime: reminder.irrigationTime.toISOString(),
        type: 'irrigation_reminder'
      },
      actionUrl: `/agriculture/irrigation/${reminder.scheduleId}`
    };

    try {
      const result = await this.notificationService.sendNotification(payload);
      
      reminder.status = 'sent';
      reminder.sentAt = new Date();
      reminder.notificationId = result.id;
    } catch (error) {
      console.error('Failed to send irrigation reminder:', error);
      reminder.status = 'cancelled';
    }
  }

  /**
   * Create reminder message based on time until irrigation
   */
  private createReminderMessage(_reminder: ReminderSchedule, hoursUntil: number): string {
    const timeText = hoursUntil === 0 
      ? 'now' 
      : hoursUntil === 1 
        ? 'in 1 hour' 
        : `in ${hoursUntil} hours`;

    return `Your crop needs irrigation ${timeText}. Make sure your irrigation system is ready.`;
  }

  /**
   * Cancel reminder for a specific irrigation event
   */
  cancelReminder(reminderId: string): void {
    const reminder = this.reminderSchedules.find(r => r.reminderId === reminderId);
    
    if (reminder && reminder.status === 'pending') {
      reminder.status = 'cancelled';
    }
  }

  /**
   * Cancel all reminders for a schedule
   */
  cancelScheduleReminders(userId: string, scheduleId: string): void {
    const reminders = this.reminderSchedules.filter(
      r => r.userId === userId && r.scheduleId === scheduleId && r.status === 'pending'
    );

    for (const reminder of reminders) {
      reminder.status = 'cancelled';
    }
  }

  /**
   * Get upcoming reminders for a user
   */
  getUpcomingReminders(userId: string, days: number = 7): ReminderSchedule[] {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.reminderSchedules.filter(
      r => 
        r.userId === userId &&
        r.status === 'pending' &&
        r.reminderTime >= now &&
        r.reminderTime <= futureDate
    );
  }

  /**
   * Get reminder history for a user
   */
  getReminderHistory(userId: string, limit: number = 50): ReminderSchedule[] {
    return this.reminderSchedules
      .filter(r => r.userId === userId && r.status !== 'pending')
      .sort((a, b) => {
        const aTime = a.sentAt || a.reminderTime;
        const bTime = b.sentAt || b.reminderTime;
        return bTime.getTime() - aTime.getTime();
      })
      .slice(0, limit);
  }

  /**
   * Get reminder statistics for a user
   */
  getReminderStats(userId: string): {
    totalScheduled: number;
    sent: number;
    skipped: number;
    cancelled: number;
    pending: number;
    skipRate: number;
  } {
    const userReminders = this.reminderSchedules.filter(r => r.userId === userId);
    
    const sent = userReminders.filter(r => r.status === 'sent').length;
    const skipped = userReminders.filter(r => r.status === 'skipped').length;
    const cancelled = userReminders.filter(r => r.status === 'cancelled').length;
    const pending = userReminders.filter(r => r.status === 'pending').length;
    const total = userReminders.length;

    return {
      totalScheduled: total,
      sent,
      skipped,
      cancelled,
      pending,
      skipRate: total > 0 ? (skipped / total) * 100 : 0
    };
  }

  /**
   * Update reminders when schedule changes
   */
  updateRemindersForSchedule(
    userId: string,
    schedule: IrrigationSchedule,
    weatherForecast?: WeatherForecast[]
  ): void {
    // Cancel existing pending reminders
    this.cancelScheduleReminders(userId, schedule.cropId);

    // Schedule new reminders
    this.scheduleReminders(userId, schedule, weatherForecast);
  }

  /**
   * Get default reminder configuration
   */
  getDefaultConfig(userId: string, scheduleId: string): ReminderConfig {
    return {
      userId,
      scheduleId,
      enabled: true,
      advanceNoticeHours: 2, // 2 hours before irrigation
      reminderChannels: ['push', 'sms', 'in-app'],
      skipOnRainfall: true,
      rainfallThreshold: 10, // 10mm threshold as per requirements
      recurringReminders: true
    };
  }

  /**
   * Generate unique reminder ID
   */
  private generateReminderId(): string {
    return `REM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.reminderConfigs.clear();
    this.reminderSchedules = [];
  }
}
