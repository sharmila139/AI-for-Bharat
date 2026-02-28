# AI Image Classifier for Grievance Category Detection

## Overview

The AI Image Classifier service uses AWS Bedrock Claude 3 Sonnet to intelligently detect infrastructure issue categories from grievance photos. It provides a robust classification system with automatic fallback to keyword-based classification when AI confidence is low or when the service is unavailable.

## Features

### 1. AI-Powered Classification
- Uses AWS Bedrock Claude 3 Sonnet with vision capabilities
- Analyzes both image content and text description
- Provides confidence scores (0-100) for classifications
- Returns detected features and reasoning for transparency

### 2. Confidence Threshold
- Minimum confidence threshold: **85%**
- Only accepts AI classifications with ≥85% confidence
- Automatically falls back to keyword matching for lower confidence

### 3. Supported Categories
The classifier supports 9 infrastructure categories as per Requirement 12:
1. **roads** - Road infrastructure issues (potholes, cracks, damaged pavement)
2. **water** - Water supply issues (leaking pipes, broken taps)
3. **electricity** - Electrical infrastructure (power outages, damaged poles, exposed wires)
4. **drainage** - Drainage and sewage issues (blocked drains, overflowing sewers)
5. **waste** - Waste management (garbage accumulation, overflowing bins)
6. **streetlights** - Street lighting issues (non-functional lights, damaged lamp posts)
7. **public_property** - Public property damage (vandalized parks, broken benches)
8. **health_facility** - Healthcare facility issues (hospital infrastructure, medical equipment)
9. **education_facility** - Educational facility issues (school infrastructure, classroom conditions)

### 4. Fallback Mechanism
When AI classification fails or confidence is below threshold:
- Automatically switches to keyword-based classification
- Analyzes description text for category-specific keywords
- Returns confidence score based on keyword matches (capped at 80%)
- Ensures service continuity even when Bedrock is unavailable

### 5. Caching
- Caches classification results to avoid redundant API calls
- Cache key based on image content and description
- Reduces costs and improves response time
- Cache can be cleared manually if needed

### 6. Multiple Input Sources
Supports both:
- **Buffer input**: Direct image buffer from upload
- **S3 URL input**: Downloads image from S3 for classification

## Usage

### Basic Usage

```typescript
import { getAIImageClassifier } from './ai-image-classifier';

const classifier = getAIImageClassifier({ region: 'us-east-1' });

// Classify with image buffer
const result = await classifier.classifyGrievanceImage(
  {
    buffer: imageBuffer,
    mimeType: 'image/jpeg'
  },
  'Large pothole on main street causing traffic issues'
);

console.log(result);
// {
//   category: 'roads',
//   confidence: 92,
//   detectedFeatures: ['pothole', 'damaged pavement', 'road surface'],
//   method: 'ai',
//   reasoning: 'Image shows clear pothole in road surface'
// }
```

### With S3 URL

```typescript
const result = await classifier.classifyGrievanceImage(
  {
    s3Url: 's3://bucket/grievances/photo.jpg',
    mimeType: 'image/jpeg'
  },
  'Broken streetlight on park road'
);
```

### Integration with Grievance Submission

The AI classifier is automatically integrated into the grievance submission service:

```typescript
import { createGrievanceSubmissionService } from './grievance-submission';

const service = createGrievanceSubmissionService(pool, s3Config);

// The service automatically uses AI classification
const result = await service.submitGrievance({
  title: 'Pothole on Main Street',
  description: 'Large pothole causing vehicle damage',
  photos: [photoUpload],
  // category is optional - AI will detect it
});
```

## Classification Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Receive Image + Description                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Check Cache                                               │
│    - Generate cache key from image + description            │
│    - Return cached result if available                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Call AWS Bedrock Claude 3 Sonnet                         │
│    - Convert image to base64                                 │
│    - Send structured prompt with category descriptions       │
│    - Request confidence score and detected features          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Parse AI Response                                         │
│    - Extract category, confidence, features, reasoning       │
│    - Validate category against supported list                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Check Confidence Threshold                                │
│    - If confidence >= 85%: Use AI result                     │
│    - If confidence < 85%: Fall back to keyword matching      │
│    - If AI fails: Fall back to keyword matching              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Return Classification Result                              │
│    - category: Detected category                             │
│    - confidence: Confidence score (0-100)                    │
│    - detectedFeatures: List of detected features             │
│    - method: 'ai' or 'keyword'                               │
│    - reasoning: (optional) AI's explanation                  │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

