"""
Soil Type Classification - Training with Synthetic Data
Demonstrates the training pipeline with synthetic data for testing purposes
"""

import tensorflow as tf
from tensorflow import keras
import numpy as np
import os
import json
from datetime import datetime
from model_training import SoilClassificationModel

def generate_synthetic_dataset(
    num_samples_per_class: int = 100,
    input_shape: Tuple[int, int, int] = (224, 224, 3),
    num_classes: int = 6
):
    """
    Generate synthetic dataset for testing
    
    Args:
        num_samples_per_class: Number of samples per class
        input_shape: Input image shape
        num_classes: Number of soil type classes
        
    Returns:
        Tuple of (X_train, y_train, X_val, y_val, X_test, y_test)
    """
    print("\nGenerating synthetic dataset...")
    print(f"Samples per class: {num_samples_per_class}")
    print(f"Total samples: {num_samples_per_class * num_classes}")
    
    total_samples = num_samples_per_class * num_classes
    
    # Generate random images with class-specific patterns
    X = []
    y = []
    
    for class_idx in range(num_classes):
        for _ in range(num_samples_per_class):
            # Create image with class-specific color bias
            img = np.random.rand(*input_shape).astype(np.float32)
            
            # Add class-specific color pattern
            if class_idx == 0:  # Alluvial - brownish
                img[:, :, 0] *= 0.6  # Less red
                img[:, :, 1] *= 0.5  # Less green
                img[:, :, 2] *= 0.3  # Much less blue
            elif class_idx == 1:  # Black - dark
                img *= 0.3
            elif class_idx == 2:  # Red - reddish
                img[:, :, 0] *= 1.2  # More red
                img[:, :, 1] *= 0.4  # Less green
                img[:, :, 2] *= 0.4  # Less blue
            elif class_idx == 3:  # Laterite - orange-red
                img[:, :, 0] *= 1.0
                img[:, :, 1] *= 0.6
                img[:, :, 2] *= 0.3
            elif class_idx == 4:  # Desert - sandy yellow
                img[:, :, 0] *= 0.9
                img[:, :, 1] *= 0.8
                img[:, :, 2] *= 0.5
            elif class_idx == 5:  # Mountain - grayish
                img *= 0.6
            
            # Clip values to [0, 1]
            img = np.clip(img, 0, 1)
            
            X.append(img)
            y.append(class_idx)
    
    X = np.array(X)
    y = np.array(y)
    
    # Shuffle
    indices = np.random.permutation(len(X))
    X = X[indices]
    y = y[indices]
    
    # Convert labels to categorical
    y = keras.utils.to_categorical(y, num_classes)
    
    # Split into train/val/test (70/15/15)
    train_end = int(0.7 * len(X))
    val_end = int(0.85 * len(X))
    
    X_train, y_train = X[:train_end], y[:train_end]
    X_val, y_val = X[train_end:val_end], y[train_end:val_end]
    X_test, y_test = X[val_end:], y[val_end:]
    
    print(f"\nDataset split:")
    print(f"  Train: {len(X_train)} samples")
    print(f"  Val:   {len(X_val)} samples")
    print(f"  Test:  {len(X_test)} samples")
    
    return X_train, y_train, X_val, y_val, X_test, y_test


