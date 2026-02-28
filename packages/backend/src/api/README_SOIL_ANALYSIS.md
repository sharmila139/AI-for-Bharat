# Soil Analysis API Documentation

## Overview

The Soil Analysis API provides comprehensive endpoints for soil photo upload and analysis, supporting both direct soil photo classification using AI/ML models and OCR extraction from government soil health cards.

## Features

- **Direct Soil Photo Analysis**: AI-powered classification of soil type, texture, and nutrient indicators
- **Soil Health Card OCR**: Extract nutrient values from government-issued soil health cards
- **Image Quality Validation**: Pre-processing quality checks before analysis
- **Confidence Threshold Validation**: 85% minimum confidence per Property 12 (Requirements 4.1, 12.1)
- **Batch Processing**: Analyze multiple images in a single request
- **Error Handling**: Graceful error handling with appropriate HTTP status codes

## API Endpoints

### 1. POST /api/agriculture/soil/analyze

Main endpoint for soil photo upload and analysis.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body Parameters:
  - `image` (file, required): Image file (JPEG, PNG, WebP)
  - `type` (string, optional): Analysis type - `"photo"` (default) or `"health-card"`

**Response (Success - Photo Analysis):**
```json
{
  "success": true,
  "analysisType": "photo",
  "data": {
    "soilType": "alluvial",
    "texture": "loamy",
    "confidence": 0.92,
    "meetsThreshold": true,
    "nutrientIndicators": {
      "nitrogen": "high",
      "phosphorus": "medium",
      "potassium": "high"
    },
    "topPredictions": [
      { "soilType": "alluvial", "confidence": 0.92 },
      { "soilType": "black", "confidence": 0.05 },
      { "soilType": "red", "confidence": 0.03 }
    ]
  },
  "imageQuality": {
    "isAcceptable": true,
    "score": 85,
    "issues": [],
    "suggestions": []
  },
  "requiresManualReview": false,
  "processingTimeMs": 250
}
```

**Response (Success - Health Card OCR):**
```json
{
  "success": true,
  "analysisType": "health-card",
  "data": {
    "nutrientIndicators": {
      "nitrogen": "280",
      "phosphorus": "45",
      "potassium": "320",
      "pH": 7.2,
      "organicCarbon": 0.65
    },
    "confidence": 0.88,
    "meetsThreshold": true
  },
  "imageQuality": {
    "isAcceptable": true,
    "score": 90
  },
  "validation": {
    "isValid": true,
    "errors": []
  },
  "requiresManualReview": false,
  "processingTimeMs": 450
}
```

**Response (Error - Poor Image Quality):**
```json
{
  "success": false,
  "analysisType": "photo",
  "imageQuality": {
    "isAcceptable": false,
    "score": 45,
    "issues": [
      {
        "type": "blur",
        "severity": "high",
        "message": "Image appears blurry or out of focus"
      }
    ],
    "suggestions": [
      "Hold the camera steady and ensure the document is in focus"
    ]
  },
  "error": {
    "code": "POOR_IMAGE_QUALITY",
    "message": "Image quality is not suitable for accurate text extraction..."
  },
  "requiresManualReview": true,
  "processingTimeMs": 120
}
```

**Response (Error - Low Confidence):**
```json
{
  "success": false,
  "analysisType": "photo",
  "data": {
    "soilType": "red",
    "confidence": 0.72,
    "meetsThreshold": false
  },
  "requiresManualReview": true,
  "processingTimeMs": 280
}
```

**Status Codes:**
- `200 OK`: Analysis successful
- `400 Bad Request`: Invalid input or poor image quality
- `500 Internal Server Error`: Server error during processing

---

### 2. POST /api/agriculture/soil/analyze/batch

