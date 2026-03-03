# RuralConnect AI - AWS Deployment Guide

## 🎯 Quick Start

Deploy backend API + web demo in **10 minutes**:

```bash
# 1. Configure AWS
aws configure

# 2. Deploy everything
./deploy-backend-and-web.sh
```

That's it! You'll get:
- ✅ Backend API URL
- ✅ Web demo URL
- ✅ Ready for mobile app integration

---

## 📋 What Gets Deployed

### 1. Backend API (AWS Lambda + API Gateway)
- **Purpose**: Real API for mobile app
- **Technology**: Node.js serverless functions
- **Features**: Auth, crops, soil analysis, market prices
- **Cost**: FREE (AWS Free Tier)

### 2. Web Demo (S3 Static Hosting)
- **Purpose**: Shareable demo link
- **Technology**: Static HTML/CSS/JS
- **Features**: Feature showcase, API testing
- **Cost**: ~$0.03/month

---

## 🚀 Deployment Steps

### Prerequisites
1. AWS Account
2. AWS CLI installed (`brew install awscli`)
3. Node.js installed (already have ✅)

### Step 1: AWS Configuration
```bash
aws configure
```
Enter your AWS credentials from IAM console.

### Step 2: Deploy
```bash
./deploy-backend-and-web.sh
```

### Step 3: Get Your URLs
After deployment:
```
Backend API: https://abc123.execute-api.us-east-1.amazonaws.com
Web Demo: http://ruralconnect-web-123456789.s3-website-us-east-1.amazonaws.com
```

---

## 📱 Fix Mobile App

### Update API Configuration

Edit `packages/mobile/src/config/api.ts`:

```typescript
// Change from:
export const MOCK_MODE = true;
export const API_BASE_URL = 'http://10.0.2.2:3000/api';

// To:
export const MOCK_MODE = false;
export const API_BASE_URL = 'https://YOUR_API_URL'; // From deployment
```

### Rebuild APK

```bash
cd packages/mobile
eas build --platform android --profile production
```

### Test
- Download new APK
- Install on device
- App should work without crashing!

---

## 🌐 Web Demo Features

Your web demo includes:
- ✅ Professional landing page
- ✅ Feature showcase
- ✅ API connection test button
- ✅ Mobile app download section
- ✅ Responsive design (works on all devices)

**Perfect for:**
- Investor presentations
- Stakeholder demos
- User testing
- Quick feedback

---

## 💰 Cost Breakdown

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| Lambda | 1M requests/month | $0.20 per 1M |
| API Gateway | 1M requests/month | $1.00 per 1M |
| S3 Storage | 5GB | $0.023 per GB |
| S3 Requests | 20K GET, 2K PUT | $0.0004 per 1K |
| **Total** | **$0/month** | **~$5-10/month** |

**First year is FREE with AWS Free Tier!**

---

## 🔧 Troubleshooting

### Deployment Fails

**Check AWS CLI:**
```bash
aws --version
aws sts get-caller-identity
```

**Check Permissions:**
- IAM user needs Lambda, API Gateway, S3 access
- Add policies in AWS Console → IAM

**Re-run Deployment:**
```bash
./deploy-backend-and-web.sh
```

### Mobile App Still Crashes

**Check API URL:**
- Make sure you updated `api.ts` with correct URL
- Verify `MOCK_MODE = false`

**Check API Connection:**
- Open web demo
- Click "Test Backend Connection"
- Should show success

**Rebuild APK:**
```bash
cd packages/mobile
rm -rf node_modules
npm install
eas build --platform android --profile production
```

### Web Demo Not Loading

**Check S3 Bucket:**
```bash
aws s3 ls s3://ruralconnect-web-YOUR_ACCOUNT_ID/
```

**Check Public Access:**
- AWS Console → S3 → Your bucket
- Permissions → Block public access → Should be OFF
- Bucket policy → Should allow public read

**Re-upload:**
```bash
aws s3 sync packages/web/build/ s3://ruralconnect-web-YOUR_ACCOUNT_ID/
```

---

## 📊 Architecture

```
┌──────────────────────────────────────────────┐
│              Internet Users                   │
└────────┬─────────────────────┬────────────────┘
         │                     │
    ┌────▼────┐           ┌────▼────┐
    │ Mobile  │           │   Web   │
    │   App   │           │  Demo   │
    │ (APK)   │           │  (S3)   │
    └────┬────┘           └────┬────┘
         │                     │
         └──────────┬──────────┘
                    │
              ┌─────▼──────┐
              │    API     │
              │  Gateway   │
              └─────┬──────┘
                    │
              ┌─────▼──────┐
              │   Lambda   │
              │  Functions │
              └────────────┘
```

---

## 📝 Next Steps

### Immediate (Today)
1. ✅ Deploy backend + web demo
2. ✅ Test web demo URL
3. ✅ Share demo link

### Short-term (This Week)
1. ⏳ Update mobile app config
2. ⏳ Rebuild APK
3. ⏳ Test mobile app with real backend
4. ⏳ Upload APK to S3 for distribution

### Long-term (This Month)
1. ⏳ Add database (RDS)
2. ⏳ Enable AI features (Bedrock)
3. ⏳ Add CDN (CloudFront)
4. ⏳ Production launch

---

## 🎉 Success Criteria

After deployment, you should have:

- [x] Backend API URL that responds
- [x] Web demo URL that loads
- [x] API test button works
- [x] Professional demo to share
- [ ] Mobile app connects to API
- [ ] Mobile app doesn't crash
- [ ] APK available for download

---

## 📞 Support

### Documentation
- `DEPLOY_COMPLETE_SOLUTION.md` - Detailed guide
- `AWS_SETUP_GUIDE.md` - AWS configuration
- `FINAL_DEPLOYMENT_SOLUTION.md` - Complete overview

### AWS Resources
- Lambda Console: https://console.aws.amazon.com/lambda
- API Gateway Console: https://console.aws.amazon.com/apigateway
- S3 Console: https://console.aws.amazon.com/s3

### Commands
```bash
# View Lambda logs
aws logs tail /aws/lambda/ruralconnect-api --follow

# List S3 buckets
aws s3 ls

# Test API
curl https://YOUR_API_URL
```

---

## 🏁 Ready to Deploy?

```bash
./deploy-backend-and-web.sh
```

**Time**: 10 minutes  
**Cost**: FREE (first year)  
**Result**: Working backend + shareable demo

Let's get your app live! 🚀

