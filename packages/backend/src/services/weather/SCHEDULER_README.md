# Weather Update Scheduler

The Weather Update Scheduler provides automated hourly weather data updates with caching support for the RuralConnect AI application.

## Features

- **Scheduled Updates**: Automatically fetch weather data at configurable intervals (default: hourly)
- **Location Management**: Register multiple locations for automatic updates
- **Metrics Tracking**: Monitor update success/failure rates and timing
- **Error Handling**: Graceful error handling with callback notifications
- **Flexible Configuration**: Customizable cron expressions and callbacks

## Installation

The scheduler is part of the weather service module. No additional installation required.

## Basic Usage

```typescript
import { createWeatherService } from './weather-service';
import { createWeatherUpdateScheduler } from './weather-update-scheduler';

// Create weather service
const weatherService = createWeatherService({
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY!,
  cacheEnabled: true,
  cacheTTL: 3600, // 1 hour cache
});

// Create scheduler
const scheduler = createWeatherUpdateScheduler(weatherService, {
  enabled: true,
  cronExpression: '0 * * * *', // Every hour at minute 0
  locations: [
    { latitude: 28.6139, longitude: 77.2090, name: 'New Delhi' },
    { latitude: 19.0760, longitude: 72.8777, name: 'Mumbai' },
    { latitude: 13.0827, longitude: 80.2707, name: 'Chennai' },
  ],
});

// Start the scheduler
scheduler.start();

// The scheduler will now automatically fetch weather data for all registered locations every hour
```

## Configuration Options

### SchedulerConfig

```typescript
interface SchedulerConfig {
  enabled?: boolean;              // Enable/disable scheduler (default: true)
  cronExpression?: string;        // Cron expression (default: '0 * * * *')
  locations?: WeatherLocation[];  // Initial locations to monitor
  onUpdate?: (location, success, error?) => void;  // Callback after each update
  onError?: (error) => void;      // Callback for scheduler errors
}
```

### Cron Expression Examples

```typescript
'0 * * * *'      // Every hour at minute 0
'*/30 * * * *'   // Every 30 minutes
'0 */2 * * *'    // Every 2 hours
'0 0 * * *'      // Daily at midnight
'*/15 * * * *'   // Every 15 minutes
```

## Location Management

### Add Locations

```typescript
// Add a single location
scheduler.addLocation({
  latitude: 12.9716,
  longitude: 77.5946,
  name: 'Bangalore',
});

// Add multiple locations
const locations = [
  { latitude: 22.5726, longitude: 88.3639, name: 'Kolkata' },
  { latitude: 17.3850, longitude: 78.4867, name: 'Hyderabad' },
];
locations.forEach(loc => scheduler.addLocation(loc));
```

### Remove Locations

```typescript
scheduler.removeLocation({
  latitude: 28.6139,
  longitude: 77.2090,
  name: 'New Delhi',
});
```

### Get All Locations

```typescript
const locations = scheduler.getLocations();
console.log(`Monitoring ${locations.length} locations`);
```

### Clear All Locations

```typescript
scheduler.clearLocations();
```

## Scheduler Control

### Start Scheduler

```typescript
scheduler.start();
console.log('Scheduler started');
```

### Stop Scheduler

```typescript
scheduler.stop();
console.log('Scheduler stopped');
```

### Check Status

```typescript
if (scheduler.isSchedulerRunning()) {
  console.log('Scheduler is running');
} else {
  console.log('Scheduler is stopped');
}
```

## Manual Updates

Trigger an immediate update for all locations:

```typescript
await scheduler.triggerUpdate();
console.log('Manual update completed');
```

## Metrics and Monitoring

### Get Metrics

```typescript
const metrics = scheduler.getMetrics();
console.log(`Total updates: ${metrics.totalUpdates}`);
console.log(`Successful: ${metrics.successfulUpdates}`);
console.log(`Failed: ${metrics.failedUpdates}`);
console.log(`Last update: ${metrics.lastUpdateTime}`);
console.log(`Last error: ${metrics.lastError?.message}`);
```

### Reset Metrics

```typescript
scheduler.resetMetrics();
```

## Callbacks

### Update Callback

Receive notifications after each location update:

```typescript
const scheduler = createWeatherUpdateScheduler(weatherService, {
  locations: [...],
  onUpdate: (location, success, error) => {
    if (success) {
      console.log(`✓ Updated weather for ${location.name}`);
    } else {
      console.error(`✗ Failed to update ${location.name}: ${error?.message}`);
    }
  },
});
```

### Error Callback

Handle scheduler-level errors:

```typescript
const scheduler = createWeatherUpdateScheduler(weatherService, {
  locations: [...],
  onError: (error) => {
    console.error('Scheduler error:', error);
    // Send alert, log to monitoring system, etc.
  },
});
```

## Advanced Configuration

### Update Cron Expression

Change the schedule while running:

