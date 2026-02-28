# Soil Health Card OCR System

## Overview

The Soil Health Card OCR system provides automated extraction of nutrient values from government-issued soil health card images. It uses Tesseract OCR with a comprehensive validation and field mapping pipeline to ensure accurate data extraction.

## Features

- **Automated Text Extraction**: Uses Tesseract.js to extract text from soil health card images
- **Image Quality Checking**: Pre-processes images to detect quality issues before OCR
- **Data Validation**: Validates extracted values against standard soil parameter ranges
- **Field Mapping**: Maps raw OCR data to standardized soil health format with recommendations
- **Manual Correction Interface**: Provides UI for users to review and correct OCR results
- **Error Handling**: Comprehensive error handling with actionable user feedback

## Architecture

### Components

1. **OCRService** (`ocr-service.ts`)
   - Integrates Tesseract.js for text extraction
   - Parses soil health card text to extract nutrient values
   - Handles OCR worker lifecycle

2. **OCRValidator** (`ocr-validator.ts`)
   - Validates extracted data against standard ranges
   - Checks confidence thresholds (85% minimum)
   - Identifies fields needing manual review

3. **SoilFieldMapper** (`soil-field-mapper.ts`)
   - Maps raw OCR data to standardized format
   - Calculates soil health scores (0-100)
   - Generates fertilizer recommendations

4. **ImageQualityChecker** (`image-quality-checker.ts`)
   - Analyzes image quality before OCR
   - Detects blur, low resolution, poor lighting
   - Provides actionable suggestions for retaking photos

5. **SoilOCRPipeline** (`soil-ocr-pipeline.ts`)
   - Orchestrates the complete OCR workflow
   - Implements retry logic for transient failures
   - Supports batch processing

## Usage

### Backend API

```typescript
import { getSoilOCRPipeline } from './services/agriculture';

// Process a single image
const pipeline = getSoilOCRPipeline();
const result = await pipeline.process(imageBuffer);

if (result.success) {
  console.log('Extracted data:', result.data);
  console.log('Health score:', result.data.overallHealthScore);
} else {
  console.error('Error:', result.error);
}

// Process with retry
const resultWithRetry = await pipeline.processWithRetry(imageBuffer, 3);

// Batch processing
const results = await pipeline.processBatch([image1, image2, image3]);
```

### REST API Endpoints

#### Process Soil Health Card
```http
POST /api/agriculture/ocr/soil-health-card
Content-Type: application/json

{
  "image": "<base64-encoded-image>"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "nitrogen": { "value": 245, "unit": "kg/ha", "status": "medium" },
    "phosphorus": { "value": 18, "unit": "kg/ha", "status": "medium" },
    "pH": { "value": 6.8, "status": "neutral" },
    "overallHealthScore": 72
  },
  "needsManualReview": false,
  "confidence": 92,
  "processingTimeMs": 1234
}
```

#### Batch Processing
```http
POST /api/agriculture/ocr/soil-health-card/batch
Content-Type: application/json

{
  "images": ["<base64-1>", "<base64-2>"]
}
```

#### Get Validation Ranges
```http
GET /api/agriculture/ocr/validation-ranges
```

#### Manual Entry
```http
POST /api/agriculture/ocr/manual-entry
Content-Type: application/json

{
  "pH": 6.8,
  "nitrogen": 245,
  "phosphorus": 18,
  "potassium": 156
}
```

### Mobile App

The mobile app provides a user-friendly interface for:
- Capturing soil health card photos
- Viewing OCR extraction results
- Manually correcting extracted values
- Saving soil health data

See `packages/mobile/src/screens/agriculture/SoilHealthCardOCRScreen.tsx`

## Data Models

### SoilHealthCardData (Raw OCR Output)
```typescript
{
  pH?: number;
  nitrogen?: number;        // kg/ha
  phosphorus?: number;      // kg/ha
  potassium?: number;       // kg/ha
  organicCarbon?: number;   // %
  sulfur?: number;          // ppm
  zinc?: number;            // ppm
  iron?: number;            // ppm
  copper?: number;          // ppm
  manganese?: number;       // ppm
  boron?: number;           // ppm
  electricalConductivity?: number; // dS/m
  confidence: number;       // 0-100
  rawText: string;
}
```

### MappedSoilData (Processed Output)
```typescript
{
  nitrogen: {
    value: number | null;
    unit: 'kg/ha';
    status: 'low' | 'medium' | 'high' | 'unknown';
    recommendation: string;
  };
  // ... similar for other nutrients
  overallHealthScore: number; // 0-100
  extractedFieldsCount: number;
  confidence: number;
}
```

## Validation Ranges

Based on Indian soil health card standards:

| Parameter | Min | Max | Unit |
|-----------|-----|-----|------|
| pH | 3.5 | 10.5 | - |
| Nitrogen | 0 | 1000 | kg/ha |
| Phosphorus | 0 | 200 | kg/ha |
| Potassium | 0 | 1000 | kg/ha |
| Organic Carbon | 0 | 5 | % |
| Sulfur | 0 | 100 | ppm |
| Zinc | 0 | 50 | ppm |
| Iron | 0 | 500 | ppm |
| Copper | 0 | 50 | ppm |
| Manganese | 0 | 200 | ppm |
| Boron | 0 | 10 | ppm |
| EC | 0 | 16 | dS/m |

## Error Handling

### Error Codes

- `POOR_IMAGE_QUALITY`: Image quality is insufficient for OCR
- `PROCESSING_ERROR`: OCR processing failed
- `MISSING_IMAGE`: No image provided
- `INVALID_DATA`: Validation failed
- `MAX_RETRIES_EXCEEDED`: Failed after multiple retry attempts

### Image Quality Issues

The system detects and provides feedback for:
- Low resolution (< 800x600)
- Blur or out of focus
- Poor lighting / low contrast
- Skewed or tilted document
- File size issues (too large or too small)

## Performance

- **OCR Processing Time**: 1-3 seconds per image
- **Confidence Threshold**: 85% for auto-acceptance
- **Retry Logic**: Exponential backoff (1s, 2s, 4s)
- **Batch Limit**: 10 images per request

## Testing

### Unit Tests
```bash
npm test -- ocr-service.test.ts
npm test -- ocr-validator.test.ts
npm test -- soil-field-mapper.test.ts
```

### Integration Tests
```bash
npm test -- soil-ocr-pipeline.test.ts
```

### Property-Based Tests
Property tests validate correctness properties across random inputs:
- Validation ranges are respected
- Health scores are 0-100
- Field mapping is consistent

## Dependencies

- `tesseract.js`: ^5.0.4 - OCR engine
- `express`: ^4.18.2 - REST API
- `react-native`: 0.72.6 - Mobile UI

## Future Enhancements

1. **Image Preprocessing**: Add image enhancement (contrast, rotation correction)
2. **Multi-language Support**: Support regional language soil health cards
3. **ML-based Extraction**: Train custom model for better accuracy
4. **Offline OCR**: Enable OCR processing on mobile devices
5. **Historical Tracking**: Track soil health changes over time
6. **Smart Recommendations**: AI-powered fertilizer recommendations

## References

- [Tesseract.js Documentation](https://tesseract.projectnaptha.com/)
- [Indian Soil Health Card Scheme](https://soilhealth.dac.gov.in/)
- [Soil Testing Standards](https://icar.org.in/)

## Support

For issues or questions, contact the development team or file an issue in the project repository.
