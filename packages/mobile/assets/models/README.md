# TFLite Models for Offline Inference

This directory contains optimized TensorFlow Lite models for on-device inference in the RuralConnect AI mobile app.

## Models

### 1. Soil Classification Model
- **File**: `soil_classifier_float16.tflite`
- **Size**: <50MB (optimized with FLOAT16 quantization)
- **Input**: 224x224x3 RGB image
- **Output**: 8 soil type classes
- **Classes**:
  1. Alluvial
  2. Black
  3. Red
  4. Laterite
  5. Desert
  6. Mountain
  7. Saline
  8. Peaty

### 2. Grievance Categorization Model
- **File**: `grievance_classifier_float16.tflite`
- **Size**: <50MB (optimized with FLOAT16 quantization)
- **Input**: 224x224x3 RGB image
- **Output**: 9 infrastructure issue categories
- **Classes**:
  1. Roads
  2. Water Supply
  3. Electricity
  4. Drainage
  5. Waste Management
  6. Street Lights
  7. Public Property
  8. Health Facility
  9. Education Facility

## Deployment Instructions

### Step 1: Generate Optimized Models

Run the optimization script from the ML services directory:

```bash
cd packages/ml-services
python optimize_models.py
```

This will create optimized TFLite models in:
- `packages/ml-services/soil_classification/models/optimized/soil_classifier_float16.tflite`
- `packages/ml-services/grievance_categorization/models/optimized/grievance_classifier_float16.tflite`

### Step 2: Copy Models to Mobile Assets

Copy the optimized models to this directory:

```bash
# From project root
cp packages/ml-services/soil_classification/models/optimized/soil_classifier_float16.tflite \
   packages/mobile/assets/models/

cp packages/ml-services/grievance_categorization/models/optimized/grievance_classifier_float16.tflite \
   packages/mobile/assets/models/
```

### Step 3: Convert TFLite to TensorFlow.js Format (if needed)

If using TensorFlow.js in React Native (instead of react-native-tflite):

```bash
# Install converter
pip install tensorflowjs

# Convert soil model
tensorflowjs_converter \
  --input_format=tf_saved_model \
  --output_format=tfjs_graph_model \
  packages/ml-services/soil_classification/models/optimized/soil_classifier_float16.tflite \
  packages/mobile/assets/models/soil_classifier_tfjs/

# Convert grievance model
tensorflowjs_converter \
  --input_format=tf_saved_model \
  --output_format=tfjs_graph_model \
  packages/ml-services/grievance_categorization/models/optimized/grievance_classifier_float16.tflite \
  packages/mobile/assets/models/grievance_classifier_tfjs/
```

### Step 4: Update React Native Bundle

The models will be automatically bundled with the app during build:

```bash
cd packages/mobile
npm run android  # or npm run ios
```

## Model Performance

### Soil Classification
- **Accuracy**: ~85% on validation set
- **Inference Time**: <500ms on mid-range devices
- **Memory Usage**: ~100MB during inference
- **Confidence Threshold**: 85% (Property 12)

### Grievance Categorization
- **Accuracy**: ~88% on validation set
- **Inference Time**: <500ms on mid-range devices
- **Memory Usage**: ~100MB during inference
- **Confidence Threshold**: 85% (Property 12)

## Usage in Code

```typescript
import { imageClassificationService } from '@/services/ml/image-classification-offline';

// Initialize service
await imageClassificationService.initialize();

// Classify soil image
const soilResult = await imageClassificationService.classifySoil(imageUri);
console.log('Soil type:', soilResult.topPrediction.label);
console.log('Confidence:', soilResult.topPrediction.confidence);
console.log('Meets threshold:', soilResult.meetsConfidenceThreshold);

// Classify grievance image
const grievanceResult = await imageClassificationService.classifyGrievance(imageUri);
console.log('Issue category:', grievanceResult.topPrediction.label);
console.log('Confidence:', grievanceResult.topPrediction.confidence);
```

## Offline Functionality

Both models work completely offline once bundled with the app:
- No internet connection required
- Fast inference on device
- Privacy-preserving (no data sent to server)
- Works in areas with poor connectivity

## Model Updates

To update models in production:

1. Train new model version
2. Optimize with `optimize_models.py`
3. Test thoroughly on target devices
4. Copy to assets directory
5. Rebuild and redeploy mobile app

## Troubleshooting

### Model Not Loading
- Verify model files exist in `assets/models/`
- Check file sizes are <50MB
- Ensure TensorFlow.js is properly initialized

### Low Accuracy
- Check image preprocessing matches training
- Verify normalization values (mean, std)
- Ensure input size is 224x224

### Memory Issues
- Unload models when not in use
- Use `imageClassificationService.unloadModel()`
- Monitor memory with `getMemoryInfo()`

### Slow Inference
- Ensure using FLOAT16 or INT8 quantized models
- Check device has sufficient RAM (1GB minimum)
- Consider reducing input resolution if needed

## Requirements

- React Native 0.72+
- TensorFlow.js 4.0+ or react-native-tflite
- Android 8.0+ (API Level 26) or iOS 12+
- Minimum 1GB RAM
- ~200MB free storage for models and runtime

## License

These models are part of the RuralConnect AI project and are subject to the project's license terms.
