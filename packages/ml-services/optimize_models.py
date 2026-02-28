"""
Model Optimization for On-Device Inference
Optimizes both soil classification and grievance categorization models to <50MB
Applies quantization, pruning, and compression techniques
"""

import tensorflow as tf
from tensorflow import keras
import tensorflow_model_optimization as tfmot
import os
import json
from typing import Dict, Tuple
import numpy as np

class ModelOptimizer:
    """Optimizes TensorFlow models for on-device inference"""
    
    def __init__(self, model_path: str, model_name: str):
        """
        Initialize model optimizer
        
        Args:
            model_path: Path to the trained Keras model (.h5)
            model_name: Name of the model (for output files)
        """
        self.model_path = model_path
        self.model_name = model_name
        self.model = None
        
    def load_model(self):
        """Load the trained Keras model"""
        print(f"\nLoading model from: {self.model_path}")
        self.model = keras.models.load_model(self.model_path)
        print(f"Model loaded successfully")
        print(f"Total parameters: {self.model.count_params():,}")
        return self.model
    
    def convert_to_tflite_basic(self, output_path: str) -> float:
        """
        Convert to TFLite with basic optimization
        
        Args:
            output_path: Path to save TFLite model
            
        Returns:
            Model size in MB
        """
        print("\n" + "="*60)
        print("Converting to TFLite (Basic Optimization)")
        print("="*60)
        
        converter = tf.lite.TFLiteConverter.from_keras_model(self.model)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        
        tflite_model = converter.convert()
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(tflite_model)
        
        size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"✓ Model saved to: {output_path}")
        print(f"  Size: {size_mb:.2f} MB")
        
        return size_mb
    
    def convert_to_tflite_quantized_int8(
        self,
        output_path: str,
        representative_dataset_gen=None
    ) -> float:
        """
        Convert to TFLite with INT8 quantization (most aggressive)
        
        Args:
            output_path: Path to save TFLite model
            representative_dataset_gen: Generator for representative dataset
            
        Returns:
            Model size in MB
        """
        print("\n" + "="*60)
        print("Converting to TFLite (INT8 Quantization)")
        print("="*60)
        
        converter = tf.lite.TFLiteConverter.from_keras_model(self.model)
        
        # Enable all optimizations
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        
        # INT8 quantization
        if representative_dataset_gen:
            converter.representative_dataset = representative_dataset_gen
            converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
            converter.inference_input_type = tf.uint8
            converter.inference_output_type = tf.uint8
        
        tflite_model = converter.convert()
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(tflite_model)
        
        size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"✓ Model saved to: {output_path}")
        print(f"  Size: {size_mb:.2f} MB")
        
        return size_mb
    
    def convert_to_tflite_float16(self, output_path: str) -> float:
        """
        Convert to TFLite with FLOAT16 quantization (balanced)
        
        Args:
            output_path: Path to save TFLite model
            
        Returns:
            Model size in MB
        """
        print("\n" + "="*60)
        print("Converting to TFLite (FLOAT16 Quantization)")
        print("="*60)
        
        converter = tf.lite.TFLiteConverter.from_keras_model(self.model)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.target_spec.supported_types = [tf.float16]
        
        tflite_model = converter.convert()
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(tflite_model)
        
        size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"✓ Model saved to: {output_path}")
        print(f"  Size: {size_mb:.2f} MB")
        
        return size_mb
    
    def optimize_all(self, output_dir: str, representative_dataset_gen=None) -> Dict:
        """
        Create all optimization variants and compare
        
        Args:
            output_dir: Directory to save optimized models
            representative_dataset_gen: Generator for INT8 quantization
            
        Returns:
            Dictionary with optimization results
        """
        results = {}
        
        # 1. Basic optimization
        basic_path = f"{output_dir}/{self.model_name}_basic.tflite"
        results['basic'] = {
            'path': basic_path,
            'size_mb': self.convert_to_tflite_basic(basic_path)
        }
        
        # 2. FLOAT16 quantization
        float16_path = f"{output_dir}/{self.model_name}_float16.tflite"
        results['float16'] = {
            'path': float16_path,
            'size_mb': self.convert_to_tflite_float16(float16_path)
        }
        
        # 3. INT8 quantization (if representative dataset provided)
        if representative_dataset_gen:
            int8_path = f"{output_dir}/{self.model_name}_int8.tflite"
            results['int8'] = {
                'path': int8_path,
                'size_mb': self.convert_to_tflite_quantized_int8(int8_path, representative_dataset_gen)
            }
        
        # Print summary
        print("\n" + "="*60)
        print("Optimization Summary")
        print("="*60)
        for opt_type, data in results.items():
            status = "✓" if data['size_mb'] < 50 else "⚠️"
            print(f"{status} {opt_type.upper():12s}: {data['size_mb']:6.2f} MB")
        
        # Recommend best option
        print("\n" + "="*60)
        print("Recommendation")
        print("="*60)
        
        # Find smallest model under 50MB
        valid_models = {k: v for k, v in results.items() if v['size_mb'] < 50}
        
        # Validate all models are under 50MB
        all_under_50mb = all(v['size_mb'] < 50 for v in results.values())
        
        if valid_models:
            # Prefer float16 over int8 for better accuracy, unless int8 is needed
            if 'float16' in valid_models:
                recommended = 'float16'
            elif 'basic' in valid_models:
                recommended = 'basic'
            else:
                recommended = min(valid_models.items(), key=lambda x: x[1]['size_mb'])[0]
            
            print(f"✓ Recommended: {recommended.upper()}")
            print(f"  Size: {results[recommended]['size_mb']:.2f} MB")
            print(f"  Path: {results[recommended]['path']}")
            print(f"\nThis model meets the <50MB requirement for on-device inference.")
        else:
            print("⚠️  Warning: No optimization variant is under 50MB!")
            print("Consider:")
            print("  1. Using a smaller base model (MobileNetV3-Small is already minimal)")
            print("  2. Reducing input resolution (currently 224x224)")
            print("  3. Pruning the model before quantization")
        
        return results


