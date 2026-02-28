# Weather Alert Service

## Overview

The Weather Alert Service monitors weather conditions and generates alerts based on configurable thresholds. It integrates with the WeatherService to fetch weather data and generates alerts for various weather conditions that may affect agricultural activities.

## Features

- **Multiple Alert Types**: Frost, heavy rain, high temperature, strong winds, drought, heatwave, and pest risk
- **Severity Levels**: Info, warning, and critical
- **Configurable Thresholds**: Customize alert thresholds for different conditions
- **Crop-Specific Advisories**: Provides actionable recommendations for farmers
- **Alert Management**: Track active alerts and maintain history
- **Location-Based**: Generate alerts for specific geographic locations

## Alert Types

### 1. Frost Alert
- **Critical**: Temperature ≤ -2°C
- **Warning**: Temperature ≤ 2°C
- **Lead Time**: 24 hours
- **Affected Crops**: Tomatoes, peppers, cucumbers, beans, potatoes

### 2. Heavy Rain Alert
- **Critical**: 
  - ≥50mm in 24 hours
  - ≥100mm in 72 hours
- **Warning**: 
  - ≥30mm in 24 hours
  - ≥70mm in 72 hours
- **Affected Crops**: All crops

### 3. High Temperature Alert
- **Critical**: Temperature ≥ 40°C
- **Warning**: Temperature ≥ 35°C
- **Affected Crops**: Wheat, rice, vegetables, fruits

### 4. Strong Wind Alert
- **Critical**: Wind speed ≥ 15 m/s (~54 km/h)
- **Warning**: Wind speed ≥ 10 m/s (~36 km/h)
- **Affected Crops**: Tall crops, fruit trees, vegetables

### 5. Drought Alert
- **Critical**: <5mm rainfall in 7 days
- **Warning**: 5-10mm rainfall in 7 days
- **Threshold**: 5+ days without significant rain (≥2mm)
- **Affected Crops**: All crops

### 6. Heatwave Alert
- **Critical**: 3+ consecutive days with temperature ≥ 38°C
- **Affected Crops**: All crops and livestock

### 7. Pest Risk Alert
- **Warning**: Humidity 80-100% AND Temperature 25-35°C
- **Affected Crops**: Vegetables, fruits, cotton

## Usage

### Basic Setup

```typescript
import { createWeatherService } from './weather-service';
import { createWeatherAlertService } from './weather-alert-service';

// Create weather service
const weatherService = createWeatherService({
  openWeatherApiKey: 'your-api-key',
  cacheEnabled: true,
  cacheTTL: 3600
});

// Create alert service with default thresholds
const alertService = createWeatherAlertService(weatherService);
```

### Custom Thresholds

```typescript
const alertService = createWeatherAlertService(weatherService, {
  thresholds: {
    frost: {
      critical: -5,
      warning: 0,
      leadTimeHours: 48
    },
    heavyRain: {
      critical24h: 60,
      warning24h: 40,
      critical72h: 120,
      warning72h: 80
    }
  },
  enabledAlertTypes: ['frost', 'heavy_rain', 'high_temperature']
});
```

### Generate Alerts

```typescript
const location = {
  latitude: 28.6139,
  longitude: 77.2090,
  name: 'New Delhi'
};

// Check weather and generate alerts
const alerts = await alertService.checkAndGenerateAlerts(location);

alerts.forEach(alert => {
  console.log(`${alert.severity.toUpperCase()}: ${alert.title}`);
  console.log(`Description: ${alert.description}`);
  console.log('Advisories:');
  alert.advisories.forEach(advisory => {
    console.log(`  - ${advisory}`);
  });
});
```

### Get Active Alerts

```typescript
// Get all active alerts
const activeAlerts = alertService.getActiveAlerts();

// Get active alerts for a specific location
const locationAlerts = alertService.getActiveAlerts(location);
```

### Alert History

```typescript
// Get all alert history
const history = alertService.getAlertHistory();

// Get history for a specific location with limit
const recentAlerts = alertService.getAlertHistory(location, 10);
```

### Update Thresholds

```typescript
alertService.updateThresholds({
  frost: {
    critical: -3,
    warning: 1,
    leadTimeHours: 24
  }
});
```

### Enable/Disable Alert Types

