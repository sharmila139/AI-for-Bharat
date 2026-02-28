"""
Grievance Photo Categorization - Inference
Performs inference on grievance images using trained model
"""

import tensorflow as tf
from tensorflow import keras
import numpy as np
import json
import os
import sys
from typing import Dict, List, Tuple
from PIL import Image

# Add parent directory to path for common module import
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from common.confidence_validator import ConfidenceValidator

class GrievanceClassifier:
    """Inference class for grievance photo categorization"""
    
    def __init__(self, model_path: str, metadata_path: str = None):
        """
        Initialize classifier
        
        Args:
            model_path: Path to trained model (.h5 or .tflite)
            metadata_path: Path to metadata.json file
        """
        self.model_path = model_path
        self.is_tflite = model_path.endswith('.tflite')
        
        # Load model
        if self.is_tflite:
            self.interpreter = tf.lite.Interpreter(model_path=model_path)
            self.interpreter.allocate_tensors()
            self.input_details = self.interpreter.get_input_details()
            self.output_details = self.interpreter.get_output_details()
            self.model = None
        else:
            self.model = keras.models.load_model(model_path)
            self.interpreter = None
        
        # Load metadata
        if metadata_path is None:
            metadata_path = os.path.join(os.path.dirname(model_path), 'metadata.json')
        
        with open(metadata_path, 'r') as f:
            self.metadata = json.load(f)
        
        self.categories = self.metadata['categories']
        self.input_shape = tuple(self.metadata['input_shape'])
        self.confidence_threshold = self.metadata.get('confidence_threshold', 0.85)
        self.validator = ConfidenceValidator(threshold=self.confidence_threshold)
        
        print(f"Loaded model: {model_path}")
        print(f"Categories: {', '.join(self.categories)}")
        print(f"Confidence threshold: {self.confidence_threshold}")
    
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """
        Preprocess image for inference
        
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
        
        # Resize to model input shape
        img = img.resize(self.input_shape[:2])
        
        # Convert to array and normalize
        img_array = np.array(img, dtype=np.float32) / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    
    def predict(self, image_path: str) -> Dict:
        """
        Predict grievance category for an image
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dictionary with prediction results and validation
        """
        # Preprocess image
        img_array = self.preprocess_image(image_path)
        
        # Run inference
        if self.is_tflite:
            # TFLite inference
            self.interpreter.set_tensor(self.input_details[0]['index'], img_array)
            self.interpreter.invoke()
            predictions = self.interpreter.get_tensor(self.output_details[0]['index'])[0]
        else:
            # Keras model inference
            predictions = self.model.predict(img_array, verbose=0)[0]
        
        # Get top prediction
        top_idx = np.argmax(predictions)
        top_confidence = float(predictions[top_idx])
        top_category = self.categories[top_idx]
        
        # Get top 3 predictions
        top_3_indices = np.argsort(predictions)[-3:][::-1]
        top_3_predictions = [
            {
                'category': self.categories[idx],
                'confidence': float(predictions[idx])
            }
            for idx in top_3_indices
        ]
        
        # Validate confidence threshold
        validation = self.validator.validate(top_confidence)
        
        result = {
            'category': top_category,
            'confidence': top_confidence,
            'meets_threshold': validation.meets_threshold,
            'validation_status': validation.status.value,
            'auto_accept': validation.meets_threshold,
            'confidence_threshold': self.confidence_threshold,
            'requires_manual_review': not validation.meets_threshold,
            'top_3_predictions': top_3_predictions,
            'all_predictions': {
                self.categories[i]: float(predictions[i])
                for i in range(len(self.categories))
            }
        }
        
        return result
    
    def predict_batch(self, image_paths: List[str]) -> List[Dict]:
        """
        Predict categories for multiple images
        
        Args:
            image_paths: List of image file paths
            
        Returns:
            List of prediction dictionaries
        """
        results = []
        
        for image_path in image_paths:
            try:
                result = self.predict(image_path)
                result['image_path'] = image_path
                result['status'] = 'success'
                results.append(result)
            except Exception as e:
                results.append({
                    'image_path': image_path,
                    'status': 'error',
                    'error': str(e)
                })
        
        return results


def main():
    """Main inference function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Grievance photo categorization inference')
    parser.add_argument(
        '--model',
        type=str,
        required=True,
        help='Path to trained model (.h5 or .tflite)'
    )
    parser.add_argument(
        '--image',
        type=str,
        help='Path to single image for inference'
    )
    parser.add_argument(
        '--images',
        type=str,
        nargs='+',
        help='Paths to multiple images for batch inference'
    )
    parser.add_argument(
        '--metadata',
        type=str,
        help='Path to metadata.json file (optional)'
    )
    parser.add_argument(
        '--output',
        type=str,
        help='Path to save results JSON file'
    )
    
    args = parser.parse_args()
    
    if not args.image and not args.images:
        parser.error("Either --image or --images must be provided")
    
    # Initialize classifier
    print("="*60)
    print("Grievance Photo Categorization - Inference")
    print("="*60)
    
    classifier = GrievanceClassifier(args.model, args.metadata)
    
    # Run inference
    if args.image:
        print(f"\nProcessing single image: {args.image}")
        result = classifier.predict(args.image)
        
        print("\nPrediction Results:")
        print(f"  Category:    {result['category']}")
        print(f"  Confidence:  {result['confidence']:.4f} ({result['confidence']:.2%})")
        print(f"  Auto-accept: {result['auto_accept']}")
        print(f"  Threshold:   {result['confidence_threshold']}")
        
        print("\nTop 3 Predictions:")
        for i, pred in enumerate(result['top_3_predictions'], 1):
            print(f"  {i}. {pred['category']:20s} - {pred['confidence']:.4f} ({pred['confidence']:.2%})")
        
        results = [result]
    
    else:
        print(f"\nProcessing {len(args.images)} images...")
        results = classifier.predict_batch(args.images)
        
        # Print summary
        successful = sum(1 for r in results if r['status'] == 'success')
        failed = len(results) - successful
        
        print(f"\nBatch Processing Summary:")
        print(f"  Total images:  {len(results)}")
        print(f"  Successful:    {successful}")
        print(f"  Failed:        {failed}")
        
        if successful > 0:
            auto_accepted = sum(1 for r in results if r.get('auto_accept', False))
            print(f"  Auto-accepted: {auto_accepted} ({auto_accepted/successful:.1%})")
        
        print("\nResults:")
        for result in results:
            if result['status'] == 'success':
                print(f"  {result['image_path']}: {result['category']} ({result['confidence']:.2%})")
            else:
                print(f"  {result['image_path']}: ERROR - {result['error']}")
    
    # Save results if output path provided
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\n✓ Results saved to: {args.output}")


if __name__ == '__main__':
    main()
