#!/bin/bash

# RuralConnect AI - AWS Amplify Setup
# Configures Amplify for mobile app deployment

set -e

APP_NAME="ruralconnect-mobile"
REGION="us-east-1"

echo "Setting up AWS Amplify for RuralConnect AI mobile app..."

# Note: This script provides the configuration
# Actual Amplify app creation requires GitHub token or repository access

echo ""
echo "AWS Amplify Setup Instructions"
echo "=============================="
echo ""
echo "Option 1: Using AWS Console (Recommended for first-time setup)"
echo "--------------------------------------------------------------"
echo "1. Go to AWS Console → AWS Amplify"
echo "2. Click 'New app' → 'Host web app'"
echo "3. Connect your GitHub repository"
echo "4. Select branch: main"
echo "5. Configure build settings (use amplify.yml below)"
echo "6. Review and deploy"
echo ""
echo "Option 2: Using AWS CLI (Requires GitHub token)"
echo "------------------------------------------------"
echo ""
echo "# Set your GitHub token"
echo "export GITHUB_TOKEN='your_github_personal_access_token'"
echo "export GITHUB_REPO='https://github.com/your-org/ruralconnect-ai'"
echo ""
echo "# Create Amplify app"
echo "aws amplify create-app \\"
echo "  --name $APP_NAME \\"
echo "  --repository \$GITHUB_REPO \\"
echo "  --access-token \$GITHUB_TOKEN \\"
echo "  --platform WEB \\"
echo "  --region $REGION"
echo ""
echo "# Get App ID from output, then create branch"
echo "export APP_ID='your_app_id'"
echo ""
echo "aws amplify create-branch \\"
echo "  --app-id \$APP_ID \\"
echo "  --branch-name main \\"
echo "  --enable-auto-build \\"
echo "  --region $REGION"
echo ""

# Create amplify.yml configuration
cat > amplify.yml <<'EOF'
version: 1
applications:
  - appRoot: packages/mobile
    frontend:
      phases:
        preBuild:
          commands:
            - yarn install
        build:
          commands:
            - yarn build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
    backend:
      phases:
        build:
          commands:
            - '# Add backend build commands if needed'
EOF

echo "✓ Created amplify.yml configuration file"
echo ""
echo "Build Configuration (amplify.yml)"
echo "=================================="
cat amplify.yml
echo ""
echo "Environment Variables to Set in Amplify Console:"
echo "================================================"
echo "EXPO_PUBLIC_API_URL=https://your-api-gateway-url/api/v1"
echo "EXPO_PUBLIC_CDN_URL=https://your-cloudfront-domain"
echo "EXPO_PUBLIC_BEDROCK_ENABLED=true"
echo ""
echo "Custom Domain Setup (Optional):"
echo "==============================="
echo "1. Go to Amplify Console → Domain management"
echo "2. Add custom domain (e.g., app.ruralconnect.ai)"
echo "3. Configure DNS records as shown"
echo "4. Wait for SSL certificate provisioning"
echo ""
echo "Deployment Triggers:"
echo "==================="
echo "- Automatic: Push to main branch"
echo "- Manual: Amplify Console → Redeploy"
echo "- CI/CD: GitHub Actions workflow (already configured)"
echo ""
echo "Next Steps:"
echo "==========="
echo "1. Create Amplify app using Console or CLI"
echo "2. Upload amplify.yml to repository root"
echo "3. Configure environment variables"
echo "4. Trigger first deployment"
echo "5. Test deployed app"
echo ""
echo "Monitoring:"
echo "==========="
echo "- Build logs: Amplify Console → Build history"
echo "- Access logs: CloudWatch Logs"
echo "- Metrics: Amplify Console → Monitoring"
