"""
Soil Type Classification - Inference
Provides inference capabilities for both Keras and TFLite models
"""

import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import json
import os
import sys
from typing import Dict, List, Tuple

# Add parent directory to path for common module import
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from common.confidence_validator import ConfidenceValidator

class SoilClassifier:
    """Keras model inference for soil classification"""
    
    def __init__(self, model_path: str, confidence_threshold: float = 0.85):
        """
        Initialize soil classifier
        
        Args:
            model_path: Path to trained Keras model (.h5)
            confidence_threshold: Minimum confidence for auto-acceptance (default: 85%)
        """
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.validator = ConfidenceValidator(threshold=confidence_threshold)
        self.model = None
        self.soil_types = [
            'alluvial',
            'black',
            'red',
            'laterite',
            'desert',
            'mountain'
        ]
        
        self.load_model()
    
    def load_model(self):
        """Load trained Keras model"""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model not found: {self.model_path}")
        
        self.model = keras.models.load_model(self.model_path)
        print(f"Model loaded from: {self.model_path}")
    
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """
        Preprocess image for model input
        
        Args:
            image_path: Path to image file
            
        Returns:
            Preprocessed image array
        """
        # Load image
        img = Image.open(image_path)
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to model input size
        img = img.resize((224, 224))
        
        # Convert to array and normalize
        img_array = np.array(img) / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    
    def predict(self, image_path: str, top_k: int = 3) -> Dict:
        """
        Predict soil type from image
        
        Args:
            image_path: Path to soil image
            top_k: Number of top predictions to return
            
        Returns:
            Dictionary containing prediction results with validation
        """
        # Preprocess image
        img_array = self.preprocess_image(image_path)
        
        # Get predictions
        predictions = self.model.predict(img_array, verbose=0)[0]
        
        # Get top-k predictions
        top_indices = np.argsort(predictions)[-top_k:][::-1]
        
        top_predictions = [
            {
                'soil_type': self.soil_types[idx],
                'confidence': float(predictions[idx])
            }
            for idx in top_indices
        ]
        
        # Primary prediction
        primary = top_predictions[0]
        
        # Validate confidence threshold
        validation = self.validator.validate(primary['confidence'])
        
        result = {
            'soil_type': primary['soil_type'],
            'confidence': primary['confidence'],
            'meets_threshold': validation.meets_threshold,
            'validation_status': validation.status.value,
            'confidence_threshold': self.confidence_threshold,
            'top_predictions': top_predictions,
            'requires_manual_review': not validation.meets_threshold,
            'auto_accepted': validation.meets_threshold
        }
        
        return result
    
    def predict_batch(self, image_paths: List[str]) -> List[Dict]:
        """
        Predict soil types for multiple images
        
        Args:
            image_paths: List of image paths
            
        Returns:
            List of prediction results
        """
        results = []
        
        for image_path in image_paths:
            try:
                result = self.predict(image_path)
                results.append(result)
            except Exception as e:
                results.append({
                    'error': str(e),
                    'image_path': image_path
                })
        
        return results


class SoilClassifierTFLite:
    """TFLite model inference for soil classification (mobile deployment)"""
    
    def __init__(self, model_path: str, confidence_threshold: float = 0.85):
        """
        Initialize TFLite soil classifier
        
        Args:
            model_path: Path to TFLite model (.tflite)
            confidence_threshold: Minimum confidence for auto-acceptance
        """
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.validator = ConfidenceValidator(threshold=confidence_threshold)
        self.interpreter = None
        self.input_details = None
        self.output_details = None
        
        self.soil_types = [
            'alluvial',
            'black',
            'red',
            'laterite',
            'desert',
            'mountain'
        ]
        
        self.load_model()
    
    def load_model(self):
        """Load TFLite model"""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model not found: {self.model_path}")
        
        # Load TFLite model
        self.interpreter = tf.lite.Interpreter(model_path=self.model_path)
        self.interpreter.allocate_tensors()
        
        # Get input and output details
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()
        
        print(f"TFLite model loaded from: {self.model_path}")
        print(f"Input shape: {self.input_details[0]['shape']}")
        print(f"Output shape: {self.output_details[0]['shape']}")
    
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """
        Preprocess image for TFLite model input
        
        Args:
            image_path: Path to image file
            
        Returns:
            Preprocessed image array
        """
        # Load image
        img = Image.open(image_path)
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to model input size
        input_shape = self.input_details[0]['shape']
        img_size = (input_shape[1], input_shape[2])
        img = img.resize(img_size)
        
        # Convert to array and normalize
        img_array = np.array(img, dtype=np.float32) / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    
    def predict(self, image_path: str, top_k: int = 3) -> Dict:
        """
        Predict soil type from image using TFLite model
        
        Args:
            image_path: Path to soil image
            top_k: Number of top predictions to return
            
        Returns:
            Dictionary containing prediction results with validation
        """
        # Preprocess image
        img_array = self.preprocess_image(image_path)
        
        # Set input tensor
        self.interpreter.set_tensor(self.input_details[0]['index'], img_array)
        
        # Run inference
        self.interpreter.invoke()
        
        # Get output tensor
        predictions = self.interpreter.get_tensor(self.output_details[0]['index'])[0]
        
        # Get top-k predictions
        top_indices = np.argsort(predictions)[-top_k:][::-1]
        
        top_predictions = [
            {
                'soil_type': self.soil_types[idx],
                'confidence': float(predictions[idx])
            }
            for idx in top_indices
        ]
        
        # Primary prediction
        primary = top_predictions[0]
        
        # Validate confidence threshold
        validation = self.validator.validate(primary['confidence'])
        
        result = {
            'soil_type': primary['soil_type'],
            'confidence': primary['confidence'],
            'meets_threshold': validation.meets_threshold,
            'validation_status': validation.status.value,
            'confidence_threshold': self.confidence_threshold,
            'top_predictions': top_predictions,
            'requires_manual_review': not validation.meets_threshold,
            'auto_accepted': validation.meets_threshold
        }
        
        return result


