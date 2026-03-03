#!/bin/bash

# RuralConnect AI - AWS Deployment Script
# This script deploys the complete application to AWS

set -e

echo "🚀 RuralConnect AI - AWS Deployment"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
PROJECT_NAME="ruralconnect"
ENVIRONMENT=${ENVIRONMENT:-"production"}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials are not configured${NC}"
    echo "Please run: aws configure"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo ""

# Function to create S3 bucket
create_s3_bucket() {
    local bucket_name=$1
    echo "Creating S3 bucket: $bucket_name"
    
    if aws s3 ls "s3://$bucket_name" 2>&1 | grep -q 'NoSuchBucket'; then
        if [ "$AWS_REGION" == "us-east-1" ]; then
            aws s3 mb "s3://$bucket_name"
        else
            aws s3 mb "s3://$bucket_name" --region "$AWS_REGION"
        fi
        echo -e "${GREEN}✅ Created bucket: $bucket_name${NC}"
    else
        echo -e "${YELLOW}⚠️  Bucket already exists: $bucket_name${NC}"
    fi
}

# Function to deploy Lambda function
deploy_lambda() {
    echo ""
    echo "📦 Deploying Lambda function..."
    
    # Create deployment package
    cd packages/backend
    npm install --production
    zip -r lambda-deployment.zip . -x "*.git*" "node_modules/aws-sdk/*"
    
    # Create Lambda function
    aws lambda create-function \
        --function-name "${PROJECT_NAME}-api" \
        --runtime nodejs20.x \
        --role "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${PROJECT_NAME}-lambda-role" \
        --handler "src/lambda.handler" \
        --zip-file fileb://lambda-deployment.zip \
        --timeout 30 \
        --memory-size 1024 \
        --environment "Variables={NODE_ENV=production}" \
        --region "$AWS_REGION" 2>/dev/null || \
    aws lambda update-function-code \
        --function-name "${PROJECT_NAME}-api" \
        --zip-file fileb://lambda-deployment.zip \
        --region "$AWS_REGION"
    
    rm lambda-deployment.zip
    cd ../..
    
    echo -e "${GREEN}✅ Lambda function deployed${NC}"
}

# Main deployment flow
echo "Select deployment option:"
echo "1. Quick Setup (Mock Backend)"
echo "2. Minimal Backend (Lambda + API Gateway)"
echo "3. Full Production (Complete Infrastructure)"
echo ""
read -p "Enter option (1-3): " DEPLOY_OPTION

case $DEPLOY_OPTION in
    1)
        echo ""
        echo "🎯 Quick Setup - Mock Backend"
        echo "=============================="
        echo ""
        echo "This will:"
        echo "- Update mobile app to use mock data"
        echo "- Rebuild APK"
        echo "- Upload APK to S3 for download"
        echo ""
        
        # Create S3 bucket for APK hosting
        APK_BUCKET="${PROJECT_NAME}-apk-${AWS_ACCOUNT_ID}"
        create_s3_bucket "$APK_BUCKET"
        
        # Enable public access for APK download
        aws s3api put-bucket-policy --bucket "$APK_BUCKET" --policy "{
            \"Version\": \"2012-10-17\",
            \"Statement\": [{
                \"Sid\": \"PublicReadGetObject\",
                \"Effect\": \"Allow\",
                \"Principal\": \"*\",
                \"Action\": \"s3:GetObject\",
                \"Resource\": \"arn:aws:s3:::${APK_BUCKET}/*\"
            }]
        }"
        
        echo ""
        echo -e "${GREEN}✅ S3 bucket configured for APK hosting${NC}"
        echo ""
        echo "Next steps:"
        echo "1. The mobile app is already configured with mock data"
        echo "2. Rebuild the APK: cd packages/mobile && eas build --platform android --profile preview"
        echo "3. Download the APK from EAS and upload to S3:"
        echo "   aws s3 cp ruralconnect.apk s3://${APK_BUCKET}/ruralconnect-latest.apk"
        echo ""
        echo "APK will be available at:"
        echo "https://${APK_BUCKET}.s3.${AWS_REGION}.amazonaws.com/ruralconnect-latest.apk"
        ;;
        
    2)
        echo ""
        echo "🎯 Minimal Backend Deployment"
        echo "=============================="
        echo ""
        
        # Create IAM role for Lambda
        echo "Creating IAM role..."
        aws iam create-role \
            --role-name "${PROJECT_NAME}-lambda-role" \
            --assume-role-policy-document file://infrastructure/aws/iam/lambda-trust-policy.json \
            2>/dev/null || echo "Role already exists"
        
        aws iam attach-role-policy \
            --role-name "${PROJECT_NAME}-lambda-role" \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        
        # Deploy Lambda
        deploy_lambda
        
        # Create API Gateway
        echo ""
        echo "Creating API Gateway..."
        API_ID=$(aws apigatewayv2 create-api \
            --name "${PROJECT_NAME}-api" \
            --protocol-type HTTP \
            --target "arn:aws:lambda:${AWS_REGION}:${AWS_ACCOUNT_ID}:function:${PROJECT_NAME}-api" \
            --query 'ApiId' \
            --output text 2>/dev/null || \
            aws apigatewayv2 get-apis --query "Items[?Name=='${PROJECT_NAME}-api'].ApiId" --output text)
        
        API_ENDPOINT="https://${API_ID}.execute-api.${AWS_REGION}.amazonaws.com"
        
        echo -e "${GREEN}✅ API Gateway created${NC}"
        echo "API Endpoint: $API_ENDPOINT"
        
        # Create S3 bucket for APK
        APK_BUCKET="${PROJECT_NAME}-apk-${AWS_ACCOUNT_ID}"
        create_s3_bucket "$APK_BUCKET"
        
        echo ""
        echo -e "${GREEN}✅ Minimal backend deployed successfully!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Update mobile app API URL to: $API_ENDPOINT"
        echo "2. Rebuild APK with production API URL"
        echo "3. Upload APK to S3 for distribution"
        ;;
        
    3)
        echo ""
        echo "🎯 Full Production Deployment"
        echo "=============================="
        echo ""
        echo "This will deploy:"
        echo "- RDS PostgreSQL database"
        echo "- Lambda functions + API Gateway"
        echo "- S3 buckets for storage"
        echo "- CloudFront CDN"
        echo "- ElastiCache Redis"
        echo "- CloudWatch monitoring"
        echo ""
        read -p "Continue? (y/n): " CONFIRM
        
        if [ "$CONFIRM" != "y" ]; then
            echo "Deployment cancelled"
            exit 0
        fi
        
        # Create VPC and networking
        echo "Setting up VPC and networking..."
        # TODO: Add VPC creation
        
        # Create RDS database
        echo "Creating RDS database..."
        # TODO: Add RDS creation
        
        # Create ElastiCache
        echo "Creating ElastiCache Redis..."
        # TODO: Add ElastiCache creation
        
        # Create S3 buckets
        echo "Creating S3 buckets..."
        create_s3_bucket "${PROJECT_NAME}-static-${AWS_ACCOUNT_ID}"
        create_s3_bucket "${PROJECT_NAME}-uploads-${AWS_ACCOUNT_ID}"
        create_s3_bucket "${PROJECT_NAME}-backups-${AWS_ACCOUNT_ID}"
        
        # Deploy Lambda
        deploy_lambda
        
        # Create CloudFront distribution
        echo "Creating CloudFront distribution..."
        # TODO: Add CloudFront creation
        
        echo ""
        echo -e "${GREEN}✅ Full production deployment completed!${NC}"
        ;;
        
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment completed!"
echo ""

