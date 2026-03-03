#!/bin/bash
# Minimal Backend Deployment to AWS Lambda

set -e

echo "🚀 Deploying RuralConnect AI Minimal Backend"
echo "============================================"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not installed"
    exit 1
fi

# Get AWS account info
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="ruralconnect"

echo "AWS Account: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo ""

# Create IAM role
echo "Creating IAM role..."
aws iam create-role \
    --role-name "${PROJECT_NAME}-lambda-role" \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }' 2>/dev/null || echo "Role exists"

aws iam attach-role-policy \
    --role-name "${PROJECT_NAME}-lambda-role" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

echo "Waiting for role to propagate..."
sleep 10

# Package Lambda
echo "Packaging Lambda function..."
cd packages/backend
npm install --production
zip -r lambda.zip . -x "*.git*" "node_modules/aws-sdk/*" "*.test.*"

# Deploy Lambda
echo "Deploying Lambda..."
aws lambda create-function \
    --function-name "${PROJECT_NAME}-api" \
    --runtime nodejs20.x \
    --role "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${PROJECT_NAME}-lambda-role" \
    --handler "src/lambda.handler" \
    --zip-file fileb://lambda.zip \
    --timeout 30 \
    --memory-size 512 \
    --region "$AWS_REGION" 2>/dev/null || \
aws lambda update-function-code \
    --function-name "${PROJECT_NAME}-api" \
    --zip-file fileb://lambda.zip \
    --region "$AWS_REGION"

rm lambda.zip
cd ../..

echo "✅ Lambda deployed!"
echo ""
echo "Next: Set up API Gateway manually or use AWS Console"
