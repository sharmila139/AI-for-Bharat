#!/bin/bash

# Deploy Models to Mobile App Script
# Copies optimized TFLite models from ML services to mobile app assets

set -e  # Exit on error

echo "=========================================="
echo "Deploying ML Models to Mobile App"
echo "=========================================="

# Define paths
ML_SERVICES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_ASSETS_DIR="$ML_SERVICES_DIR/../mobile/assets/models"

SOIL_MODEL_SRC="$ML_SERVICES_DIR/soil_classification/models/optimized/soil_classifier_float16.tflite"
GRIEVANCE_MODEL_SRC="$ML_SERVICES_DIR/grievance_categorization/models/optimized/grievance_classifier_float16.tflite"

SOIL_MODEL_DEST="$MOBILE_ASSETS_DIR/soil_classifier_float16.tflite"
GRIEVANCE_MODEL_DEST="$MOBILE_ASSETS_DIR/grievance_classifier_float16.tflite"

# Create mobile assets directory if it doesn't exist
echo ""
echo "Creating mobile assets directory..."
mkdir -p "$MOBILE_ASSETS_DIR"
echo "✓ Directory created: $MOBILE_ASSETS_DIR"

# Check if models exist
echo ""
echo "Checking for optimized models..."

if [ ! -f "$SOIL_MODEL_SRC" ]; then
    echo "⚠️  Soil classification model not found at:"
    echo "   $SOIL_MODEL_SRC"
    echo ""
    echo "Please run the optimization script first:"
    echo "   cd packages/ml-services"
    echo "   python optimize_models.py"
    exit 1
fi

if [ ! -f "$GRIEVANCE_MODEL_SRC" ]; then
    echo "⚠️  Grievance categorization model not found at:"
    echo "   $GRIEVANCE_MODEL_SRC"
    echo ""
    echo "Please run the optimization script first:"
    echo "   cd packages/ml-services"
    echo "   python optimize_models.py"
    exit 1
fi

echo "✓ Both models found"

# Copy soil classification model
echo ""
echo "Copying soil classification model..."
cp "$SOIL_MODEL_SRC" "$SOIL_MODEL_DEST"
SOIL_SIZE=$(du -h "$SOIL_MODEL_DEST" | cut -f1)
echo "✓ Soil model deployed: $SOIL_SIZE"
echo "   Destination: $SOIL_MODEL_DEST"

# Copy grievance categorization model
echo ""
echo "Copying grievance categorization model..."
cp "$GRIEVANCE_MODEL_SRC" "$GRIEVANCE_MODEL_DEST"
GRIEVANCE_SIZE=$(du -h "$GRIEVANCE_MODEL_DEST" | cut -f1)
echo "✓ Grievance model deployed: $GRIEVANCE_SIZE"
echo "   Destination: $GRIEVANCE_MODEL_DEST"

# Verify sizes are under 50MB
echo ""
echo "Verifying model sizes..."

SOIL_SIZE_MB=$(du -m "$SOIL_MODEL_DEST" | cut -f1)
GRIEVANCE_SIZE_MB=$(du -m "$GRIEVANCE_MODEL_DEST" | cut -f1)

if [ "$SOIL_SIZE_MB" -gt 50 ]; then
    echo "⚠️  Warning: Soil model exceeds 50MB limit ($SOIL_SIZE_MB MB)"
else
    echo "✓ Soil model size OK: $SOIL_SIZE_MB MB (< 50MB)"
fi

if [ "$GRIEVANCE_SIZE_MB" -gt 50 ]; then
    echo "⚠️  Warning: Grievance model exceeds 50MB limit ($GRIEVANCE_SIZE_MB MB)"
else
    echo "✓ Grievance model size OK: $GRIEVANCE_SIZE_MB MB (< 50MB)"
fi

# Create model metadata file
echo ""
echo "Creating model metadata..."

cat > "$MOBILE_ASSETS_DIR/models.json" << EOF
{
  "version": "1.0.0",
  "lastUpdated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "models": {
    "soil_classification": {
      "filename": "soil_classifier_float16.tflite",
      "size_mb": $SOIL_SIZE_MB,
      "input_shape": [1, 224, 224, 3],
      "output_classes": 8,
      "labels": [
        "Alluvial",
        "Black",
        "Red",
        "Laterite",
        "Desert",
        "Mountain",
        "Saline",
        "Peaty"
      ],
      "confidence_threshold": 0.85
    },
    "grievance_categorization": {
      "filename": "grievance_classifier_float16.tflite",
      "size_mb": $GRIEVANCE_SIZE_MB,
      "input_shape": [1, 224, 224, 3],
      "output_classes": 9,
      "labels": [
        "Roads",
        "Water Supply",
        "Electricity",
        "Drainage",
        "Waste Management",
        "Street Lights",
        "Public Property",
        "Health Facility",
        "Education Facility"
      ],
      "confidence_threshold": 0.85
    }
  }
}
EOF

echo "✓ Metadata created: $MOBILE_ASSETS_DIR/models.json"

# Summary
echo ""
echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
echo ""
echo "Models deployed to: $MOBILE_ASSETS_DIR"
echo ""
echo "Soil Classification Model:"
echo "  - File: soil_classifier_float16.tflite"
echo "  - Size: $SOIL_SIZE"
echo ""
echo "Grievance Categorization Model:"
echo "  - File: grievance_classifier_float16.tflite"
echo "  - Size: $GRIEVANCE_SIZE"
echo ""
echo "Next Steps:"
echo "  1. Rebuild the mobile app to include the models"
echo "  2. Test on target devices (Android 8.0+, 1GB RAM minimum)"
echo "  3. Verify inference works offline"
echo ""
echo "To rebuild the mobile app:"
echo "  cd packages/mobile"
echo "  npm run android  # or npm run ios"
echo ""
echo "=========================================="
echo "✓ Deployment Complete!"
echo "=========================================="
