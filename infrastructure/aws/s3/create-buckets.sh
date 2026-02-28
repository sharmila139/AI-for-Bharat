#!/bin/bash

# RuralConnect AI - S3 Bucket Creation Script
# This script creates all required S3 buckets with proper configuration

set -e

REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "Creating S3 buckets for RuralConnect AI..."
echo "Region: $REGION"
echo "Account ID: $ACCOUNT_ID"

# Function to create bucket with configuration
create_bucket() {
  local bucket_name=$1
  local purpose=$2
  
  echo ""
  echo "Creating bucket: $bucket_name"
  echo "Purpose: $purpose"
  
  # Create bucket
  aws s3api create-bucket \
    --bucket "$bucket_name" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION" \
    2>/dev/null || echo "Bucket already exists"
  
  # Enable versioning
  aws s3api put-bucket-versioning \
    --bucket "$bucket_name" \
    --versioning-configuration Status=Enabled
  
  # Enable encryption
  aws s3api put-bucket-encryption \
    --bucket "$bucket_name" \
    --server-side-encryption-configuration '{
      "Rules": [{
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }]
    }'
  
  # Block public access
  aws s3api put-public-access-block \
    --bucket "$bucket_name" \
    --public-access-block-configuration \
      "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
  
  echo "✓ Bucket $bucket_name created and configured"
}

# Create static assets bucket
create_bucket "ruralconnect-static-assets-$ACCOUNT_ID" "Static assets (images, videos, documents)"

# Configure lifecycle for static assets
aws s3api put-bucket-lifecycle-configuration \
  --bucket "ruralconnect-static-assets-$ACCOUNT_ID" \
  --lifecycle-configuration file://infrastructure/aws/s3/lifecycle-static.json

# Configure CORS for static assets
aws s3api put-bucket-cors \
  --bucket "ruralconnect-static-assets-$ACCOUNT_ID" \
  --cors-configuration file://infrastructure/aws/s3/cors-config.json

# Create user uploads bucket
create_bucket "ruralconnect-user-uploads-$ACCOUNT_ID" "User uploaded content"

# Configure lifecycle for user uploads
aws s3api put-bucket-lifecycle-configuration \
  --bucket "ruralconnect-user-uploads-$ACCOUNT_ID" \
  --lifecycle-configuration file://infrastructure/aws/s3/lifecycle-uploads.json

# Configure CORS for user uploads
aws s3api put-bucket-cors \
  --bucket "ruralconnect-user-uploads-$ACCOUNT_ID" \
  --cors-configuration file://infrastructure/aws/s3/cors-config.json

# Create backups bucket
create_bucket "ruralconnect-backups-$ACCOUNT_ID" "Database and system backups"

# Configure lifecycle for backups
aws s3api put-bucket-lifecycle-configuration \
  --bucket "ruralconnect-backups-$ACCOUNT_ID" \
  --lifecycle-configuration file://infrastructure/aws/s3/lifecycle-backups.json

# Create ML models bucket
create_bucket "ruralconnect-ml-models-$ACCOUNT_ID" "ML model artifacts"

# Create logs bucket
create_bucket "ruralconnect-logs-$ACCOUNT_ID" "Application logs"

# Configure lifecycle for logs
aws s3api put-bucket-lifecycle-configuration \
  --bucket "ruralconnect-logs-$ACCOUNT_ID" \
  --lifecycle-configuration file://infrastructure/aws/s3/lifecycle-logs.json

echo ""
echo "✓ All S3 buckets created successfully!"
echo ""
echo "Bucket URLs:"
echo "  Static Assets: s3://ruralconnect-static-assets-$ACCOUNT_ID"
echo "  User Uploads: s3://ruralconnect-user-uploads-$ACCOUNT_ID"
echo "  Backups: s3://ruralconnect-backups-$ACCOUNT_ID"
echo "  ML Models: s3://ruralconnect-ml-models-$ACCOUNT_ID"
echo "  Logs: s3://ruralconnect-logs-$ACCOUNT_ID"
echo ""
echo "Add these to your .env file:"
echo "S3_STATIC_BUCKET=ruralconnect-static-assets-$ACCOUNT_ID"
echo "S3_UPLOADS_BUCKET=ruralconnect-user-uploads-$ACCOUNT_ID"
echo "S3_BACKUPS_BUCKET=ruralconnect-backups-$ACCOUNT_ID"
echo "S3_ML_BUCKET=ruralconnect-ml-models-$ACCOUNT_ID"
echo "S3_LOGS_BUCKET=ruralconnect-logs-$ACCOUNT_ID"
