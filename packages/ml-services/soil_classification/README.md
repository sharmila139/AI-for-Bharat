# Soil Type Classification - MobileNetV3

This module implements a lightweight MobileNetV3-based model for on-device soil type classification. The model is optimized for mobile deployment with a target size of <50MB.

## Overview

The soil classification model can identify 6 different soil types commonly found in India:

1. **Alluvial** - Fertile soil deposited by rivers, good for most crops
2. **Black** - Cotton soil with high clay content, retains moisture well
3. **Red** - Iron-rich soil with good drainage, suitable for various crops
4. **Laterite** - Acidic soil with low fertility, found in high rainfall areas
5. **Desert** - Sandy soil with low water retention
6. **Mountain** - Rocky soil with variable composition

## Model Architecture

- **Base Model**: MobileNetV3Small (pretrained on ImageNet)
- **Input Size**: 224x224x3
- **Output**: 6 classes (soil types)
- **Target Size**: <50MB (TFLite optimized)
- **Confidence Threshold**: 85% minimum (as per requirements)

## Directory Structure

```
soil_classification/
├── README.md                    # This file
├── data_preparation.py          # Dataset organization script
├── model_training.py            # Model training script
├── inference.py                 # Inference script
├── data/
│   └── soil_images/
│       ├── raw/                 # Raw images organized by soil type
│       │   ├── alluvial/
│       │   ├── black/
│       │   ├── red/
│       │   ├── laterite/
│       │   ├── desert/
│       │   └── mountain/
│       ├── train/               # Training set (70%)
│       ├── val/                 # Validation set (15%)
│       └── test/                # Test set (15%)
└── models/
    ├── soil_classifier.h5       # Keras model
    ├── soil_classifier_optimized.tflite  # TFLite model
    ├── metadata.json            # Model metadata
    ├── training_history.json    # Training history
    └── evaluation_metrics.json  # Evaluation metrics
```

## Setup

### 1. Install Dependencies

```bash
cd packages/ml-services
pip install -r requirements.txt
```

### 2. Prepare Dataset

#### Option A: Create Sample Structure

```bash
cd soil_classification
python data_preparation.py --create-sample
```

This creates the directory structure. You then need to:
1. Collect soil images (500+ per type recommended)
2. Place them in `data/soil_images/raw/<soil_type>/`

#### Option B: Organize Existing Images

If you already have images organized by soil type:

```bash
python data_preparation.py --source ./data/soil_images/raw --output ./data/soil_images
```

This will:
- Split images into train (70%), val (15%), test (15%)
- Create organized directory structure
- Generate dataset statistics report

## Training

### Basic Training

```bash
python model_training.py
```

This will:
1. Load MobileNetV3Small with ImageNet weights
2. Train in two phases:
   - Phase 1: Transfer learning (frozen base) - 20 epochs
   - Phase 2: Fine-tuning (unfrozen top layers) - 10 epochs
3. Evaluate on test set
4. Save Keras model (.h5)
5. Convert to TFLite and optimize for mobile
6. Generate evaluation metrics

### Training Output

The training process will create:
- `models/soil_classifier.h5` - Full Keras model
- `models/soil_classifier_optimized.tflite` - Optimized TFLite model (<50MB)
- `models/metadata.json` - Model metadata
- `models/training_history.json` - Training history
- `models/evaluation_metrics.json` - Test set metrics

## Inference

### Python Inference

```python
from inference import SoilClassifier

# Initialize classifier
classifier = SoilClassifier(model_path='./models/soil_classifier.h5')

# Classify image
result = classifier.predict('path/to/soil_image.jpg')

print(f"Soil Type: {result['soil_type']}")
print(f"Confidence: {result['confidence']:.2%}")
print(f"Meets Threshold: {result['meets_threshold']}")
```

### TFLite Inference (Mobile)

```python
from inference import SoilClassifierTFLite

# Initialize TFLite classifier
classifier = SoilClassifierTFLite(model_path='./models/soil_classifier_optimized.tflite')

# Classify image
result = classifier.predict('path/to/soil_image.jpg')
```

## Model Performance

Expected performance metrics:
- **Accuracy**: >85% on test set
- **Top-2 Accuracy**: >95% on test set
- **Model Size**: <50MB (TFLite)
- **Inference Time**: <100ms on mobile devices
- **Confidence Threshold**: 85% minimum for auto-acceptance

## Integration with RuralConnect AI

The trained model integrates with the RuralConnect AI app:

1. **Mobile Deployment**: TFLite model deployed to React Native app
2. **Offline Inference**: Model runs on-device without internet
3. **Confidence Validation**: Results with <85% confidence require manual review
4. **Soil Analysis**: Classification feeds into soil health scoring system

## Data Requirements

For optimal performance:
- **Minimum**: 300 images per soil type (1,800 total)
- **Recommended**: 500+ images per soil type (3,000+ total)
- **Image Quality**: Clear soil texture and color visible
- **Resolution**: Minimum 224x224, higher is better
- **Variety**: Different lighting, angles, moisture levels

## Troubleshooting

### Model Size Exceeds 50MB

If the TFLite model exceeds 50MB:
1. Reduce input size (e.g., 192x192 instead of 224x224)
2. Use quantization (int8 instead of float32)
3. Prune less important layers

### Low Accuracy

If accuracy is below 85%:
1. Collect more training data
2. Increase data augmentation
3. Train for more epochs
4. Adjust learning rate
5. Try different base models (MobileNetV3Large)

### Out of Memory

If training runs out of memory:
1. Reduce batch size
2. Use gradient accumulation
3. Train on GPU/TPU
4. Use mixed precision training

## References

- [MobileNetV3 Paper](https://arxiv.org/abs/1905.02244)
- [TensorFlow Lite](https://www.tensorflow.org/lite)
- [Transfer Learning Guide](https://www.tensorflow.org/tutorials/images/transfer_learning)

## License

Part of RuralConnect AI project.
