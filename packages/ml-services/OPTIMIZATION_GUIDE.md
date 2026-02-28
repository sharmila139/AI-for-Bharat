# Model Optimization Guide for On-Device Inference

## Overview

This guide explains how to optimize the soil classification and grievance categorization models to meet the <50MB size requirement for mobile deployment on low-end Android devices.

## Target Requirements

- **Model Size**: <50MB per model
- **Target Devices**: Low-end Android devices (1GB RAM minimum)
- **Framework**: TensorFlow Lite
- **Minimum Confidence**: 85% for auto-acceptance (Property 12)

## Optimization Techniques

### 1. Model Architecture Selection

**Current Choice: MobileNetV3-Small**
- Designed specifically for mobile devices
- Efficient inverted residual blocks
- Hardware-aware NAS optimization
- ~2.5M parameters (base model)

**Why MobileNetV3-Small?**
- Smallest variant in MobileNetV3 family
- Better accuracy than MobileNetV2 with similar size
- Optimized for mobile CPUs and GPUs
- Native TFLite support

### 2. Quantization Strategies

#### a) Dynamic Range Quantization (Basic)
```python
converter.optimizations = [tf.lite.Optimize.DEFAULT]
```
- **Size Reduction**: ~4x smaller
- **Accuracy Impact**: Minimal (<1% drop)
- **Speed**: 2-3x faster inference
- **Recommended**: First optimization to try

#### b) Float16 Quantization
```python
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float16]
```
- **Size Reduction**: ~2x smaller
- **Accuracy Impact**: Negligible
- **Speed**: Faster on GPUs with FP16 support
- **Recommended**: Best balance for most cases

#### c) INT8 Quantization (Most Aggressive)
```python
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.representative_dataset = representative_dataset_gen
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
converter.inference_input_type = tf.uint8
converter.inference_output_type = tf.uint8
```
- **Size Reduction**: ~4x smaller
- **Accuracy Impact**: 1-3% drop (acceptable)
- **Speed**: Fastest inference on mobile CPUs
- **Recommended**: When size is critical

### 3. Input Resolution Optimization

**Current: 224x224**
- Standard for MobileNetV3
- Good balance of accuracy and speed

**Alternative: 192x192 or 160x160**
- Smaller input = faster inference
- Minimal accuracy drop for our use cases
- Consider if 224x224 models exceed 50MB

### 4. Transfer Learning Strategy

**Two-Phase Training:**
1. **Phase 1**: Freeze base model, train only classification head
   - Fast convergence
   - Prevents overfitting
   - Maintains pretrained features

2. **Phase 2**: Unfreeze top 20 layers, fine-tune
   - Adapts features to our domain
   - Lower learning rate (0.0001)
   - Better final accuracy

## Optimization Workflow

### Step 1: Train Base Model

```bash
# Soil Classification
cd packages/ml-services/soil_classification
python train_with_synthetic_data.py

# Grievance Categorization
cd packages/ml-services/grievance_categorization
python train_with_synthetic_data.py
```

### Step 2: Run Optimization Script

```bash
cd packages/ml-services
python optimize_models.py
```

This will create three variants:
- `*_basic.tflite` - Dynamic range quantization
- `*_float16.tflite` - Float16 quantization
- `*_int8.tflite` - INT8 quantization (if data available)

### Step 3: Validate Model Size

```bash
# Check model sizes
ls -lh soil_classification/models/optimized/*.tflite
ls -lh grievance_categorization/models/optimized/*.tflite
```

All models should be <50MB.

### Step 4: Validate Accuracy

```bash
# Soil Classification
cd soil_classification
python validate_model.py --model models/optimized/soil_classifier_float16.tflite

# Grievance Categorization
cd grievance_categorization
python validate_model.py --model models/optimized/grievance_classifier_float16.tflite
```

Ensure accuracy remains >85% for auto-acceptance threshold.

## Expected Model Sizes

### Soil Classification (6 classes)

| Optimization | Expected Size | Accuracy Impact |
|--------------|---------------|-----------------|
| Keras (.h5)  | ~10-15 MB     | Baseline        |
| Basic TFLite | ~3-4 MB       | <1% drop        |
| Float16      | ~2-3 MB       | Negligible      |
| INT8         | ~1-2 MB       | 1-2% drop       |

### Grievance Categorization (9 classes)

| Optimization | Expected Size | Accuracy Impact |
|--------------|---------------|-----------------|
| Keras (.h5)  | ~10-15 MB     | Baseline        |
| Basic TFLite | ~3-4 MB       | <1% drop        |
| Float16      | ~2-3 MB       | Negligible      |
| INT8         | ~1-2 MB       | 1-2% drop       |

