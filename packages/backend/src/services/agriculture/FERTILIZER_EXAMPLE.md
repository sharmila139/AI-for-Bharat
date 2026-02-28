# Fertilizer Recommendation Engine - Usage Examples

## Example 1: Basic Usage for Rice Crop

```typescript
import { getFertilizerRecommendationEngine } from './fertilizer-recommendation';
import { getSoilHealthCalculator } from './soil-health-calculator';
import { CropTimelineService } from './crop-timeline';

// Step 1: Prepare soil data (from soil testing or OCR)
const soilData = {
  pH: 6.8,
  organicMatter: 1.5,
  nitrogen: 250,
  phosphorus: 18,
  potassium: 180,
  zinc: 0.5,
  iron: 5.0,
  texture: 'loamy'
};

// Step 2: Calculate soil health score
const calculator = getSoilHealthCalculator();
const soilHealthScore = calculator.calculateScore(soilData);

console.log('Soil Health Score:', soilHealthScore.overallScore);
console.log('Status:', soilHealthScore.overallStatus);

// Step 3: Generate crop timeline
const timelineService = new CropTimelineService();
const cropTimeline = timelineService.generateTimeline({
  cropId: 'rice-001',
  cropName: 'Rice',
  region: 'Punjab',
  sowingDate: new Date('2024-06-15'),
  landArea: 2,
  soilType: 'loamy',
  irrigationType: 'flood'
});

// Step 4: Generate fertilizer recommendations
const engine = getFertilizerRecommendationEngine();
const recommendations = engine.generateRecommendations({
  soilData,
  soilHealthScore,
  cropName: 'rice',
  cropTimeline,
  landArea: 2 // hectares
});

// Step 5: Display recommendations
console.log('\n=== RECOMMENDED APPROACH ===');
console.log('Type:', recommendations.recommended);
console.log('Summary:', recommendations.comparisonSummary);

// Display organic recommendation
console.log('\n=== ORGANIC RECOMMENDATION ===');
console.log('Total Cost: ₹', recommendations.organic.costBenefitAnalysis.totalCost);
console.log('Expected Yield Increase:', recommendations.organic.costBenefitAnalysis.expectedYieldIncrease, '%');
console.log('ROI:', recommendations.organic.costBenefitAnalysis.roi, '%');
console.log('Sustainability Score:', recommendations.organic.costBenefitAnalysis.sustainability);

console.log('\nProducts:');
recommendations.organic.products.forEach(product => {
  console.log(`- ${product.name}: ${product.totalQuantity} kg/tons @ ₹${product.totalCost}`);
});

console.log('\nApplication Schedule:');
recommendations.organic.applicationSchedule.forEach(schedule => {
  console.log(`\n${schedule.stage} (${schedule.growthStage})`);
  console.log('Date:', schedule.timing.toDateString());
  console.log('Instructions:', schedule.instructions.join(', '));
});

// Display chemical recommendation
console.log('\n=== CHEMICAL RECOMMENDATION ===');
console.log('Total Cost: ₹', recommendations.chemical.costBenefitAnalysis.totalCost);
console.log('Expected Yield Increase:', recommendations.chemical.costBenefitAnalysis.expectedYieldIncrease, '%');
console.log('Total NPK:', recommendations.chemical.totalNPK);

// Display mixed recommendation
console.log('\n=== MIXED RECOMMENDATION ===');
console.log('Total Cost: ₹', recommendations.mixed.costBenefitAnalysis.totalCost);
console.log('Expected Yield Increase:', recommendations.mixed.costBenefitAnalysis.expectedYieldIncrease, '%');
console.log('Environmental Impact:', recommendations.mixed.costBenefitAnalysis.environmentalImpact);
```

## Example 2: Budget-Constrained Farmer

```typescript
// Farmer has limited budget of ₹10,000
const recommendations = engine.generateRecommendations({
  soilData,
  soilHealthScore,
  cropName: 'wheat',
  cropTimeline,
  landArea: 1,
  budget: 10000 // Budget constraint
});

// Engine will recommend the most cost-effective option within budget
console.log('Recommended within budget:', recommendations.recommended);

// Check if recommendation fits budget
const recommendedOption = recommendations[recommendations.recommended];
if (recommendedOption.costBenefitAnalysis.totalCost <= 10000) {
  console.log('✓ Fits within budget');
  console.log('Cost:', recommendedOption.costBenefitAnalysis.totalCost);
} else {
  console.log('⚠ Exceeds budget, consider alternatives');
}
```

## Example 3: Poor Soil Health - Organic Focus

```typescript
// Soil with poor health needs improvement
const poorSoilData = {
  pH: 5.2, // Acidic
  organicMatter: 0.3, // Very low
  nitrogen: 150, // Low
  phosphorus: 8, // Low
  potassium: 90, // Low
  texture: 'sandy'
};

const poorSoilScore = calculator.calculateScore(poorSoilData);
console.log('Poor Soil Score:', poorSoilScore.overallScore); // Likely < 50

const recommendations = engine.generateRecommendations({
  soilData: poorSoilData,
  soilHealthScore: poorSoilScore,
  cropName: 'maize',
  cropTimeline,
  landArea: 1
});

// Engine will likely recommend organic or mixed for soil improvement
console.log('Recommended for poor soil:', recommendations.recommended);
console.log('Soil Health Improvement:', 
  recommendations[recommendations.recommended].costBenefitAnalysis.soilHealthImprovement
);

// Show specific recommendations for soil improvement
console.log('\nSoil Improvement Recommendations:');
poorSoilScore.recommendations.forEach(rec => {
  console.log('-', rec);
});
```

