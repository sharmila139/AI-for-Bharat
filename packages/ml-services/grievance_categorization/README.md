# Grievance Photo Categorization Model

AI-powered infrastructure grievance photo categorization using MobileNetV3 for on-device inference.

## Overview

This model automatically categorizes infrastructure grievance photos into 9 categories:
- **Roads**: Road damage, potholes, cracks
- **Water**: Water supply issues, leaks, contamination
- **Electricity**: Power outages, damaged lines
- **Drainage**: Blocked drains, flooding, sewage
- **Waste**: Garbage accumulation, littering
- **Streetlights**: Non-functional or damaged streetlights
- **Public Property**: Damaged parks, buildings, infrastructure
- **Health Facility**: PHC issues, medical facility problems
- **Education Facility**: School infrastructure issues

## Features

- **Lightweight Architecture**: MobileNetV3Small optimized for mobile devices
- **On-Device Inference**: Works offline without internet connectivity
- **High Accuracy**: Trained to meet 85% confidence threshold requirement
- **Small Model Size**: <50MB for mobile deployment
- **Fast Inference**: Real-time categorization on low-end devices

## Requirements

```bash
tensorflow>=2.10.0
numpy>=1.21.0
pillow>=9.0.0
scikit-learn>=1.0.0
```

Install dependencies:
```bash
pip install -r requirements.txt
```

## Quick Start

### 1. Prepare Dataset

Create the directory structure:
```bash
python data_preparation.py --create-sample
```

Place your grievance images in `data/grievance_images/raw/<category>/`

Organize into train/val/test splits:
```bash
python data_preparation.py
```

### 2. Train Model

#### With Real Data
```bash
python model_training.py
```

#### With Synthetic Data (for testing)
```bash
python train_with_synthetic_data.py --samples 100 --epochs 10
```

### 3. Run Inference

#### Single Image
```bash
python inference.py --model models/grievance_classifier.h5 --image test_image.jpg
```

#### Batch Inference
```bash
python inference.py --model models/grievance_classifier.h5 --images img1.jpg img2.jpg img3.jpg
```

#### Using TFLite Model
```bash
python inference.py --model models/grievance_classifier_optimized.tflite --image test_image.jpg
```

## Model Architecture

- **Base Model**: MobileNetV3Small (pretrained on ImageNet)
- **Input Shape**: 224x224x3
- **Output**: 9 classes (softmax)
- **Training Strategy**: Two-phase (transfer learning + fine-tuning)
- **Optimization**: TensorFlow Lite with default optimizations

## Training Process

### Phase 1: Transfer Learning
- Freeze base model layers
- Train classification head
- Learning rate: 0.001
- Epochs: 20 (with early stopping)

### Phase 2: Fine-Tuning
- Unfreeze top 20 layers
- Fine-tune entire model
- Learning rate: 0.0001
- Epochs: 10 (with early stopping)

### Data Augmentation
- Rotation: ±20°
- Width/Height shift: 20%
- Shear: 20%
- Zoom: 20%
- Horizontal flip
- Rescaling: 1/255

## Model Files

After training, the following files are generated:

```
models/
├── grievance_classifier.h5                    # Keras model
├── grievance_classifier_optimized.tflite      # TFLite model
├── metadata.json                              # Model metadata
├── training_history.json                      # Training history
└── evaluation_metrics.json                    # Test metrics
```

## Performance Requirements

- **Accuracy**: ≥85% (Requirements 12.1)
- **Model Size**: <50MB (Requirements 9.3)
- **Inference Time**: <500ms on low-end devices
- **Confidence Threshold**: 85% for auto-acceptance

## Usage in Mobile App

### Load TFLite Model
```python
from grievance_categorization.inference import GrievanceClassifier

classifier = GrievanceClassifier(
    model_path='models/grievance_classifier_optimized.tflite',
    metadata_path='models/metadata.json'
)
```

### Predict Category
```python
result = classifier.predict('grievance_photo.jpg')

print(f"Category: {result['category']}")
print(f"Confidence: {result['confidence']:.2%}")
print(f"Auto-accept: {result['auto_accept']}")
```

### Handle Low Confidence
```python
if result['auto_accept']:
    # Confidence ≥85%, auto-accept categorization
    category = result['category']
else:
    # Confidence <85%, request manual verification
    top_3 = result['top_3_predictions']
    # Show top 3 options to user for manual selection
```

## Integration with Backend

### API Endpoint
```python
@app.post('/api/grievance/categorize')
async def categorize_grievance(image: UploadFile):
    # Save uploaded image
    image_path = save_upload(image)
    
    # Run inference
    result = classifier.predict(image_path)
    
    return {
        'category': result['category'],
        'confidence': result['confidence'],
        'auto_accept': result['auto_accept'],
        'alternatives': result['top_3_predictions']
    }
```

## Validation

Validate model performance:
```bash
python validate_model.py --model models/grievance_classifier.h5 --test-dir data/grievance_images/test
```

## Retraining

To retrain with new data:

1. Add new images to `data/grievance_images/raw/<category>/`
2. Re-run data preparation: `python data_preparation.py`
3. Train model: `python model_training.py`
4. Validate performance: `python validate_model.py`
5. Deploy updated model to mobile app

## Troubleshooting

### Low Accuracy
- Collect more training data (500+ images per category)
- Ensure images are properly labeled
- Increase training epochs
- Adjust learning rate

### Model Too Large
- Use more aggressive quantization
- Reduce input image size
- Prune unnecessary layers

### Slow Inference
- Use TFLite model instead of Keras
- Enable GPU acceleration on device
- Reduce input image resolution

## Related Tasks

- Task 9.1: Train MobileNetV3 model for soil type classification ✓
- Task 9.2: Train model for grievance photo categorization (current)
- Task 9.3: Optimize models for on-device inference (<50MB size)
- Task 9.4: Implement confidence threshold validation (85% minimum)
- Task 9.5: Create image preprocessing pipeline
- Task 9.6: Deploy models to mobile app for offline use
- Task 9.7: Write property test for AI confidence threshold (Property 12)

## References

- Requirements 12.1: AI image classification with 85% confidence
- Requirements 12.5: Grievance categories
- Design: MobileNetV3 architecture for on-device inference
- Property 12: AI Confidence Threshold validation

## License

Part of RuralConnect AI project.
