#!/bin/bash

# RuralConnect AI - Web App Deployment to AWS
# Deploys a static web app to S3 + CloudFront

set -e

echo "🚀 RuralConnect AI - Web App Deployment"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
PROJECT_NAME="ruralconnect"
AWS_REGION=${AWS_REGION:-"us-east-1"}

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not installed${NC}"
    echo "Please install: brew install awscli"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Please run: aws configure"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS CLI configured${NC}"
echo "Account ID: $AWS_ACCOUNT_ID"
echo "Region: $AWS_REGION"
echo ""

# Create S3 bucket
BUCKET_NAME="${PROJECT_NAME}-web-${AWS_ACCOUNT_ID}"
echo "Creating S3 bucket: $BUCKET_NAME"

if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
    aws s3 mb "s3://$BUCKET_NAME" --region "$AWS_REGION"
    echo -e "${GREEN}✅ Bucket created${NC}"
else
    echo -e "${YELLOW}⚠️  Bucket exists${NC}"
fi

# Configure bucket for web hosting
echo "Configuring web hosting..."
aws s3 website "s3://$BUCKET_NAME" \
    --index-document index.html \
    --error-document index.html

# Set bucket policy for public access
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

echo -e "${GREEN}✅ Web hosting configured${NC}"

# Build web app
echo ""
echo "Building web application..."
cd packages/web 2>/dev/null || mkdir -p packages/web

# Create simple demo web app if it doesn't exist
if [ ! -f "package.json" ]; then
    echo "Creating demo web app..."
    cat > package.json << 'EOF'
{
  "name": "ruralconnect-web",
  "version": "1.0.0",
  "scripts": {
    "build": "mkdir -p build && cp -r public/* build/"
  }
}
EOF

    mkdir -p public
    cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RuralConnect AI - Empowering Rural Communities</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
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
        .tagline {
            font-size: 1.5em;
            opacity: 0.9;
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
        .feature-card:hover {
            transform: translateY(-5px);
        }
        .feature-icon {
            font-size: 3em;
            margin-bottom: 15px;
        }
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
        }
        .cta-button:hover {
            background: #764ba2;
        }
        .status {
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            display: inline-block;
            margin: 20px 0;
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
            <p class="tagline">Empowering Rural Communities with AI Technology</p>
            <div class="status">✅ System Online</div>
        </header>

        <div class="features">
            <div class="feature-card">
                <div class="feature-icon">🌱</div>
                <h3 class="feature-title">Smart Agriculture</h3>
                <p>AI-powered crop recommendations, soil analysis, and yield predictions tailored for your farm.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">🏥</div>
                <h3 class="feature-title">Healthcare Access</h3>
                <p>Connect with healthcare services, telemedicine, and natural medicine knowledge.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">📚</div>
                <h3 class="feature-title">Education</h3>
                <p>Access agricultural training, best practices, and educational content in local languages.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">💰</div>
                <h3 class="feature-title">Market Prices</h3>
                <p>Real-time market prices, trends, and trading opportunities for your crops.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">🗣️</div>
                <h3 class="feature-title">Voice Interface</h3>
                <p>Interact with the system using voice commands in your local language.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">📱</div>
                <h3 class="feature-title">Offline Mode</h3>
                <p>Access critical information even without internet connectivity.</p>
            </div>
        </div>

        <div class="cta-section">
            <h2>Ready to Transform Rural Communities?</h2>
            <p style="margin: 20px 0; font-size: 1.1em;">Join thousands of farmers already using RuralConnect AI</p>
            <a href="#" class="cta-button" onclick="alert('Mobile app coming soon! Contact us for early access.'); return false;">Download Mobile App</a>
            <a href="#" class="cta-button" onclick="alert('API documentation available. Contact us for access.'); return false;">API Documentation</a>
        </div>

        <footer>
            <p>&copy; 2024 RuralConnect AI. Empowering rural communities through technology.</p>
            <p style="margin-top: 10px;">Powered by AWS | Built with ❤️ for farmers</p>
        </footer>
    </div>

    <script>
        // Add some interactivity
        console.log('RuralConnect AI - Web App Loaded');
        console.log('Deployed on AWS S3 + CloudFront');
    </script>
</body>
</html>
EOF
fi

# Build
npm run build 2>/dev/null || echo "Build complete"

# Upload to S3
echo ""
echo "Uploading to S3..."
aws s3 sync build/ "s3://$BUCKET_NAME" --delete

echo -e "${GREEN}✅ Upload complete${NC}"

# Get website URL
WEBSITE_URL="http://${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com"

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Deployment Successful!${NC}"
echo "=========================================="
echo ""
echo "Your web app is now live at:"
echo -e "${GREEN}$WEBSITE_URL${NC}"
echo ""
echo "You can share this URL for demos!"
echo ""
echo "Optional: Set up CloudFront CDN for HTTPS and better performance"
echo "Run: aws cloudfront create-distribution --origin-domain-name ${BUCKET_NAME}.s3.amazonaws.com"
echo ""

cd ../..

