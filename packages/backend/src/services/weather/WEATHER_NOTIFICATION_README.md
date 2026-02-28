# Weather Notification Integration

## Overview

The Weather Notification Integration service connects the Weather Alert Service with the Notification Service to deliver weather alerts through multiple channels (push notifications, SMS, and voice calls).

## Features

- **Multi-Channel Delivery**: Automatically delivers weather alerts via push, SMS, and voice
- **Severity-Based Priority Mapping**: Maps alert severity to notification priority
- **Crop-Specific Filtering**: Only sends alerts relevant to user's crops
- **Duplicate Prevention**: Prevents sending the same alert multiple times
- **User Preferences**: Respects user notification preferences and quiet hours
- **Batch Processing**: Can check and notify all registered users efficiently

## Architecture

```
WeatherAlertService → WeatherNotificationIntegration → NotificationService
                                                      ↓
                                            [Push, SMS, Voice]
```

## Usage

### Basic Setup

```typescript
import { WeatherService } from './weather-service';
import { WeatherAlertService } from './weather-alert-service';
import { NotificationService } from '../notifications/notification-service';
import { WeatherNotificationIntegration } from './weather-notification-integration';

// Initialize services
const weatherService = new WeatherService({
  openWeatherApiKey: 'your-api-key'
});

const weatherAlertService = new WeatherAlertService(weatherService);
const notificationService = new NotificationService();

// Create integration
const integration = new WeatherNotificationIntegration(
  weatherAlertService,
  notificationService
);
```

### Register Users

```typescript
// Register user with weather preferences
integration.registerUser({
  userId: 'user123',
  location: {
    latitude: 28.6139,
    longitude: 77.2090
  },
  crops: ['wheat', 'rice', 'tomatoes'],
  enableWeatherAlerts: true
});
```

### Check and Notify

```typescript
// Check alerts for a specific user
await integration.checkAndNotifyUser('user123');

// Check alerts for all registered users
await integration.checkAndNotifyAllUsers();
```

### Update Preferences

```typescript
// Update user's crops
integration.updateUserPreferences('user123', {
  crops: ['corn', 'soybeans']
});

// Disable alerts
integration.updateUserPreferences('user123', {
  enableWeatherAlerts: false
});
```

## Alert Severity to Priority Mapping

The integration automatically maps weather alert severity to notification priority:

| Alert Severity | Notification Priority | Channels Used |
|----------------|----------------------|---------------|
| Critical       | Critical             | Push, SMS, Voice (all channels) |
| Warning        | High                 | Push, SMS |
| Info           | Normal               | Push |

**Critical Priority Behavior**: When an alert has critical severity, it is delivered through ALL available channels regardless of user preferences (as per Requirements 5.4).

## Crop-Specific Filtering

The integration filters alerts based on user's crops:

1. **Specific Crops**: If alert specifies affected crops (e.g., "tomatoes", "peppers"), only users growing those crops receive the alert
2. **All Crops**: If alert affects "all crops", all users receive it
3. **No Specification**: If alert doesn't specify crops, all users receive it

Example:
```typescript
// User grows wheat and rice
integration.registerUser({
  userId: 'farmer1',
  crops: ['wheat', 'rice'],
  // ...
});

// Frost alert affects tomatoes, peppers → NOT sent to farmer1
// Heavy rain alert affects all crops → SENT to farmer1
// Drought alert (no crop specification) → SENT to farmer1
```

## Notification Format

### Push Notification
- **Title**: Alert title (e.g., "Critical Frost Alert")
- **Body**: Description + top 3 advisories
- **Data**: Complete alert details including all advisories

### SMS
- **Content**: Concise message with description and primary advisory
- **Length**: Optimized for SMS (< 300 characters)

### Voice
- **Content**: Same as SMS, optimized for text-to-speech

Example:
```typescript
const alert = {
  title: "Critical Frost Alert",
  description: "Temperature dropping to -3°C",
  advisories: ["Cover crops", "Water before sunset", "Use heaters"]
};

// Push notification body:
// "Temperature dropping to -3°C
//  
//  Recommended actions:
//  1. Cover crops
//  2. Water before sunset
//  3. Use heaters"

// SMS/Voice message:
// "Critical Frost Alert: Temperature dropping to -3°C Action: Cover crops"
```

