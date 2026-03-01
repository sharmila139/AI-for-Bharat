# Soil Analysis Photo Capture Implementation

## Overview

The Soil Analysis Screen provides a comprehensive interface for farmers to capture and upload soil photos for AI-based analysis or OCR extraction from government soil health cards.

## Features

### 1. Photo Capture & Selection
- **Camera Integration**: Direct camera access for capturing soil photos
- **Gallery Selection**: Choose existing photos from device gallery
- **Permission Handling**: Automatic camera permission requests on Android
- **Photo Preview**: Review captured photo before upload

### 2. Analysis Types
- **Direct Soil Photo**: AI-based classification of soil type, texture, and nutrient indicators
- **Soil Health Card**: OCR extraction of nutrient values from government documents

### 3. User Experience
- **Photo Guidelines**: Display best practices for capturing quality photos
- **Loading States**: Clear feedback during upload and analysis
- **Error Handling**: Graceful error messages with retry options
- **Manual Review**: Alerts when confidence is below threshold

### 4. Quality Assurance
- **Image Quality Validation**: Backend validates image quality before analysis
- **Confidence Threshold**: 85% minimum confidence per Property 12
- **Clear Error Messages**: User-friendly error descriptions

## Technical Implementation

### Dependencies
- `react-native-image-picker`: Camera and gallery integration
- `axios`: HTTP requests for API communication
- Custom services: `soilAnalysisService` for API calls

### Key Components

#### SoilAnalysisScreen
Main screen component with:
- State management for image selection and upload
- Camera/gallery integration
- Analysis type selection
- Upload and error handling

#### SoilAnalysisService
API service handling:
- Photo upload with multipart/form-data
- Analysis type specification
- Error response handling
- Quality requirements fetching

### API Integration

**Endpoint**: `POST /api/agriculture/soil/analyze`

**Request**:
```typescript
FormData {
  image: File (JPEG/PNG)
  type: 'photo' | 'health-card'
}
```

**Response**:
```typescript
{
  success: boolean
  analysisType: 'photo' | 'health-card'
  data?: {
    soilType?: string
    texture?: string
    confidence?: number
    meetsThreshold?: boolean
    nutrientIndicators?: {
      nitrogen?: string
      phosphorus?: string
      potassium?: string
      pH?: number
      organicCarbon?: number
    }
  }
  requiresManualReview?: boolean
  error?: {
    code: string
    message: string
  }
}
```

## User Flow

1. **Select Analysis Type**
   - User chooses between direct photo or health card
   - Modal displays options with descriptions

2. **Capture/Select Photo**
   - User taps "Take Photo" or "Choose from Gallery"
   - Camera permission requested if needed
   - Photo displayed in preview

3. **Review Photo**
   - User can remove or retake photo
   - Guidelines displayed for quality

4. **Upload & Analyze**
   - User taps "Upload & Analyze"
   - Loading state shown during processing
   - Results displayed in alert

5. **Handle Results**
   - Success: Navigate to detailed results
   - Failure: Show error with retry option
   - Manual Review: Alert user about quality issues

## Error Handling

### Camera Permission Denied
- Alert user to enable permission in settings
- Provide clear instructions

### Poor Image Quality
- Backend validates image quality
- User alerted to retake photo
- Guidelines displayed

### Low Confidence (<85%)
- Manual review required alert
- Option to retry with better photo
- Contact support option

### Network Errors
- Timeout after 30 seconds
- Retry option provided
- Offline mode guidance

## Accessibility

- Large touch targets for buttons
- Clear visual feedback
- Icon-based navigation
- Screen reader compatible
- High contrast colors

## Testing

### Unit Tests
- Component rendering
- Button interactions
- State management
- Error handling

### Integration Tests
- Camera/gallery integration
- API service calls
- Navigation flow
- Permission handling

## Future Enhancements

1. **Offline Analysis**: On-device ML model for basic classification
2. **Batch Upload**: Multiple photos at once
3. **Photo Editing**: Crop, rotate, adjust brightness
4. **History**: View past analyses
5. **Comparison**: Compare multiple soil samples
6. **Export**: Share results as PDF/image

## Navigation Integration

The screen is integrated into the Agriculture Stack:

```typescript
AgricultureStackParamList {
  SoilAnalysis: undefined
}
```

Navigate to screen:
```typescript
navigation.navigate('SoilAnalysis');
```

## Related Files

- `packages/mobile/src/screens/agriculture/SoilAnalysisScreen.tsx`
- `packages/mobile/src/services/soilAnalysisService.ts`
- `packages/backend/src/api/soil-analysis.ts`
- `packages/mobile/__tests__/SoilAnalysisScreen.test.tsx`

## Requirements Validation

✅ Create screen for soil analysis photo capture  
✅ Allow users to take photo with camera or select from gallery  
✅ Display photo preview before upload  
✅ Upload photo to backend API for analysis  
✅ Show loading state during upload and analysis  
✅ Handle errors gracefully (camera permissions, upload failures)  
✅ Link to farm profiles for context (via navigation)  
✅ Use LoadingState and ErrorState components  
✅ Follow existing navigation patterns  
✅ Ensure TypeScript type safety  
✅ Make screen accessible and user-friendly for rural farmers  

## Design Compliance

- **Property 12**: AI confidence threshold (85%) validated
- **Requirement 4.1**: Soil photo upload and AI analysis
- **Requirement 4.2**: Soil health card OCR support
- Offline-first architecture ready (service layer prepared)
- Multi-language support ready (text can be localized)
- Accessibility features implemented
