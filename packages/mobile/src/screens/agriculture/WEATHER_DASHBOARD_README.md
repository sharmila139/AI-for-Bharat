# Weather Dashboard Screen

## Overview

The Weather Dashboard Screen provides farmers with comprehensive weather information including current conditions, forecasts, and alerts. This component is part of the Smart Agriculture module and helps farmers make informed decisions about crop management.

## Features

### 1. Current Weather Display
- Real-time temperature and conditions
- Feels-like temperature
- Humidity percentage
- Wind speed
- Weather description with icons

### 2. Hourly Forecast (48 hours)
- Hour-by-hour temperature predictions
- Rainfall amounts
- Wind speed
- Weather conditions
- Horizontal scrollable view for easy navigation

### 3. Daily Forecast (7 days)
- Daily high and low temperatures
- Expected rainfall
- Weather conditions
- Date and day of week

### 4. Weather Alerts
- Critical, warning, and info level alerts
- Alert types: frost, heavy rain, high temperature, strong winds, drought, heatwave, pest risk
- Detailed advisories for each alert
- Color-coded severity indicators
- Validity period display

### 5. Interactive Features
- Pull-to-refresh for latest data
- Location selection
- Tab navigation between hourly and daily forecasts
- Tap alerts for detailed information and advisories

## Usage

```typescript
import { WeatherDashboardScreen } from './screens/agriculture';

// Basic usage
<WeatherDashboardScreen />

// With custom location
<WeatherDashboardScreen
  location={{
    latitude: 28.6139,
    longitude: 77.2090,
    name: 'New Delhi'
  }}
  onLocationChange={(location) => {
    console.log('Location changed:', location);
  }}
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| location | WeatherLocation | No | Current location for weather data |
| onLocationChange | (location: WeatherLocation) => void | No | Callback when user changes location |

## Data Types

### WeatherLocation
```typescript
interface WeatherLocation {
  latitude: number;
  longitude: number;
  name?: string;
}
```

### CurrentWeather
```typescript
interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}
```

### HourlyForecast
```typescript
interface HourlyForecast {
  time: Date;
  temperature: { min: number; max: number };
  rainfall: number;
  windSpeed?: number;
  description: string;
}
```

### DailyForecast
```typescript
interface DailyForecast {
  date: Date;
  temperature: { min: number; max: number };
  rainfall: number;
  description: string;
}
```

### WeatherAlert
```typescript
interface WeatherAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  advisories: string[];
  validUntil: Date;
}
```

## Integration with Backend Services

The Weather Dashboard integrates with the following backend services:

1. **WeatherService** - Fetches weather data from IMD API and OpenWeatherMap
2. **WeatherAlertService** - Generates alerts based on weather thresholds
3. **CrowdWeatherService** - Incorporates crowd-sourced observations

### Example Integration

```typescript
import { WeatherService } from '@ruralconnect/backend/services/weather';
import { WeatherAlertService } from '@ruralconnect/backend/services/weather';

const weatherService = new WeatherService();
const alertService = new WeatherAlertService(weatherService);

// Fetch weather data
const weatherData = await weatherService.getWeather(location);

// Check for alerts
const alerts = await alertService.checkAndGenerateAlerts(location);
```

## Offline Support

The Weather Dashboard supports offline functionality:

- Cached weather data displayed when offline
- Offline indicator shown in UI
- Data automatically syncs when connection restored
- Stale data marked with timestamp

## Accessibility

- Screen reader compatible
- High contrast mode support
- Large touch targets for buttons
- Clear visual hierarchy
- Color-blind friendly alert colors

## Performance Considerations

- Lazy loading of forecast data
- Efficient re-rendering with React.memo
- Optimized scroll performance
- Image caching for weather icons
- Debounced refresh actions

## Requirements Validation

This component validates the following requirements:

- **Requirement 5.2**: Weather forecasts with current conditions, 48-hour hourly, and 14-day extended forecast
- **Requirement 5.3**: Weather alerts for critical thresholds
- **Requirement 5.4**: Multi-channel notification delivery
- **Requirement 5.5**: Crop-specific advisories
- **Requirement 5.6**: Frost alert with 24-hour lead time
- **Requirement 5.7**: Heavy rain alert with drainage recommendations
- **Requirement 5.8**: Pest risk advisory based on humidity and temperature

## Future Enhancements

1. Weather radar visualization
2. Satellite imagery
3. Historical weather data charts
4. Customizable alert thresholds
5. Weather-based crop recommendations
6. Integration with irrigation scheduling
7. Weather comparison with previous years
8. Crowd-sourced observation submission UI
9. Weather widgets for home screen
10. Voice-based weather updates

## Testing

Unit tests are located in `__tests__/WeatherDashboardScreen.test.tsx`

Run tests:
```bash
npm test WeatherDashboardScreen.test.tsx
```

## Styling

The component uses a modern, clean design with:
- Card-based layout
- Green accent color (#10B981) for primary actions
- Color-coded alerts (red for critical, orange for warning, blue for info)
- Responsive spacing and typography
- Shadow effects for depth
- Smooth animations and transitions

## Troubleshooting

### Weather data not loading
- Check internet connection
- Verify location permissions
- Check API key configuration
- Review backend service logs

### Alerts not displaying
- Verify alert thresholds in backend
- Check alert service configuration
- Review notification permissions

### Performance issues
- Reduce forecast data range
- Enable data caching
- Optimize image loading
- Check for memory leaks

## Support

For issues or questions, contact the development team or refer to the main project documentation.
