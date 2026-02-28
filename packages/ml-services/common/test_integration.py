"""
Integration tests for confidence threshold validation with models
Tests that the validator integrates correctly with inference code
"""

import pytest
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from confidence_validator import ConfidenceValidator


class TestValidatorIntegration:
    """Test validator integration patterns used in models"""
    
    def test_soil_classifier_pattern(self):
        """Test the pattern used in SoilClassifier"""
        # Simulate SoilClassifier initialization
        confidence_threshold = 0.85
        validator = ConfidenceValidator(threshold=confidence_threshold)
        
        # Simulate prediction result
        primary_prediction = {
            'soil_type': 'alluvial',
            'confidence': 0.92
        }
        
        # Validate using the pattern from SoilClassifier.predict()
        validation = validator.validate(primary_prediction['confidence'])
        
        result = {
            'soil_type': primary_prediction['soil_type'],
            'confidence': primary_prediction['confidence'],
            'meets_threshold': validation.meets_threshold,
            'validation_status': validation.status.value,
            'confidence_threshold': confidence_threshold,
            'requires_manual_review': not validation.meets_threshold,
            'auto_accepted': validation.meets_threshold
        }
        
        # Verify result structure
        assert 'soil_type' in result
        assert 'confidence' in result
        assert 'meets_threshold' in result
        assert 'validation_status' in result
        assert 'confidence_threshold' in result
        assert 'requires_manual_review' in result
        assert 'auto_accepted' in result
        
        # Verify values
        assert result['auto_accepted'] is True
        assert result['requires_manual_review'] is False
        assert result['validation_status'] == 'auto_accepted'
    
    def test_grievance_classifier_pattern(self):
        """Test the pattern used in GrievanceClassifier"""
        # Simulate GrievanceClassifier initialization
        confidence_threshold = 0.85
        validator = ConfidenceValidator(threshold=confidence_threshold)
        
        # Simulate prediction result
        top_confidence = 0.78
        top_category = 'roads'
        
        # Validate using the pattern from GrievanceClassifier.predict()
        validation = validator.validate(top_confidence)
        
        result = {
            'category': top_category,
            'confidence': top_confidence,
            'meets_threshold': validation.meets_threshold,
            'validation_status': validation.status.value,
            'auto_accept': validation.meets_threshold,
            'confidence_threshold': confidence_threshold,
            'requires_manual_review': not validation.meets_threshold
        }
        
        # Verify result structure
        assert 'category' in result
        assert 'confidence' in result
        assert 'meets_threshold' in result
        assert 'validation_status' in result
        assert 'auto_accept' in result
        assert 'confidence_threshold' in result
        assert 'requires_manual_review' in result
        
        # Verify values for low confidence
        assert result['auto_accept'] is False
        assert result['requires_manual_review'] is True
        assert result['validation_status'] == 'manual_review'
    
    def test_multiple_predictions_workflow(self):
        """Test workflow with multiple predictions"""
        validator = ConfidenceValidator(threshold=0.85)
        
        # Simulate batch of predictions
        predictions = [
            {'type': 'soil', 'confidence': 0.95},
            {'type': 'soil', 'confidence': 0.87},
            {'type': 'soil', 'confidence': 0.82},
            {'type': 'soil', 'confidence': 0.75},
        ]
        
        results = []
        for pred in predictions:
            validation = validator.validate(pred['confidence'])
            results.append({
                **pred,
                'auto_accepted': validation.meets_threshold,
                'validation_status': validation.status.value
            })
        
        # Verify results
        assert len(results) == 4
        assert results[0]['auto_accepted'] is True
        assert results[1]['auto_accepted'] is True
        assert results[2]['auto_accepted'] is False
        assert results[3]['auto_accepted'] is False
        
        # Count auto-accepted
        auto_accepted_count = sum(1 for r in results if r['auto_accepted'])
        assert auto_accepted_count == 2
    
    def test_threshold_boundary_cases(self):
        """Test predictions at threshold boundaries"""
        validator = ConfidenceValidator(threshold=0.85)
        
        # Test cases at and around threshold
        test_cases = [
            (0.849, False),  # Just below
            (0.850, True),   # Exactly at threshold
            (0.851, True),   # Just above
        ]
        
        for confidence, should_accept in test_cases:
            validation = validator.validate(confidence)
            assert validation.meets_threshold == should_accept, \
                f"Confidence {confidence} should {'be accepted' if should_accept else 'require review'}"
    
    def test_error_handling(self):
        """Test error handling for invalid inputs"""
        validator = ConfidenceValidator(threshold=0.85)
        
        # Test invalid confidence values
        with pytest.raises(ValueError):
            validator.validate(-0.1)
        
        with pytest.raises(ValueError):
            validator.validate(1.5)
        
        # Test invalid threshold
        with pytest.raises(ValueError):
            ConfidenceValidator(threshold=-0.1)
        
        with pytest.raises(ValueError):
            ConfidenceValidator(threshold=1.5)
    
    def test_statistics_for_model_monitoring(self):
        """Test statistics calculation for model monitoring"""
        validator = ConfidenceValidator(threshold=0.85)
        
        # Simulate a day's worth of predictions
        daily_confidences = [
            0.95, 0.92, 0.88, 0.87, 0.86,  # High confidence
            0.84, 0.82, 0.80, 0.78, 0.75,  # Low confidence
        ]
        
        stats = validator.get_statistics(daily_confidences)
        
        # Verify statistics
        assert stats['count'] == 10
        assert stats['auto_accepted'] == 5
        assert stats['manual_review'] == 5
        assert stats['auto_accept_rate'] == 0.5
        assert 0.80 < stats['avg_confidence'] < 0.90
        assert stats['min_confidence'] == 0.75
        assert stats['max_confidence'] == 0.95
        assert stats['threshold'] == 0.85
    
    def test_custom_threshold_per_model(self):
        """Test using different thresholds for different models"""
        # Soil classification with standard threshold
        soil_validator = ConfidenceValidator(threshold=0.85)
        
        # Grievance categorization with higher threshold for critical issues
        grievance_validator = ConfidenceValidator(threshold=0.90)
        
        # Same confidence, different results
        confidence = 0.87
        
        soil_result = soil_validator.validate(confidence)
        grievance_result = grievance_validator.validate(confidence)
        
        assert soil_result.meets_threshold is True
        assert grievance_result.meets_threshold is False
    
    def test_validation_message_clarity(self):
        """Test that validation messages are clear and informative"""
        validator = ConfidenceValidator(threshold=0.85)
        
        # High confidence
        result_high = validator.validate(0.92)
        assert 'meets threshold' in result_high.message.lower()
        assert '92' in result_high.message or '0.92' in result_high.message
        
        # Low confidence
        result_low = validator.validate(0.78)
        assert 'manual review' in result_low.message.lower()
        assert '78' in result_low.message or '0.78' in result_low.message
        
        # Strict mode rejection
        result_rejected = validator.validate(0.78, strict=True)
        assert 'rejected' in result_rejected.message.lower()


