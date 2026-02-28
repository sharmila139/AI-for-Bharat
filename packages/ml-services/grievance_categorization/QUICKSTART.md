# Grievance Photo Categorization - Quick Start Guide

Get started with training and using the grievance categorization model in 5 minutes.

## Prerequisites

```bash
# Install dependencies
pip install tensorflow numpy pillow scikit-learn matplotlib seaborn
```

## Option 1: Train with Synthetic Data (Fastest)

Perfect for testing the pipeline without collecting real images.

```bash
# Navigate to the directory
cd packages/ml-services/grievance_categorization

# Train with synthetic data
python train_with_synthetic_data.py --samples 100 --epochs 10 --fine-tune-epochs 5

# This will create:
# - models/grievance_classifier.h5 (Keras model)
# - models/grievance_classifier_optimized.tflite (TFLite model)
# - models/metadata.json (Model metadata)
# - models/evaluation_metrics.json (Test metrics)
```

**Expected output:**
```
Training Phase 1: Transfer Learning...
Training Phase 2: Fine-Tuning...
Final Test Accuracy: 0.8500+
TFLite Model Size: ~3-5 MB
```

## Option 2: Train with Real Data

For production-ready models with real grievance images.

### Step 1: Prepare Dataset Structure

```bash
# Create directory structure
python data_preparation.py --create-sample
```

This creates:
```
data/grievance_images/
  raw/
    roads/
    water/
    electricity/
    drainage/
    waste/
    streetlights/
    public_property/
    health_facility/
    education_facility/
```

### Step 2: Collect Images

Place at least 100 images per category in the respective folders:
- **Roads**: Photos of potholes, cracks, damaged roads
- **Water**: Water leaks, contamination, supply issues
- **Electricity**: Damaged wires, power outages
- **Drainage**: Blocked drains, flooding
- **Waste**: Garbage accumulation
- **Streetlights**: Non-functional lights
- **Public Property**: Damaged parks, buildings
- **Health Facility**: PHC infrastructure issues
- **Education Facility**: School infrastructure problems

### Step 3: Organize Dataset

```bash
# Split into train/val/test (70/15/15)
python data_preparation.py --source data/grievance_images/raw --output data/grievance_images
```

### Step 4: Train Model

```bash
# Train with real data
python model_training.py
```

Training takes 30-60 minutes depending on dataset size and hardware.

## Test the Model

### Single Image Inference

```bash
# Using Keras model
python inference.py --model models/grievance_classifier.h5 --image test_image.jpg

# Using TFLite model (faster, smaller)
python inference.py --model models/grievance_classifier_optimized.tflite --image test_image.jpg
```

**Example output:**
```
Prediction Results:
  Category:    roads
  Confidence:  0.9234 (92.34%)
  Auto-accept: True
  Threshold:   0.85

Top 3 Predictions:
  1. roads                 - 0.9234 (92.34%)
  2. public_property       - 0.0456 (4.56%)
  3. drainage              - 0.0189 (1.89%)
```

### Batch Inference

```bash
python inference.py --model models/grievance_classifier.h5 --images img1.jpg img2.jpg img3.jpg --output results.json
```

## Validate Model Performance

```bash
python validate_model.py --model models/grievance_classifier.h5 --test-dir data/grievance_images/test --output validation_results
```

This generates:
- `validation_results.json` - Detailed metrics
- `confusion_matrix.png` - Visual confusion matrix
- `confidence_distribution.png` - Confidence score distribution
- `category_accuracy.png` - Per-category accuracy

## Integration Examples

### Python API

```python
from inference import GrievanceClassifier

# Initialize classifier
classifier = GrievanceClassifier(
    model_path='models/grievance_classifier_optimized.tflite',
    metadata_path='models/metadata.json'
)

# Predict single image
result = classifier.predict('grievance_photo.jpg')

if result['auto_accept']:
    print(f"Category: {result['category']} (Confidence: {result['confidence']:.2%})")
else:
    print(f"Low confidence. Top 3 options:")
    for pred in result['top_3_predictions']:
        print(f"  - {pred['category']}: {pred['confidence']:.2%}")
```

### REST API Endpoint

```python
from fastapi import FastAPI, UploadFile
from inference import GrievanceClassifier

app = FastAPI()
classifier = GrievanceClassifier('models/grievance_classifier_optimized.tflite')

@app.post('/api/categorize')
async def categorize_grievance(image: UploadFile):
    # Save uploaded image
    image_path = f"temp/{image.filename}"
    with open(image_path, 'wb') as f:
        f.write(await image.read())
    
    # Run inference
    result = classifier.predict(image_path)
    
    return {
        'category': result['category'],
        'confidence': result['confidence'],
        'auto_accept': result['auto_accept'],
        'alternatives': result['top_3_predictions']
    }
```

### React Native Integration

```typescript
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

// Load model
const model = await tf.loadLayersModel(
  bundleResourceIO(modelJson, modelWeights)
);

// Preprocess image
const imageTensor = tf.browser.fromPixels(imageUri)
  .resizeBilinear([224, 224])
  .expandDims(0)
  .div(255.0);

// Run inference
const predictions = await model.predict(imageTensor);
const categoryIndex = predictions.argMax(-1).dataSync()[0];
const confidence = predictions.max().dataSync()[0];

// Check confidence threshold
if (confidence >= 0.85) {
  // Auto-accept
  console.log(`Category: ${categories[categoryIndex]}`);
} else {
  // Request manual verification
  console.log('Low confidence, please verify');
}
```

## Model Performance

### Requirements Validation

✓ **Accuracy**: ≥85% (Requirements 12.1)  
✓ **Model Size**: <50MB (Requirements 9.3)  
✓ **Confidence Threshold**: 85% for auto-acceptance  
✓ **Offline Capable**: TFLite model for on-device inference

### Expected Metrics

With 500+ images per category:
- Overall Accuracy: 85-92%
- High Confidence Accuracy: 90-95%
- Model Size: 3-5 MB (TFLite)
- Inference Time: <500ms on mobile

## Troubleshooting

### Issue: Low Accuracy (<85%)

**Solutions:**
1. Collect more training data (500+ images per category)
2. Ensure images are properly labeled
3. Increase training epochs: `--epochs 30 --fine-tune-epochs 15`
4. Check data quality (clear images, correct categories)

### Issue: Model Too Large (>50MB)

**Solutions:**
1. Use TFLite model (already optimized)
2. Apply quantization: Modify `optimize_for_mobile()` in `model_training.py`
3. Reduce input size to 192x192 or 160x160

### Issue: Slow Inference

**Solutions:**
1. Use TFLite model instead of Keras
2. Enable GPU acceleration on device
3. Reduce input image resolution
4. Use quantized model

## Next Steps

1. **Task 9.3**: Optimize models for on-device inference (<50MB)
2. **Task 9.4**: Implement confidence threshold validation (85% minimum)
3. **Task 9.5**: Create image preprocessing pipeline
4. **Task 9.6**: Deploy models to mobile app for offline use
5. **Task 9.7**: Write property test for AI confidence threshold (Property 12)

## Resources

- [MobileNetV3 Paper](https://arxiv.org/abs/1905.02244)
- [TensorFlow Lite Guide](https://www.tensorflow.org/lite)
- [Requirements Document](../../.kiro/specs/ruralconnect-ai/requirements.md)
- [Design Document](../../.kiro/specs/ruralconnect-ai/design.md)

## Support

For issues or questions:
1. Check the main [README.md](README.md)
2. Review the [Design Document](../../.kiro/specs/ruralconnect-ai/design.md)
3. Refer to Property 12: AI Confidence Threshold validation
