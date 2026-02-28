"""
Grievance Photo Categorization - Model Validation
Validates trained model performance and generates detailed metrics
"""

import tensorflow as tf
from tensorflow import keras
import numpy as np
import json
import os
from typing import Dict
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

def validate_model(
    model_path: str,
    test_dir: str,
    metadata_path: str = None,
    output_dir: str = './validation_results'
):
    """
    Validate model performance on test set
    
    Args:
        model_path: Path to trained model
        test_dir: Directory containing test images
        metadata_path: Path to metadata.json
        output_dir: Directory to save validation results
    """
    print("="*60)
    print("Grievance Categorization - Model Validation")
    print("="*60)
    
    # Load metadata
    if metadata_path is None:
        metadata_path = os.path.join(os.path.dirname(model_path), 'metadata.json')
    
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    categories = metadata['categories']
    confidence_threshold = metadata.get('confidence_threshold', 0.85)
    
    print(f"\nModel: {model_path}")
    print(f"Test directory: {test_dir}")
    print(f"Categories: {len(categories)}")
    print(f"Confidence threshold: {confidence_threshold}")
    
    # Load model
    print("\nLoading model...")
    is_tflite = model_path.endswith('.tflite')
    
    if is_tflite:
        interpreter = tf.lite.Interpreter(model_path=model_path)
        interpreter.allocate_tensors()
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
        model = None
    else:
        model = keras.models.load_model(model_path)
        interpreter = None
    
    # Create test data generator
    print("\nLoading test data...")
    test_datagen = tf.keras.preprocessing.image.ImageDataGenerator(rescale=1./255)
    test_generator = test_datagen.flow_from_directory(
        test_dir,
        target_size=(224, 224),
        batch_size=32,
        class_mode='categorical',
        classes=categories,
        shuffle=False
    )
    
    print(f"Test samples: {test_generator.samples}")
    
    # Run predictions
    print("\nRunning predictions...")
    if is_tflite:
        # TFLite inference
        predictions = []
        for i in range(len(test_generator)):
            batch_x, _ = test_generator[i]
            for img in batch_x:
                img_input = np.expand_dims(img, axis=0)
                interpreter.set_tensor(input_details[0]['index'], img_input)
                interpreter.invoke()
                pred = interpreter.get_tensor(output_details[0]['index'])[0]
                predictions.append(pred)
        predictions = np.array(predictions)
    else:
        # Keras model inference
        predictions = model.predict(test_generator, verbose=1)
    
    # Get true labels and predicted labels
    y_true = test_generator.classes
    y_pred = np.argmax(predictions, axis=1)
    
    # Get confidence scores
    confidences = np.max(predictions, axis=1)
    
    # Calculate metrics
    print("\nCalculating metrics...")
    
    # Overall accuracy
    accuracy = np.mean(y_pred == y_true)
    
    # Accuracy at confidence threshold
    high_conf_mask = confidences >= confidence_threshold
    high_conf_accuracy = np.mean(y_pred[high_conf_mask] == y_true[high_conf_mask]) if high_conf_mask.any() else 0
    high_conf_percentage = np.mean(high_conf_mask)
    
    # Classification report
    report = classification_report(
        y_true,
        y_pred,
        target_names=categories,
        output_dict=True,
        zero_division=0
    )
    
    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    
    # Print results
    print("\n" + "="*60)
    print("Validation Results")
    print("="*60)
    
    print(f"\nOverall Metrics:")
    print(f"  Accuracy:                    {accuracy:.4f} ({accuracy:.2%})")
    print(f"  High Confidence Accuracy:    {high_conf_accuracy:.4f} ({high_conf_accuracy:.2%})")
    print(f"  High Confidence Percentage:  {high_conf_percentage:.4f} ({high_conf_percentage:.2%})")
    print(f"  Confidence Threshold:        {confidence_threshold}")
    
    print(f"\nPer-Category Metrics:")
    print(f"{'Category':<20} {'Precision':<12} {'Recall':<12} {'F1-Score':<12} {'Support':<10}")
    print("-" * 70)
    for category in categories:
        metrics = report[category]
        print(f"{category:<20} {metrics['precision']:<12.4f} {metrics['recall']:<12.4f} "
              f"{metrics['f1-score']:<12.4f} {int(metrics['support']):<10}")
    
    # Check if model meets requirements
    print(f"\nRequirements Validation:")
    if accuracy >= 0.85:
        print(f"  ✓ Overall accuracy ({accuracy:.2%}) meets 85% threshold")
    else:
        print(f"  ✗ Overall accuracy ({accuracy:.2%}) below 85% threshold")
    
    if high_conf_accuracy >= 0.85:
        print(f"  ✓ High confidence accuracy ({high_conf_accuracy:.2%}) meets 85% threshold")
    else:
        print(f"  ✗ High confidence accuracy ({high_conf_accuracy:.2%}) below 85% threshold")
    
    # Save results
    os.makedirs(output_dir, exist_ok=True)
    
    # Save metrics JSON
    validation_results = {
        'model_path': model_path,
        'test_dir': test_dir,
        'overall_accuracy': float(accuracy),
        'high_confidence_accuracy': float(high_conf_accuracy),
        'high_confidence_percentage': float(high_conf_percentage),
        'confidence_threshold': confidence_threshold,
        'classification_report': report,
        'confusion_matrix': cm.tolist(),
        'categories': categories,
        'test_samples': int(test_generator.samples)
    }
    
    results_path = os.path.join(output_dir, 'validation_results.json')
    with open(results_path, 'w') as f:
        json.dump(validation_results, f, indent=2)
    print(f"\n✓ Validation results saved to: {results_path}")
    
    # Plot confusion matrix
    plt.figure(figsize=(12, 10))
    sns.heatmap(
        cm,
        annot=True,
        fmt='d',
        cmap='Blues',
        xticklabels=categories,
        yticklabels=categories
    )
    plt.title('Confusion Matrix - Grievance Categorization')
    plt.ylabel('True Category')
    plt.xlabel('Predicted Category')
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    plt.tight_layout()
    
    cm_path = os.path.join(output_dir, 'confusion_matrix.png')
    plt.savefig(cm_path, dpi=300, bbox_inches='tight')
    print(f"✓ Confusion matrix saved to: {cm_path}")
    
    # Plot confidence distribution
    plt.figure(figsize=(10, 6))
    plt.hist(confidences, bins=50, edgecolor='black', alpha=0.7)
    plt.axvline(confidence_threshold, color='red', linestyle='--', linewidth=2, label=f'Threshold ({confidence_threshold})')
    plt.xlabel('Confidence Score')
    plt.ylabel('Frequency')
    plt.title('Confidence Score Distribution')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    conf_path = os.path.join(output_dir, 'confidence_distribution.png')
    plt.savefig(conf_path, dpi=300, bbox_inches='tight')
    print(f"✓ Confidence distribution saved to: {conf_path}")
    
    # Plot per-category accuracy
    category_accuracies = []
    for i, category in enumerate(categories):
        mask = y_true == i
        if mask.any():
            cat_acc = np.mean(y_pred[mask] == y_true[mask])
            category_accuracies.append(cat_acc)
        else:
            category_accuracies.append(0)
    
    plt.figure(figsize=(12, 6))
    bars = plt.bar(range(len(categories)), category_accuracies)
    plt.axhline(confidence_threshold, color='red', linestyle='--', linewidth=2, label=f'Threshold ({confidence_threshold})')
    plt.xlabel('Category')
    plt.ylabel('Accuracy')
    plt.title('Per-Category Accuracy')
    plt.xticks(range(len(categories)), categories, rotation=45, ha='right')
    plt.ylim(0, 1.0)
    plt.legend()
    plt.grid(True, alpha=0.3, axis='y')
    
    # Color bars based on threshold
    for i, bar in enumerate(bars):
        if category_accuracies[i] >= confidence_threshold:
            bar.set_color('green')
        else:
            bar.set_color('orange')
    
    acc_path = os.path.join(output_dir, 'category_accuracy.png')
    plt.savefig(acc_path, dpi=300, bbox_inches='tight')
    print(f"✓ Category accuracy plot saved to: {acc_path}")
    
    print(f"\n✓ Validation complete! Results saved to: {output_dir}")
    
    return validation_results


def main():
    """Main validation function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Validate grievance categorization model')
    parser.add_argument(
        '--model',
        type=str,
        required=True,
        help='Path to trained model (.h5 or .tflite)'
    )
    parser.add_argument(
        '--test-dir',
        type=str,
        required=True,
        help='Directory containing test images'
    )
    parser.add_argument(
        '--metadata',
        type=str,
        help='Path to metadata.json file (optional)'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='./validation_results',
        help='Output directory for validation results'
    )
    
    args = parser.parse_args()
    
    validate_model(
        model_path=args.model,
        test_dir=args.test_dir,
        metadata_path=args.metadata,
        output_dir=args.output
    )


if __name__ == '__main__':
    main()
