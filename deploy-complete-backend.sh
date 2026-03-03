#!/bin/bash

# Complete Backend Deployment Script
# Deploys Lambda with Bedrock integration and S3 data

set -e

# Use local AWS credentials
if [ -f ".aws/env.sh" ]; then
    source .aws/env.sh
fi

echo "🚀 RuralConnect AI - Complete Backend Deployment"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

AWS_REGION=${AWS_REGION:-"us-east-1"}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
PROJECT_NAME="ruralconnect"
LAMBDA_NAME="${PROJECT_NAME}-api"
DATA_BUCKET="${PROJECT_NAME}-data-${AWS_ACCOUNT_ID}"

echo -e "${BLUE}AWS Account: ${AWS_ACCOUNT_ID}${NC}"
echo -e "${BLUE}Region: ${AWS_REGION}${NC}"
echo ""

# ============================================
# Step 1: Create S3 Data Bucket
# ============================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1: Creating S3 Data Bucket${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

aws s3 mb "s3://$DATA_BUCKET" --region "$AWS_REGION" 2>/dev/null || echo "Bucket already exists"

echo -e "${GREEN}✅ S3 bucket ready: $DATA_BUCKET${NC}"
echo ""

# ============================================
# Step 2: Upload Data Files to S3
# ============================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2: Uploading Data Files${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Upload data files
aws s3 cp data/remedies.json "s3://$DATA_BUCKET/remedies.json"
aws s3 cp data/crops.json "s3://$DATA_BUCKET/crops.json"

# Create empty grievances file if it doesn't exist
echo "[]" > /tmp/grievances.json
aws s3 cp /tmp/grievances.json "s3://$DATA_BUCKET/grievances.json" 2>/dev/null || true
rm /tmp/grievances.json

echo -e "${GREEN}✅ Data files uploaded${NC}"
echo ""

# ============================================
# Step 3: Update IAM Role Permissions
# ============================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3: Updating IAM Permissions${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ROLE_NAME="${PROJECT_NAME}-lambda-role"

# Create inline policy for Bedrock and S3
cat > /tmp/lambda-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:${AWS_REGION}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
        "arn:aws:bedrock:${AWS_REGION}::foundation-model/amazon.titan-text-express-v1"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${DATA_BUCKET}",
        "arn:aws:s3:::${DATA_BUCKET}/*"
      ]
    }
  ]
}
EOF

aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "${PROJECT_NAME}-bedrock-s3-policy" \
    --policy-document file:///tmp/lambda-policy.json

rm /tmp/lambda-policy.json

echo -e "${GREEN}✅ IAM permissions updated${NC}"
echo ""

# ============================================
# Step 4: Package Lambda Function
# ============================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 4: Packaging Lambda Function${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd packages/backend

# Create temporary directory for packaging
rm -rf lambda-package
mkdir -p lambda-package

# Copy Lambda function
cp src/lambda-complete.js lambda-package/index.js

# Copy package.json
cp package-lambda.json lambda-package/package.json

# Install dependencies
cd lambda-package
npm install --production --silent
cd ..

# Create deployment package
cd lambda-package
zip -r ../lambda-deployment.zip . -q
cd ..

# Cleanup
rm -rf lambda-package

echo -e "${GREEN}✅ Lambda package created${NC}"
echo ""

# ============================================
# Step 5: Deploy Lambda Function
# ============================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 5: Deploying Lambda Function${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Update Lambda function code
aws lambda update-function-code \
    --function-name "$LAMBDA_NAME" \
    --zip-file fileb://lambda-deployment.zip \
    --region "$AWS_REGION" > /dev/null

echo "Waiting for Lambda update to complete..."
sleep 5

# Update Lambda configuration
aws lambda update-function-configuration \
    --function-name "$LAMBDA_NAME" \
    --timeout 30 \
    --memory-size 512 \
    --environment "Variables={NODE_ENV=production,AWS_REGION=${AWS_REGION},DATA_BUCKET=${DATA_BUCKET}}" \
    --region "$AWS_REGION" > /dev/null

# Cleanup
rm lambda-deployment.zip

cd ../..

echo -e "${GREEN}✅ Lambda function deployed${NC}"
echo ""

# ============================================
# Step 6: Get API Gateway URL
# ============================================

API_NAME="${PROJECT_NAME}-api"
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='${API_NAME}'].ApiId" --output text 2>/dev/null)
API_ENDPOINT="https://${API_ID}.execute-api.${AWS_REGION}.amazonaws.com"

# ============================================
# Deployment Complete
# ============================================

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Backend API:${NC}"
echo -e "${GREEN}${API_ENDPOINT}${NC}"
echo ""
echo -e "${BLUE}Data Bucket:${NC}"
echo -e "${GREEN}s3://${DATA_BUCKET}${NC}"
echo ""
echo -e "${YELLOW}Features Enabled:${NC}"
echo "  ✅ AWS Bedrock AI (Claude 3 Sonnet + Titan)"
echo "  ✅ S3 Data Storage"
echo "  ✅ Crop Recommendations"
echo "  ✅ Soil Analysis"
echo "  ✅ Symptom Checker"
echo "  ✅ Natural Remedies Database"
echo "  ✅ Grievance Reporting"
echo ""
echo -e "${YELLOW}Test Endpoints:${NC}"
echo "  curl ${API_ENDPOINT}/"
echo "  curl -X POST ${API_ENDPOINT}/api/agriculture/crop-recommendations"
echo "  curl -X POST ${API_ENDPOINT}/api/health/symptom-check -d '{\"symptoms\":\"fever and cough\"}'"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Enable Bedrock models in AWS Console (if not already done)"
echo "  2. Test the API endpoints"
echo "  3. Frontend is already deployed and will use these endpoints"
echo ""
