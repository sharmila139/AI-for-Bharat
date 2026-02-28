#!/bin/bash

# RuralConnect AI - Lambda Functions Setup
# Creates Lambda functions for serverless compute

set -e

REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/RuralConnectLambdaRole"

echo "Creating Lambda functions for RuralConnect AI..."
echo "Account ID: $ACCOUNT_ID"
echo "Region: $REGION"

# Create deployment package placeholder
mkdir -p /tmp/lambda-deploy
cat > /tmp/lambda-deploy/index.js <<'EOF'
exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'RuralConnect API - Deploy actual code' })
  };
};
EOF

cd /tmp/lambda-deploy
zip -q function.zip index.js

# Function 1: Main API Handler
echo "Creating main API Lambda function..."
aws lambda create-function \
  --function-name ruralconnect-api \
  --runtime nodejs18.x \
  --role "$ROLE_ARN" \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 1024 \
  --environment Variables="{
    NODE_ENV=production,
    LOG_LEVEL=info
  }" \
  --tags Project=RuralConnect,Environment=Production \
  --region "$REGION" \
  2>/dev/null || echo "Function ruralconnect-api already exists"

# Configure reserved concurrency
aws lambda put-function-concurrency \
  --function-name ruralconnect-api \
  --reserved-concurrent-executions 100 \
  --region "$REGION"

echo "✓ Main API function created"

# Function 2: Bedrock AI Handler
echo "Creating Bedrock AI Lambda function..."
aws lambda create-function \
  --function-name ruralconnect-bedrock-ai \
  --runtime nodejs18.x \
  --role "$ROLE_ARN" \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 60 \
  --memory-size 2048 \
  --environment Variables="{
    NODE_ENV=production,
    BEDROCK_REGION=$REGION
  }" \
  --tags Project=RuralConnect,Environment=Production,Service=AI \
  --region "$REGION" \
  2>/dev/null || echo "Function ruralconnect-bedrock-ai already exists"

echo "✓ Bedrock AI function created"

# Function 3: Image Processing
echo "Creating image processing Lambda function..."
aws lambda create-function \
  --function-name ruralconnect-image-processor \
  --runtime nodejs18.x \
  --role "$ROLE_ARN" \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 300 \
  --memory-size 3008 \
  --ephemeral-storage Size=2048 \
  --environment Variables="{
    NODE_ENV=production,
    MAX_IMAGE_SIZE=10485760
  }" \
  --tags Project=RuralConnect,Environment=Production,Service=ImageProcessing \
  --region "$REGION" \
  2>/dev/null || echo "Function ruralconnect-image-processor already exists"

echo "✓ Image processing function created"

# Function 4: Notification Handler
echo "Creating notification Lambda function..."
aws lambda create-function \
  --function-name ruralconnect-notifications \
  --runtime nodejs18.x \
  --role "$ROLE_ARN" \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables="{
    NODE_ENV=production
  }" \
  --tags Project=RuralConnect,Environment=Production,Service=Notifications \
  --region "$REGION" \
  2>/dev/null || echo "Function ruralconnect-notifications already exists"

echo "✓ Notification function created"

# Function 5: Sync Handler
echo "Creating sync Lambda function..."
aws lambda create-function \
  --function-name ruralconnect-sync \
  --runtime nodejs18.x \
  --role "$ROLE_ARN" \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 60 \
  --memory-size 1024 \
  --environment Variables="{
    NODE_ENV=production
  }" \
  --tags Project=RuralConnect,Environment=Production,Service=Sync \
  --region "$REGION" \
  2>/dev/null || echo "Function ruralconnect-sync already exists"

echo "✓ Sync function created"

# Function 6: Analytics Processor
echo "Creating analytics Lambda function..."
aws lambda create-function \
  --function-name ruralconnect-analytics \
  --runtime nodejs18.x \
  --role "$ROLE_ARN" \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables="{
    NODE_ENV=production
  }" \
  --tags Project=RuralConnect,Environment=Production,Service=Analytics \
  --region "$REGION" \
  2>/dev/null || echo "Function ruralconnect-analytics already exists"

echo "✓ Analytics function created"

# Enable CloudWatch Logs Insights for all functions
for func in ruralconnect-api ruralconnect-bedrock-ai ruralconnect-image-processor \
            ruralconnect-notifications ruralconnect-sync ruralconnect-analytics; do
  aws logs create-log-group \
    --log-group-name "/aws/lambda/$func" \
    --region "$REGION" \
    2>/dev/null || true
  
  aws logs put-retention-policy \
    --log-group-name "/aws/lambda/$func" \
    --retention-in-days 30 \
    --region "$REGION"
done

# Clean up
rm -rf /tmp/lambda-deploy

echo ""
echo "✓ All Lambda functions created successfully!"
echo ""
echo "Functions:"
echo "  1. ruralconnect-api (Main API, 1024MB, 30s timeout)"
echo "  2. ruralconnect-bedrock-ai (AI Assistant, 2048MB, 60s timeout)"
echo "  3. ruralconnect-image-processor (Image Processing, 3008MB, 300s timeout)"
echo "  4. ruralconnect-notifications (Notifications, 512MB, 30s timeout)"
echo "  5. ruralconnect-sync (Offline Sync, 1024MB, 60s timeout)"
echo "  6. ruralconnect-analytics (Analytics, 512MB, 30s timeout)"
echo ""
echo "Next steps:"
echo "  1. Deploy actual code: cd packages/backend && yarn deploy"
echo "  2. Set up API Gateway to trigger functions"
echo "  3. Configure environment variables in Lambda console"
echo ""
echo "View functions:"
echo "  aws lambda list-functions --region $REGION | grep ruralconnect"
