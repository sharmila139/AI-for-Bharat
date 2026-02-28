#!/bin/bash

# Deploy Crop Recommendation Model to AWS Lambda
# This script packages and deploys the crop recommendation ML model

set -e

echo "=========================================="
echo "Crop Recommendation Model Deployment"
echo "=========================================="

# Configuration
FUNCTION_NAME="ruralconnect-crop-recommendation"
REGION="${AWS_REGION:-ap-south-1}"
RUNTIME="python3.11"
HANDLER="lambda_handler.lambda_handler"
TIMEOUT=30
MEMORY_SIZE=512
MODEL_BUCKET="ruralconnect-ml-models"
ROLE_NAME="ruralconnect-lambda-ml-role"

# Directories
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ML_DIR="$PROJECT_ROOT/packages/ml-services/crop_recommendation"
BUILD_DIR="$PROJECT_ROOT/build/lambda/crop-recommendation"

echo ""
echo "Configuration:"
echo "  Function Name: $FUNCTION_NAME"
echo "  Region: $REGION"
echo "  Runtime: $RUNTIME"
echo "  Memory: ${MEMORY_SIZE}MB"
echo "  Timeout: ${TIMEOUT}s"
echo ""

# Step 1: Create S3 bucket for ML models if it doesn't exist
echo "Step 1: Checking S3 bucket for ML models..."
if aws s3 ls "s3://$MODEL_BUCKET" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "  Creating S3 bucket: $MODEL_BUCKET"
    aws s3 mb "s3://$MODEL_BUCKET" --region "$REGION"
    
    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket "$MODEL_BUCKET" \
        --versioning-configuration Status=Enabled
    
    echo "  ✓ Bucket created"
else
    echo "  ✓ Bucket already exists"
fi

# Step 2: Train and upload model
echo ""
echo "Step 2: Training and uploading model..."
cd "$ML_DIR"

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "  Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q numpy pandas scikit-learn boto3

# Run training
echo "  Training model..."
python data_preparation.py > /dev/null 2>&1
python model_training.py > /dev/null 2>&1

# Upload model files to S3
echo "  Uploading model files to S3..."
aws s3 cp ./models/model.pkl "s3://$MODEL_BUCKET/crop_recommendation/model.pkl"
aws s3 cp ./models/scaler.pkl "s3://$MODEL_BUCKET/crop_recommendation/scaler.pkl"
aws s3 cp ./data/feature_columns.json "s3://$MODEL_BUCKET/crop_recommendation/feature_columns.json"

echo "  ✓ Model uploaded to S3"

# Step 3: Create IAM role for Lambda
echo ""
echo "Step 3: Setting up IAM role..."

# Check if role exists
if aws iam get-role --role-name "$ROLE_NAME" 2>&1 | grep -q 'NoSuchEntity'; then
    echo "  Creating IAM role: $ROLE_NAME"
    
    # Create trust policy
    cat > /tmp/lambda-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
    
    # Create role
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document file:///tmp/lambda-trust-policy.json
    
    # Attach policies
    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    
    # Create custom policy for S3 access
    cat > /tmp/lambda-s3-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::$MODEL_BUCKET",
        "arn:aws:s3:::$MODEL_BUCKET/*"
      ]
    }
  ]
}
EOF
    
    aws iam put-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-name "S3ModelAccess" \
        --policy-document file:///tmp/lambda-s3-policy.json
    
    echo "  ✓ IAM role created"
    echo "  Waiting 10 seconds for role to propagate..."
    sleep 10
else
    echo "  ✓ IAM role already exists"
fi

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
echo "  Role ARN: $ROLE_ARN"

# Step 4: Package Lambda function
echo ""
echo "Step 4: Packaging Lambda function..."

# Clean and create build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copy Lambda handler and dependencies
cp "$ML_DIR/lambda_handler.py" "$BUILD_DIR/"
cp "$ML_DIR/scoring.py" "$BUILD_DIR/"
cp "$ML_DIR/feature_engineering.py" "$BUILD_DIR/"

# Install dependencies to build directory
cd "$BUILD_DIR"
pip install -q --target . numpy pandas boto3

