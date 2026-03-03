#!/bin/bash

# RuralConnect AI - Complete Deployment
# Deploys both backend API and web demo to AWS

set -e

echo "🚀 RuralConnect AI - Complete AWS Deployment"
echo "=============================================="
echo ""
echo "This will deploy:"
echo "1. Backend API (Lambda + API Gateway)"
echo "2. Web Demo App (S3 + CloudFront)"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_NAME="ruralconnect"
AWS_REGION=${AWS_REGION:-"us-east-1"}

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not installed${NC}"
    echo "Install: brew install awscli"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not installed${NC}"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ Prerequisites met${NC}"
echo "AWS Account: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo ""

# ============================================
# PART 1: Deploy Backend API
# ============================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}PART 1: Deploying Backend API${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Create IAM role for Lambda
echo "Creating IAM role..."
ROLE_NAME="${PROJECT_NAME}-lambda-role"

aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }' 2>/dev/null || echo "Role already exists"

# Attach policies
aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole 2>/dev/null || true

echo "Waiting for IAM role to propagate..."
sleep 10

# Package and deploy Lambda
echo "Packaging Lambda function..."
cd packages/backend

# Install dependencies
npm install --production --silent

# Create deployment package
zip -r lambda-deployment.zip . \
    -x "*.git*" \
    -x "node_modules/aws-sdk/*" \
    -x "*.test.*" \
    -x "*.md" \
    -q

echo "Deploying Lambda function..."
LAMBDA_NAME="${PROJECT_NAME}-api"

# Create or update Lambda
aws lambda create-function \
    --function-name "$LAMBDA_NAME" \
    --runtime nodejs20.x \
    --role "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ROLE_NAME}" \
    --handler "src/lambda.handler" \
    --zip-file fileb://lambda-deployment.zip \
    --timeout 30 \
    --memory-size 512 \
    --environment "Variables={NODE_ENV=production,AWS_REGION=${AWS_REGION}}" \
    --region "$AWS_REGION" 2>/dev/null || \
aws lambda update-function-code \
    --function-name "$LAMBDA_NAME" \
    --zip-file fileb://lambda-deployment.zip \
    --region "$AWS_REGION" > /dev/null

rm lambda-deployment.zip
cd ../..

echo -e "${GREEN}✅ Lambda function deployed${NC}"

# Create API Gateway
echo "Setting up API Gateway..."
API_NAME="${PROJECT_NAME}-api"

# Check if API exists
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='${API_NAME}'].ApiId" --output text 2>/dev/null)

if [ -z "$API_ID" ]; then
    # Create new API
    API_ID=$(aws apigatewayv2 create-api \
        --name "$API_NAME" \
        --protocol-type HTTP \
        --target "arn:aws:lambda:${AWS_REGION}:${AWS_ACCOUNT_ID}:function:${LAMBDA_NAME}" \
        --query 'ApiId' \
        --output text)
    
    echo "Created new API Gateway"
else
    echo "Using existing API Gateway"
fi

