# Fertilizer Recommendation Engine

## Overview

The Fertilizer Recommendation Engine generates comprehensive fertilizer recommendations based on soil health analysis and crop requirements. It provides three types of recommendations:

1. **Organic**: Compost, farmyard manure, green manure, bio-fertilizers
2. **Chemical**: NPK formulations, micronutrient supplements
3. **Mixed**: Combination of organic and chemical approaches

## Features

- **Nutrient Deficiency Analysis**: Calculates NPK and micronutrient deficiencies based on soil data
- **Crop-Specific Requirements**: Tailored recommendations for different crops (rice, wheat, maize, cotton, etc.)
- **Application Schedules**: Aligned with crop growth stages from the crop timeline
- **Cost-Benefit Analysis**: Includes ROI, payback period, and environmental impact
- **Sustainability Scoring**: Evaluates environmental impact and soil health improvement
- **Scalable**: Automatically scales quantities based on land area

## Usage

```typescript
import { getFertilizerRecommendationEngine } from './fertilizer-recommendation';
import { getSoilHealthCalculator } from './soil-health-calculator';
import { CropTimelineService } from './crop-timeline';

// 1. Calculate soil health score
const calculator = getSoilHealthCalculator();
const soilHealthScore = calculator.calculateScore(soilData);

// 2. Generate crop timeline
const timelineService = new CropTimelineService();
const cropTimeline = timelineService.generateTimeline({
  cropId: 'rice-001',
  cropName: 'Rice',
  region: 'Punjab',
  landArea: 2,
  soilType: 'loamy',
  irrigationType: 'flood'
});

// 3. Generate fertilizer recommendations
const engine = getFertilizerRecommendationEngine();
const recommendations = engine.generateRecommendations({
  soilData,
  soilHealthScore,
  cropName: 'rice',
  cropTimeline,
  landArea: 2, // hectares
  budget: 20000 // optional, in INR
});

// Access different recommendation types
console.log('Organic:', recommendations.organic);
console.log('Chemical:', recommendations.chemical);
console.log('Mixed:', recommendations.mixed);
console.log('Recommended:', recommendations.recommended);
```

## Input Parameters

### FertilizerInput

```typescript
{
  soilData: SoilData;              // From soil analysis
  soilHealthScore: SoilHealthScore; // From soil health calculator
  cropName: string;                 // e.g., 'rice', 'wheat', 'maize'
  cropTimeline: CropTimeline;       // From crop timeline service
  landArea: number;                 // in hectares
  preferredType?: 'organic' | 'chemical' | 'mixed'; // optional
  budget?: number;                  // optional, in INR
}
```

## Output Structure

### FertilizerRecommendations

```typescript
{
  organic: FertilizerRecommendation;
  chemical: FertilizerRecommendation;
  mixed: FertilizerRecommendation;
  recommended: 'organic' | 'chemical' | 'mixed';
  comparisonSummary: string;
}
```

### FertilizerRecommendation

Each recommendation includes:

- **products**: Array of fertilizer products with quantities and costs
- **applicationSchedule**: Timeline of when and how to apply fertilizers
- **costBenefitAnalysis**: Financial and environmental impact analysis
- **totalNPK**: Total nitrogen, phosphorus, and potassium provided
- **micronutrients**: List of micronutrients included
- **warnings**: Important precautions
- **tips**: Best practices for application

## Recommendation Types

### 1. Organic Recommendations

**Products:**
- Farmyard Manure (FYM): 0.5% N, 0.2% P, 0.5% K
- Compost: 1.5% N, 1.0% P, 1.5% K
- Vermicompost: 2.0% N, 1.5% P, 1.5% K
- Neem Cake: 5.0% N, 1.0% P, 1.5% K

**Characteristics:**
- High sustainability score (90/100)
- Low environmental impact
- High soil health improvement
- Slow-release nutrients
- Improves soil structure

**Best For:**
- Poor soil health (score < 50)
- Long-term soil improvement
- Organic farming practices
- Sustainable agriculture

### 2. Chemical Recommendations

**Products:**
- Urea: 46% N
- DAP (Di-Ammonium Phosphate): 18% N, 46% P
- MOP (Muriate of Potash): 60% K
- NPK Complex (12:32:16)
- Zinc Sulfate: 21% Zn

**Characteristics:**
- Moderate sustainability score (40/100)
- High environmental impact
- Low soil health improvement
- Quick-acting nutrients
- Precise nutrient delivery

**Best For:**
- Good soil health (score >= 70)
- Quick results needed
- Budget constraints
- Intensive farming

### 3. Mixed Recommendations

**Products:**
- Combination of organic (FYM, Vermicompost) and chemical (Urea, NPK Complex)
- 50% organic + 50% chemical approach

**Characteristics:**
- Balanced sustainability score (70/100)
- Medium environmental impact
- Medium soil health improvement
- Both immediate and sustained nutrition
- Cost-effective

**Best For:**
- Moderate soil health (score 50-70)
- Balanced approach
- Most farming scenarios
- Transitioning to organic

## Application Schedules

Fertilizer applications are aligned with crop growth stages:

### Organic Schedule

1. **Basal Application** (Land Preparation)
   - Apply FYM and compost
   - Incorporate into soil
   - Allow 7-10 days for decomposition