# Create deployment package
echo "  Creating deployment package..."
zip -q -r function.zip .

echo "  ✓ Package created: $(du -h function.zip | cut -f1)"

# Step 5: Deploy Lambda function
echo ""
echo "Step 5: Deploying Lambda function..."

# Check if function exists
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" 2>&1 | grep -q 'ResourceNotFoundException'; then
    echo "  Creating new Lambda function..."
    
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime "$RUNTIME" \
        --role "$ROLE_ARN" \
        --handler "$HANDLER" \
        --timeout "$TIMEOUT" \
        --memory-size "$MEMORY_SIZE" \
        --zip-file fileb://function.zip \
        --region "$REGION" \
        --environment "Variables={MODEL_BUCKET=$MODEL_BUCKET}" \
        --description "Crop recommendation ML model for RuralConnect AI"
    
    echo "  ✓ Function created"
else
    echo "  Updating existing Lambda function..."
    
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file fileb://function.zip \
        --region "$REGION"
    
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --timeout "$TIMEOUT" \
        --memory-size "$MEMORY_SIZE" \
        --environment "Variables={MODEL_BUCKET=$MODEL_BUCKET}" \
        --region "$REGION"
    
    echo "  ✓ Function updated"
fi

# Wait for function to be active
echo "  Waiting for function to be active..."
aws lambda wait function-active --function-name "$FUNCTION_NAME" --region "$REGION"

# Step 6: Create API Gateway endpoint (optional)
echo ""
echo "Step 6: Setting up API Gateway..."

API_NAME="ruralconnect-crop-api"

# Check if API exists
API_ID=$(aws apigatewayv2 get-apis --region "$REGION" --query "Items[?Name=='$API_NAME'].ApiId" --output text)

if [ -z "$API_ID" ]; then
    echo "  Creating HTTP API..."
    
    API_ID=$(aws apigatewayv2 create-api \
        --name "$API_NAME" \
        --protocol-type HTTP \
        --target "arn:aws:lambda:$REGION:$(aws sts get-caller-identity --query Account --output text):function:$FUNCTION_NAME" \
        --region "$REGION" \
        --query 'ApiId' \
        --output text)
    
    echo "  ✓ API created: $API_ID"
else
    echo "  ✓ API already exists: $API_ID"
fi

# Grant API Gateway permission to invoke Lambda
aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "apigateway-invoke" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*" \
    --region "$REGION" 2>/dev/null || echo "  Permission already exists"

# Get API endpoint
API_ENDPOINT=$(aws apigatewayv2 get-apis --region "$REGION" --query "Items[?ApiId=='$API_ID'].ApiEndpoint" --output text)

# Step 7: Test deployment
echo ""
echo "Step 7: Testing deployment..."

TEST_PAYLOAD='{
  "body": {
    "soil_type": "loamy",
    "nitrogen": 90,
    "phosphorus": 45,
    "potassium": 50,
    "ph": 6.5,
    "temperature": 25,
    "humidity": 70,
    "rainfall": 100,
    "region": "central",
    "season": "kharif",
    "top_n": 3
  }
}'

echo "  Invoking Lambda function..."
aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --payload "$TEST_PAYLOAD" \
    --region "$REGION" \
    /tmp/lambda-response.json > /dev/null

if [ $? -eq 0 ]; then
    echo "  ✓ Test invocation successful"
    echo ""
    echo "  Response:"
    cat /tmp/lambda-response.json | python3 -m json.tool | head -20
else
    echo "  ✗ Test invocation failed"
fi

# Summary
echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Lambda Function:"
echo "  Name: $FUNCTION_NAME"
echo "  ARN: arn:aws:lambda:$REGION:$(aws sts get-caller-identity --query Account --output text):function:$FUNCTION_NAME"
echo ""
echo "API Endpoint:"
echo "  URL: $API_ENDPOINT"
echo ""
echo "S3 Model Bucket:"
echo "  Bucket: s3://$MODEL_BUCKET/crop_recommendation/"
echo ""
echo "Test the API:"
echo "  curl -X POST $API_ENDPOINT \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '$TEST_PAYLOAD'"
echo ""
echo "Monitor logs:"
echo "  aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION"
echo ""