```typescript
// Change to every 30 minutes
scheduler.updateCronExpression('*/30 * * * *');

// The scheduler will automatically restart with the new schedule
```

### Get Current Configuration

```typescript
const config = scheduler.getConfig();
console.log(`Enabled: ${config.enabled}`);
console.log(`Cron: ${config.cronExpression}`);
console.log(`Locations: ${config.locations?.length}`);
```

## Complete Example

```typescript
import { createWeatherService } from './weather-service';
import { createWeatherUpdateScheduler } from './weather-update-scheduler';

// Initialize services
const weatherService = createWeatherService({
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY!,
  imdApiKey: process.env.IMD_API_KEY,
  cacheEnabled: true,
  cacheTTL: 3600,
});

// Create scheduler with callbacks
const scheduler = createWeatherUpdateScheduler(weatherService, {
  enabled: true,
  cronExpression: '0 * * * *', // Hourly updates
  locations: [
    { latitude: 28.6139, longitude: 77.2090, name: 'New Delhi' },
    { latitude: 19.0760, longitude: 72.8777, name: 'Mumbai' },
    { latitude: 13.0827, longitude: 80.2707, name: 'Chennai' },
    { latitude: 22.5726, longitude: 88.3639, name: 'Kolkata' },
    { latitude: 12.9716, longitude: 77.5946, name: 'Bangalore' },
  ],
  onUpdate: (location, success, error) => {
    if (success) {
      console.log(`✓ ${location.name}: Weather updated successfully`);
    } else {
      console.error(`✗ ${location.name}: Update failed - ${error?.message}`);
    }
  },
  onError: (error) => {
    console.error('Scheduler error:', error);
    // Send alert to monitoring system
  },
});

// Start the scheduler
scheduler.start();
console.log('Weather update scheduler started');

// Trigger immediate update
await scheduler.triggerUpdate();

// Monitor metrics
setInterval(() => {
  const metrics = scheduler.getMetrics();
  console.log('Scheduler Metrics:', {
    total: metrics.totalUpdates,
    successful: metrics.successfulUpdates,
    failed: metrics.failedUpdates,
    successRate: `${((metrics.successfulUpdates / metrics.totalUpdates) * 100).toFixed(2)}%`,
    lastUpdate: metrics.lastUpdateTime,
  });
}, 60000); // Log metrics every minute

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down scheduler...');
  scheduler.stop();
  process.exit(0);
});
```

## Integration with Express

```typescript
import express from 'express';
import { createWeatherService } from './services/weather/weather-service';
import { createWeatherUpdateScheduler } from './services/weather/weather-update-scheduler';

const app = express();

// Initialize scheduler
const weatherService = createWeatherService({
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY!,
  cacheEnabled: true,
  cacheTTL: 3600,
});

const scheduler = createWeatherUpdateScheduler(weatherService, {
  cronExpression: '0 * * * *',
  locations: [], // Start with no locations
});

scheduler.start();

// API endpoint to add location
app.post('/api/weather/locations', (req, res) => {
  const { latitude, longitude, name } = req.body;
  scheduler.addLocation({ latitude, longitude, name });
  res.json({ message: 'Location added to scheduler' });
});

// API endpoint to get metrics
app.get('/api/weather/scheduler/metrics', (req, res) => {
  const metrics = scheduler.getMetrics();
  res.json(metrics);
});

// API endpoint to trigger manual update
app.post('/api/weather/scheduler/update', async (req, res) => {
  await scheduler.triggerUpdate();
  res.json({ message: 'Update triggered' });
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
```

## Best Practices

1. **Cache TTL**: Set cache TTL to match or slightly exceed your update interval
2. **Error Handling**: Always implement onUpdate and onError callbacks for monitoring
3. **Location Limits**: Be mindful of API rate limits when adding many locations
4. **Graceful Shutdown**: Always stop the scheduler before process exit
5. **Metrics Monitoring**: Regularly check metrics to ensure updates are succeeding
6. **Cron Validation**: Use valid cron expressions to avoid startup errors

## Troubleshooting

### Scheduler Not Starting

```typescript
// Check if enabled
const config = scheduler.getConfig();
if (!config.enabled) {
  console.log('Scheduler is disabled');
}

// Validate cron expression
try {
  scheduler.start();
} catch (error) {
  console.error('Invalid cron expression:', error.message);
}
```

### Updates Failing

```typescript
// Check metrics
const metrics = scheduler.getMetrics();
if (metrics.failedUpdates > 0) {
  console.error('Last error:', metrics.lastError);
}

// Check weather service configuration
const cacheStats = weatherService.getCacheStats();
console.log('Cache stats:', cacheStats);
```

### High Failure Rate

- Verify API keys are valid
- Check network connectivity
- Review rate limits
- Ensure locations have valid coordinates

## Related Documentation

- [Weather Service README](./weather-service.ts)
- [Irrigation Schedule](../agriculture/irrigation-schedule.ts)
- [Weather Alerts](./weather-alerts.ts)
