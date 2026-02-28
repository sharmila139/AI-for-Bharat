# ML Services Common Utilities

This module provides shared utilities for ML services in the RuralConnect AI project.

## Confidence Threshold Validator

The `ConfidenceValidator` class implements **Property 12: AI Confidence Threshold** from the design specification.

### Property 12 Specification

> For any AI-based classification (soil analysis, grievance categorization), if the result is auto-accepted, the confidence score must be >= 85%.

### Features

- **Threshold Validation**: Validates model predictions against configurable confidence thresholds (default: 85%)
- **Multiple Validation Modes**:
  - **Auto-accept**: Predictions with confidence >= threshold
  - **Manual review**: Predictions with confidence < threshold (default)
  - **Reject**: Predictions with confidence < threshold (strict mode)
- **Batch Processing**: Validate multiple predictions at once
- **Statistics**: Calculate auto-accept rates and confidence metrics
- **Integration**: Easy integration with existing model inference code

### Usage

#### Basic Validation

```python
from common.confidence_validator import ConfidenceValidator

# Create validator with 85% threshold
validator = ConfidenceValidator(threshold=0.85)

# Validate a single confidence score
result = validator.validate(0.92)

print(f"Status: {result.status.value}")  # 'auto_accepted'
print(f"Meets threshold: {result.meets_threshold}")  # True
print(f"Message: {result.message}")
```

#### Validate Prediction Dictionary

```python
# Validate a prediction dictionary
prediction = {
    'soil_type': 'alluvial',
    'confidence': 0.92
}

validated = validator.validate_prediction(prediction)

print(f"Auto-accepted: {validated['auto_accepted']}")  # True
print(f"Requires manual review: {validated['requires_manual_review']}")  # False
print(f"Validation status: {validated['validation_status']}")  # 'auto_accepted'
```

#### Batch Validation

```python
# Validate multiple confidence scores
confidences = [0.95, 0.87, 0.82, 0.75]
results = validator.validate_batch(confidences)

for conf, result in zip(confidences, results):
    print(f"{conf:.2%} -> {result.status.value}")
```

#### Get Statistics

```python
# Get statistics about predictions
confidences = [0.95, 0.87, 0.82, 0.75, 0.90]
stats = validator.get_statistics(confidences)

print(f"Total: {stats['count']}")
print(f"Auto-accepted: {stats['auto_accepted']}")
print(f"Manual review: {stats['manual_review']}")
print(f"Auto-accept rate: {stats['auto_accept_rate']:.1%}")
print(f"Average confidence: {stats['avg_confidence']:.2%}")
```

### Integration with Models

#### Soil Classification

```python
from common.confidence_validator import validate_soil_classification

prediction = {
    'soil_type': 'alluvial',
    'confidence': 0.92
}

validated = validate_soil_classification(prediction)
# Returns prediction with added validation fields
```

#### Grievance Categorization

```python
from common.confidence_validator import validate_grievance_categorization

prediction = {
    'category': 'roads',
    'confidence': 0.88
}

validated = validate_grievance_categorization(prediction)
# Returns prediction with added validation fields
```

### Validation Result Fields

When validating a prediction, the following fields are added:

- `validation_status`: One of 'auto_accepted', 'manual_review', or 'rejected'
- `meets_threshold`: Boolean indicating if confidence meets threshold
- `confidence_threshold`: The threshold value used
- `requires_manual_review`: Boolean indicating if manual review is needed
- `auto_accepted`: Boolean indicating if prediction was auto-accepted
- `validation_message`: Human-readable validation message

### Strict Mode

In strict mode, predictions below the threshold are rejected instead of sent for manual review:

```python
# Strict mode rejects low-confidence predictions
result = validator.validate(0.80, strict=True)
print(result.status.value)  # 'rejected'
```

### Custom Thresholds

You can use different thresholds for different use cases:

```python
# Higher threshold for critical decisions
critical_validator = ConfidenceValidator(threshold=0.95)

# Lower threshold for non-critical decisions
relaxed_validator = ConfidenceValidator(threshold=0.75)
```

### Testing

The module includes comprehensive unit tests covering:

- Initialization and configuration
- Validation logic for various confidence levels
- Batch processing
- Edge cases (0%, 100%, boundary values)
- Property 12 compliance verification

Run tests:

```bash
python -m pytest packages/ml-services/common/test_confidence_validator.py -v
```

### Implementation Details

The validator is integrated into both model inference classes:

1. **SoilClassifier** (`soil_classification/inference.py`)
   - Uses validator in `predict()` method
   - Returns predictions with validation fields

2. **GrievanceClassifier** (`grievance_categorization/inference.py`)
   - Uses validator in `predict()` method
   - Returns predictions with validation fields

Both models use the default 85% threshold as specified in Property 12.

### Design Principles

1. **Separation of Concerns**: Validation logic is separate from model inference
2. **Reusability**: Single validator implementation used by all models
3. **Testability**: Comprehensive unit tests ensure correctness
4. **Flexibility**: Configurable thresholds and validation modes
5. **Clarity**: Clear status values and messages for downstream systems

### Property 12 Compliance

The implementation ensures that:

- All auto-accepted predictions have confidence >= 85%
- Predictions below 85% are flagged for manual review
- The threshold is consistently applied across all AI models
- Validation results are clearly communicated to downstream systems

This guarantees that the system never auto-accepts low-confidence predictions, maintaining data quality and user trust.
