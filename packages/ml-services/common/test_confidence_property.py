"""
Property-Based Tests for Confidence Threshold Validation

Feature: ruralconnect-ai
Property 12: AI Confidence Threshold

For any AI-based classification (soil analysis, grievance categorization),
if the result is auto-accepted, the confidence score must be >= 85%.

Validates: Requirements 4.1, 12.1
"""

import pytest
from hypothesis import given, strategies as st, assume, settings
from hypothesis import HealthCheck

from confidence_validator import (
    ConfidenceValidator,
    ValidationStatus,
    validate_soil_classification,
    validate_grievance_categorization
)


# Property 12.1: Auto-Accepted Results Must Meet Threshold
@given(st.floats(min_value=0.85, max_value=1.0))
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_auto_accepted_results_must_meet_threshold(confidence):
    """
    **Validates: Property 12**
    
    For any confidence score >= 85%, the validation status must be AUTO_ACCEPTED.
    """
    assume(0.85 <= confidence <= 1.0)
    
    validator = ConfidenceValidator(threshold=0.85)
    result = validator.validate(confidence)
    
    # Property: If confidence >= 85%, status must be AUTO_ACCEPTED
    assert result.status == ValidationStatus.AUTO_ACCEPTED
    assert result.meets_threshold is True
    assert result.confidence >= 0.85


# Property 12.2: Below-Threshold Results Must Not Be Auto-Accepted
@given(st.floats(min_value=0.0, max_value=0.849))
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_below_threshold_results_not_auto_accepted(confidence):
    """
    **Validates: Property 12**
    
    For any confidence score < 85%, the validation status must NOT be AUTO_ACCEPTED.
    """
    assume(0.0 <= confidence < 0.85)
    
    validator = ConfidenceValidator(threshold=0.85)
    result = validator.validate(confidence)
    
    # Property: If confidence < 85%, status must NOT be AUTO_ACCEPTED
    assert result.status != ValidationStatus.AUTO_ACCEPTED
    assert result.meets_threshold is False
    assert result.confidence < 0.85


# Property 12.3: Threshold Boundary Consistency
@given(st.floats(min_value=0.0, max_value=1.0))
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_threshold_boundary_consistency(confidence):
    """
    **Validates: Property 12**
    
    For any confidence score, meets_threshold must be consistent with
    the comparison: confidence >= 0.85
    """
    assume(0.0 <= confidence <= 1.0)
    
    validator = ConfidenceValidator(threshold=0.85)
    result = validator.validate(confidence)
    
    expected_meets_threshold = confidence >= 0.85
    
    # Property: meets_threshold must match the comparison
    assert result.meets_threshold == expected_meets_threshold
    
    if expected_meets_threshold:
        assert result.status == ValidationStatus.AUTO_ACCEPTED
    else:
        assert result.status in [ValidationStatus.MANUAL_REVIEW, ValidationStatus.REJECTED]


# Property 12.4: Batch Validation Consistency
@given(st.lists(st.floats(min_value=0.0, max_value=1.0), min_size=1, max_size=20))
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_batch_validation_consistency(confidences):
    """
    **Validates: Property 12**
    
    For any batch of confidence scores, each result must independently
    satisfy the confidence threshold property.
    """
    validator = ConfidenceValidator(threshold=0.85)
    results = validator.validate_batch(confidences)
    
    # Property: Each result must satisfy the threshold property
    for confidence, result in zip(confidences, results):
        if result.meets_threshold:
            assert confidence >= 0.85
            assert result.status == ValidationStatus.AUTO_ACCEPTED
        else:
            assert confidence < 0.85
            assert result.status != ValidationStatus.AUTO_ACCEPTED


# Property 12.5: Strict Mode Consistency
@given(
    st.floats(min_value=0.0, max_value=0.849),
    st.booleans()
)
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_strict_mode_consistency(confidence, strict):
    """
    **Validates: Property 12**
    
    In strict mode, below-threshold results must be REJECTED.
    In non-strict mode, they must be MANUAL_REVIEW.
    """
    assume(0.0 <= confidence < 0.85)
    
    validator = ConfidenceValidator(threshold=0.85)
    result = validator.validate(confidence, strict=strict)
    
    # Property: Strict mode determines rejection vs manual review
    if strict:
        assert result.status == ValidationStatus.REJECTED
    else:
        assert result.status == ValidationStatus.MANUAL_REVIEW
    
    assert result.meets_threshold is False


# Property 12.6: Threshold Value Invariance
@given(
    st.floats(min_value=0.0, max_value=1.0),
    st.floats(min_value=0.5, max_value=0.95)
)
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_threshold_value_invariance(confidence, threshold):
    """
    **Validates: Property 12**
    
    For any threshold value, the validation logic must be consistent:
    confidence >= threshold implies AUTO_ACCEPTED.
    """
    assume(0.0 <= confidence <= 1.0)
    assume(0.5 <= threshold <= 0.95)
    
    validator = ConfidenceValidator(threshold=threshold)
    result = validator.validate(confidence)
    
    # Property: Validation logic is consistent for any threshold
    if confidence >= threshold:
        assert result.status == ValidationStatus.AUTO_ACCEPTED
        assert result.meets_threshold is True
    else:
        assert result.status != ValidationStatus.AUTO_ACCEPTED
        assert result.meets_threshold is False