## Example 4: Micronutrient Deficiency

```typescript
// Soil with zinc deficiency
const deficientSoilData = {
  pH: 7.0,
  organicMatter: 1.0,
  nitrogen: 300,
  phosphorus: 20,
  potassium: 200,
  zinc: 0.3, // Deficient (< 0.6)
  iron: 3.0, // Deficient (< 4.5)
  texture: 'loamy'
};

const recommendations = engine.generateRecommendations({
  soilData: deficientSoilData,
  soilHealthScore: calculator.calculateScore(deficientSoilData),
  cropName: 'rice',
  cropTimeline,
  landArea: 1
});

// Check chemical recommendation for micronutrient supplements
console.log('Micronutrients in chemical recommendation:');
console.log(recommendations.chemical.micronutrients);

// Find zinc sulfate in products
const zincProduct = recommendations.chemical.products.find(p => 
  p.name.includes('Zinc')
);

if (zincProduct) {
  console.log('\nZinc Sulfate Application:');
  console.log('Quantity:', zincProduct.totalQuantity, 'kg');
  console.log('Cost:', zincProduct.totalCost, 'INR');
  console.log('Method:', zincProduct.applicationMethod);
}
```

## Example 5: Comparing All Three Options

```typescript
const recommendations = engine.generateRecommendations({
  soilData,
  soilHealthScore,
  cropName: 'cotton',
  cropTimeline,
  landArea: 2
});

// Create comparison table
console.log('\n=== FERTILIZER OPTIONS COMPARISON ===\n');
console.log('Metric                  | Organic  | Chemical | Mixed');
console.log('------------------------|----------|----------|----------');

const types: ('organic' | 'chemical' | 'mixed')[] = ['organic', 'chemical', 'mixed'];
const metrics = [
  { label: 'Total Cost (₹)', key: 'totalCost' },
  { label: 'Yield Increase (%)', key: 'expectedYieldIncrease' },
  { label: 'ROI (%)', key: 'roi' },
  { label: 'Sustainability', key: 'sustainability' },
  { label: 'Env. Impact', key: 'environmentalImpact' },
  { label: 'Soil Improvement', key: 'soilHealthImprovement' }
];

metrics.forEach(metric => {
  const values = types.map(type => {
    const value = recommendations[type].costBenefitAnalysis[metric.key];
    return String(value).padEnd(8);
  });
  console.log(`${metric.label.padEnd(23)} | ${values.join(' | ')}`);
});

console.log('\nRecommended:', recommendations.recommended.toUpperCase());
```

## Example 6: Application Schedule Calendar

```typescript
const recommendations = engine.generateRecommendations({
  soilData,
  soilHealthScore,
  cropName: 'wheat',
  cropTimeline,
  landArea: 1
});

// Generate calendar view of fertilizer applications
console.log('\n=== FERTILIZER APPLICATION CALENDAR ===\n');

const schedule = recommendations.mixed.applicationSchedule;

schedule.forEach((application, index) => {
  console.log(`\n📅 Application ${index + 1}: ${application.stage}`);
  console.log('Date:', application.timing.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));
  console.log('Growth Stage:', application.growthStage);
  
  console.log('\n📦 Products to Apply:');
  application.products.forEach(product => {
    console.log(`  • ${product.name}: ${product.applicationRate} kg/ha`);
  });
  
  console.log('\n📋 Instructions:');
  application.instructions.forEach((instruction, i) => {
    console.log(`  ${i + 1}. ${instruction}`);
  });
  
  console.log('\n✅ Expected Results:', application.expectedResults);
  console.log('─'.repeat(60));
});
```

## Example 7: Cost Breakdown

```typescript
const recommendations = engine.generateRecommendations({
  soilData,
  soilHealthScore,
  cropName: 'rice',
  cropTimeline,
  landArea: 2
});

// Detailed cost breakdown for organic recommendation
console.log('\n=== ORGANIC FERTILIZER COST BREAKDOWN ===\n');

let totalCost = 0;
recommendations.organic.products.forEach(product => {
  const unitCost = product.costPerUnit;
  const quantity = product.totalQuantity;
  const cost = product.totalCost;
  
  console.log(`${product.name}`);
  console.log(`  Quantity: ${quantity} ${product.name.includes('FYM') || product.name.includes('Compost') ? 'tons' : 'kg'}`);
  console.log(`  Rate: ₹${unitCost} per ${product.name.includes('FYM') || product.name.includes('Compost') ? 'ton' : 'kg'}`);
  console.log(`  Cost: ₹${cost}`);
  console.log();
  
  totalCost += cost;
});

console.log('─'.repeat(40));
console.log(`Total Investment: ₹${totalCost}`);
console.log(`Expected Revenue Increase: ₹${recommendations.organic.costBenefitAnalysis.expectedRevenueIncrease}`);
console.log(`Net Profit: ₹${recommendations.organic.costBenefitAnalysis.expectedRevenueIncrease - totalCost}`);
console.log(`ROI: ${recommendations.organic.costBenefitAnalysis.roi}%`);
console.log(`Payback Period: ${recommendations.organic.costBenefitAnalysis.paybackPeriod}`);
```

