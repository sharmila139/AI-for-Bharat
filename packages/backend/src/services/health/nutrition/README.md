# Nutrition and Lifestyle Tracking Module

## Overview

The Nutrition and Lifestyle Tracking module provides comprehensive nutrition planning, meal generation, compliance tracking, and dietary restriction support for rural communities. This module implements personalized nutrition plans based on user health profiles, occupation, and dietary needs.

## Features

### 1. Health Profile Management (Task 17.1)
- CRUD operations for user health profiles
- Automatic BMI calculation
- Storage of health conditions, allergies, and dietary restrictions
- Emergency contact management
- Profile validation

### 2. Calorie and Macronutrient Calculator (Task 17.2)
- **Mifflin-St Jeor Equation** for BMR calculation
- TDEE calculation with activity level multipliers
- Macronutrient distribution (protein, carbs, fat, fiber)
- Health condition adjustments (diabetes, kidney disease, etc.)
- Goal-based calorie adjustment (weight loss, gain, maintenance)

### 3. Meal Plan Generator (Task 17.3)
- Daily meal plans with 5 meals (breakfast, mid-morning, lunch, evening snack, dinner)
- Prioritizes local and seasonal foods
- Meets calorie and macronutrient targets
- Variety and balance in food selection
- Recipe instructions and preparation time

### 4. Cost Optimization (Task 17.4)
- Budget-based meal planning
- Cost per meal breakdown
- Affordable food alternatives
- Cost efficiency analysis (cost per calorie)
- Savings calculation and substitution tracking

### 5. Daily Meal Structure (Task 17.5)
- Structured 5-meal daily plans
- Meal timing schedule
- Portion sizes and nutritional breakdown
- Preparation instructions
- Compliance tracking per meal

### 6. Nutrition Information Display (Task 17.6)
- Detailed macronutrient breakdown
- Micronutrient estimation
- Visual nutrition data
- Cost per serving
- Daily progress tracking

### 7. Occupation-Based Calorie Adjustment (Task 17.7)
- **Sedentary (Desk job)**: 1600-2000 kcal
- **Light (Light physical)**: 2000-2500 kcal
- **Moderate (Moderate physical)**: 2500-3000 kcal
- **Heavy Labor (Heavy physical/Farming)**: 3000-3500 kcal

### 8. Meal Compliance Tracking (Task 17.8)
- Track meals consumed vs planned
- Daily and weekly compliance percentage
- Missed meals identification
- Compliance rating (1-5 scale)
- Adherence analytics

### 9. Nutrient Gap Analysis (Task 17.9)
- Compare actual vs target nutrients
- Identify deficiencies and excesses
- Food suggestions to fill gaps
- Daily, weekly, and monthly trends
- Personalized recommendations

### 10. Dietary Restriction Support (Task 17.10)
- **Dietary Preferences**: Vegetarian, vegan, gluten-free, lactose-intolerant, diabetic
- **Allergy Management**: Custom allergen filtering
- **Religious Restrictions**: Halal, kosher, Hindu, Jain
- **Medical Restrictions**: Low sodium, low fat, kidney-friendly
- **Ingredient Substitutions**: Automatic alternatives for restricted foods

## Architecture

### Services

1. **HealthProfileService**
   - Health profile CRUD operations
   - BMI calculation and categorization
   - Profile validation

2. **CalorieCalculatorService**
   - BMR calculation (Mifflin-St Jeor)
   - TDEE calculation
   - Macronutrient distribution
   - Health condition adjustments
   - Calorie validation

3. **MealPlanGeneratorService**
   - Nutrition plan creation
   - Daily meal plan generation
   - Food selection with local/seasonal priority
   - Cost optimization
   - Recipe generation

4. **NutritionTrackingService**
   - Meal consumption tracking
   - Compliance calculation
   - Nutrient gap analysis
   - Progress tracking
   - Nutrition information display

5. **DietaryRestrictionService**
   - Food validation against restrictions
   - Ingredient substitutions
   - Restriction filtering
   - Occupation calorie ranges

## API Endpoints

### Health Profile
- `POST /api/nutrition/health-profile` - Create health profile
- `GET /api/nutrition/health-profile/:userId` - Get health profile
- `PUT /api/nutrition/health-profile/:userId` - Update health profile
- `DELETE /api/nutrition/health-profile/:userId` - Delete health profile

### Calorie Calculator
- `POST /api/nutrition/calculate-requirements` - Calculate nutritional requirements
- `GET /api/nutrition/occupation-calories/:occupation` - Get occupation calorie range

### Meal Planning
- `POST /api/nutrition/meal-plan` - Create nutrition plan
- `POST /api/nutrition/meal-plan/:planId/generate-daily` - Generate daily meal plan
- `POST /api/nutrition/optimize-cost` - Calculate cost optimization