# Property 12.7: Soil Classification Validation
@given(st.floats(min_value=0.0, max_value=1.0))
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_soil_classification_validation(confidence):
    """
    **Validates: Property 12, Requirements 4.1**
    
    Soil classification predictions must satisfy the 85% threshold property.
    """
    assume(0.0 <= confidence <= 1.0)
    
    prediction = {
        'label': 'Alluvial',
        'confidence': confidence,
        'category': 'soil'
    }
    
    result = validate_soil_classification(prediction)
    
    # Property: Soil classification follows threshold rules
    if confidence >= 0.85:
        assert result['auto_accepted'] is True
        assert result['meets_threshold'] is True
    else:
        assert result['auto_accepted'] is False
        assert result['meets_threshold'] is False


# Property 12.8: Grievance Categorization Validation
@given(st.floats(min_value=0.0, max_value=1.0))
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_grievance_categorization_validation(confidence):
    """
    **Validates: Property 12, Requirements 12.1**
    
    Grievance categorization predictions must satisfy the 85% threshold property.
    """
    assume(0.0 <= confidence <= 1.0)
    
    prediction = {
        'label': 'Roads',
        'confidence': confidence,
        'category': 'grievance'
    }
    
    result = validate_grievance_categorization(prediction)
    
    # Property: Grievance categorization follows threshold rules
    if confidence >= 0.85:
        assert result['auto_accepted'] is True
        assert result['meets_threshold'] is True
    else:
        assert result['auto_accepted'] is False
        assert result['meets_threshold'] is False


# Property 12.9: Statistics Consistency
@given(st.lists(st.floats(min_value=0.0, max_value=1.0), min_size=1, max_size=50))
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_statistics_consistency(confidences):
    """
    **Validates: Property 12**
    
    Statistics must be consistent with individual validations.
    """
    validator = ConfidenceValidator(threshold=0.85)
    stats = validator.get_statistics(confidences)
    
    # Count expected auto-accepted
    expected_auto_accepted = sum(1 for c in confidences if c >= 0.85)
    expected_manual_review = sum(1 for c in confidences if c < 0.85)
    
    # Property: Statistics match individual validations
    assert stats['count'] == len(confidences)
    assert stats['auto_accepted'] == expected_auto_accepted
    assert stats['manual_review'] == expected_manual_review
    assert stats['auto_accept_rate'] == expected_auto_accepted / len(confidences)


# Property 12.10: Monotonicity Property
@given(
    st.floats(min_value=0.0, max_value=1.0),
    st.floats(min_value=0.0, max_value=0.5)
)
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_monotonicity_property(base_confidence, delta):
    """
    **Validates: Property 12**
    
    If confidence A meets threshold and confidence B > A,
    then B must also meet threshold (monotonicity).
    """
    confidence_a = base_confidence
    confidence_b = min(1.0, base_confidence + abs(delta))
    
    assume(0.0 <= confidence_a <= 1.0)
    assume(0.0 <= confidence_b <= 1.0)
    assume(confidence_b >= confidence_a)
    
    validator = ConfidenceValidator(threshold=0.85)
    result_a = validator.validate(confidence_a)
    result_b = validator.validate(confidence_b)
    
    # Property: If A meets threshold and B >= A, then B meets threshold
    if result_a.meets_threshold and confidence_b >= confidence_a:
        assert result_b.meets_threshold


# Property 12.11: Default Threshold Value
def test_default_threshold_is_85_percent():
    """
    **Validates: Property 12**
    
    The default confidence threshold must be exactly 85% (0.85).
    """
    validator = ConfidenceValidator()
    assert validator.threshold == 0.85
    assert ConfidenceValidator.DEFAULT_THRESHOLD == 0.85


# Property 12.12: Threshold Bounds Validation
@given(st.floats(min_value=-1.0, max_value=2.0))
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_threshold_bounds_validation(threshold):
    """
    **Validates: Property 12**
    
    Threshold values outside [0, 1] must raise ValueError.
    """
    if 0.0 <= threshold <= 1.0:
        # Valid threshold - should not raise
        validator = ConfidenceValidator(threshold=threshold)
        assert validator.threshold == threshold
    else:
        # Invalid threshold - should raise ValueError
        with pytest.raises(ValueError):
            ConfidenceValidator(threshold=threshold)


# Property 12.13: Confidence Bounds Validation
@given(st.floats(min_value=-1.0, max_value=2.0))
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_confidence_bounds_validation(confidence):
    """
    **Validates: Property 12**
    
    Confidence values outside [0, 1] must raise ValueError.
    """
    validator = ConfidenceValidator(threshold=0.85)
    
    if 0.0 <= confidence <= 1.0:
        # Valid confidence - should not raise
        result = validator.validate(confidence)
        assert result.confidence == confidence
    else:
        # Invalid confidence - should raise ValueError
        with pytest.raises(ValueError):
            validator.validate(confidence)


if __name__ == '__main__':
    # Run tests with pytest
    pytest.main([__file__, '-v', '--tb=short'])