## Example 8: Integration with API Endpoint

```typescript
// Express.js API endpoint example
import express from 'express';

const router = express.Router();

router.post('/api/fertilizer-recommendations', async (req, res) => {
  try {
    const { soilData, cropName, landArea, sowingDate, budget } = req.body;
    
    // Validate input
    if (!soilData || !cropName || !landArea) {
      return res.status(400).json({
        error: 'Missing required fields: soilData, cropName, landArea'
      });
    }
    
    // Calculate soil health
    const calculator = getSoilHealthCalculator();
    const soilHealthScore = calculator.calculateScore(soilData);
    
    // Generate crop timeline
    const timelineService = new CropTimelineService();
    const cropTimeline = timelineService.generateTimeline({
      cropId: `${cropName}-${Date.now()}`,
      cropName,
      region: req.body.region || 'India',
      sowingDate: sowingDate ? new Date(sowingDate) : undefined,
      landArea,
      soilType: soilData.texture || 'loamy',
      irrigationType: req.body.irrigationType || 'flood'
    });
    
    // Generate recommendations
    const engine = getFertilizerRecommendationEngine();
    const recommendations = engine.generateRecommendations({
      soilData,
      soilHealthScore,
      cropName,
      cropTimeline,
      landArea,
      budget
    });
    
    // Return response
    res.json({
      success: true,
      data: {
        soilHealthScore: {
          overall: soilHealthScore.overallScore,
          status: soilHealthScore.overallStatus
        },
        recommendations: {
          recommended: recommendations.recommended,
          organic: {
            cost: recommendations.organic.costBenefitAnalysis.totalCost,
            yieldIncrease: recommendations.organic.costBenefitAnalysis.expectedYieldIncrease,
            products: recommendations.organic.products,
            schedule: recommendations.organic.applicationSchedule
          },
          chemical: {
            cost: recommendations.chemical.costBenefitAnalysis.totalCost,
            yieldIncrease: recommendations.chemical.costBenefitAnalysis.expectedYieldIncrease,
            products: recommendations.chemical.products,
            schedule: recommendations.chemical.applicationSchedule
          },
          mixed: {
            cost: recommendations.mixed.costBenefitAnalysis.totalCost,
            yieldIncrease: recommendations.mixed.costBenefitAnalysis.expectedYieldIncrease,
            products: recommendations.mixed.products,
            schedule: recommendations.mixed.applicationSchedule
          }
        },
        comparisonSummary: recommendations.comparisonSummary
      }
    });
    
  } catch (error) {
    console.error('Error generating fertilizer recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate fertilizer recommendations',
      message: error.message
    });
  }
});

export default router;
```

## Example 9: Mobile App Integration

```typescript
// React Native component example
import React, { useState } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';

const FertilizerRecommendationScreen = ({ soilData, cropName, landArea }) => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fertilizer-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soilData, cropName, landArea })
      });
      
      const data = await response.json();
      setRecommendations(data.data.recommendations);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView>
      <Button 
        title="Get Fertilizer Recommendations" 
        onPress={fetchRecommendations}
        disabled={loading}
      />
      
      {recommendations && (
        <View>
          <Text>Recommended: {recommendations.recommended}</Text>
          
          {/* Display organic option */}
          <View>
            <Text>Organic Option</Text>
            <Text>Cost: ₹{recommendations.organic.cost}</Text>
            <Text>Yield Increase: {recommendations.organic.yieldIncrease}%</Text>
          </View>
          
          {/* Display chemical option */}
          <View>
            <Text>Chemical Option</Text>
            <Text>Cost: ₹{recommendations.chemical.cost}</Text>
            <Text>Yield Increase: {recommendations.chemical.yieldIncrease}%</Text>
          </View>
          
          {/* Display mixed option */}
          <View>
            <Text>Mixed Option</Text>
            <Text>Cost: ₹{recommendations.mixed.cost}</Text>
            <Text>Yield Increase: {recommendations.mixed.yieldIncrease}%</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default FertilizerRecommendationScreen;
```

## Tips for Best Results

1. **Accurate Soil Data**: Ensure soil testing is done properly for accurate recommendations
2. **Timely Application**: Follow the application schedule aligned with crop growth stages
3. **Weather Monitoring**: Adjust application timing based on weather forecasts
4. **Budget Planning**: Consider the cost-benefit analysis when choosing fertilizer type
5. **Soil Health Priority**: For poor soil, prioritize organic or mixed approaches
6. **Record Keeping**: Track applications and results for future reference
7. **Expert Consultation**: Consult agricultural experts for complex cases
