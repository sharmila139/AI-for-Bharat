# RuralConnect AI - Quick Deployment Guide

## Current Status
✅ Android APK builds successfully  
❌ App crashes on startup (no backend)  
🎯 Goal: Get working demo on AWS

## Quick Fix Options

### Option 1: Mock Backend (FASTEST - 30 minutes)

The app is now configured with mock data. This allows it to run without a backend.

**Steps:**

1. **Rebuild APK with mock data enabled:**
   ```bash
   cd packages/mobile
   eas build --platform android --profile preview
   ```

2. **Wait for build to complete** (~10-15 minutes)

3. **Download and test APK:**
   - Download from EAS build URL
   - Install on Android device
   - App will now work with mock data

**What works:**
- ✅ App starts successfully
- ✅ All UI screens visible
- ✅ Mock data for demo
- ✅ No backend needed

**What doesn't work:**
- ❌ No real data
- ❌ No AI features
- ❌ No data persistence

**Best for:** Quick UI/UX demo

---

### Option 2: AWS Lambda Backend (RECOMMENDED - 2 hours)

Deploy a minimal backend to AWS Lambda with API Gateway.

**Prerequisites:**
- AWS Account
- AWS CLI installed and configured
- Domain name (optional)

**Steps:**

1. **Configure AWS credentials:**
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Enter region: us-east-1
   ```

2. **Run deployment script:**
   ```bash
   ./deploy-to-aws.sh
   # Select option 2: Minimal Backend
   ```

3. **Update mobile app with API URL:**
   ```bash
   cd packages/mobile
   # Edit src/config/api.ts
   # Change MOCK_MODE to false
   # Update API_BASE_URL with your Lambda URL
   ```

4. **Rebuild APK:**
   ```bash
   eas build --platform android --profile production
   ```

5. **Upload APK to S3:**
   ```bash
   # Download APK from EAS
   aws s3 cp ruralconnect.apk s3://ruralconnect-apk-YOUR_ACCOUNT_ID/ruralconnect-latest.apk
   ```

**What you get:**
- ✅ Real backend API
- ✅ Basic CRUD operations
- ✅ User authentication
- ✅ Shareable demo link
- ⚠️ No database yet (in-memory)
- ⚠️ No AI features yet

**Cost:** ~$5/month

---

### Option 3: Full Production (5 days)

Complete AWS infrastructure with all features.

**Includes:**
- RDS PostgreSQL database
- Lambda functions
- S3 storage
- CloudFront CDN
- Amazon Bedrock AI
- ElastiCache Redis
- CloudWatch monitoring

**Steps:**
1. Run: `./deploy-to-aws.sh` (select option 3)
2. Follow prompts for each service
3. Configure domain and SSL
4. Deploy web app
5. Rebuild mobile app with production URLs

**Cost:** ~$95/month

---

## Recommended Path for Demo

### Phase 1: Today (30 minutes)
1. ✅ Rebuild APK with mock data
2. ✅ Test on device
3. ✅ Share APK link

### Phase 2: Tomorrow (2 hours)
1. Deploy Lambda backend
2. Update mobile app
3. Rebuild APK
4. Upload to S3
5. Share demo link

### Phase 3: This Week (5 days)
1. Deploy full infrastructure
2. Add database
3. Enable AI features
4. Deploy web app
5. Production ready

---

## Current Mock Data Features

The app now includes mock data for:

- ✅ User authentication (login/register)
- ✅ Dashboard with weather and crops
- ✅ Crop recommendations
- ✅ Soil analysis
- ✅ Market prices
- ✅ Health services
- ✅ Education courses

All screens are functional with realistic demo data.

---

## Sharing the Demo

### Option A: Direct APK Download
1. Upload APK to S3
2. Share public S3 URL
3. Users download and install

**URL format:**
```
https://ruralconnect-apk-ACCOUNT_ID.s3.us-east-1.amazonaws.com/ruralconnect-latest.apk
```

### Option B: Landing Page
1. Create simple HTML page
2. Host on S3 + CloudFront
3. Add download button
4. Share landing page URL

**Example:**
```
https://demo.ruralconnect.app
```

---

## Next Steps

**Choose your path:**

1. **Need demo NOW?**
   → Rebuild APK with mock data (Option 1)

2. **Need working backend?**
   → Deploy Lambda backend (Option 2)

3. **Need production system?**
   → Full AWS deployment (Option 3)

**My recommendation:** Start with Option 1 today, then do Option 2 tomorrow.

---

## Troubleshooting

### APK still crashes?
1. Check if mock data is enabled in `src/config/api.ts`
2. Verify `MOCK_MODE = true`
3. Rebuild APK

### Can't deploy to AWS?
1. Check AWS credentials: `aws sts get-caller-identity`
2. Check IAM permissions
3. Check AWS region

### Build fails?
1. Clear cache: `cd packages/mobile && rm -rf node_modules && npm install`
2. Check EAS credentials
3. Check package versions

---

## Support

For issues or questions:
1. Check build logs in EAS dashboard
2. Check AWS CloudWatch logs
3. Review error messages in app

