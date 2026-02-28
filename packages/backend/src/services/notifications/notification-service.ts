/**
 * Notification Service
 * Multi-channel notification delivery system for push, SMS, and in-app notifications
 */

export type NotificationChannel = 'push' | 'sms' | 'in-app' | 'voice';
export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';
export type NotificationCategory = 
  | 'irrigation' 
  | 'weather' 
  | 'market' 
  | 'health' 
  | 'education' 
  | 'infrastructure'
  | 'system';

export interface NotificationPreferences {
  userId: string;
  enabledChannels: NotificationChannel[];
  categoryPreferences: Record<NotificationCategory, {
    enabled: boolean;
    channels: NotificationChannel[];
  }>;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
  language: string;
}

export interface NotificationPayload {
  userId: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  data?: Record<string, any>;
  actionUrl?: string;
  scheduledFor?: Date;
  expiresAt?: Date;
}

export interface NotificationResult {
  id: string;
  userId: string;
  channels: NotificationChannel[];
  deliveryStatus: Record<NotificationChannel, {
    sent: boolean;
    timestamp: Date;
    error?: string;
  }>;
  createdAt: Date;
}

export interface NotificationDeliveryLog {
  notificationId: string;
  userId: string;
  channel: NotificationChannel;
  sent: boolean;
  deliveredAt?: Date;
  readAt?: Date;
  clickedAt?: Date;
  error?: string;
}

export class NotificationService {
  private preferences: Map<string, NotificationPreferences> = new Map();
  private deliveryLogs: NotificationDeliveryLog[] = [];
  private notificationQueue: Array<{ payload: NotificationPayload; scheduledFor: Date }> = [];

  /**
   * Send notification through appropriate channels
   */
  async sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
    const preferences = this.getUserPreferences(payload.userId);
    
    // Determine which channels to use
    const channels = this.selectChannels(payload, preferences);
    
    // Check if notification should be sent now or queued
    if (payload.scheduledFor && payload.scheduledFor > new Date()) {
      this.queueNotification(payload);
      return this.createPendingResult(payload, channels);
    }
    
    // Check quiet hours for non-critical notifications
    if (payload.priority !== 'critical' && this.isQuietHours(preferences)) {
      this.queueNotification(payload);
      return this.createPendingResult(payload, channels);
    }
    
    // Send through each channel
    const deliveryStatus: Record<NotificationChannel, any> = {} as any;
    