def train_with_synthetic_data(
    num_samples_per_class: int = 100,
    epochs: int = 10,
    fine_tune_epochs: int = 5,
    output_dir: str = './models'
):
    """
    Train model with synthetic data
    
    Args:
        num_samples_per_class: Number of synthetic samples per class
        epochs: Number of training epochs
        fine_tune_epochs: Number of fine-tuning epochs
        output_dir: Directory to save model
    """
    print("="*60)
    print("Soil Classification - Training with Synthetic Data")
    print("="*60)
    print("\nNote: This uses synthetic data for demonstration purposes.")
    print("For production use, train with real soil images.")
    
    # Generate synthetic dataset
    X_train, y_train, X_val, y_val, X_test, y_test = generate_synthetic_dataset(
        num_samples_per_class=num_samples_per_class
    )
    
    # Initialize model
    print("\n1. Building model...")
    model = SoilClassificationModel(num_classes=6)
    model.build_model(pretrained=True)
    
    # Train Phase 1: Transfer learning
    print("\n2. Training Phase 1: Transfer Learning...")
    print("   (Training with frozen base model)")
    
    history1 = model.model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=32,
        callbacks=[
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=3,
                restore_best_weights=True
            )
        ],
        verbose=1
    )
    
    # Train Phase 2: Fine-tuning
    print("\n3. Training Phase 2: Fine-Tuning...")
    print("   (Training with unfrozen top layers)")
    
    model.unfreeze_base_model(num_layers=20)
    
    history2 = model.model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=fine_tune_epochs,
        batch_size=32,
        callbacks=[
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=3,
                restore_best_weights=True
            )
        ],
        verbose=1
    )
    
    # Evaluate on test set
    print("\n4. Evaluating on test set...")
    test_results = model.model.evaluate(X_test, y_test, verbose=0)
    
    metrics = {
        'test_loss': float(test_results[0]),
        'test_accuracy': float(test_results[1]),
        'test_top_2_accuracy': float(test_results[2])
    }
    
    print(f"\nTest Results:")
    print(f"  Loss:           {metrics['test_loss']:.4f}")
    print(f"  Accuracy:       {metrics['test_accuracy']:.4f}")
    print(f"  Top-2 Accuracy: {metrics['test_top_2_accuracy']:.4f}")
    
    # Save model
    print("\n5. Saving model...")
    os.makedirs(output_dir, exist_ok=True)
    
    model_path = f'{output_dir}/soil_classifier.h5'
    model.model.save(model_path)
    print(f"   Keras model saved: {model_path}")
    
    # Save metadata
    metadata = {
        'model_name': 'soil_classifier',
        'architecture': 'MobileNetV3Small',
        'num_classes': 6,
        'input_shape': [224, 224, 3],
        'soil_types': model.soil_types,
        'training_date': datetime.now().isoformat(),
        'framework': 'tensorflow',
        'version': tf.__version__,
        'trained_with': 'synthetic_data',
        'note': 'This model was trained with synthetic data for demonstration purposes'
    }
    
    metadata_path = f'{output_dir}/metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"   Metadata saved: {metadata_path}")
    
    # Save metrics
    metrics_path = f'{output_dir}/evaluation_metrics.json'
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"   Metrics saved: {metrics_path}")
    
    # Optimize for mobile
    print("\n6. Optimizing for mobile deployment...")
    model_size = model.optimize_for_mobile(f'{output_dir}/soil_classifier_optimized.tflite')
    
    print("\n" + "="*60)
    print("✓ Training Complete!")
    print("="*60)
    print(f"\nFinal Test Accuracy: {metrics['test_accuracy']:.4f}")
    print(f"TFLite Model Size: {model_size:.2f} MB")
    print(f"\nModel files saved to: {output_dir}")
    print("\nNote: This model was trained with synthetic data.")
    print("For production use, retrain with real soil images.")
    
    return model, metrics


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Train soil classification model with synthetic data'
    )
    parser.add_argument(
        '--samples',
        type=int,
        default=100,
        help='Number of samples per class (default: 100)'
    )
    parser.add_argument(
        '--epochs',
        type=int,
        default=10,
        help='Number of training epochs (default: 10)'
    )
    parser.add_argument(
        '--fine-tune-epochs',
        type=int,
        default=5,
        help='Number of fine-tuning epochs (default: 5)'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='./models',
        help='Output directory for models (default: ./models)'
    )
    
    args = parser.parse_args()
    
    # Train model
    train_with_synthetic_data(
        num_samples_per_class=args.samples,
        epochs=args.epochs,
        fine_tune_epochs=args.fine_tune_epochs,
        output_dir=args.output
    )


if __name__ == '__main__':
    from typing import Tuple
    main()