## Duplicate Prevention

The integration tracks sent alerts per user to prevent duplicates:

```typescript
// First check - alert sent
await integration.checkAndNotifyUser('user123');

// Second check - same alert NOT sent again
await integration.checkAndNotifyUser('user123');

// Clear history to allow resending
integration.clearSentAlerts('user123');
```

## Statistics

Track notification statistics:

```typescript
const stats = integration.getStatistics();
console.log(stats);
// {
//   totalUsers: 100,
//   usersWithAlerts: 45,
//   totalAlertsSent: 120
// }
```

## Integration with Scheduler

For automated weather monitoring, integrate with a scheduler:

```typescript
import { WeatherUpdateScheduler } from './weather-update-scheduler';

const scheduler = new WeatherUpdateScheduler(weatherService);

// Check alerts every hour
setInterval(async () => {
  await integration.checkAndNotifyAllUsers();
}, 60 * 60 * 1000);
```

## Error Handling

The integration handles errors gracefully:

```typescript
// Individual user errors don't affect other users
await integration.checkAndNotifyAllUsers();
// If user1 fails, user2, user3, etc. still get checked

// Errors are logged to console
// "Failed to check alerts for user user1: API error"
```

## Testing

### Unit Tests
```bash
npm test -- weather-notification-integration.test.ts
```

### Property-Based Tests
```bash
npm test -- weather-notification-integration.property.test.ts
```

## Requirements Validation

This implementation validates the following requirements:

- **Requirement 5.4**: Multi-channel notification delivery (push, SMS, voice) within 30 minutes
- **Requirement 5.5**: Crop-specific advisories included in notifications
- **Property 38**: Critical notifications use all available channels
- **Property 39**: Quiet hours respected for non-critical notifications

## API Reference

### `WeatherNotificationIntegration`

#### Constructor
```typescript
constructor(
  weatherAlertService: WeatherAlertService,
  notificationService: NotificationService,
  config?: WeatherNotificationConfig
)
```

#### Methods

**`registerUser(preferences: UserWeatherPreferences): void`**
- Register a user for weather notifications

**`updateUserPreferences(userId: string, updates: Partial<UserWeatherPreferences>): void`**
- Update user's weather preferences

**`unregisterUser(userId: string): void`**
- Remove user from weather notifications

**`checkAndNotifyUser(userId: string): Promise<void>`**
- Check weather alerts for a specific user and send notifications

**`checkAndNotifyAllUsers(): Promise<void>`**
- Check weather alerts for all registered users

**`formatConciseMessage(alert: WeatherAlert): string`**
- Format alert as concise message for SMS/Voice

**`clearSentAlerts(userId?: string): void`**
- Clear sent alerts history

**`getStatistics(): { totalUsers, usersWithAlerts, totalAlertsSent }`**
- Get notification statistics

**`getUserPreferences(userId: string): UserWeatherPreferences | undefined`**
- Get user's weather preferences

**`getRegisteredUsers(): string[]`**
- Get list of all registered user IDs

## Configuration

```typescript
interface WeatherNotificationConfig {
  enabledChannels?: ('push' | 'sms' | 'voice')[];
  notificationDelayMinutes?: number;
  batchNotifications?: boolean;
}
```

Currently, the config parameter is reserved for future enhancements. The service uses default behavior:
- All channels enabled (push, SMS, voice)
- No notification delay
- Individual notification processing

## Future Enhancements

1. **Batch Notifications**: Group multiple alerts into a single notification
2. **Notification Delay**: Configurable delay before sending notifications
3. **Channel Preferences**: Per-user channel preferences
4. **Alert Aggregation**: Combine similar alerts
5. **Notification Templates**: Customizable message templates
6. **Delivery Tracking**: Track notification delivery status
7. **Retry Logic**: Automatic retry for failed deliveries

## Related Services

- [Weather Service](./weather-service.ts) - Fetches weather data
- [Weather Alert Service](./weather-alert-service.ts) - Generates weather alerts
- [Weather Update Scheduler](./weather-update-scheduler.ts) - Schedules weather updates
- [Notification Service](../notifications/notification-service.ts) - Multi-channel notification delivery
