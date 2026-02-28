"""
Unit tests for confidence threshold validator
Tests Property 12: AI Confidence Threshold
"""

import pytest
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from confidence_validator import (
    ConfidenceValidator,
    ValidationStatus,
    ValidationResult,
    validate_soil_classification,
    validate_grievance_categorization
)


class TestConfidenceValidator:
    """Test suite for ConfidenceValidator"""
    
    def test_initialization_default_threshold(self):
        """Test validator initialization with default threshold"""
        validator = ConfidenceValidator()
        assert validator.threshold == 0.85
    
    def test_initialization_custom_threshold(self):
        """Test validator initialization with custom threshold"""
        validator = ConfidenceValidator(threshold=0.90)
        assert validator.threshold == 0.90
    
    def test_initialization_invalid_threshold_too_low(self):
        """Test validator rejects threshold below 0"""
        with pytest.raises(ValueError, match="Threshold must be between 0.0 and 1.0"):
            ConfidenceValidator(threshold=-0.1)
    
    def test_initialization_invalid_threshold_too_high(self):
        """Test validator rejects threshold above 1"""
        with pytest.raises(ValueError, match="Threshold must be between 0.0 and 1.0"):
            ConfidenceValidator(threshold=1.5)
    
    def test_validate_auto_accepted(self):
        """Test validation of confidence above threshold"""
        validator = ConfidenceValidator(threshold=0.85)
        result = validator.validate(0.90)
        
        assert result.status == ValidationStatus.AUTO_ACCEPTED
        assert result.confidence == 0.90
        assert result.threshold == 0.85
        assert result.meets_threshold is True
        assert "meets threshold" in result.message.lower()
    
    def test_validate_at_threshold(self):
        """Test validation of confidence exactly at threshold"""
        validator = ConfidenceValidator(threshold=0.85)
        result = validator.validate(0.85)
        
        assert result.status == ValidationStatus.AUTO_ACCEPTED
        assert result.meets_threshold is True
    
    def test_validate_below_threshold_manual_review(self):
        """Test validation of confidence below threshold (manual review)"""
        validator = ConfidenceValidator(threshold=0.85)
        result = validator.validate(0.80)
        
        assert result.status == ValidationStatus.MANUAL_REVIEW
        assert result.confidence == 0.80
        assert result.meets_threshold is False
        assert "manual review" in result.message.lower()
    
    def test_validate_below_threshold_strict_mode(self):
        """Test validation in strict mode rejects low confidence"""
        validator = ConfidenceValidator(threshold=0.85)
        result = validator.validate(0.80, strict=True)
        
        assert result.status == ValidationStatus.REJECTED
        assert result.meets_threshold is False
        assert "rejected" in result.message.lower()
    
    def test_validate_invalid_confidence_too_low(self):
        """Test validator rejects confidence below 0"""
        validator = ConfidenceValidator()
        with pytest.raises(ValueError, match="Confidence must be between 0.0 and 1.0"):
            validator.validate(-0.1)
    
    def test_validate_invalid_confidence_too_high(self):
        """Test validator rejects confidence above 1"""
        validator = ConfidenceValidator()
        with pytest.raises(ValueError, match="Confidence must be between 0.0 and 1.0"):
            validator.validate(1.5)
    
    def test_validate_batch(self):
        """Test batch validation of multiple confidences"""
        validator = ConfidenceValidator(threshold=0.85)
        confidences = [0.95, 0.87, 0.82, 0.75]
        results = validator.validate_batch(confidences)
        
        assert len(results) == 4
        assert results[0].status == ValidationStatus.AUTO_ACCEPTED
        assert results[1].status == ValidationStatus.AUTO_ACCEPTED
        assert results[2].status == ValidationStatus.MANUAL_REVIEW
        assert results[3].status == ValidationStatus.MANUAL_REVIEW
    
    def test_validate_batch_strict_mode(self):
        """Test batch validation in strict mode"""
        validator = ConfidenceValidator(threshold=0.85)
        confidences = [0.90, 0.80]
        results = validator.validate_batch(confidences, strict=True)
        
        assert results[0].status == ValidationStatus.AUTO_ACCEPTED
        assert results[1].status == ValidationStatus.REJECTED
    
    def test_validate_prediction_success(self):
        """Test validation of prediction dictionary"""
        validator = ConfidenceValidator(threshold=0.85)
        prediction = {
            'category': 'roads',
            'confidence': 0.92
        }
        
        result = validator.validate_prediction(prediction)
        
        assert result['category'] == 'roads'
        assert result['confidence'] == 0.92
        assert result['validation_status'] == 'auto_accepted'
        assert result['meets_threshold'] is True
        assert result['confidence_threshold'] == 0.85
        assert result['requires_manual_review'] is False
        assert result['auto_accepted'] is True
        assert 'validation_message' in result
    
    def test_validate_prediction_below_threshold(self):
        """Test validation of prediction below threshold"""
        validator = ConfidenceValidator(threshold=0.85)
        prediction = {
            'soil_type': 'alluvial',
            'confidence': 0.78
        }
        
        result = validator.validate_prediction(prediction)
        
        assert result['validation_status'] == 'manual_review'
        assert result['meets_threshold'] is False
        assert result['requires_manual_review'] is True
        assert result['auto_accepted'] is False
    
    def test_validate_prediction_custom_confidence_key(self):
        """Test validation with custom confidence key"""
        validator = ConfidenceValidator(threshold=0.85)
        prediction = {
            'category': 'water',
            'score': 0.88
        }
        
        result = validator.validate_prediction(prediction, confidence_key='score')
        
        assert result['score'] == 0.88
        assert result['auto_accepted'] is True
    
    def test_validate_prediction_missing_confidence_key(self):
        """Test validation fails when confidence key missing"""
        validator = ConfidenceValidator()
        prediction = {'category': 'roads'}
        
        with pytest.raises(KeyError, match="Confidence key 'confidence' not found"):
            validator.validate_prediction(prediction)
    
    def test_get_statistics_empty_list(self):
        """Test statistics with empty confidence list"""
        validator = ConfidenceValidator()
        stats = validator.get_statistics([])
        
        assert stats['count'] == 0
        assert stats['auto_accepted'] == 0
        assert stats['manual_review'] == 0
        assert stats['auto_accept_rate'] == 0.0
        assert stats['avg_confidence'] == 0.0
    
    def test_get_statistics_all_auto_accepted(self):
        """Test statistics when all predictions auto-accepted"""
        validator = ConfidenceValidator(threshold=0.85)
        confidences = [0.95, 0.90, 0.87, 0.92]
        stats = validator.get_statistics(confidences)
        
        assert stats['count'] == 4
        assert stats['auto_accepted'] == 4
        assert stats['manual_review'] == 0
        assert stats['auto_accept_rate'] == 1.0
        assert stats['avg_confidence'] == 0.91
        assert stats['min_confidence'] == 0.87
        assert stats['max_confidence'] == 0.95
        assert stats['threshold'] == 0.85
    
    def test_get_statistics_mixed_results(self):
        """Test statistics with mixed auto-accept and manual review"""
        validator = ConfidenceValidator(threshold=0.85)
        confidences = [0.95, 0.87, 0.82, 0.75, 0.90]
        stats = validator.get_statistics(confidences)
        
        assert stats['count'] == 5
        assert stats['auto_accepted'] == 3
        assert stats['manual_review'] == 2
        assert stats['auto_accept_rate'] == 0.6
        assert abs(stats['avg_confidence'] - 0.858) < 0.001
    
    def test_validation_result_to_dict(self):
        """Test ValidationResult conversion to dictionary"""
        result = ValidationResult(
            status=ValidationStatus.AUTO_ACCEPTED,
            confidence=0.92,
            threshold=0.85,
            meets_threshold=True,
            message="Test message"
        )
        
        result_dict = result.to_dict()
        
        assert result_dict['status'] == 'auto_accepted'
        assert result_dict['confidence'] == 0.92
        assert result_dict['threshold'] == 0.85
        assert result_dict['meets_threshold'] is True
        assert result_dict['message'] == "Test message"


