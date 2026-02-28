# Crop-Specific Advisory Service

## Overview

The Crop Advisory Service generates tailored weather advisories based on crop type, growth stage, and weather conditions. It provides immediate actions, preventive measures, and warnings specific to each crop's sensitivities.

**Validates:** Requirements 5.5 - Crop-specific advisories with immediate actions, preventive measures, and warnings

## Features

- **Crop-Specific Risk Assessment**: Calculates risk levels based on crop sensitivities to weather conditions
- **Growth Stage Awareness**: Adjusts advisories based on critical growth stages (seedling, vegetative, flowering, fruiting, harvest)
- **Multiple Alert Types**: Supports frost, heavy rain, high temperature, heatwave, strong winds, drought, and pest risk alerts
- **Actionable Recommendations**: Provides immediate actions, preventive measures, and warnings
- **Yield Impact Estimation**: Estimates potential yield loss based on risk level

## Supported Crops

- **Wheat**: Moderate frost tolerance, sensitive during flowering
- **Rice**: Frost-sensitive, requires high humidity
- **Tomatoes**: Highly frost-sensitive, pest-prone
- **Peppers**: Frost-sensitive, heat-tolerant
- **Potatoes**: Moderate frost tolerance, cool-season crop
- **Cotton**: Pest-prone, heat-tolerant
- **Sugarcane**: Heat-tolerant, requires high water
- **Maize**: Moderate tolerance to most conditions
- **Onions**: Cool-season crop
- **Beans**: Frost-sensitive

## Usage

### Basic Usage

```typescript
import { CropAdvisoryService } from './crop-advisory-service';
import { WeatherAlertService } from './weather-alert-service';
import { WeatherService } from './weather-service';

// Initialize services
const weatherService = new WeatherService({ openWeatherApiKey: 'your-key' });
const alertService = new WeatherAlertService(weatherService);
const advisoryService = new CropAdvisoryService();

// Get weather alert
const location = { latitude: 28.6139, longitude: 77.2090 };
const weatherData = await weatherService.getWeather(location);
const alerts = await alertService.checkAndGenerateAlerts(location);

// Generate crop-specific advisory
const cropInfo = {
  type: 'tomatoes',
  growthStage: 'flowering'
};

const advisory = advisoryService.generateAdvisory(
  alerts[0],
  cropInfo,
  weatherData
);

console.log(advisory);
```

### Multiple Crops

```typescript
const crops = [
  { type: 'wheat', growthStage: 'vegetative' },
  { type: 'tomatoes', growthStage: 'flowering' },
  { type: 'rice', growthStage: 'fruiting' }
];

const advisories = advisoryService.generateAdvisories(
  alert,
  crops,
  weatherData
);

advisories.forEach(advisory => {
  console.log(`${advisory.cropType} (${advisory.growthStage}):`);
  console.log(`  Severity: ${advisory.severity}`);
  console.log(`  Risk Level: ${advisory.metadata.riskLevel}`);
  console.log(`  Immediate Actions:`);
  advisory.immediateActions.forEach(action => {
    console.log(`    - ${action}`);
  });
});
```

## Advisory Structure

```typescript
interface CropAdvisory {
  cropType: CropType;
  growthStage: GrowthStage;
  alertType: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  immediateActions: string[];      // Actions to take now
  preventiveMeasures: string[];    // Long-term prevention
  warnings: string[];              // Critical warnings
  expectedImpact: string;          // Impact description
  timeframe: string;               // When to act
  metadata: {
    weatherCondition: string;
    riskLevel: number;             // 0-100
    affectedYield?: string;        // Estimated yield impact
  };
}
```

## Risk Calculation

Risk levels are calculated based on:

1. **Weather Thresholds**: Each crop has specific thresholds for frost, heat, rainfall, wind, etc.
2. **Growth Stage**: Critical stages (flowering, fruiting) have higher risk multipliers
3. **Crop Sensitivity**: Frost-sensitive crops (tomatoes, peppers) have lower frost thresholds

### Risk Level Ranges

- **0-29**: Low risk - Minor impact expected
- **30-59**: Medium risk - Moderate damage possible
- **60-79**: High risk - Significant damage likely
- **80-100**: Critical risk - Severe damage or crop loss

## Growth Stage Considerations

### Seedling
- Most vulnerable to extreme conditions
- Focus on protection and establishment
- Higher sensitivity to frost and heat

### Vegetative
- Building plant structure
- Moderate sensitivity
- Focus on growth optimization

### Flowering
- **Critical stage** for most crops
- High sensitivity to temperature extremes
- Frost or heat can cause pollen sterility
- Heavy rain can wash away flowers