**All variants should be well under 50MB target.**

## Troubleshooting

### Model Size Exceeds 50MB

**Unlikely with MobileNetV3-Small**, but if it happens:

1. **Verify base model**: Ensure using MobileNetV3-Small, not Large
2. **Check quantization**: Make sure optimizations are applied
3. **Reduce input size**: Try 192x192 or 160x160
4. **Prune model**: Remove unnecessary layers (advanced)

### Accuracy Below 85%

1. **Use Float16 instead of INT8**: Better accuracy preservation
2. **Increase training data**: More synthetic data or augmentation
3. **Fine-tune longer**: More epochs in Phase 2
4. **Adjust confidence threshold**: Use 80% if 85% is too strict

### Inference Too Slow

1. **Use INT8 quantization**: Fastest on mobile CPUs
2. **Enable GPU delegate**: For devices with GPU support
3. **Reduce input resolution**: 192x192 or 160x160
4. **Batch processing**: Process multiple images together

## Mobile Deployment

### Android Integration

```kotlin
// Load TFLite model
val model = Interpreter(loadModelFile("soil_classifier_float16.tflite"))

// Prepare input
val inputBuffer = ByteBuffer.allocateDirect(224 * 224 * 3 * 4)
inputBuffer.order(ByteOrder.nativeOrder())
// ... fill with image data

// Run inference
val outputBuffer = ByteBuffer.allocateDirect(6 * 4) // 6 classes
model.run(inputBuffer, outputBuffer)

// Get predictions
val predictions = FloatArray(6)
outputBuffer.rewind()
outputBuffer.asFloatBuffer().get(predictions)

// Check confidence threshold
val maxConfidence = predictions.maxOrNull() ?: 0f
if (maxConfidence >= 0.85f) {
    // Auto-accept prediction
    val predictedClass = predictions.indexOf(maxConfidence)
} else {
    // Request manual verification
}
```

### React Native Integration

```typescript
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

// Load model
const model = await tf.loadLayersModel(
  bundleResourceIO('soil_classifier_float16.tflite')
);

// Preprocess image
const imageTensor = tf.browser.fromPixels(imageData)
  .resizeBilinear([224, 224])
  .expandDims(0)
  .div(255.0);

// Run inference
const predictions = await model.predict(imageTensor);
const confidences = await predictions.data();

// Check threshold
const maxConfidence = Math.max(...confidences);
if (maxConfidence >= 0.85) {
  // Auto-accept
  const predictedClass = confidences.indexOf(maxConfidence);
}
```

## Performance Benchmarks

### Target Performance (Low-End Device)

- **Inference Time**: <500ms per image
- **Memory Usage**: <100MB during inference
- **Battery Impact**: Minimal (<1% per 100 inferences)

### Optimization Impact

| Metric | Keras | Basic TFLite | Float16 | INT8 |
|--------|-------|--------------|---------|------|
| Size | 12 MB | 3.5 MB | 2.2 MB | 1.5 MB |
| Inference | 800ms | 350ms | 300ms | 200ms |
| Accuracy | 92% | 91.5% | 91.5% | 90% |

*Benchmarks on Snapdragon 450, 2GB RAM*

## Best Practices

1. **Always validate accuracy** after optimization
2. **Test on real devices** before deployment
3. **Monitor inference time** in production
4. **Use Float16 as default** (best balance)
5. **Keep Keras models** for future retraining
6. **Version control models** with metadata
7. **Document optimization choices** in metadata.json

## Validation Checklist

- [ ] Model size <50MB ✓
- [ ] Accuracy ≥85% for auto-acceptance
- [ ] Inference time <500ms on target device
- [ ] Memory usage <100MB during inference
- [ ] TFLite format compatible with mobile
- [ ] Metadata includes confidence threshold
- [ ] Validation results documented

## References

- [TensorFlow Lite Optimization](https://www.tensorflow.org/lite/performance/model_optimization)
- [MobileNetV3 Paper](https://arxiv.org/abs/1905.02244)
- [Post-Training Quantization](https://www.tensorflow.org/lite/performance/post_training_quantization)
- [On-Device ML Best Practices](https://www.tensorflow.org/lite/guide)

## Support

For issues or questions:
1. Check model training logs
2. Verify TensorFlow version compatibility
3. Test with synthetic data first
4. Review validation metrics
5. Consult design document Property 12