class TestHelperFunctions:
    """Test suite for helper functions"""
    
    def test_validate_soil_classification_auto_accepted(self):
        """Test soil classification validation with high confidence"""
        prediction = {
            'soil_type': 'alluvial',
            'confidence': 0.92
        }
        
        result = validate_soil_classification(prediction)
        
        assert result['soil_type'] == 'alluvial'
        assert result['auto_accepted'] is True
        assert result['confidence_threshold'] == 0.85
    
    def test_validate_soil_classification_manual_review(self):
        """Test soil classification validation with low confidence"""
        prediction = {
            'soil_type': 'red',
            'confidence': 0.78
        }
        
        result = validate_soil_classification(prediction)
        
        assert result['requires_manual_review'] is True
        assert result['auto_accepted'] is False
    
    def test_validate_soil_classification_custom_threshold(self):
        """Test soil classification with custom threshold"""
        prediction = {
            'soil_type': 'black',
            'confidence': 0.87
        }
        
        result = validate_soil_classification(prediction, threshold=0.90)
        
        assert result['confidence_threshold'] == 0.90
        assert result['requires_manual_review'] is True
    
    def test_validate_grievance_categorization_auto_accepted(self):
        """Test grievance categorization validation with high confidence"""
        prediction = {
            'category': 'roads',
            'confidence': 0.94
        }
        
        result = validate_grievance_categorization(prediction)
        
        assert result['category'] == 'roads'
        assert result['auto_accepted'] is True
    
    def test_validate_grievance_categorization_manual_review(self):
        """Test grievance categorization validation with low confidence"""
        prediction = {
            'category': 'water',
            'confidence': 0.72
        }
        
        result = validate_grievance_categorization(prediction)
        
        assert result['requires_manual_review'] is True
        assert result['auto_accepted'] is False