```bash
# AWS Bedrock Configuration
BEDROCK_REGION=us-east-1

# S3 Configuration (for S3 URL input)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### AWS Bedrock Model

The service uses **Claude 3 Sonnet** (`anthropic.claude-3-sonnet-20240229-v1:0`) which supports:
- Vision capabilities (image analysis)
- High accuracy for classification tasks
- Structured JSON responses
- Cost-effective compared to larger models

## Error Handling

### Graceful Degradation
1. **Bedrock API Error**: Falls back to keyword classification
2. **Low Confidence**: Falls back to keyword classification
3. **Invalid Response**: Falls back to keyword classification
4. **Network Timeout**: Falls back to keyword classification

### Logging
- All errors are logged with context
- Bedrock API errors include error type and message
- Fallback events are logged for monitoring

## Performance

### Response Times
- **AI Classification**: ~2-3 seconds (includes image encoding and API call)
- **Keyword Fallback**: <100ms (local processing)
- **Cached Result**: <10ms (memory lookup)

### Cost Optimization
- Caching reduces redundant API calls
- Claude 3 Sonnet is cost-effective for vision tasks
- Keyword fallback eliminates costs for low-quality images

### Accuracy
- **AI Classification**: 85%+ confidence threshold ensures high accuracy
- **Keyword Fallback**: 60-80% confidence based on keyword matches
- **Combined Approach**: Balances accuracy with availability

## Testing

### Unit Tests
Comprehensive test suite covering:
- AI classification with high confidence
- Fallback to keyword classification
- Cache functionality
- Error handling
- Response parsing
- Category validation

Run tests:
```bash
npm test -- ai-image-classifier.test.ts
```

### Integration Tests
Tests integration with grievance submission service:
```bash
npm test -- grievance-submission.test.ts
```

## Monitoring

### Metrics to Track
1. **Classification Method Distribution**
   - % using AI classification
   - % using keyword fallback
   - Helps identify Bedrock availability issues

2. **Confidence Score Distribution**
   - Average confidence for AI classifications
   - Helps tune confidence threshold

3. **Category Distribution**
   - Most common categories detected
   - Helps identify data patterns

4. **Cache Hit Rate**
   - % of requests served from cache
   - Helps optimize cache size

### CloudWatch Metrics
Bedrock usage is automatically logged to CloudWatch:
- Input tokens consumed
- Output tokens consumed
- API call latency
- Error rates

## Future Enhancements

### Potential Improvements
1. **Fine-tuning**: Train custom model on local infrastructure images
2. **Multi-image Analysis**: Analyze multiple photos for better accuracy
3. **Severity Detection**: Use AI to detect severity level from images
4. **Location Context**: Incorporate GPS data for better classification
5. **Feedback Loop**: Learn from user corrections to improve accuracy

### Scalability
- Consider using Claude 3 Haiku for faster, cheaper classifications
- Implement batch processing for multiple images
- Add Redis caching for distributed systems
- Implement rate limiting to control costs

## Compliance

### Data Privacy
- Images are not stored by Bedrock (processed in-memory)
- Classification results are cached locally
- No PII is sent to Bedrock

### Cost Management
- Caching reduces API calls
- Fallback mechanism prevents unnecessary costs
- Monitor CloudWatch metrics for cost tracking

## Support

For issues or questions:
1. Check CloudWatch logs for Bedrock errors
2. Verify AWS credentials and model access
3. Test with keyword fallback to isolate issues
4. Review cache statistics for performance issues

## References

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Claude 3 Model Card](https://www.anthropic.com/claude)
- [Requirement 12: Visual Grievance Reporting](../../../../../../.kiro/specs/ruralconnect-ai/requirements.md#requirement-12-infrastructure---visual-grievance-reporting)
