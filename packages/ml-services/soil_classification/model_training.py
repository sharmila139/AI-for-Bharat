"""
Soil Type Classification - MobileNetV3 Model Training
Trains a lightweight MobileNetV3 model for on-device soil type classification
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV3Small
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np
import json
import os
from typing import Dict, Tuple
from datetime import datetime

class SoilClassificationModel:
    """MobileNetV3-based model for soil type classification"""
    
    def __init__(self, num_classes: int = 6, input_shape: Tuple[int, int, int] = (224, 224, 3)):
        """
        Initialize soil classification model
        
        Args:
            num_classes: Number of soil types to classify
            input_shape: Input image shape (height, width, channels)
        """
        self.num_classes = num_classes
        self.input_shape = input_shape
        self.model = None
        self.history = None
        
        # Soil type classes
        self.soil_types = [
            'alluvial',      # Fertile, good for most crops
            'black',         # Cotton soil, high clay content
            'red',           # Iron-rich, good drainage
            'laterite',      # Acidic, low fertility
            'desert',        # Sandy, low water retention
            'mountain'       # Rocky, variable composition
        ]
        
    def build_model(self, pretrained: bool = True) -> keras.Model:
        """
        Build MobileNetV3Small model for soil classification
        
        Args:
            pretrained: Whether to use ImageNet pretrained weights
            
        Returns:
            Compiled Keras model
        """
        print("\nBuilding MobileNetV3Small model...")
        
        # Load MobileNetV3Small as base
        base_model = MobileNetV3Small(
            input_shape=self.input_shape,
            include_top=False,
            weights='imagenet' if pretrained else None,
            pooling='avg'
        )
        
        # Freeze base model layers initially
        base_model.trainable = False
        
        # Build classification head
        inputs = keras.Input(shape=self.input_shape)
        x = base_model(inputs, training=False)
        
        # Add dropout for regularization
        x = layers.Dropout(0.2)(x)
        
        # Classification layer
        outputs = layers.Dense(
            self.num_classes,
            activation='softmax',
            name='soil_classification'
        )(x)
        
        # Create model
        model = keras.Model(inputs, outputs, name='soil_classifier')
        
        # Compile model
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy', keras.metrics.TopKCategoricalAccuracy(k=2, name='top_2_accuracy')]
        )
        
        self.model = model
        
        print(f"Model built successfully")
        print(f"Total parameters: {model.count_params():,}")
        print(f"Trainable parameters: {sum([tf.size(w).numpy() for w in model.trainable_weights]):,}")
        
        return model
    
    def unfreeze_base_model(self, num_layers: int = 20):
        """
        Unfreeze top layers of base model for fine-tuning
        
        Args:
            num_layers: Number of layers to unfreeze from the top
        """
        print(f"\nUnfreezing top {num_layers} layers for fine-tuning...")
        
        base_model = self.model.layers[1]  # MobileNetV3Small is the second layer
        base_model.trainable = True
        
        # Freeze all layers except the top num_layers
        for layer in base_model.layers[:-num_layers]:
            layer.trainable = False
        
        # Recompile with lower learning rate
        self.model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.0001),
            loss='categorical_crossentropy',
            metrics=['accuracy', keras.metrics.TopKCategoricalAccuracy(k=2, name='top_2_accuracy')]
        )
        
        print(f"Trainable parameters after unfreezing: {sum([tf.size(w).numpy() for w in self.model.trainable_weights]):,}")
    
    def create_data_generators(
        self,
        train_dir: str,
        val_dir: str,
        batch_size: int = 32
    ) -> Tuple[ImageDataGenerator, ImageDataGenerator]:
        """
        Create data generators with augmentation
        
        Args:
            train_dir: Directory containing training images
            val_dir: Directory containing validation images
            batch_size: Batch size for training
            
        Returns:
            Tuple of (train_generator, val_generator)
        """
        # Training data augmentation
        train_datagen = ImageDataGenerator(
            rescale=1./255,
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            fill_mode='nearest'
        )
        
        # Validation data (only rescaling)
        val_datagen = ImageDataGenerator(rescale=1./255)
        
        # Create generators
        train_generator = train_datagen.flow_from_directory(
            train_dir,
            target_size=self.input_shape[:2],
            batch_size=batch_size,
            class_mode='categorical',
            classes=self.soil_types,
            shuffle=True
        )
        
        val_generator = val_datagen.flow_from_directory(
            val_dir,
            target_size=self.input_shape[:2],
            batch_size=batch_size,
            class_mode='categorical',
            classes=self.soil_types,
            shuffle=False
        )
        
        print(f"\nData generators created:")
        print(f"Training samples: {train_generator.samples}")
        print(f"Validation samples: {val_generator.samples}")
        print(f"Classes: {train_generator.class_indices}")
        
        return train_generator, val_generator
    
    def train(
        self,
        train_generator,
        val_generator,
        epochs: int = 20,
        fine_tune_epochs: int = 10
    ) -> Dict:
        """
        Train the model in two phases: transfer learning then fine-tuning
        
        Args:
            train_generator: Training data generator
            val_generator: Validation data generator
            epochs: Number of epochs for initial training
            fine_tune_epochs: Number of epochs for fine-tuning
            
        Returns:
            Training history dictionary
        """
        print("\n" + "="*60)
        print("PHASE 1: Transfer Learning (frozen base)")
        print("="*60)
        
        # Callbacks
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=5,
                restore_best_weights=True
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=3,
                min_lr=1e-7
            )
        ]
        
        # Phase 1: Train with frozen base
        history1 = self.model.fit(
            train_generator,
            validation_data=val_generator,
            epochs=epochs,
            callbacks=callbacks
        )
        
        print("\n" + "="*60)
        print("PHASE 2: Fine-tuning (unfrozen top layers)")
        print("="*60)
        
        # Phase 2: Fine-tune with unfrozen layers
        self.unfreeze_base_model(num_layers=20)
        
        history2 = self.model.fit(
            train_generator,
            validation_data=val_generator,
            epochs=fine_tune_epochs,
            callbacks=callbacks
        )
        
        # Combine histories
        self.history = {
            'phase1': history1.history,
            'phase2': history2.history
        }
        
        return self.history
    
    def evaluate(self, test_generator) -> Dict:
        """
        Evaluate model on test set
        
        Args:
            test_generator: Test data generator
            
        Returns:
            Evaluation metrics dictionary
        """
        print("\nEvaluating model on test set...")
        
        results = self.model.evaluate(test_generator)
        
        metrics = {
            'test_loss': float(results[0]),
            'test_accuracy': float(results[1]),
            'test_top_2_accuracy': float(results[2])
        }
        
        print(f"\nTest Results:")
        print(f"  Loss: {metrics['test_loss']:.4f}")
        print(f"  Accuracy: {metrics['test_accuracy']:.4f}")
        print(f"  Top-2 Accuracy: {metrics['test_top_2_accuracy']:.4f}")
        
        # Get predictions for confusion matrix
        predictions = self.model.predict(test_generator)
        y_pred = np.argmax(predictions, axis=1)
        y_true = test_generator.classes
        
        # Calculate per-class accuracy
        from sklearn.metrics import classification_report, confusion_matrix
        
        print("\nClassification Report:")
        print(classification_report(
            y_true,
            y_pred,
            target_names=self.soil_types,
            zero_division=0
        ))
        
        metrics['confusion_matrix'] = confusion_matrix(y_true, y_pred).tolist()
        metrics['classification_report'] = classification_report(
            y_true,
            y_pred,
            target_names=self.soil_types,
            output_dict=True,
            zero_division=0
        )
        
        return metrics
    
    def optimize_for_mobile(self, output_path: str = './models/soil_classifier_optimized.tflite'):
        """
        Convert model to TensorFlow Lite for mobile deployment
        
        Args:
            output_path: Path to save optimized TFLite model
        """
        print("\nOptimizing model for mobile deployment...")
        
        # Convert to TFLite
        converter = tf.lite.TFLiteConverter.from_keras_model(self.model)
        
        # Apply optimizations
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        
        # Convert
        tflite_model = converter.convert()
        
        # Save
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(tflite_model)
        
        # Get model size
        model_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        
        print(f"TFLite model saved to: {output_path}")
        print(f"Model size: {model_size_mb:.2f} MB")
        
        if model_size_mb > 50:
            print(f"⚠️  Warning: Model size ({model_size_mb:.2f} MB) exceeds 50MB target")
        else:
            print(f"✓ Model size is within 50MB target")
        
        return model_size_mb
    
    def save_model(self, output_dir: str = './models'):
        """
        Save trained model and metadata
        
        Args:
            output_dir: Directory to save model files
        """
        os.makedirs(output_dir, exist_ok=True)
        
        # Save Keras model
        model_path = f'{output_dir}/soil_classifier.h5'
        self.model.save(model_path)
        print(f"\nKeras model saved to: {model_path}")
        
        # Save metadata
        metadata = {
            'model_name': 'soil_classifier',
            'architecture': 'MobileNetV3Small',
            'num_classes': self.num_classes,
            'input_shape': self.input_shape,
            'soil_types': self.soil_types,
            'training_date': datetime.now().isoformat(),
            'framework': 'tensorflow',
            'version': tf.__version__
        }
        
        metadata_path = f'{output_dir}/metadata.json'
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"Metadata saved to: {metadata_path}")
        
        # Save training history if available
        if self.history:
            history_path = f'{output_dir}/training_history.json'
            with open(history_path, 'w') as f:
                json.dump(self.history, f, indent=2)
            print(f"Training history saved to: {history_path}")
    
    def load_model(self, model_path: str):
        """
        Load a trained model
        
        Args:
            model_path: Path to saved model file
        """
        self.model = keras.models.load_model(model_path)
        print(f"Model loaded from: {model_path}")


def main():
    """Main training pipeline"""
    print("="*60)
    print("Soil Type Classification - MobileNetV3 Training")
    print("="*60)
    
    # Configuration
    DATA_DIR = './data/soil_images'
    TRAIN_DIR = f'{DATA_DIR}/train'
    VAL_DIR = f'{DATA_DIR}/val'
    TEST_DIR = f'{DATA_DIR}/test'
    OUTPUT_DIR = './models'
    
    BATCH_SIZE = 32
    EPOCHS = 20
    FINE_TUNE_EPOCHS = 10
    
    # Check if data directories exist
    if not os.path.exists(TRAIN_DIR):
        print(f"\n⚠️  Error: Training data directory not found: {TRAIN_DIR}")
        print("\nExpected directory structure:")
        print("  data/soil_images/")
        print("    train/")
        print("      alluvial/")
        print("      black/")
        print("      red/")
        print("      laterite/")
        print("      desert/")
        print("      mountain/")
        print("    val/")
        print("      (same structure)")
        print("    test/")
        print("      (same structure)")
        return
    
    # Initialize model
    print("\n1. Initializing model...")
    model = SoilClassificationModel(num_classes=6)
    model.build_model(pretrained=True)
    
    # Create data generators
    print("\n2. Creating data generators...")
    train_gen, val_gen = model.create_data_generators(
        TRAIN_DIR,
        VAL_DIR,
        batch_size=BATCH_SIZE
    )
    
    # Train model
    print("\n3. Training model...")
    history = model.train(
        train_gen,
        val_gen,
        epochs=EPOCHS,
        fine_tune_epochs=FINE_TUNE_EPOCHS
    )
    
    # Evaluate on test set
    print("\n4. Evaluating on test set...")
    test_datagen = tf.keras.preprocessing.image.ImageDataGenerator(rescale=1./255)
    test_gen = test_datagen.flow_from_directory(
        TEST_DIR,
        target_size=(224, 224),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        classes=model.soil_types,
        shuffle=False
    )
    
    metrics = model.evaluate(test_gen)
    
    # Save model
    print("\n5. Saving model...")
    model.save_model(OUTPUT_DIR)
    
    # Save metrics
    metrics_path = f'{OUTPUT_DIR}/evaluation_metrics.json'
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Evaluation metrics saved to: {metrics_path}")
    
    # Optimize for mobile
    print("\n6. Optimizing for mobile deployment...")
    model_size = model.optimize_for_mobile(f'{OUTPUT_DIR}/soil_classifier_optimized.tflite')
    
    print("\n" + "="*60)
    print("✓ Training Complete!")
    print("="*60)
    print(f"\nFinal Test Accuracy: {metrics['test_accuracy']:.4f}")
    print(f"TFLite Model Size: {model_size:.2f} MB")
    print(f"\nModel files saved to: {OUTPUT_DIR}")


if __name__ == '__main__':
    main()