```typescript
// Only enable specific alert types
alertService.setEnabledAlertTypes(['frost', 'heavy_rain']);

// Get currently enabled types
const enabledTypes = alertService.getEnabledAlertTypes();
```

### Clear Expired Alerts

```typescript
// Remove alerts that have passed their validity period
const clearedCount = alertService.clearExpiredAlerts();
console.log(`Cleared ${clearedCount} expired alerts`);
```

## Alert Structure

```typescript
interface WeatherAlert {
  id: string;                    // Unique alert identifier
  type: AlertType;               // Alert type (frost, heavy_rain, etc.)
  severity: AlertSeverity;       // Severity level (info, warning, critical)
  location: WeatherLocation;     // Geographic location
  title: string;                 // Alert title
  description: string;           // Detailed description
  advisories: string[];          // Actionable recommendations
  timestamp: Date;               // When alert was generated
  validUntil: Date;              // When alert expires
  metadata: {
    currentValue?: number;       // Current measured value
    threshold?: number;          // Threshold that was exceeded
    unit?: string;               // Unit of measurement
    affectedCrops?: string[];    // Crops affected by this alert
  };
}
```

## Integration with Notification Service

```typescript
import { NotificationService } from '../notifications/notification-service';

const notificationService = new NotificationService();

// Generate alerts
const alerts = await alertService.checkAndGenerateAlerts(location);

// Send notifications for critical alerts
for (const alert of alerts) {
  if (alert.severity === 'critical') {
    await notificationService.sendNotification({
      userId: 'user-id',
      category: 'weather',
      priority: 'critical',
      title: alert.title,
      body: alert.description,
      data: {
        alertId: alert.id,
        alertType: alert.type,
        advisories: alert.advisories
      }
    });
  }
}
```

## Scheduled Alert Monitoring

```typescript
import { createWeatherUpdateScheduler } from './weather-update-scheduler';

// Create scheduler for hourly weather updates
const scheduler = createWeatherUpdateScheduler(weatherService, {
  enabled: true,
  cronExpression: '0 * * * *', // Every hour
  locations: [
    { latitude: 28.6139, longitude: 77.2090, name: 'New Delhi' },
    { latitude: 19.0760, longitude: 72.8777, name: 'Mumbai' }
  ],
  onUpdate: async (location, success, error) => {
    if (success) {
      // Check for alerts after weather update
      const alerts = await alertService.checkAndGenerateAlerts(location);
      
      // Send notifications for new alerts
      for (const alert of alerts) {
        // Send notification logic here
      }
    }
  }
});

scheduler.start();
```

## Testing

### Unit Tests

```bash
npm test -- weather-alert-service.test.ts
```

### Property-Based Tests

```bash
npm test -- weather-alert-service.property.test.ts
```

## Requirements Validation

This service validates the following requirements from the RuralConnect AI specification:

- **Requirement 5.3**: Generate weather alerts when conditions meet critical thresholds
- **Requirement 5.6**: Issue critical frost alert with 24-hour lead time when temperature drops below -2°C
- **Requirement 5.7**: Issue heavy rain alert with drainage recommendations when rainfall exceeds thresholds
- **Requirement 5.8**: Issue pest risk advisory when humidity exceeds 80% and temperature is between 25-35°C

## Design Properties

This service implements **Property 14** from the design document:

> **Property 14: Weather Alert Generation**
> For any weather conditions meeting critical thresholds (frost < -2°C, heavy rain > 50mm, drought conditions), appropriate weather alerts should be generated with correct severity level.

## Best Practices

1. **Regular Monitoring**: Check for alerts at least hourly during critical seasons
2. **Threshold Tuning**: Adjust thresholds based on local climate and crop types
3. **Alert Fatigue**: Avoid sending too many alerts by using appropriate severity levels
4. **Actionable Advisories**: Ensure advisories are practical and implementable by farmers
5. **Timely Delivery**: Send critical alerts immediately through multiple channels
6. **Historical Analysis**: Use alert history to identify patterns and improve predictions

## Future Enhancements

- Machine learning-based threshold optimization
- Crop-specific threshold customization
- Integration with soil moisture sensors
- Multi-day alert forecasting
- Alert effectiveness tracking
- Community-sourced weather observations
- Regional alert aggregation
