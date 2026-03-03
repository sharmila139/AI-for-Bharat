# Deploy Complete RuralConnect AI Solution

## What This Does

Deploys **both** backend and web demo to AWS:

1. **Backend API** (AWS Lambda + API Gateway)
   - Real API for mobile app to connect to
   - Handles all data processing
   - Scalable and serverless

2. **Web Demo** (S3 Static Hosting)
   - Shareable URL for demos
   - Works on all devices
   - Tests backend connection

## Prerequisites

1. **AWS Account** - Create at https://aws.amazon.com
2. **AWS CLI** - Install: `brew install awscli`
3. **Node.js** - Already installed ✅

## Step-by-Step Deployment

### Step 1: Configure AWS CLI (5 minutes)

```bash
# Run this command
aws configure
```

You'll need:
- **AWS Access Key ID** - Get from AWS Console → IAM → Security credentials
- **AWS Secret Access Key** - From same place
- **Region**: `us-east-1`
- **Output format**: `json`

### Step 2: Deploy Everything (10 minutes)

```bash
# Run this ONE command
./deploy-backend-and-web.sh
```

This automatically:
- ✅ Creates IAM roles
- ✅ Packages backend code
- ✅ Deploys Lambda function
- ✅ Sets up API Gateway
- ✅ Creates S3 bucket
- ✅ Builds web demo
- ✅ Uploads everything
- ✅ Gives you URLs

### Step 3: Test Your Deployment

After deployment, you'll see:

```
🎉 DEPLOYMENT SUCCESSFUL!

Backend API:
https://abc123.execute-api.us-east-1.amazonaws.com

Web Demo:
http://ruralconnect-web-123456789.s3-website-us-east-1.amazonaws.com
```

**Open the Web Demo URL** and click "Test Backend Connection"

## What You Get

### 1. Backend API
- **URL**: `https://abc123.execute-api.us-east-1.amazonaws.com`
- **Purpose**: Mobile app connects here for data
- **Features**: 
  - User authentication
  - Crop recommendations
  - Soil analysis
  - Market prices
  - Health services

### 2. Web Demo
- **URL**: `http://ruralconnect-web-123456789.s3-website-us-east-1.amazonaws.com`
- **Purpose**: Shareable demo for presentations
- **Features**:
  - Feature showcase
  - API connection test
  - Mobile app download link
  - Professional landing page

## Next Steps

### For Mobile App

1. **Update API configuration:**
   ```bash
   # Edit packages/mobile/src/config/api.ts
   ```
   
   Change:
   ```typescript
   export const MOCK_MODE = false; // Disable mock data
   export const API_BASE_URL = 'https://YOUR_API_URL'; // Use real API
   ```

2. **Rebuild APK:**
   ```bash
   cd packages/mobile
   eas build --platform android --profile production
   ```

3. **Test the new APK** - Should work without crashing!

### For Demos

1. **Share the web demo URL** - Works immediately
2. **Test API connection** - Click button on web page
3. **Show features** - Professional presentation

## Cost

### Monthly Costs:
- Lambda: $0-5 (1M requests free)
- API Gateway: $0-3 (1M requests free)
- S3: $0.03 (minimal storage)
- **Total: ~$0-8/month**

### First Year:
- **FREE** (AWS Free Tier covers everything)

## Troubleshooting

### "AWS CLI not found"
```bash
brew install awscli
```

### "Unable to locate credentials"
```bash
aws configure
# Re-enter your credentials
```

### "Permission denied"
```bash
chmod +x deploy-backend-and-web.sh
```

### "IAM role error"
- Wait 30 seconds and try again
- IAM roles take time to propagate

### "API Gateway error"
- Check AWS Console → API Gateway
- Verify Lambda function exists

## Architecture

```
┌─────────────────────────────────────────┐
│           Users/Devices                  │
└────────┬──────────────────┬──────────────┘
         │                  │
    ┌────▼────┐        ┌────▼────┐
    │ Mobile  │        │   Web   │
    │   App   │        │  Demo   │
    └────┬────┘        └────┬────┘
         │                  │
         │    ┌─────────────┘
         │    │
    ┌────▼────▼────┐
    │ API Gateway  │
    └────┬─────────┘
         │
    ┌────▼────┐
    │ Lambda  │
    │ Backend │
    └─────────┘
```

## Testing Checklist

After deployment:

- [ ] Web demo URL opens
- [ ] "Test Backend Connection" works
- [ ] API returns JSON response
- [ ] Mobile app config updated
- [ ] Mobile APK rebuilt
- [ ] Mobile app connects to API
- [ ] Mobile app doesn't crash

## Support

### Check Deployment Status
```bash
# Check Lambda function
aws lambda get-function --function-name ruralconnect-api

# Check API Gateway
aws apigatewayv2 get-apis

# Check S3 bucket
aws s3 ls s3://ruralconnect-web-YOUR_ACCOUNT_ID/
```

### View Logs
```bash
# Lambda logs
aws logs tail /aws/lambda/ruralconnect-api --follow

# API Gateway logs
# Check in AWS Console → API Gateway → Logs
```

## Ready to Deploy?

Just run:
```bash
./deploy-backend-and-web.sh
```

You'll have both backend and web demo live in 10 minutes! 🚀

