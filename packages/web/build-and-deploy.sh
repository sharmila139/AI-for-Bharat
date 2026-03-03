#!/bin/bash

# Build and deploy React web app to S3

set -e

echo "🚀 Building and Deploying RuralConnect AI Web App"
echo "=================================================="

# Use local AWS credentials if available
if [ -f "../../.aws/env.sh" ]; then
    source ../../.aws/env.sh
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the app
echo "🔨 Building React app..."
npm run build

# Deploy to S3
echo "☁️  Deploying to S3..."
BUCKET_NAME="ruralconnect-web-032761628276"

aws s3 sync build/ "s3://$BUCKET_NAME" --delete

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Web App URL:"
echo "http://${BUCKET_NAME}.s3-website-us-east-1.amazonaws.com"
echo ""
