/**
 * Weather Notification Integration Service
 * Integrates WeatherAlertService with NotificationService for multi-channel delivery
 * Validates: Requirements 5.4 - Multi-channel notification delivery within 30 minutes
 */

import { WeatherAlertService, WeatherAlert, AlertSeverity } from './weather-alert-service';
import { NotificationService, NotificationPayload, NotificationPriority } from '../notifications/notification-service';

export interface WeatherNotificationConfig {
  enabledChannels?: ('push' | 'sms' | 'voice')[];
  notificationDelayMinutes?: number;
  batchNotifications?: boolean;
}

export interface UserWeatherPreferences {
  userId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  crops?: string[];
  enableWeatherAlerts: boolean;
}

/**
 * Weather Notification Integration Service
 * Maps weather alerts to notifications and delivers through multiple channels
 */
export class WeatherNotificationIntegration {
  private weatherAlertService: WeatherAlertService;
  private notificationService: NotificationService;
  private userPreferences: Map<string, UserWeatherPreferences>;
  private sentAlerts: Map<string, Set<string>>; // userId -> Set of alert IDs

  constructor(
    weatherAlertService: WeatherAlertService,
    notificationService: NotificationService,
    _config: WeatherNotificationConfig = {}
  ) {
    this.weatherAlertService = weatherAlertService;
    this.notificationService = notificationService;
    // Config is available for future use (e.g., batch notifications, delays)
    // Currently using default behavior
    this.userPreferences = new Map();
    this.sentAlerts = new Map();
  }

  /**
   * Check weather alerts for a user and send notifications
   * Validates: Requirements 5.4 - Deliver notifications within 30 minutes
   */
  async checkAndNotifyUser(userId: string): Promise<void> {
    const preferences = this.userPreferences.get(userId);
    
    if (!preferences || !preferences.enableWeatherAlerts) {
      return;
    }

    // Get weather alerts for user's location
    const alerts = await this.weatherAlertService.checkAndGenerateAlerts(preferences.location);

    // Filter alerts relevant to user's crops
    const relevantAlerts = this.filterRelevantAlerts(alerts, preferences);

    // Send notifications for new alerts
    for (const alert of relevantAlerts) {
      await this.sendAlertNotification(userId, alert);
    }
  }

  /**
   * Check weather alerts for all registered users
   */
  async checkAndNotifyAllUsers(): Promise<void> {
    const userIds = Array.from(this.userPreferences.keys());
    
    for (const userId of userIds) {
      try {
        await this.checkAndNotifyUser(userId);
      } catch (error) {
        console.error(`Failed to check alerts for user ${userId}:`, error);
      }
    }
  }

  /**
   * Send notification for a weather alert
   * Maps alert severity to notification priority
   */
  private async sendAlertNotification(
    userId: string,
    alert: WeatherAlert
  ): Promise<void> {
    // Check if alert already sent to this user
    if (this.isAlertSent(userId, alert.id)) {
      return;
    }

    // Map alert severity to notification priority
    const priority = this.mapSeverityToPriority(alert.severity);

    // Format notification payload
    const payload = this.formatNotificationPayload(userId, alert, priority);

    // Send notification
    await this.notificationService.sendNotification(payload);

    // Mark alert as sent
    this.markAlertSent(userId, alert.id);
  }