Batch analysis of multiple soil photos.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body Parameters:
  - `images` (files, required): Array of image files (max 10)
  - `type` (string, optional): Analysis type - `"photo"` or `"health-card"`

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "success": true,
      "analysisType": "photo",
      "data": {
        "soilType": "alluvial",
        "confidence": 0.91
      },
      "requiresManualReview": false
    },
    {
      "success": true,
      "analysisType": "photo",
      "data": {
        "soilType": "black",
        "confidence": 0.87
      },
      "requiresManualReview": false
    }
  ],
  "summary": {
    "total": 2,
    "successful": 2,
    "needsReview": 0,
    "avgProcessingTimeMs": 200
  },
  "processingTimeMs": 450
}
```

**Status Codes:**
- `200 OK`: Batch processing completed
- `400 Bad Request`: Invalid input (no images, too many images)
- `500 Internal Server Error`: Server error during processing

---

### 3. GET /api/agriculture/soil/supported-types

Get list of supported soil types with descriptions.

**Request:**
- Method: `GET`
- No parameters required

**Response:**
```json
{
  "success": true,
  "soilTypes": [
    {
      "id": "alluvial",
      "name": "Alluvial Soil",
      "description": "Found in river valleys and deltas, rich in nutrients",
      "characteristics": [
        "High fertility",
        "Good water retention",
        "Suitable for most crops"
      ]
    },
    {
      "id": "black",
      "name": "Black Soil (Regur)",
      "description": "Rich in clay, ideal for cotton cultivation",
      "characteristics": [
        "High clay content",
        "Good moisture retention",
        "Rich in calcium and magnesium"
      ]
    }
    // ... more soil types
  ],
  "confidenceThreshold": 0.85
}
```

**Status Codes:**
- `200 OK`: Success
- `500 Internal Server Error`: Server error

---

### 4. GET /api/agriculture/soil/quality-requirements

Get image quality requirements and guidelines.

**Request:**
- Method: `GET`
- No parameters required

**Response:**
```json
{
  "success": true,
  "requirements": {
    "minWidth": 800,
    "minHeight": 600,
    "maxFileSize": 10485760,
    "minFileSize": 10240,
    "acceptedFormats": ["jpeg", "jpg", "png", "webp"],
    "minQualityScore": 60
  },
  "guidelines": [
    "Ensure good lighting (natural daylight is best)",
    "Hold camera steady and parallel to soil/document",
    "Make sure image is in focus and clearly readable",
    "Avoid shadows, glare, or reflections",
    "Capture the entire soil sample or document within the frame",
    "Use minimum 800x600 resolution"
  ]
}
```

**Status Codes:**
- `200 OK`: Success
- `500 Internal Server Error`: Server error

---

## Integration with Existing Services

### Image Quality Checker
- Pre-validates image quality before processing
- Checks resolution, file size, format, blur, contrast, and skew
- Provides actionable feedback for users to retake photos

### OCR Pipeline (for Health Cards)
- Integrates with `soil-ocr-pipeline.ts`
- Performs OCR extraction, validation, and field mapping
- Handles retry logic for transient failures

### ML Classification Service (for Photos)
- Integrates with `soil-classification-service.ts`
- Calls Python ML inference service
- Validates confidence threshold (85% minimum)

## Confidence Threshold Validation

Per **Property 12** (Requirements 4.1, 12.1), all AI-based classifications must meet an 85% confidence threshold for auto-acceptance:

- **Confidence ≥ 85%**: Auto-accepted, `requiresManualReview: false`
- **Confidence < 85%**: Requires manual review, `requiresManualReview: true`

This ensures high accuracy and reliability of automated soil analysis results.

## Error Codes

| Code | Description |
|------|-------------|
| `MISSING_IMAGE` | No image file provided in request |
| `INVALID_ANALYSIS_TYPE` | Analysis type must be "photo" or "health-card" |
| `POOR_IMAGE_QUALITY` | Image quality below acceptable threshold |
| `ML_SERVICE_ERROR` | ML classification service failed |
| `OCR_SERVICE_ERROR` | OCR processing service failed |
| `TOO_MANY_IMAGES` | Batch request exceeds 10 images limit |
| `INTERNAL_ERROR` | Unexpected server error |

## Usage Examples

### cURL Example - Photo Analysis

```bash
curl -X POST http://localhost:3000/api/agriculture/soil/analyze \
  -F "image=@soil_sample.jpg" \
  -F "type=photo"
```

### cURL Example - Health Card OCR

```bash
curl -X POST http://localhost:3000/api/agriculture/soil/analyze \
  -F "image=@health_card.jpg" \
  -F "type=health-card"
```

### cURL Example - Batch Analysis

```bash
curl -X POST http://localhost:3000/api/agriculture/soil/analyze/batch \
  -F "images=@soil1.jpg" \
  -F "images=@soil2.jpg" \
  -F "images=@soil3.jpg" \
  -F "type=photo"
```

### JavaScript/TypeScript Example

```typescript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('type', 'photo');

const response = await fetch('/api/agriculture/soil/analyze', {
  method: 'POST',
  body: formData,
});

const result = await response.json();

if (result.success) {
  console.log('Soil Type:', result.data.soilType);
  console.log('Confidence:', result.data.confidence);
  console.log('Meets Threshold:', result.data.meetsThreshold);
} else {
  console.error('Analysis failed:', result.error.message);
}
```

## Testing

Unit tests are located in `__tests__/soil-analysis.test.ts` and cover:

- Input validation (missing image, invalid type)
- Image quality validation
- Confidence threshold enforcement (Property 12)
- Successful photo analysis
- Successful health card OCR
- Batch processing
- Error handling
- Integration with existing services

Run tests with:
```bash
npm test -- src/api/__tests__/soil-analysis.test.ts
```

## Dependencies

- `express`: Web framework
- `multer`: File upload handling
- `soil-ocr-pipeline`: OCR processing for health cards
- `image-quality-checker`: Image quality validation
- `soil-classification-service`: ML-based soil classification

## Performance Considerations

- Image quality check: ~50-100ms
- ML classification: ~200-500ms
- OCR processing: ~300-600ms
- Batch processing: Sequential to avoid overwhelming system
- Temporary files cleaned up after processing

## Security Considerations

- File size limit: 10MB maximum
- File type validation: Only image files accepted
- Temporary files stored securely and cleaned up
- Input sanitization for all parameters
- Rate limiting recommended for production deployment

## Future Enhancements

1. **S3 Integration**: Store uploaded images for audit trail
2. **Async Processing**: Queue-based processing for large batches
3. **Caching**: Cache ML model results for similar images
4. **WebSocket Support**: Real-time progress updates for batch processing
5. **Multi-language Support**: Localized error messages and responses
6. **Advanced Analytics**: Track soil type distribution, confidence trends