class TestEdgeCases:
    """Test edge cases and boundary conditions"""
    
    def test_confidence_exactly_zero(self):
        """Test validation with 0% confidence"""
        validator = ConfidenceValidator(threshold=0.85)
        result = validator.validate(0.0)
        
        assert result.status == ValidationStatus.MANUAL_REVIEW
        assert result.confidence == 0.0
        assert result.meets_threshold is False
    
    def test_confidence_exactly_one(self):
        """Test validation with 100% confidence"""
        validator = ConfidenceValidator(threshold=0.85)
        result = validator.validate(1.0)
        
        assert result.status == ValidationStatus.AUTO_ACCEPTED
        assert result.confidence == 1.0
        assert result.meets_threshold is True
    
    def test_threshold_exactly_zero(self):
        """Test validator with 0% threshold (all pass)"""
        validator = ConfidenceValidator(threshold=0.0)
        result = validator.validate(0.01)
        
        assert result.status == ValidationStatus.AUTO_ACCEPTED
        assert result.meets_threshold is True
    
    def test_threshold_exactly_one(self):
        """Test validator with 100% threshold (only perfect passes)"""
        validator = ConfidenceValidator(threshold=1.0)
        
        result_pass = validator.validate(1.0)
        assert result_pass.status == ValidationStatus.AUTO_ACCEPTED
        
        result_fail = validator.validate(0.99)
        assert result_fail.status == ValidationStatus.MANUAL_REVIEW
    
    def test_very_small_confidence_difference(self):
        """Test validation with very small difference from threshold"""
        validator = ConfidenceValidator(threshold=0.85)
        
        # Just above threshold
        result_above = validator.validate(0.850001)
        assert result_above.meets_threshold is True
        
        # Just below threshold
        result_below = validator.validate(0.849999)
        assert result_below.meets_threshold is False


class TestProperty12Compliance:
    """
    Test compliance with Property 12: AI Confidence Threshold
    
    Property 12: For any AI-based classification (soil analysis, grievance 
    categorization), if the result is auto-accepted, the confidence score 
    must be >= 85%.
    """
    
    def test_property_12_auto_accepted_implies_high_confidence(self):
        """Test that auto-accepted predictions have confidence >= 85%"""
        validator = ConfidenceValidator(threshold=0.85)
        
        # Test multiple confidence values
        test_cases = [
            (0.85, True),   # At threshold
            (0.86, True),   # Above threshold
            (0.90, True),   # Well above
            (0.95, True),   # Very high
            (1.00, True),   # Perfect
            (0.84, False),  # Just below
            (0.80, False),  # Below
            (0.50, False),  # Well below
        ]
        
        for confidence, should_auto_accept in test_cases:
            result = validator.validate(confidence)
            
            if result.status == ValidationStatus.AUTO_ACCEPTED:
                # Property 12: Auto-accepted must have confidence >= 0.85
                assert result.confidence >= 0.85, \
                    f"Auto-accepted prediction has confidence {result.confidence} < 0.85"
                assert should_auto_accept, \
                    f"Confidence {confidence} should not be auto-accepted"
            else:
                assert not should_auto_accept or result.confidence < 0.85
    
    def test_property_12_soil_classification(self):
        """Test Property 12 for soil classification predictions"""
        test_predictions = [
            {'soil_type': 'alluvial', 'confidence': 0.95},
            {'soil_type': 'black', 'confidence': 0.85},
            {'soil_type': 'red', 'confidence': 0.80},
        ]
        
        for pred in test_predictions:
            result = validate_soil_classification(pred)
            
            if result['auto_accepted']:
                assert result['confidence'] >= 0.85, \
                    f"Property 12 violated: Auto-accepted soil classification " \
                    f"has confidence {result['confidence']} < 0.85"
    
    def test_property_12_grievance_categorization(self):
        """Test Property 12 for grievance categorization predictions"""
        test_predictions = [
            {'category': 'roads', 'confidence': 0.92},
            {'category': 'water', 'confidence': 0.85},
            {'category': 'electricity', 'confidence': 0.78},
        ]
        
        for pred in test_predictions:
            result = validate_grievance_categorization(pred)
            
            if result['auto_accepted']:
                assert result['confidence'] >= 0.85, \
                    f"Property 12 violated: Auto-accepted grievance categorization " \
                    f"has confidence {result['confidence']} < 0.85"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