### Fruiting
- **Critical stage** for yield
- Sensitive to water stress
- Quality issues from extreme weather
- Pest risk increases

### Harvest
- Focus on timing and quality
- Immediate harvesting may be recommended
- Weather can affect storage quality

## Alert Type Specific Advisories

### Frost Alerts
- **Immediate**: Cover plants, water before sunset, use heaters
- **Preventive**: Install frost protection, plant resistant varieties
- **Warnings**: Frost-sensitive crops may suffer complete loss

### Heavy Rain
- **Immediate**: Clear drainage, stop irrigation, harvest if possible
- **Preventive**: Improve drainage, build raised beds
- **Warnings**: Waterlogging causes root rot, fungal diseases

### High Temperature/Heatwave
- **Immediate**: Increase irrigation, apply mulch, provide shade
- **Preventive**: Install shade nets, use heat-tolerant varieties
- **Warnings**: Heat stress during flowering causes pollen sterility

### Strong Winds
- **Immediate**: Stake plants, secure structures, harvest mature crops
- **Preventive**: Establish windbreaks, use dwarf varieties
- **Warnings**: Wind causes lodging and flower/fruit drop

### Drought
- **Immediate**: Switch to drip irrigation, apply mulch, prioritize crops
- **Preventive**: Install efficient irrigation, harvest rainwater
- **Warnings**: Water stress during critical stages causes severe yield loss

### Pest Risk
- **Immediate**: Inspect crops daily, apply preventive sprays, set traps
- **Preventive**: Practice crop rotation, maintain field hygiene
- **Warnings**: Pest populations can explode rapidly

## Integration with Weather Alert System

The Crop Advisory Service integrates seamlessly with the Weather Alert Service:

```typescript
// Weather Alert Service generates alerts
const alerts = await alertService.checkAndGenerateAlerts(location);

// Crop Advisory Service generates crop-specific advisories
alerts.forEach(alert => {
  const advisory = advisoryService.generateAdvisory(
    alert,
    cropInfo,
    weatherData
  );
  
  // Send to farmers via notification service
  await notificationService.sendNotification({
    userId: farmer.id,
    title: advisory.cropType + ' Advisory',
    body: formatAdvisory(advisory),
    priority: mapSeverityToPriority(advisory.severity)
  });
});
```

## Testing

The service includes comprehensive unit tests and property-based tests:

```bash
# Run unit tests
npm test -- crop-advisory-service.test.ts

# Run property-based tests
npm test -- crop-advisory-service.property.test.ts

# Run all tests
npm test -- crop-advisory-service
```

### Property-Based Tests

The service uses fast-check for property-based testing to ensure:
- Risk levels are always 0-100
- Severity matches risk level
- All advisories have required fields
- Immediate actions are always provided
- Frost-sensitive crops have appropriate risk levels
- Critical growth stages have appropriate warnings

## Example Output

```typescript
{
  cropType: 'tomatoes',
  growthStage: 'flowering',
  alertType: 'frost',
  severity: 'critical',
  immediateActions: [
    'Cover plants immediately with frost cloth or plastic sheets',
    'Water crops before sunset to help retain soil heat',
    'Harvest mature produce immediately to prevent total loss',
    'Use smoke pots or heaters in small areas if available'
  ],
  preventiveMeasures: [
    'Install permanent frost protection structures for future seasons',
    'Plant frost-resistant varieties in frost-prone areas',
    'Maintain good air circulation to prevent cold air pockets'
  ],
  warnings: [
    'These crops are highly frost-sensitive and may suffer complete loss',
    'Frost during flowering/fruiting can cause severe yield reduction',
    'Temperatures below -2°C can kill plants even with protection'
  ],
  expectedImpact: 'Complete crop loss likely for tomatoes. Immediate action required. Critical growth stage - impact may be higher.',
  timeframe: 'Immediate action required (within 6 hours)',
  metadata: {
    weatherCondition: 'Temperature expected to drop to -3°C',
    riskLevel: 95,
    affectedYield: '40-80% yield loss possible'
  }
}
```

## Best Practices

1. **Always check growth stage**: Advisories are most accurate when growth stage is provided
2. **Consider multiple crops**: Generate advisories for all crops on the farm
3. **Act on timeframe**: Follow the timeframe guidance for immediate actions
4. **Combine with weather data**: Use current weather data for accurate risk assessment
5. **Update regularly**: Regenerate advisories as weather conditions change

## Future Enhancements

- Machine learning for yield impact prediction
- Historical data integration for risk refinement
- Soil condition integration
- Regional variety-specific sensitivities
- Multi-language advisory generation
- Voice-based advisory delivery