    for (const channel of channels) {
      try {
        await this.deliverToChannel(channel, payload, preferences);
        deliveryStatus[channel] = {
          sent: true,
          timestamp: new Date()
        };
        
        // Log delivery
        this.logDelivery({
          notificationId: this.generateId(),
          userId: payload.userId,
          channel,
          sent: true,
          deliveredAt: new Date()
        });
      } catch (error) {
        deliveryStatus[channel] = {
          sent: false,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        // Log failed delivery
        this.logDelivery({
          notificationId: this.generateId(),
          userId: payload.userId,
          channel,
          sent: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return {
      id: this.generateId(),
      userId: payload.userId,
      channels,
      deliveryStatus,
      createdAt: new Date()
    };
  }

  /**
   * Select appropriate channels based on priority and preferences
   * Property 38: Critical notifications use all available channels
   */
  private selectChannels(
    payload: NotificationPayload,
    preferences: NotificationPreferences
  ): NotificationChannel[] {
    // Critical priority: use all available channels regardless of preferences
    if (payload.priority === 'critical') {
      return ['push', 'sms', 'in-app'];
    }
    
    // Check category preferences
    const categoryPref = preferences.categoryPreferences[payload.category];
    if (!categoryPref || !categoryPref.enabled) {
      return []; // Category disabled
    }
    
    // Use channels specified in category preferences
    return categoryPref.channels.filter(channel => 
      preferences.enabledChannels.includes(channel)
    );
  }

  /**
   * Check if current time is within quiet hours
   * Property 39: Respect quiet hours for non-critical notifications
   */
  private isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours || !preferences.quietHours.enabled) {
      return false;
    }
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { start, end } = preferences.quietHours;
    
    // Handle quiet hours that span midnight
    if (start > end) {
      return currentTime >= start || currentTime < end;
    }
    
    return currentTime >= start && currentTime < end;
  }

  /**
   * Queue notification for later delivery
   */
  private queueNotification(payload: NotificationPayload): void {
    const scheduledFor = payload.scheduledFor || this.getQuietHoursEndTime(payload.userId);
    this.notificationQueue.push({ payload, scheduledFor });
  }

  /**
   * Get the end time of quiet hours for a user
   */
  private getQuietHoursEndTime(userId: string): Date {
    const preferences = this.getUserPreferences(userId);
    
    if (!preferences.quietHours || !preferences.quietHours.enabled) {
      return new Date(); // Send immediately if no quiet hours
    }
    
    const now = new Date();
    const [endHour, endMinute] = preferences.quietHours.end.split(':').map(Number);
    
    const endTime = new Date(now);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    // If end time is before current time, it's tomorrow
    if (endTime <= now) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    return endTime;
  }

  /**
   * Deliver notification to specific channel
   */
  private async deliverToChannel(
    channel: NotificationChannel,
    payload: NotificationPayload,
    preferences: NotificationPreferences
  ): Promise<void> {
    // Translate content to user's language
    const translatedPayload = this.translateNotification(payload, preferences.language);
    
    switch (channel) {
      case 'push':
        await this.sendPushNotification(translatedPayload);
        break;
      case 'sms':
        await this.sendSMS(translatedPayload);
        break;
      case 'in-app':
        await this.sendInAppNotification(translatedPayload);
        break;
      case 'voice':
        await this.sendVoiceNotification(translatedPayload);
        break;
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(payload: NotificationPayload): Promise<void> {
    // Mock implementation - in production, integrate with FCM/APNS
    console.log(`[PUSH] Sending to user ${payload.userId}: ${payload.title}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate 95% success rate
    if (Math.random() < 0.05) {
      throw new Error('Push notification delivery failed');
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(payload: NotificationPayload): Promise<void> {
    // Mock implementation - in production, integrate with Twilio/AWS SNS
    console.log(`[SMS] Sending to user ${payload.userId}: ${payload.body}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Simulate 95% success rate
    if (Math.random() < 0.05) {
      throw new Error('SMS delivery failed');
    }
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(payload: NotificationPayload): Promise<void> {
    // Mock implementation - in production, store in database
    console.log(`[IN-APP] Storing for user ${payload.userId}: ${payload.title}`);
    
    // In-app notifications are always successful (stored locally)
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * Send voice notification
   */
  private async sendVoiceNotification(payload: NotificationPayload): Promise<void> {
    // Mock implementation - in production, integrate with text-to-speech service
    console.log(`[VOICE] Calling user ${payload.userId}: ${payload.body}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simulate 90% success rate (voice calls are less reliable)
    if (Math.random() < 0.10) {
      throw new Error('Voice call failed');
    }
  }

  /**
   * Translate notification content
   */
  private translateNotification(
    payload: NotificationPayload,
    language: string
  ): NotificationPayload {
    // Mock implementation - in production, use translation service
    if (language === 'en') {
      return payload;
    }
    
    // For now, just return original payload
    // In production, translate title and body
    return {
      ...payload,
      title: `[${language}] ${payload.title}`,
      body: `[${language}] ${payload.body}`
    };
  }

  /**
   * Set user notification preferences
   */
  setUserPreferences(preferences: NotificationPreferences): void {
    this.preferences.set(preferences.userId, preferences);
  }

  /**
   * Get user notification preferences
   */
  getUserPreferences(userId: string): NotificationPreferences {
    return this.preferences.get(userId) || this.getDefaultPreferences(userId);
  }

  /**
   * Get default notification preferences
   */
  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      enabledChannels: ['push', 'in-app'],
      categoryPreferences: {
        irrigation: { enabled: true, channels: ['push', 'sms', 'in-app'] },
        weather: { enabled: true, channels: ['push', 'sms'] },
        market: { enabled: true, channels: ['push', 'in-app'] },
        health: { enabled: true, channels: ['push', 'in-app'] },
        education: { enabled: true, channels: ['in-app'] },
        infrastructure: { enabled: true, channels: ['push', 'in-app'] },
        system: { enabled: true, channels: ['in-app'] }
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00'
      },
      language: 'en'
    };
  }

  /**
   * Process queued notifications
   */
  async processQueue(): Promise<void> {
    const now = new Date();
    const readyNotifications = this.notificationQueue.filter(
      item => item.scheduledFor <= now
    );
    
    for (const item of readyNotifications) {
      await this.sendNotification(item.payload);
    }
    
    // Remove processed notifications
    this.notificationQueue = this.notificationQueue.filter(
      item => item.scheduledFor > now
    );
  }

  /**
   * Get delivery logs for a user
   */
  getDeliveryLogs(userId: string): NotificationDeliveryLog[] {
    return this.deliveryLogs.filter(log => log.userId === userId);
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const log = this.deliveryLogs.find(l => l.notificationId === notificationId);
    if (log) {
      log.readAt = new Date();
    }
  }

  /**
   * Mark notification as clicked
   */
  markAsClicked(notificationId: string): void {
    const log = this.deliveryLogs.find(l => l.notificationId === notificationId);
    if (log) {
      log.clickedAt = new Date();
    }
  }

  /**
   * Get notification analytics
   */
  getAnalytics(userId: string): {
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    totalClicked: number;
    deliveryRate: number;
    readRate: number;
    clickRate: number;
  } {
    const logs = this.getDeliveryLogs(userId);
    
    const totalSent = logs.length;
    const totalDelivered = logs.filter(l => l.sent).length;
    const totalRead = logs.filter(l => l.readAt).length;
    const totalClicked = logs.filter(l => l.clickedAt).length;
    
    return {
      totalSent,
      totalDelivered,
      totalRead,
      totalClicked,
      deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      readRate: totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0,
      clickRate: totalRead > 0 ? (totalClicked / totalRead) * 100 : 0
    };
  }

  /**
   * Log notification delivery
   */
  private logDelivery(log: NotificationDeliveryLog): void {
    this.deliveryLogs.push(log);
  }

  /**
   * Create pending result for queued notifications
   */
  private createPendingResult(
    payload: NotificationPayload,
    channels: NotificationChannel[]
  ): NotificationResult {
    const deliveryStatus: Record<NotificationChannel, any> = {} as any;
    
    for (const channel of channels) {
      deliveryStatus[channel] = {
        sent: false,
        timestamp: new Date(),
        error: 'Queued for later delivery'
      };
    }
    
    return {
      id: this.generateId(),
      userId: payload.userId,
      channels,
      deliveryStatus,
      createdAt: new Date()
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.preferences.clear();
    this.deliveryLogs = [];
    this.notificationQueue = [];
  }
}