class TestProperty12EnforcementInIntegration:
    """
    Test that Property 12 is enforced in realistic integration scenarios
    """
    
    def test_property_12_cannot_be_violated(self):
        """Test that it's impossible to auto-accept predictions below 85%"""
        validator = ConfidenceValidator(threshold=0.85)
        
        # Try many confidence values below threshold
        low_confidences = [0.84, 0.80, 0.75, 0.70, 0.60, 0.50, 0.40, 0.30]
        
        for confidence in low_confidences:
            validation = validator.validate(confidence)
            
            # Property 12: If auto-accepted, confidence must be >= 0.85
            if validation.status.value == 'auto_accepted':
                assert confidence >= 0.85, \
                    f"Property 12 violated: Auto-accepted confidence {confidence} < 0.85"
            
            # All these should require manual review
            assert validation.status.value == 'manual_review', \
                f"Confidence {confidence} should require manual review"
    
    def test_property_12_with_realistic_model_outputs(self):
        """Test Property 12 with realistic model output distributions"""
        validator = ConfidenceValidator(threshold=0.85)
        
        # Simulate realistic model outputs (some high, some low)
        realistic_confidences = [
            # High confidence predictions (should auto-accept)
            0.98, 0.95, 0.92, 0.90, 0.88, 0.87, 0.86, 0.85,
            # Low confidence predictions (should require review)
            0.84, 0.82, 0.80, 0.75, 0.70, 0.65, 0.60, 0.55
        ]
        
        for confidence in realistic_confidences:
            validation = validator.validate(confidence)
            
            # Verify Property 12
            if validation.status.value == 'auto_accepted':
                assert confidence >= 0.85, \
                    f"Property 12 violated: Auto-accepted {confidence} < 0.85"
            
            # Verify correct classification
            if confidence >= 0.85:
                assert validation.status.value == 'auto_accepted'
            else:
                assert validation.status.value == 'manual_review'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