2. **Top Dressing** (Vegetative Stage)
   - Apply neem cake or vermicompost
   - Side dressing near plant rows
   - Light incorporation

### Chemical Schedule

1. **Basal Application** (Sowing)
   - Apply DAP, MOP, and NPK complex
   - Mix with soil before seed placement

2. **First Top Dressing** (Early Vegetative)
   - Apply 50% of Urea dose
   - Broadcast between rows
   - Irrigate immediately

3. **Second Top Dressing** (Mid Vegetative)
   - Apply remaining 50% of Urea
   - Ensure adequate soil moisture

4. **Micronutrient Application** (Reproductive Stage)
   - Foliar spray of zinc sulfate
   - Apply during early morning or late evening

### Mixed Schedule

1. **Organic Basal** (Land Preparation)
   - Apply FYM first

2. **Chemical Basal** (Sowing)
   - Apply NPK complex

3. **Top Dressing** (Vegetative)
   - Combination of Urea and vermicompost
   - Maintain 7-day gap between applications

## Cost-Benefit Analysis

Each recommendation includes:

- **Total Cost**: Total investment required (INR)
- **Expected Yield Increase**: Percentage increase in crop yield
- **Expected Revenue Increase**: Additional revenue from increased yield (INR)
- **ROI**: Return on investment percentage
- **Payback Period**: Time to recover investment
- **Environmental Impact**: Low, Medium, or High
- **Soil Health Improvement**: Low, Medium, or High
- **Sustainability Score**: 0-100 rating

## Crop-Specific NPK Requirements

The engine uses crop-specific nutrient requirements (kg/ha):

| Crop       | Nitrogen (N) | Phosphorus (P) | Potassium (K) |
|------------|--------------|----------------|---------------|
| Rice       | 120          | 60             | 40            |
| Wheat      | 120          | 60             | 40            |
| Maize      | 150          | 75             | 50            |
| Cotton     | 120          | 60             | 60            |
| Sugarcane  | 250          | 115            | 115           |
| Potato     | 150          | 100            | 100           |
| Soybean    | 30           | 60             | 40            |
| Groundnut  | 25           | 50             | 75            |

## Recommendation Logic

The engine determines the recommended approach based on:

1. **Soil Health Score**
   - Poor (< 50): Recommends mixed or organic for soil improvement
   - Good (>= 70): Recommends organic (if budget allows) or chemical
   - Moderate (50-70): Recommends mixed approach

2. **Budget Constraints**
   - If budget is specified, ensures recommendation fits within budget
   - Adjusts recommendation type based on affordability

3. **Nutrient Deficiencies**
   - Calculates deficiencies based on soil data and crop requirements
   - Adds specific products to address deficiencies (e.g., zinc sulfate for zinc deficiency)

## Best Practices

### Application Tips

1. **Organic Fertilizers**
   - Apply well in advance of crop requirement
   - Ensure proper decomposition before sowing
   - Maintain soil moisture for faster decomposition
   - Use well-decomposed organic matter only

2. **Chemical Fertilizers**
   - Split nitrogen application for better efficiency
   - Apply phosphorus at sowing for root development
   - Avoid over-application to prevent nutrient toxicity
   - Do not apply during heavy rain

3. **Mixed Approach**
   - Apply organic fertilizers first, then chemical
   - Maintain gap of 7-10 days between applications
   - Monitor soil moisture levels
   - Combine with green manuring for better results

### Safety Warnings

- Store fertilizers in cool, dry place away from moisture
- Avoid direct contact with seeds during application
- Use protective equipment when handling chemical fertilizers
- Follow recommended dosages to prevent toxicity
- Irrigate after application for better nutrient uptake

## Integration with Other Services

The Fertilizer Recommendation Engine integrates with:

1. **Soil Health Calculator**: Provides soil health scores and nutrient analysis
2. **Crop Timeline Service**: Provides growth stages for scheduling applications
3. **Weather Service**: Can be used to adjust application timing based on weather
4. **Market Prices**: Can be integrated for real-time cost calculations

## Validation

The engine validates:
- Requirements 4.4: Generates fertilizer recommendations with application schedule by growth stage
- Requirements 4.5: Provides organic, chemical, and mixed fertilizer options with cost-benefit analysis

## Testing

Comprehensive unit tests cover:
- All three recommendation types
- Application schedule generation
- Cost-benefit analysis
- Scaling based on land area
- Edge cases (unknown crops, poor soil, budget constraints)
- Singleton pattern

Run tests:
```bash
npm test -- fertilizer-recommendation.test.ts
```

## Future Enhancements

1. **Real-time Price Integration**: Fetch current fertilizer prices from market APIs
2. **Weather-based Adjustments**: Adjust application timing based on weather forecasts
3. **Soil Test Integration**: Direct integration with soil testing labs
4. **Custom Fertilizer Blends**: Support for custom NPK ratios
5. **Organic Certification**: Track compliance with organic farming standards
6. **Multi-season Planning**: Long-term fertilizer planning across multiple seasons
7. **Regional Variations**: Region-specific fertilizer recommendations
8. **Mobile Notifications**: Send reminders for fertilizer applications

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
