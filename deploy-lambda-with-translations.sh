#!/bin/bash

# Deploy Complete Lambda with Translation Support
# This script packages and deploys the complete Lambda function with AWS Bedrock and translation endpoints

set -e

echo "=========================================="
echo "Deploying Complete Lambda with Translations"
echo "=========================================="

# Load AWS credentials
if [ -f .aws/env.sh ]; then
    source .aws/env.sh
    echo "✓ AWS credentials loaded"
else
    echo "✗ AWS credentials not found"
    exit 1
fi

LAMBDA_NAME="ruralconnect-api"
LAMBDA_ROLE="arn:aws:iam::032761628276:role/ruralconnect-lambda-role"

# Step 1: Create deployment package directory
echo ""
echo "Step 1: Creating deployment package..."
rm -rf lambda-package
mkdir -p lambda-package

# Copy Lambda code
cp packages/backend/src/lambda-complete.js lambda-package/index.js

# Create package.json for dependencies
cat > lambda-package/package.json << 'EOF'
{
  "name": "ruralconnect-lambda",
  "version": "2.0.0",
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.400.0",
    "@aws-sdk/client-s3": "^3.400.0"
  }
}
EOF

echo "✓ Lambda code copied"

# Step 2: Install dependencies
echo ""
echo "Step 2: Installing dependencies..."
cd lambda-package
npm install --production --no-package-lock
cd ..
echo "✓ Dependencies installed"

# Step 3: Create ZIP package
echo ""
echo "Step 3: Creating ZIP package..."
cd lambda-package
zip -r ../lambda-deployment.zip . -q
cd ..
echo "✓ ZIP package created: lambda-deployment.zip"

# Step 4: Update Lambda function
echo ""
echo "Step 4: Updating Lambda function..."
aws lambda update-function-code \
    --function-name ${LAMBDA_NAME} \
    --zip-file fileb://lambda-deployment.zip \
    --region us-east-1

if [ $? -eq 0 ]; then
    echo "✓ Lambda function updated successfully"
else
    echo "✗ Failed to update Lambda function"
    exit 1
fi

# Step 5: Wait for update to complete
echo ""
echo "Step 5: Waiting for Lambda update to complete..."
sleep 5

# Step 6: Update Lambda configuration (increase timeout and memory)
echo ""
echo "Step 6: Updating Lambda configuration..."
aws lambda update-function-configuration \
    --function-name ${LAMBDA_NAME} \
    --timeout 30 \
    --memory-size 512 \
    --region us-east-1 \
    > /dev/null

echo "✓ Lambda configuration updated (timeout: 30s, memory: 512MB)"

# Step 7: Wait for configuration update
echo ""
echo "Step 7: Waiting for configuration update..."
sleep 5

# Step 8: Test translation endpoints
echo ""
echo "Step 8: Testing translation endpoints..."
API_URL="https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com"

echo ""
echo "Testing GET /api/translations/languages..."
curl -s "${API_URL}/api/translations/languages" | jq '.data.languages | length'

echo ""
echo "Testing GET /api/translations/hi..."
curl -s "${API_URL}/api/translations/hi" | jq '.data.language.name'

echo ""
echo "Testing GET /api/translations/hi/agriculture..."
curl -s "${API_URL}/api/translations/hi/agriculture" | jq '.data.module'

# Cleanup
echo ""
echo "Step 9: Cleaning up..."
rm -rf lambda-package lambda-deployment.zip
echo "✓ Cleanup complete"

echo ""
echo "=========================================="
echo "Lambda Deployment Complete!"
echo "=========================================="
echo ""
echo "Translation Endpoints:"
echo "  GET  ${API_URL}/api/translations/languages"
echo "  GET  ${API_URL}/api/translations/{lang}"
echo "  GET  ${API_URL}/api/translations/{lang}/{module}"
echo "  POST ${API_URL}/api/translations/translate"
echo ""
echo "Other Endpoints:"
echo "  POST ${API_URL}/api/agriculture/crop-recommendations"
echo "  POST ${API_URL}/api/agriculture/soil-analysis"
echo "  POST ${API_URL}/api/health/symptom-check"
echo "  GET  ${API_URL}/api/health/remedies"
echo "  POST ${API_URL}/api/infrastructure/grievance"
echo "  GET  ${API_URL}/api/infrastructure/grievance"
echo ""
