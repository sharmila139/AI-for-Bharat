#!/bin/bash

# Deploy Translation System (Section 26)
# This script uploads translation data to S3 and updates the Lambda function

set -e

echo "=========================================="
echo "Deploying Translation System (Section 26)"
echo "=========================================="

# Load AWS credentials
if [ -f .aws/env.sh ]; then
    source .aws/env.sh
    echo "✓ AWS credentials loaded"
else
    echo "✗ AWS credentials not found. Please run configure-aws-local.sh first"
    exit 1
fi

DATA_BUCKET="ruralconnect-data-032761628276"
LAMBDA_NAME="ruralconnect-api"

# Step 1: Upload translations.json to S3
echo ""
echo "Step 1: Uploading translations.json to S3..."
aws s3 cp data/translations.json s3://${DATA_BUCKET}/translations.json \
    --content-type "application/json" \
    --region us-east-1

if [ $? -eq 0 ]; then
    echo "✓ translations.json uploaded successfully"
else
    echo "✗ Failed to upload translations.json"
    exit 1
fi

# Step 2: Verify the upload
echo ""
echo "Step 2: Verifying upload..."
aws s3 ls s3://${DATA_BUCKET}/translations.json --region us-east-1

if [ $? -eq 0 ]; then
    echo "✓ Upload verified"
else
    echo "✗ Verification failed"
    exit 1
fi

# Step 3: Update Lambda function (already has translation endpoints)
echo ""
echo "Step 3: Lambda function already has translation endpoints:"
echo "  - GET /api/translations/languages"
echo "  - GET /api/translations/{lang}"
echo "  - GET /api/translations/{lang}/{module}"
echo "  - POST /api/translations/translate"
echo ""
echo "If you need to redeploy the Lambda, run: ./deploy-complete-backend.sh"

# Step 4: Test translation endpoints
echo ""
echo "Step 4: Testing translation endpoints..."
API_URL="https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com"

echo ""
echo "Testing GET /api/translations/languages..."
curl -s "${API_URL}/api/translations/languages" | jq '.'

echo ""
echo "Testing GET /api/translations/hi (Hindi translations)..."
curl -s "${API_URL}/api/translations/hi" | jq '.data.translations.common | keys'

echo ""
echo "Testing GET /api/translations/hi/agriculture (Hindi agriculture translations)..."
curl -s "${API_URL}/api/translations/hi/agriculture" | jq '.'

echo ""
echo "Testing POST /api/translations/translate..."
curl -s -X POST "${API_URL}/api/translations/translate" \
    -H "Content-Type: application/json" \
    -d '{"text": "Welcome to RuralConnect AI", "sourceLang": "en", "targetLang": "hi"}' \
    | jq '.'

echo ""
echo "=========================================="
echo "Translation System Deployment Complete!"
echo "=========================================="
echo ""
echo "Available Endpoints:"
echo "  GET  ${API_URL}/api/translations/languages"
echo "  GET  ${API_URL}/api/translations/{lang}"
echo "  GET  ${API_URL}/api/translations/{lang}/{module}"
echo "  POST ${API_URL}/api/translations/translate"
echo ""
echo "Supported Languages: 15 Indian languages"
echo "  - English (en), Hindi (hi), Tamil (ta), Telugu (te)"
echo "  - Bengali (bn), Marathi (mr), Gujarati (gu), Kannada (kn)"
echo "  - Malayalam (ml), Punjabi (pa), Odia (or), Assamese (as)"
echo "  - Urdu (ur), Sanskrit (sa), Kashmiri (ks)"
echo ""
echo "Translation Features:"
echo "  ✓ Static translations for common terms"
echo "  ✓ Module-specific translations (agriculture, health, etc.)"
echo "  ✓ AI-powered translation using AWS Bedrock"
echo "  ✓ Date/time/currency format configurations"
echo "  ✓ RTL support for Urdu"
echo ""