def benchmark_inference(model_path: str, test_images: List[str], num_runs: int = 10):
    """
    Benchmark inference performance
    
    Args:
        model_path: Path to model file
        test_images: List of test image paths
        num_runs: Number of runs for averaging
    """
    import time
    
    print(f"\nBenchmarking inference performance...")
    print(f"Model: {model_path}")
    print(f"Test images: {len(test_images)}")
    print(f"Runs per image: {num_runs}")
    
    # Determine model type
    is_tflite = model_path.endswith('.tflite')
    
    # Load model
    if is_tflite:
        classifier = SoilClassifierTFLite(model_path)
    else:
        classifier = SoilClassifier(model_path)
    
    # Warm-up run
    if test_images:
        classifier.predict(test_images[0])
    
    # Benchmark
    times = []
    
    for image_path in test_images:
        image_times = []
        
        for _ in range(num_runs):
            start = time.time()
            classifier.predict(image_path)
            end = time.time()
            image_times.append((end - start) * 1000)  # Convert to ms
        
        avg_time = np.mean(image_times)
        times.append(avg_time)
    
    # Statistics
    avg_inference_time = np.mean(times)
    min_inference_time = np.min(times)
    max_inference_time = np.max(times)
    std_inference_time = np.std(times)
    
    print(f"\nInference Time Statistics:")
    print(f"  Average: {avg_inference_time:.2f} ms")
    print(f"  Min:     {min_inference_time:.2f} ms")
    print(f"  Max:     {max_inference_time:.2f} ms")
    print(f"  Std Dev: {std_inference_time:.2f} ms")
    
    # Check if meets mobile target (<100ms)
    if avg_inference_time < 100:
        print(f"\n✓ Meets mobile inference target (<100ms)")
    else:
        print(f"\n⚠️  Exceeds mobile inference target (>100ms)")
    
    return {
        'avg_time_ms': avg_inference_time,
        'min_time_ms': min_inference_time,
        'max_time_ms': max_inference_time,
        'std_time_ms': std_inference_time
    }


def main():
    """Demo inference"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Soil classification inference')
    parser.add_argument(
        '--model',
        type=str,
        default='./models/soil_classifier.h5',
        help='Path to model file (.h5 or .tflite)'
    )
    parser.add_argument(
        '--image',
        type=str,
        required=True,
        help='Path to soil image'
    )
    parser.add_argument(
        '--threshold',
        type=float,
        default=0.85,
        help='Confidence threshold (default: 0.85)'
    )
    parser.add_argument(
        '--benchmark',
        action='store_true',
        help='Run inference benchmark'
    )
    
    args = parser.parse_args()
    
    # Check if model exists
    if not os.path.exists(args.model):
        print(f"Error: Model not found: {args.model}")
        return
    
    # Check if image exists
    if not os.path.exists(args.image):
        print(f"Error: Image not found: {args.image}")
        return
    
    # Determine model type
    is_tflite = args.model.endswith('.tflite')
    
    # Initialize classifier
    print(f"\nInitializing {'TFLite' if is_tflite else 'Keras'} classifier...")
    
    if is_tflite:
        classifier = SoilClassifierTFLite(args.model, args.threshold)
    else:
        classifier = SoilClassifier(args.model, args.threshold)
    
    # Run inference
    print(f"\nClassifying: {args.image}")
    result = classifier.predict(args.image)
    
    # Display results
    print("\n" + "="*60)
    print("Classification Results")
    print("="*60)
    print(f"\nPrimary Prediction:")
    print(f"  Soil Type:  {result['soil_type'].capitalize()}")
    print(f"  Confidence: {result['confidence']:.2%}")
    print(f"  Threshold:  {args.threshold:.2%}")
    print(f"  Status:     {'✓ Auto-accepted' if result['meets_threshold'] else '⚠️  Manual review required'}")
    
    print(f"\nTop Predictions:")
    for i, pred in enumerate(result['top_predictions'], 1):
        print(f"  {i}. {pred['soil_type'].capitalize():12s} - {pred['confidence']:.2%}")
    
    # Benchmark if requested
    if args.benchmark:
        print("\n" + "="*60)
        benchmark_inference(args.model, [args.image], num_runs=10)


if __name__ == '__main__':
    main()