# Grant API Gateway permission to invoke Lambda
aws lambda add-permission \
    --function-name "$LAMBDA_NAME" \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${AWS_REGION}:${AWS_ACCOUNT_ID}:${API_ID}/*" \
    2>/dev/null || true

API_ENDPOINT="https://${API_ID}.execute-api.${AWS_REGION}.amazonaws.com"

echo -e "${GREEN}✅ API Gateway configured${NC}"
echo -e "${GREEN}API Endpoint: ${API_ENDPOINT}${NC}"
echo ""

# ============================================
# PART 2: Deploy Web Demo
# ============================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}PART 2: Deploying Web Demo${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Create S3 bucket for web hosting
BUCKET_NAME="${PROJECT_NAME}-web-${AWS_ACCOUNT_ID}"
echo "Creating S3 bucket: $BUCKET_NAME"

aws s3 mb "s3://$BUCKET_NAME" --region "$AWS_REGION" 2>/dev/null || echo "Bucket exists"

# Configure for web hosting
aws s3 website "s3://$BUCKET_NAME" \
    --index-document index.html \
    --error-document index.html

# Set public access policy
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" \
    2>/dev/null || true

aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
        \"Sid\": \"PublicReadGetObject\",
        \"Effect\": \"Allow\",
        \"Principal\": \"*\",
        \"Action\": \"s3:GetObject\",
        \"Resource\": \"arn:aws:s3:::${BUCKET_NAME}/*\"
    }]
}"

echo -e "${GREEN}✅ S3 bucket configured${NC}"

# Build web app
echo "Building web demo..."
mkdir -p packages/web/build

# Create demo web app with API integration
cat > packages/web/build/index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RuralConnect AI - Demo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        header {
            text-align: center;
            padding: 60px 20px;
            color: white;
        }
        h1 {
            font-size: 3em;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .status-badge {
            display: inline-block;
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            border-radius: 20px;
            margin: 20px 0;
            font-weight: bold;
        }
        .api-info {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            color: white;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin: 40px 0;
        }
        .feature-card {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: transform 0.3s;
        }
        .feature-card:hover { transform: translateY(-5px); }
        .feature-icon { font-size: 3em; margin-bottom: 15px; }
        .feature-title {
            font-size: 1.5em;
            margin-bottom: 10px;
            color: #667eea;
        }
        .cta-section {
            text-align: center;
            padding: 60px 20px;
            background: white;
            border-radius: 15px;
            margin: 40px 0;
        }
        .cta-button {
            display: inline-block;
            padding: 15px 40px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 30px;
            font-size: 1.2em;
            margin: 10px;
            transition: background 0.3s;
            cursor: pointer;
            border: none;
        }
        .cta-button:hover { background: #764ba2; }
        .api-test {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            font-family: monospace;
            font-size: 0.9em;
        }
        footer {
            text-align: center;
            padding: 40px 20px;
            color: white;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🌾 RuralConnect AI</h1>
            <p style="font-size: 1.5em; opacity: 0.9;">Empowering Rural Communities with AI</p>
            <div class="status-badge">✅ System Online</div>
            
            <div class="api-info">
                <strong>Backend API:</strong> ${API_ENDPOINT}<br>
                <small>Real-time data processing powered by AWS Lambda</small>
            </div>
        </header>

        <div class="features">
            <div class="feature-card">
                <div class="feature-icon">🌱</div>
                <h3 class="feature-title">Smart Agriculture</h3>
                <p>AI-powered crop recommendations and soil analysis</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🏥</div>
                <h3 class="feature-title">Healthcare</h3>
                <p>Telemedicine and health services access</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">📚</div>
                <h3 class="feature-title">Education</h3>
                <p>Training and knowledge in local languages</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">💰</div>
                <h3 class="feature-title">Market Prices</h3>
                <p>Real-time market data and trends</p>
            </div>
        </div>

        <div class="cta-section">
            <h2>Test the API</h2>
            <button class="cta-button" onclick="testAPI()">Test Backend Connection</button>
            <div id="api-result" class="api-test" style="display:none;"></div>
        </div>

        <div class="cta-section">
            <h2>Download Mobile App</h2>
            <p style="margin: 20px 0;">Get the full experience on your Android device</p>
            <a href="#" class="cta-button" onclick="alert('APK download link will be provided after mobile app is fixed'); return false;">
                Download APK
            </a>
        </div>

        <footer>
            <p>&copy; 2024 RuralConnect AI</p>
            <p style="margin-top: 10px;">Powered by AWS Lambda + API Gateway</p>
        </footer>
    </div>

    <script>
        const API_ENDPOINT = '${API_ENDPOINT}';
        
        async function testAPI() {
            const resultDiv = document.getElementById('api-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = 'Testing API connection...';
            
            try {
                const response = await fetch(API_ENDPOINT);
                const data = await response.json();
                
                resultDiv.innerHTML = \`
                    <strong>✅ API Connection Successful!</strong><br><br>
                    <strong>Response:</strong><br>
                    \${JSON.stringify(data, null, 2)}
                \`;
            } catch (error) {
                resultDiv.innerHTML = \`
                    <strong>❌ API Connection Failed</strong><br><br>
                    Error: \${error.message}
                \`;
            }
        }
        
        console.log('RuralConnect AI Web Demo');
        console.log('API Endpoint:', API_ENDPOINT);
    </script>
</body>
</html>
EOF

# Upload to S3
echo "Uploading to S3..."
aws s3 sync packages/web/build/ "s3://$BUCKET_NAME" --delete --quiet

echo -e "${GREEN}✅ Web demo deployed${NC}"

WEB_URL="http://${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com"

# ============================================
# DEPLOYMENT COMPLETE
# ============================================

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Backend API:${NC}"
echo -e "${GREEN}${API_ENDPOINT}${NC}"
echo ""
echo -e "${BLUE}Web Demo:${NC}"
echo -e "${GREEN}${WEB_URL}${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Open the web demo URL in your browser"
echo "2. Click 'Test Backend Connection' to verify API"
echo "3. Update mobile app with API endpoint: ${API_ENDPOINT}"
echo "4. Rebuild mobile APK with real backend"
echo ""
echo -e "${BLUE}Mobile App Configuration:${NC}"
echo "Edit packages/mobile/src/config/api.ts:"
echo "  - Set MOCK_MODE = false"
echo "  - Set API_BASE_URL = '${API_ENDPOINT}'"
echo ""
echo "Then rebuild: cd packages/mobile && eas build --platform android"
echo ""

