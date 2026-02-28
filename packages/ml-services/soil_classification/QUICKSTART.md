# Soil Classification - Quick Start Guide

This guide will help you get started with training and deploying the soil type classification model.

## Prerequisites

```bash
# Install Python dependencies
cd packages/ml-services
pip install -r requirements.txt
```

Required packages:
- TensorFlow 2.14.0+
- Pillow (image processing)
- NumPy, scikit-learn

## Option 1: Demo Training (Synthetic Data)

For testing the training pipeline without real images:

```bash
cd soil_classification
python train_with_synthetic_data.py --samples 100 --epochs 10 --fine-tune-epochs 5
```

This will:
- Generate synthetic soil images
- Train MobileNetV3Small model
- Save Keras model (.h5)
- Convert to TFLite (<50MB)
- Generate evaluation metrics

**Output:**
- `models/soil_classifier.h5` - Keras model
- `models/soil_classifier_optimized.tflite` - TFLite model
- `models/metadata.json` - Model metadata
- `models/evaluation_metrics.json` - Performance metrics

## Option 2: Production Training (Real Images)

### Step 1: Prepare Dataset

Create the directory structure:

```bash
python data_preparation.py --create-sample
```

This creates:
```
data/soil_images/raw/
  alluvial/
  black/
  red/
  laterite/
  desert/
  mountain/
```

### Step 2: Collect Images

Place soil images in the appropriate directories:
- **Minimum**: 300 images per soil type (1,800 total)
- **Recommended**: 500+ images per soil type (3,000+ total)
- **Format**: JPG, PNG, or BMP
- **Resolution**: 224x224 minimum (higher is better)

### Step 3: Organize Dataset

```bash
python data_preparation.py --source ./data/soil_images/raw --output ./data/soil_images
```

This will:
- Split images into train (70%), val (15%), test (15%)
- Create organized directory structure
- Generate dataset statistics report

### Step 4: Train Model

```bash
python model_training.py
```

Training process:
1. **Phase 1**: Transfer learning (20 epochs, frozen base)
2. **Phase 2**: Fine-tuning (10 epochs, unfrozen top layers)
3. Evaluation on test set
4. TFLite conversion and optimization
5. Model size validation (<50MB)

Expected training time:
- CPU: 2-4 hours
- GPU: 30-60 minutes

## Inference

### Keras Model

```bash
python inference.py --model ./models/soil_classifier.h5 --image path/to/soil.jpg
```

### TFLite Model

```bash
python inference.py --model ./models/soil_classifier_optimized.tflite --image path/to/soil.jpg
```

### Benchmark Performance

```bash
python inference.py --model ./models/soil_classifier_optimized.tflite --image path/to/soil.jpg --benchmark
```

## Python API

### Keras Inference

```python
from inference import SoilClassifier

# Initialize
classifier = SoilClassifier(
    model_path='./models/soil_classifier.h5',
    confidence_threshold=0.85
)

# Predict
result = classifier.predict('soil_image.jpg')

print(f"Soil Type: {result['soil_type']}")
print(f"Confidence: {result['confidence']:.2%}")
print(f"Auto-accepted: {result['meets_threshold']}")
```

### TFLite Inference

```python
from inference import SoilClassifierTFLite

# Initialize
classifier = SoilClassifierTFLite(
    model_path='./models/soil_classifier_optimized.tflite',
    confidence_threshold=0.85
)

# Predict
result = classifier.predict('soil_image.jpg')
```

## Mobile Integration (React Native)

### 1. Copy TFLite Model

```bash
cp models/soil_classifier_optimized.tflite packages/mobile/assets/models/
```

### 2. Install TFLite Package

```bash
cd packages/mobile
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native
```

### 3. Use in React Native

```typescript
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

// Load model
const model = await tf.loadLayersModel(
  bundleResourceIO(require('./assets/models/soil_classifier_optimized.tflite'))
);

// Preprocess image
const imageTensor = tf.browser.fromPixels(imageData)
  .resizeBilinear([224, 224])
  .expandDims(0)
  .div(255.0);

// Predict
const predictions = await model.predict(imageTensor);
const soilTypeIndex = predictions.argMax(-1).dataSync()[0];
```

## Validation

Validate the implementation:

```bash
python validate_model.py
```

This checks:
- ✓ Model architecture
- ✓ Data preparation scripts
- ✓ Inference capabilities
- ✓ Requirements compliance
- ✓ Documentation completeness

## Troubleshooting

### Model Size > 50MB

```python
# Use quantization
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float16]
```

### Low Accuracy

- Collect more training data
- Increase data augmentation
- Train for more epochs
- Try MobileNetV3Large

### Out of Memory

- Reduce batch size
- Use gradient accumulation
- Train on GPU

### Slow Inference

- Use TFLite model (not Keras)
- Enable GPU delegation on mobile
- Reduce input size

## Performance Targets

- **Accuracy**: >85% on test set
- **Model Size**: <50MB (TFLite)
- **Inference Time**: <100ms on mobile
- **Confidence Threshold**: 85% for auto-acceptance

## Next Steps

1. ✓ Task 9.1: Train soil classification model (COMPLETE)
2. Task 9.2: Train grievance photo categorization model
3. Task 9.3: Optimize models for on-device inference
4. Task 9.4: Implement confidence threshold validation
5. Task 9.5: Create image preprocessing pipeline
6. Task 9.6: Deploy models to mobile app

## Support

For issues or questions:
1. Check README.md for detailed documentation
2. Review model_training.py for implementation details
3. See inference.py for usage examples
4. Consult RuralConnect AI design document

## References

- [MobileNetV3 Paper](https://arxiv.org/abs/1905.02244)
- [TensorFlow Transfer Learning](https://www.tensorflow.org/tutorials/images/transfer_learning)
- [TFLite Optimization](https://www.tensorflow.org/lite/performance/best_practices)
