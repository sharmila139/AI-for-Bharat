# Deploy RuralConnect AI to AWS - Step by Step

## 🎯 Goal
Get a working demo URL on AWS that you can share immediately.

## ⏱️ Time Required
- AWS CLI setup: 5 minutes
- Deployment: 5 minutes
- **Total: 10 minutes**

## 💰 Cost
- **$0-1/month** (AWS Free Tier covers this)

---

## Step 1: Install AWS CLI (if not installed)

Check if installed:
```bash
aws --version
```

If not installed:
```bash
brew install awscli
```

---

## Step 2: Get AWS Credentials

1. Go to: https://console.aws.amazon.com
2. Log in to your AWS account
3. Click your username (top right) → **Security credentials**
4. Scroll to **Access keys** section
5. Click **Create access key**
6. Select **Command Line Interface (CLI)**
7. Click **Next** → **Create access key**
8. **Download** the CSV file or copy the keys

You'll get:
- Access Key ID (looks like: AKIAIOSFODNN7EXAMPLE)
- Secret Access Key (looks like: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY)

---

## Step 3: Configure AWS CLI

Run this command:
```bash
aws configure
```

Enter when prompted:
```
AWS Access Key ID: [paste your Access Key ID]
AWS Secret Access Key: [paste your Secret Access Key]
Default region name: us-east-1
Default output format: json
```

---

## Step 4: Verify Configuration

```bash
aws sts get-caller-identity
```

You should see your AWS account info. If you see an error, double-check your credentials.

---

## Step 5: Deploy to AWS

Run the deployment script:
```bash
./deploy-web-app-to-aws.sh
```

This will:
1. ✅ Create S3 bucket
2. ✅ Build web app
3. ✅ Upload to S3
4. ✅ Configure public access
5. ✅ Give you a public URL

---

## Step 6: Get Your Demo URL

After deployment completes, you'll see:

```
🎉 Deployment Successful!
==========================================

Your web app is now live at:
http://ruralconnect-web-123456789.s3-website-us-east-1.amazonaws.com

You can share this URL for demos!
```

**Copy this URL and share it!**

---

## What You Get

✅ **Public web URL** - Works on any device  
✅ **No installation needed** - Just open in browser  
✅ **Professional landing page** - Shows all features  
✅ **Shareable link** - Send to anyone  
✅ **Mobile friendly** - Works on phones and tablets  

---

## Troubleshooting

### Error: "AWS CLI not found"
```bash
brew install awscli
```

### Error: "Unable to locate credentials"
```bash
aws configure
# Re-enter your credentials
```

### Error: "Bucket already exists"
- This is OK! The script will use the existing bucket
- Just continue

### Error: "Access Denied"
- Check your IAM user has S3 permissions
- Go to IAM console and add S3FullAccess policy

---

## Next Steps After Deployment

### Option A: Keep Simple Landing Page
- ✅ Already done!
- Share the URL
- Perfect for initial demos

### Option B: Deploy Full Web App
1. Build the React web app
2. Upload to same S3 bucket
3. Get full functionality

### Option C: Add Backend API
1. Deploy Lambda backend
2. Connect web app to API
3. Get real data and AI features

---

## Quick Commands Reference

```bash
# Check AWS CLI
aws --version

# Configure AWS
aws configure

# Verify configuration
aws sts get-caller-identity

# Deploy web app
./deploy-web-app-to-aws.sh

# Check S3 buckets
aws s3 ls

# View bucket contents
aws s3 ls s3://ruralconnect-web-YOUR_ACCOUNT_ID/
```

---

## Cost Breakdown

| Service | Usage | Cost |
|---------|-------|------|
| S3 Storage | 1GB | $0.02/month |
| S3 Requests | 10,000 | $0.01/month |
| Data Transfer | 10GB | Free (first 100GB) |
| **Total** | | **~$0.03/month** |

**AWS Free Tier includes:**
- 5GB S3 storage
- 20,000 GET requests
- 2,000 PUT requests
- 100GB data transfer

So your first year is essentially **FREE**! 🎉

---

## Support

If you encounter any issues:

1. **Check AWS credentials**: `aws sts get-caller-identity`
2. **Check script permissions**: `chmod +x deploy-web-app-to-aws.sh`
3. **Check AWS region**: Should be `us-east-1`
4. **Check IAM permissions**: User needs S3 access

---

## Ready to Deploy?

Just run:
```bash
./deploy-web-app-to-aws.sh
```

You'll have a live demo URL in 5 minutes! 🚀

