# AWS Setup and Deployment Guide

## Step 1: Install AWS CLI

### Check if AWS CLI is installed
```bash
aws --version
```

If not installed, install it:

### macOS
```bash
brew install awscli
```

Or download from: https://aws.amazon.com/cli/

## Step 2: Get AWS Credentials

1. **Log in to AWS Console**: https://console.aws.amazon.com
2. **Go to IAM** (Identity and Access Management)
3. **Create Access Key**:
   - Click on your username (top right)
   - Select "Security credentials"
   - Scroll to "Access keys"
   - Click "Create access key"
   - Choose "CLI" as use case
   - Download the credentials (you'll need these)

## Step 3: Configure AWS CLI

Run this command and enter your credentials:

```bash
aws configure
```

You'll be prompted for:
- **AWS Access Key ID**: [Enter the key from Step 2]
- **AWS Secret Access Key**: [Enter the secret from Step 2]
- **Default region name**: us-east-1 (recommended)
- **Default output format**: json

## Step 4: Verify Configuration

```bash
aws sts get-caller-identity
```

You should see your AWS account information.

## Step 5: Deploy to AWS

Once configured, run:

```bash
./deploy-web-app-to-aws.sh
```

This will:
1. Create S3 bucket for web hosting
2. Build the web application
3. Upload to S3
4. Configure CloudFront CDN
5. Provide you with a public URL

## Estimated Time
- AWS CLI setup: 5 minutes
- Deployment: 10-15 minutes
- **Total: ~20 minutes**

## Cost
- S3 hosting: ~$1/month
- CloudFront: ~$5/month (first 1TB free)
- **Total: ~$1-6/month**

## What You'll Get
- Public web URL (e.g., https://d1234567890.cloudfront.net)
- Accessible from any device with a browser
- No app installation needed
- Works on Android, iOS, desktop
- Professional demo link to share