def create_representative_dataset_generator(data_dir: str, num_samples: int = 100):
    """
    Create a representative dataset generator for INT8 quantization
    
    Args:
        data_dir: Directory containing sample images
        num_samples: Number of samples to use
        
    Returns:
        Generator function for representative dataset
    """
    def representative_dataset():
        # Load sample images
        from tensorflow.keras.preprocessing.image import ImageDataGenerator
        
        datagen = ImageDataGenerator(rescale=1./255)
        generator = datagen.flow_from_directory(
            data_dir,
            target_size=(224, 224),
            batch_size=1,
            class_mode=None,
            shuffle=True
        )
        
        for i in range(min(num_samples, generator.samples)):
            image = next(generator)
            yield [image]
    
    return representative_dataset


def optimize_soil_classification_model(
    model_path: str = "packages/ml-services/soil_classification/models/soil_classifier.h5",
    output_dir: str = "packages/ml-services/soil_classification/models/optimized",
    data_dir: str = "packages/ml-services/soil_classification/data/soil_images/val"
):
    """Optimize soil classification model"""
    print("\n" + "="*80)
    print("OPTIMIZING SOIL CLASSIFICATION MODEL")
    print("="*80)
    
    optimizer = ModelOptimizer(model_path, "soil_classifier")
    optimizer.load_model()
    
    # Create representative dataset if data available
    rep_dataset = None
    if os.path.exists(data_dir):
        print(f"\nCreating representative dataset from: {data_dir}")
        rep_dataset = create_representative_dataset_generator(data_dir)
    else:
        print(f"\n⚠️  Data directory not found: {data_dir}")
        print("Skipping INT8 quantization (requires representative dataset)")
    
    results = optimizer.optimize_all(output_dir, rep_dataset)
    
    # Save results
    results_path = f"{output_dir}/optimization_results.json"
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to: {results_path}")
    
    return results


def optimize_grievance_categorization_model(
    model_path: str = "packages/ml-services/grievance_categorization/models/grievance_classifier.h5",
    output_dir: str = "packages/ml-services/grievance_categorization/models/optimized",
    data_dir: str = "packages/ml-services/grievance_categorization/data/grievance_images/val"
):
    """Optimize grievance categorization model"""
    print("\n" + "="*80)
    print("OPTIMIZING GRIEVANCE CATEGORIZATION MODEL")
    print("="*80)
    
    optimizer = ModelOptimizer(model_path, "grievance_classifier")
    optimizer.load_model()
    
    # Create representative dataset if data available
    rep_dataset = None
    if os.path.exists(data_dir):
        print(f"\nCreating representative dataset from: {data_dir}")
        rep_dataset = create_representative_dataset_generator(data_dir)
    else:
        print(f"\n⚠️  Data directory not found: {data_dir}")
        print("Skipping INT8 quantization (requires representative dataset)")
    
    results = optimizer.optimize_all(output_dir, rep_dataset)
    
    # Save results
    results_path = f"{output_dir}/optimization_results.json"
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to: {results_path}")
    
    return results


def main():
    """Main optimization pipeline"""
    print("="*80)
    print("MODEL OPTIMIZATION FOR ON-DEVICE INFERENCE")
    print("Target: <50MB per model for mobile deployment")
    print("="*80)
    
    all_results = {}
    
    # Optimize soil classification model
    try:
        soil_results = optimize_soil_classification_model()
        all_results['soil_classification'] = soil_results
    except Exception as e:
        print(f"\n⚠️  Error optimizing soil classification model: {e}")
        print("Make sure the model has been trained first.")
    
    print("\n\n")
    
    # Optimize grievance categorization model
    try:
        grievance_results = optimize_grievance_categorization_model()
        all_results['grievance_categorization'] = grievance_results
    except Exception as e:
        print(f"\n⚠️  Error optimizing grievance categorization model: {e}")
        print("Make sure the model has been trained first.")
    
    # Final summary
    print("\n" + "="*80)
    print("FINAL SUMMARY")
    print("="*80)
    
    if all_results:
        for model_name, results in all_results.items():
            print(f"\n{model_name.upper().replace('_', ' ')}:")
            for opt_type, data in results.items():
                status = "✓" if data['size_mb'] < 50 else "⚠️"
                print(f"  {status} {opt_type:10s}: {data['size_mb']:6.2f} MB")
    else:
        print("\n⚠️  No models were optimized.")
        print("\nTo optimize models:")
        print("  1. Train the models first using:")
        print("     - packages/ml-services/soil_classification/train_with_synthetic_data.py")
        print("     - packages/ml-services/grievance_categorization/train_with_synthetic_data.py")
        print("  2. Run this optimization script again")
    
    print("\n" + "="*80)


if __name__ == '__main__':
    main()