### Nutrition Tracking
- `GET /api/nutrition/meal/:mealPlanId/info` - Get nutrition information
- `POST /api/nutrition/meal/:mealPlanId/consume` - Mark meal consumed
- `GET /api/nutrition/compliance/daily/:userId/:date` - Get daily compliance
- `GET /api/nutrition/compliance/weekly/:userId/:startDate` - Get weekly compliance
- `GET /api/nutrition/nutrient-gaps/:userId` - Analyze nutrient gaps
- `GET /api/nutrition/progress/daily/:userId/:date` - Get daily progress

### Dietary Restrictions
- `POST /api/nutrition/validate-food` - Validate food against restrictions
- `POST /api/nutrition/substitutions` - Get ingredient substitutions
- `POST /api/nutrition/filter-foods` - Filter foods by restrictions
- `POST /api/nutrition/restriction-summary` - Get restriction summary

## Database Schema

### health_profiles
- User health information (height, weight, BMI, activity level)
- Chronic conditions and allergies
- Dietary restrictions and food allergies
- Emergency contacts

### nutrition_plans
- Personalized nutrition plans
- Target calories and macronutrients
- Meal schedule and preferences
- Budget constraints
- Active status and date range

### meal_plans
- Individual meal records
- Food items with quantities
- Nutritional breakdown
- Cost estimation
- Consumption tracking

## Usage Examples

### 1. Create Health Profile
```typescript
const profile = await healthProfileService.createHealthProfile({
  userId: 'user-123',
  heightCm: 170,
  weightKg: 70,
  activityLevel: 'moderate',
  occupationType: 'farming',
  dietaryRestrictions: ['vegetarian'],
  chronicConditions: ['diabetes']
});
```

### 2. Calculate Nutritional Requirements
```typescript
const requirements = calorieCalculator.calculateNutritionalRequirements(
  70,    // weight in kg
  170,   // height in cm
  30,    // age
  'male',
  'moderate',
  'farming',
  ['diabetes'],
  'maintenance'
);
```

### 3. Generate Daily Meal Plan
```typescript
const dailyPlan = await mealPlanGenerator.generateDailyMealPlan(
  'plan-123',
  new Date(),
  ['vegetarian'],
  ['onion', 'garlic']
);
```

### 4. Track Meal Compliance
```typescript
await nutritionTracking.markMealConsumed('meal-123', 5);
const compliance = await nutritionTracking.getDailyCompliance(
  'user-123',
  new Date()
);
```

### 5. Analyze Nutrient Gaps
```typescript
const analysis = await nutritionTracking.analyzeNutrientGaps(
  'user-123',
  'weekly',
  new Date()
);
```

## Algorithms

### Mifflin-St Jeor Equation (BMR)
```
BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + s
where s = +5 for males, -161 for females
```

### TDEE Calculation
```
TDEE = BMR × Activity Multiplier
Activity Multipliers:
- Sedentary: 1.2
- Light: 1.375
- Moderate: 1.55
- Active: 1.725
- Very Active: 1.9
```

### Macronutrient Distribution
```
Protein calories = Target calories × Protein %
Protein grams = Protein calories / 4

Carbs calories = Target calories × Carbs %
Carbs grams = Carbs calories / 4

Fat calories = Target calories × Fat %
Fat grams = Fat calories / 9

Fiber grams = (Target calories / 1000) × 14
```

## Testing

### Unit Tests
- Health profile CRUD operations
- BMI calculation accuracy
- Calorie requirement calculations
- Macronutrient distribution
- Meal plan generation
- Compliance tracking
- Nutrient gap analysis

### Test Coverage
- 80%+ code coverage
- All service methods tested
- Edge cases and error conditions
- Validation logic

## Performance Considerations

1. **Database Queries**: Optimized with proper indexes
2. **Caching**: Meal plans and food database cached
3. **Batch Operations**: Bulk meal generation for weekly plans
4. **Async Processing**: Non-blocking operations

## Security

1. **Data Validation**: All inputs validated
2. **SQL Injection Prevention**: Parameterized queries
3. **Access Control**: User-specific data isolation
4. **Sensitive Data**: Health information encrypted

## Future Enhancements

1. AI-powered meal recommendations
2. Integration with fitness trackers
3. Barcode scanning for food items
4. Community recipe sharing
5. Nutritionist consultation booking
6. Grocery list generation
7. Meal prep planning
8. Restaurant menu analysis

## Dependencies

- `pg`: PostgreSQL database client
- `express`: Web framework
- TypeScript for type safety

## Contributing

Follow the project's coding standards and ensure all tests pass before submitting changes.

## License

Part of RuralConnect AI project.
