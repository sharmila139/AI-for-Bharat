"""
Confidence Threshold Validator
Validates AI model predictions against confidence thresholds
Implements Property 12: AI Confidence Threshold
"""

from typing import Dict, List, Optional, Union
from dataclasses import dataclass
from enum import Enum


class ValidationStatus(Enum):
    """Validation status for predictions"""
    AUTO_ACCEPTED = "auto_accepted"
    MANUAL_REVIEW = "manual_review"
    REJECTED = "rejected"


@dataclass
class ValidationResult:
    """Result of confidence threshold validation"""
    status: ValidationStatus
    confidence: float
    threshold: float
    meets_threshold: bool
    message: str
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'status': self.status.value,
            'confidence': self.confidence,
            'threshold': self.threshold,
            'meets_threshold': self.meets_threshold,
            'message': self.message
        }


class ConfidenceValidator:
    """
    Validates AI model predictions against confidence thresholds
    
    Implements Property 12: AI Confidence Threshold
    For any AI-based classification (soil analysis, grievance categorization),
    if the result is auto-accepted, the confidence score must be >= 85%.
    """
    
    DEFAULT_THRESHOLD = 0.85  # 85% minimum confidence
    
    def __init__(self, threshold: float = DEFAULT_THRESHOLD):
        """
        Initialize confidence validator
        
        Args:
            threshold: Minimum confidence threshold (0.0 to 1.0)
        
        Raises:
            ValueError: If threshold is not between 0 and 1
        """
        if not 0.0 <= threshold <= 1.0:
            raise ValueError(f"Threshold must be between 0.0 and 1.0, got {threshold}")
        
        self.threshold = threshold
    
    def validate(
        self,
        confidence: float,
        strict: bool = False
    ) -> ValidationResult:
        """
        Validate a single confidence score
        
        Args:
            confidence: Confidence score from model (0.0 to 1.0)
            strict: If True, reject predictions below threshold instead of manual review
        
        Returns:
            ValidationResult with status and details
        
        Raises:
            ValueError: If confidence is not between 0 and 1
        """
        if not 0.0 <= confidence <= 1.0:
            raise ValueError(f"Confidence must be between 0.0 and 1.0, got {confidence}")
        
        meets_threshold = confidence >= self.threshold
        
        if meets_threshold:
            status = ValidationStatus.AUTO_ACCEPTED
            message = f"Confidence {confidence:.2%} meets threshold {self.threshold:.2%}"
        elif strict:
            status = ValidationStatus.REJECTED
            message = f"Confidence {confidence:.2%} below threshold {self.threshold:.2%} - rejected"
        else:
            status = ValidationStatus.MANUAL_REVIEW
            message = f"Confidence {confidence:.2%} below threshold {self.threshold:.2%} - requires manual review"
        
        return ValidationResult(
            status=status,
            confidence=confidence,
            threshold=self.threshold,
            meets_threshold=meets_threshold,
            message=message
        )
    
    def validate_batch(
        self,
        confidences: List[float],
        strict: bool = False
    ) -> List[ValidationResult]:
        """
        Validate multiple confidence scores
        
        Args:
            confidences: List of confidence scores
            strict: If True, reject predictions below threshold
        
        Returns:
            List of ValidationResult objects
        """
        return [self.validate(conf, strict) for conf in confidences]
    
    def validate_prediction(
        self,
        prediction: Dict,
        confidence_key: str = 'confidence',
        strict: bool = False
    ) -> Dict:
        """
        Validate a prediction dictionary and add validation fields
        
        Args:
            prediction: Prediction dictionary containing confidence score
            confidence_key: Key name for confidence score in prediction dict
            strict: If True, reject predictions below threshold
        
        Returns:
            Updated prediction dictionary with validation fields
        
        Raises:
            KeyError: If confidence_key not found in prediction
        """
        if confidence_key not in prediction:
            raise KeyError(f"Confidence key '{confidence_key}' not found in prediction")
        
        confidence = prediction[confidence_key]
        validation = self.validate(confidence, strict)
        
        # Add validation fields to prediction
        result = prediction.copy()
        result.update({
            'validation_status': validation.status.value,
            'meets_threshold': validation.meets_threshold,
            'confidence_threshold': self.threshold,
            'requires_manual_review': validation.status == ValidationStatus.MANUAL_REVIEW,
            'auto_accepted': validation.status == ValidationStatus.AUTO_ACCEPTED,
            'validation_message': validation.message
        })
        
        return result
    
    def get_statistics(self, confidences: List[float]) -> Dict:
        """
        Get statistics about confidence scores
        
        Args:
            confidences: List of confidence scores
        
        Returns:
            Dictionary with statistics
        """
        if not confidences:
            return {
                'count': 0,
                'auto_accepted': 0,
                'manual_review': 0,
                'auto_accept_rate': 0.0,
                'avg_confidence': 0.0,
                'min_confidence': 0.0,
                'max_confidence': 0.0
            }
        
        validations = self.validate_batch(confidences)
        auto_accepted = sum(1 for v in validations if v.status == ValidationStatus.AUTO_ACCEPTED)
        manual_review = sum(1 for v in validations if v.status == ValidationStatus.MANUAL_REVIEW)
        
        return {
            'count': len(confidences),
            'auto_accepted': auto_accepted,
            'manual_review': manual_review,
            'auto_accept_rate': auto_accepted / len(confidences),
            'avg_confidence': sum(confidences) / len(confidences),
            'min_confidence': min(confidences),
            'max_confidence': max(confidences),
            'threshold': self.threshold
        }


def validate_soil_classification(
    prediction: Dict,
    threshold: float = ConfidenceValidator.DEFAULT_THRESHOLD
) -> Dict:
    """
    Validate soil classification prediction
    
    Args:
        prediction: Soil classification prediction dictionary
        threshold: Confidence threshold
    
    Returns:
        Validated prediction with threshold validation fields
    """
    validator = ConfidenceValidator(threshold)
    return validator.validate_prediction(prediction, confidence_key='confidence')


def validate_grievance_categorization(
    prediction: Dict,
    threshold: float = ConfidenceValidator.DEFAULT_THRESHOLD
) -> Dict:
    """
    Validate grievance categorization prediction
    
    Args:
        prediction: Grievance categorization prediction dictionary
        threshold: Confidence threshold
    
    Returns:
        Validated prediction with threshold validation fields
    """
    validator = ConfidenceValidator(threshold)
    return validator.validate_prediction(prediction, confidence_key='confidence')


# Example usage
if __name__ == '__main__':
    # Create validator with 85% threshold
    validator = ConfidenceValidator(threshold=0.85)
    
    # Test cases
    test_confidences = [0.95, 0.87, 0.82, 0.75, 0.60]
    
    print("Confidence Threshold Validation Demo")
    print("=" * 60)
    print(f"Threshold: {validator.threshold:.2%}\n")
    
    for conf in test_confidences:
        result = validator.validate(conf)
        print(f"Confidence: {conf:.2%}")
        print(f"  Status: {result.status.value}")
        print(f"  Message: {result.message}\n")
    
    # Statistics
    print("=" * 60)
    print("Statistics:")
    stats = validator.get_statistics(test_confidences)
    print(f"  Total predictions: {stats['count']}")
    print(f"  Auto-accepted: {stats['auto_accepted']}")
    print(f"  Manual review: {stats['manual_review']}")
    print(f"  Auto-accept rate: {stats['auto_accept_rate']:.1%}")
    print(f"  Average confidence: {stats['avg_confidence']:.2%}")