  /**
   * Map alert severity to notification priority
   * Critical alerts -> critical priority (all channels)
   * Warning alerts -> high priority
   * Info alerts -> normal priority
   */
  private mapSeverityToPriority(severity: AlertSeverity): NotificationPriority {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'warning':
        return 'high';
      case 'info':
        return 'normal';
      default:
        return 'normal';
    }
  }

  /**
   * Format weather alert as notification payload
   * Creates appropriate messages for different channels
   */
  private formatNotificationPayload(
    userId: string,
    alert: WeatherAlert,
    priority: NotificationPriority
  ): NotificationPayload {
    return {
      userId,
      category: 'weather',
      priority,
      title: alert.title,
      body: this.formatNotificationBody(alert),
      data: {
        alertId: alert.id,
        alertType: alert.type,
        severity: alert.severity,
        location: alert.location,
        advisories: alert.advisories,
        metadata: alert.metadata
      },
      actionUrl: `/weather/alerts/${alert.id}`,
      expiresAt: alert.validUntil
    };
  }

  /**
   * Format notification body for different channels
   * SMS/Voice: Concise message with key information
   * Push: Detailed message with advisories
   */
  private formatNotificationBody(alert: WeatherAlert): string {
    // Base message with description
    let body = alert.description;

    // Add top 3 advisories for push notifications
    if (alert.advisories.length > 0) {
      body += '\n\nRecommended actions:';
      const topAdvisories = alert.advisories.slice(0, 3);
      topAdvisories.forEach((advisory, index) => {
        body += `\n${index + 1}. ${advisory}`;
      });
      
      if (alert.advisories.length > 3) {
        body += `\n... and ${alert.advisories.length - 3} more`;
      }
    }

    return body;
  }

  /**
   * Format concise message for SMS/Voice channels
   */
  formatConciseMessage(alert: WeatherAlert): string {
    let message = `${alert.title}: ${alert.description}`;
    
    // Add most critical advisory
    if (alert.advisories.length > 0) {
      message += ` Action: ${alert.advisories[0]}`;
    }
    
    return message;
  }

  /**
   * Filter alerts relevant to user's crops
   */
  private filterRelevantAlerts(
    alerts: WeatherAlert[],
    preferences: UserWeatherPreferences
  ): WeatherAlert[] {
    if (!preferences.crops || preferences.crops.length === 0) {
      return alerts; // Return all alerts if no crop preferences
    }

    return alerts.filter(alert => {
      // If alert doesn't specify affected crops, it's relevant to all
      if (!alert.metadata.affectedCrops || alert.metadata.affectedCrops.length === 0) {
        return true;
      }

      // Check if any of user's crops are affected
      const affectedCrops = alert.metadata.affectedCrops.map(c => c.toLowerCase());
      return preferences.crops!.some(crop => 
        affectedCrops.includes(crop.toLowerCase()) || 
        affectedCrops.includes('all crops')
      );
    });
  }

  /**
   * Check if alert has been sent to user
   */
  private isAlertSent(userId: string, alertId: string): boolean {
    const sentAlerts = this.sentAlerts.get(userId);
    return sentAlerts ? sentAlerts.has(alertId) : false;
  }

  /**
   * Mark alert as sent to user
   */
  private markAlertSent(userId: string, alertId: string): void {
    if (!this.sentAlerts.has(userId)) {
      this.sentAlerts.set(userId, new Set());
    }
    this.sentAlerts.get(userId)!.add(alertId);
  }

  /**
   * Register user weather preferences
   */
  registerUser(preferences: UserWeatherPreferences): void {
    this.userPreferences.set(preferences.userId, preferences);
  }

  /**
   * Update user weather preferences
   */
  updateUserPreferences(userId: string, updates: Partial<UserWeatherPreferences>): void {
    const existing = this.userPreferences.get(userId);
    if (existing) {
      this.userPreferences.set(userId, { ...existing, ...updates });
    }
  }

  /**
   * Unregister user from weather notifications
   */
  unregisterUser(userId: string): void {
    this.userPreferences.delete(userId);
    this.sentAlerts.delete(userId);
  }

  /**
   * Get user preferences
   */
  getUserPreferences(userId: string): UserWeatherPreferences | undefined {
    return this.userPreferences.get(userId);
  }

  /**
   * Get all registered users
   */
  getRegisteredUsers(): string[] {
    return Array.from(this.userPreferences.keys());
  }

  /**
   * Clear sent alerts history (for testing or periodic cleanup)
   */
  clearSentAlerts(userId?: string): void {
    if (userId) {
      this.sentAlerts.delete(userId);
    } else {
      this.sentAlerts.clear();
    }
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalUsers: number;
    usersWithAlerts: number;
    totalAlertsSent: number;
  } {
    let totalAlertsSent = 0;
    for (const alerts of this.sentAlerts.values()) {
      totalAlertsSent += alerts.size;
    }

    return {
      totalUsers: this.userPreferences.size,
      usersWithAlerts: this.sentAlerts.size,
      totalAlertsSent
    };
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.userPreferences.clear();
    this.sentAlerts.clear();
  }
}

/**
 * Create weather notification integration instance
 */
export function createWeatherNotificationIntegration(
  weatherAlertService: WeatherAlertService,
  notificationService: NotificationService,
  config?: WeatherNotificationConfig
): WeatherNotificationIntegration {
  return new WeatherNotificationIntegration(
    weatherAlertService,
    notificationService,
    config
  );
}
