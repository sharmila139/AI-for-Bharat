# Soil Analysis API Integration Example

## How to Register the API in Your Express App

### Option 1: Direct Registration

```typescript
// src/index.ts or src/app.ts
import express from 'express';
import soilAnalysisRouter from './api/soil-analysis';

const app = express();

// Register the soil analysis API
app.use('/api/agriculture/soil', soilAnalysisRouter);

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Option 2: Grouped Agriculture Routes

```typescript
// src/routes/agriculture.ts
import { Router } from 'express';
import soilAnalysisRouter from '../api/soil-analysis';
import soilOcrRouter from '../api/soil-ocr';
import cropRecommendationRouter from '../api/crop-recommendation';

const router = Router();

// Mount all agriculture-related routes
router.use('/soil', soilAnalysisRouter);
router.use('/ocr', soilOcrRouter);
router.use('/crops', cropRecommendationRouter);

export default router;
```

```typescript
// src/index.ts
import express from 'express';
import agricultureRouter from './routes/agriculture';

const app = express();

// Register agriculture routes
app.use('/api/agriculture', agricultureRouter);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Option 3: With Middleware

```typescript
// src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import soilAnalysisRouter from './api/soil-analysis';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rate-limit';

const app = express();

// Global middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Apply authentication and rate limiting to soil analysis routes
app.use(
  '/api/agriculture/soil',
  authMiddleware,
  rateLimitMiddleware({ maxRequests: 100, windowMs: 60000 }),
  soilAnalysisRouter
);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Complete Example with Error Handling

```typescript
// src/index.ts
import express, { Request, Response, NextFunction } from 'express';
import soilAnalysisRouter from './api/soil-analysis';

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register soil analysis API
app.use('/api/agriculture/soil', soilAnalysisRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Soil Analysis API available at http://localhost:${PORT}/api/agriculture/soil`);
});

export default app;
```

## Testing the Integration

### Using cURL

```bash
# Test photo analysis
curl -X POST http://localhost:3000/api/agriculture/soil/analyze \
  -F "image=@test_soil.jpg" \
  -F "type=photo"

# Test health card OCR
curl -X POST http://localhost:3000/api/agriculture/soil/analyze \
  -F "image=@health_card.jpg" \
  -F "type=health-card"

# Get supported soil types
curl http://localhost:3000/api/agriculture/soil/supported-types

# Get quality requirements
curl http://localhost:3000/api/agriculture/soil/quality-requirements
```

### Using Postman

1. Create a new POST request to `http://localhost:3000/api/agriculture/soil/analyze`
2. Go to Body tab → form-data
3. Add key `image` with type `File` and select an image
4. Add key `type` with value `photo` or `health-card`
5. Send the request

### Using JavaScript/Fetch

```javascript
// Frontend example
async function analyzeSoilPhoto(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('type', 'photo');

  try {
    const response = await fetch('http://localhost:3000/api/agriculture/soil/analyze', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      console.log('Soil Type:', result.data.soilType);
      console.log('Confidence:', result.data.confidence);
      console.log('Texture:', result.data.texture);
      console.log('Nutrient Indicators:', result.data.nutrientIndicators);
    } else {
      console.error('Analysis failed:', result.error.message);
      if (result.requiresManualReview) {
        console.log('Manual review required');
      }
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Usage
const fileInput = document.getElementById('soil-image');
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    analyzeSoilPhoto(file);
  }
});
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# ML Service Configuration
ML_SERVICE_PATH=/path/to/ml-services/soil_classification
ML_MODEL_PATH=/path/to/models/soil_classifier.h5

# Image Processing
MAX_IMAGE_SIZE=10485760  # 10MB in bytes
MIN_IMAGE_SIZE=10240     # 10KB in bytes

# Confidence Threshold
SOIL_CONFIDENCE_THRESHOLD=0.85

# Database (if needed)
DATABASE_URL=postgresql://user:password@localhost:5432/ruralconnect

# Redis (for caching)
REDIS_URL=redis://localhost:6379
```

## Docker Compose Example

```yaml
version: '3.8'

services:
  backend:
    build: ./packages/backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - ML_SERVICE_PATH=/app/ml-services/soil_classification
    volumes:
      - ./packages/ml-services:/app/ml-services
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=ruralconnect
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## Production Considerations

### 1. Add Authentication

```typescript
import { authMiddleware } from './middleware/auth';

app.use('/api/agriculture/soil', authMiddleware, soilAnalysisRouter);
```

### 2. Add Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/agriculture/soil', limiter, soilAnalysisRouter);
```

### 3. Add Request Logging

```typescript
import morgan from 'morgan';

app.use(morgan('combined'));
```

### 4. Add CORS Configuration

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### 5. Add Compression

```typescript
import compression from 'compression';

app.use(compression());
```

## Monitoring and Logging

```typescript
// Add request ID for tracing
import { v4 as uuidv4 } from 'uuid';

app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Log all requests
app.use((req, res, next) => {
  console.log({
    requestId: req.id,
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
  });
  next();
});

// Log response time
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log({
      requestId: req.id,
      duration,
      statusCode: res.statusCode,
    });
  });
  next();
});
```

## API Endpoints Summary

Once integrated, the following endpoints will be available:

- `POST /api/agriculture/soil/analyze` - Analyze single soil photo or health card
- `POST /api/agriculture/soil/analyze/batch` - Batch analyze multiple images
- `GET /api/agriculture/soil/supported-types` - Get supported soil types
- `GET /api/agriculture/soil/quality-requirements` - Get image quality requirements

All endpoints are documented in `README_SOIL_ANALYSIS.md`.
