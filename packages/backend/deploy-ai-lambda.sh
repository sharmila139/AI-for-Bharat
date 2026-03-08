#!/bin/bash

# Deploy AI Lambda Function
# This script packages and deploys the AI invocation Lambda function

set -e

echo "🚀 Starting AI Lambda deployment..."

# Build TypeScript
echo "📦 Building TypeScript..."
npx tsc src/lambda-ai.ts --outDir dist --esModuleInterop --resolveJsonModule --skipLibCheck --module commonjs --target es2020

# Create deployment directory
echo "📁 Creating deployment directory..."
rm -rf deploy-ai
mkdir -p deploy-ai

# Copy compiled Lambda function
echo "📋 Copying Lambda function..."
cp dist/lambda-ai.js deploy-ai/index.js

# Copy Bedrock service files
echo "📋 Copying Bedrock service..."
mkdir -p deploy-ai/services/bedrock
cp dist/services/bedrock/*.js deploy-ai/services/bedrock/

# Create minimal package.json
echo "📝 Creating package.json..."
cat > deploy-ai/package.json << EOF
{
  "name": "ruralconnect-ai-lambda",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.450.0",
    "@aws-sdk/client-cloudwatch": "^3.450.0"
  }
}
EOF

# Install production dependencies
echo "📦 Installing dependencies..."
cd deploy-ai
npm install --production --no-package-lock
cd ..

# Create ZIP file
echo "🗜️  Creating deployment package..."
cd deploy-ai
zip -r ../lambda-ai-deployment.zip . -x "*.DS_Store"
cd ..

echo "✅ Deployment package created: lambda-ai-deployment.zip"
echo "📊 Package size: $(du -h lambda-ai-deployment.zip | cut -f1)"

# Optional: Deploy to AWS Lambda
if [ "$1" == "--deploy" ]; then
  echo "🚀 Deploying to AWS Lambda..."
  
  FUNCTION_NAME="ruralconnect-ai-invoke"
  REGION="us-east-1"
  
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://lambda-ai-deployment.zip \
    --region $REGION
  
  echo "✅ Lambda function updated successfully!"
fi

echo "🎉 Done!"
