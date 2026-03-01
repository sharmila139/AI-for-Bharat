# Crop Recommendation Input Form Implementation

## Overview

This document describes the implementation of the Crop Recommendation Input Form (Task 33.2) for the RuralConnect AI mobile application.

## Files Created

### 1. Type Definitions
**File:** `src/types/cropRecommendation.ts`

Defines TypeScript types and constants for crop recommendations:
- `CropRecommendationInput` - Input parameters for the recommendation API
- `CropRecommendation` - Individual crop recommendation structure
- `CropRecommendationResponse` - API response structure
- Constants: `SOIL_TYPES`, `REGIONS`, `SEASONS`, `WATER_AVAILABILITY`

### 2. Service Layer
**File:** `src/services/cropRecommendationService.ts`

Handles API communication for crop recommendations:
- `getCropRecommendations()` - POST request to backend API
- `getSupportedCrops()` - GET list of available crops
- Includes authentication headers and timeout handling

### 3. Main Screen Component
**File:** `src/screens/agriculture/CropRecommendationInputScreen.tsx`

The main input form screen with the following features:

#### Features Implemented

1. **Farm Profile Integration**
   - Load user's saved farm profiles
   - Pre-fill form data from selected farm profile
   - Modal selector for choosing farms
   - Option to enter data manually

2. **Form Sections**
   - **Location**: Region selection and location input
   - **Soil Information**: Soil type, NPK values, pH level
   - **Climate Conditions**: Season, temperature, humidity, rainfall
   - **Additional Information**: Land size, budget, previous crop (optional)

3. **Form Validation**
   - Required field validation
   - Numeric range validation for all parameters
   - User-friendly error messages
   - Matches backend API validation rules

4. **User Experience**
   - Clean, organized layout with sections
   - Button-based selectors for categorical data
   - Numeric inputs with hints showing valid ranges
   - Loading states during API calls
   - Error handling with retry options

5. **Navigation**
   - Integrated with React Navigation
   - Type-safe navigation props
   - Deep linking support

## Navigation Updates

### Updated Files

1. **`src/navigation/types.ts`**
   - Added `CropRecommendationInput` screen to `AgricultureStackParamList`
   - Updated deep linking configuration

2. **`src/navigation/AgricultureNavigator.tsx`**
   - Imported `CropRecommendationInputScreen`
   - Added screen to stack navigator
   - Configured screen options

## Form Fields

### Required Fields

| Field | Type | Range | Unit | Description |
|-------|------|-------|------|-------------|
| Soil Type | Select | 7 options | - | Alluvial, Black, Red, Laterite, Sandy, Clayey, Loamy |
| Region | Select | 5 options | - | North, South, East, West, Central India |
| Season | Select | 3 options | - | Kharif, Rabi, Zaid |
| Nitrogen (N) | Number | 0-200 | kg/ha | Soil nitrogen content |
| Phosphorus (P) | Number | 0-100 | kg/ha | Soil phosphorus content |
| Potassium (K) | Number | 0-150 | kg/ha | Soil potassium content |
| pH | Number | 3.0-10.0 | - | Soil pH level |
| Temperature | Number | -10 to 50 | °C | Average temperature |
| Humidity | Number | 0-100 | % | Average humidity |
| Rainfall | Number | 0-500 | mm/month | Monthly rainfall |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| Location | Text | District, State |
| Land Size | Number | Farm area in acres |
| Budget | Number | Investment capacity in ₹ |
| Previous Crop | Text | Last crop grown |

## API Integration

### Endpoint
```
POST /api/crop-recommendation
```

### Request Body
```typescript
{
  soilType: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  region: string;
  season: string;
  topN?: number;
}
```

### Response
```typescript
{
  recommendations: CropRecommendation[];
  farmConditions: CropRecommendationInput;
  source: 'ml-model' | 'rule-based' | 'cached';
  timestamp: string;
}
```

## Testing

### Test File
**File:** `__tests__/CropRecommendationInput.test.tsx`

Tests implemented:
- ✅ Form data constants validation
- ✅ Soil types match backend expectations
- ✅ Regions and seasons are correctly defined
- ✅ Numeric range validation logic
- ✅ Type structure validation

### Running Tests
```bash
cd packages/mobile
npm test -- CropRecommendationInput.test.tsx
```

## Usage Flow

1. **User navigates to Crop Recommendation**
   - From Agriculture Home or Dashboard

2. **Farm Profile Selection (Optional)**
   - If user has saved farms, they can select one
   - Form pre-fills with farm data (location, soil type, land size)
   - User can choose to enter manually instead

3. **Fill Required Fields**
   - Select soil type, region, and season
   - Enter NPK values and pH
   - Enter climate data (temperature, humidity, rainfall)

4. **Add Optional Information**
   - Land size, budget, previous crop

5. **Submit Form**
   - Validation runs on all fields
   - API call to backend
   - Loading state shown during request

6. **View Results**
   - Navigate to results screen (to be implemented in Task 33.3)
   - Display top 5 crop recommendations

## Error Handling

1. **Validation Errors**
   - Alert dialogs with specific field errors
   - Prevents submission until fixed

2. **Network Errors**
   - Error message displayed in form
   - User can retry submission

3. **API Errors**
   - Displays backend error messages
   - Fallback to generic error message

## Accessibility Features

- Clear labels for all inputs
- Hint text showing valid ranges
- Button-based selectors for easy interaction
- Error messages in plain language
- Keyboard-friendly input types (numeric, decimal)

## Future Enhancements

1. **Smart Defaults**
   - Use device location to pre-fill region
   - Fetch current weather data automatically
   - Suggest NPK values based on soil type

2. **Soil Health Card Integration**
   - OCR to extract NPK values from photos
   - Link to Soil Analysis screen

3. **Historical Data**
   - Save previous inputs for quick reuse
   - Show trends in recommendations

4. **Offline Support**
   - Cache form data locally
   - Queue submissions when offline
   - Sync when connectivity restored

## Dependencies

- React Native
- React Navigation
- Axios (HTTP client)
- TypeScript
- Farm Profile Service
- Loading/Error State Components

## Related Tasks

- ✅ Task 33.1: Farm profile management screens
- ✅ Task 33.2: Crop recommendation input form (Current)
- ⏳ Task 33.3: Crop recommendation results display
- ⏳ Task 33.4: Soil analysis photo capture

## Notes

- Form validation matches backend API requirements exactly
- All numeric ranges align with agricultural standards
- Soil types and regions match government classifications
- Multi-language support ready (labels can be translated)
- Follows existing app patterns for consistency
