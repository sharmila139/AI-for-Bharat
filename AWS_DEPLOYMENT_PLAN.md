# RuralConnect AI - AWS Deployment Plan

## Current Status
- ✅ Android APK builds successfully
- ❌ App crashes on startup (missing backend)
- ❌ No AWS infrastructure deployed

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Cloud Infrastructure                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   Route 53   │────────▶│  CloudFront  │                 │
│  │     DNS      │         │     CDN      │                 │
│  └──────────────┘         └──────┬───────┘                 │
│                                   │                          │
│                    ┌──────────────┴──────────────┐          │
│                    │                              │          │
│           ┌────────▼────────┐          ┌─────────▼────────┐│
│           │   S3 Bucket     │          │  API Gateway     ││
│           │  Static Assets  │          │   REST API       ││
│           └─────────────────┘          └────────┬─────────┘│
│                                                  │          │
│                                         ┌────────▼────────┐ │
│                                         │  Lambda/ECS     │ │
│                                         │  Backend API    │ │
│                                         └────────┬────────┘ │
│                                                  │          │
│                    ┌─────────────────────────────┼─────┐   │
│                    │                             │     │   │
│           ┌────────▼────────┐         ┌─────────▼─────▼┐  │
│           │   RDS Postgres  │         │  Amazon Bedrock│  │
│           │    Database     │         │   AI Service   │  │
│           └─────────────────┘         └────────────────┘  │
│                                                             │
│           ┌─────────────────┐         ┌────────────────┐  │
│           │  ElastiCache    │         │   DynamoDB     │  │
│           │     Redis       │         │   Sessions     │  │
│           └─────────────────┘         └────────────────┘  │
│                                                             │
│           ┌─────────────────┐         ┌────────────────┐  │
│           │   S3 Buckets    │         │  CloudWatch    │  │
│           │  User Uploads   │         │   Monitoring   │  │
│           └─────────────────┘         └────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Phase 1: Quick Fix - Make APK Work

### Option A: Use Mock Backend (Fastest - 5 minutes)
Create a mock API that returns dummy data so the app can start.

**Steps:**
1. Update `packages/mobile/src/config/api.ts` to use a mock backend
2. Create mock data responses
3. Rebuild APK

**Pros:** Immediate demo capability
**Cons:** No real functionality, just UI demo

### Option B: Deploy Minimal Backend (30 minutes)
Deploy a minimal Express backend to AWS Lambda with API Gateway.

**Steps:**
1. Create Lambda function with Express backend
2. Set up API Gateway
3. Update mobile app API URL
4. Rebuild APK

**Pros:** Real backend, basic functionality
**Cons:** Limited features, no database yet

## Phase 2: Full AWS Deployment

### Step 1: Backend Infrastructure (2-3 hours)

#### 1.1 Database Setup
```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier ruralconnect-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password <PASSWORD> \
  --allocated-storage 20 \
  --vpc-security-group-ids <SG_ID> \
  --db-subnet-group-name <SUBNET_GROUP>
```

#### 1.2 Backend Deployment Options

**Option A: AWS Lambda + API Gateway (Serverless)**
- Cost: ~$5-20/month
- Scalability: Automatic
- Cold start: 1-3 seconds
- Best for: Low to medium traffic

**Option B: ECS Fargate (Containerized)**
- Cost: ~$30-50/month
- Scalability: Manual/Auto
- Cold start: None
- Best for: Consistent traffic

**Option C: EC2 (Traditional)**
- Cost: ~$10-30/month
- Scalability: Manual
- Cold start: None
- Best for: Full control needed

**Recommendation: Start with Lambda, migrate to ECS if needed**

#### 1.3 Storage Setup
```bash
# Create S3 buckets
aws s3 mb s3://ruralconnect-static-assets
aws s3 mb s3://ruralconnect-user-uploads
aws s3 mb s3://ruralconnect-ml-models

# Configure CORS
aws s3api put-bucket-cors \
  --bucket ruralconnect-user-uploads \
  --cors-configuration file://cors-config.json
```

#### 1.4 AI Service Setup
```bash
# Enable Amazon Bedrock
aws bedrock list-foundation-models --region us-east-1

# Request model access (Claude 3 Sonnet)
# This requires manual approval in AWS Console
```

### Step 2: Frontend Deployment (1 hour)

#### 2.1 Web App (React)
```bash
# Build web app
cd packages/web
npm run build

# Deploy to S3
aws s3 sync build/ s3://ruralconnect-static-assets/

# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name ruralconnect-static-assets.s3.amazonaws.com
```

#### 2.2 Mobile App Configuration
```bash
# Update API URL in mobile app
# Rebuild APK with production API URL
cd packages/mobile
# Update src/config/api.ts with production URL
eas build --platform android --profile production
```

### Step 3: Monitoring & Security (30 minutes)

#### 3.1 CloudWatch Setup
```bash
# Create log groups
aws logs create-log-group --log-group-name /aws/lambda/ruralconnect-api
aws logs create-log-group --log-group-name /aws/rds/ruralconnect-db

# Set up alarms
aws cloudwatch put-metric-alarm \
  --alarm-name ruralconnect-high-error-rate \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

#### 3.2 Security Configuration
```bash
# Create IAM roles
aws iam create-role --role-name RuralConnectLambdaRole \
  --assume-role-policy-document file://lambda-trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name RuralConnectLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
```

## Cost Estimation

### Minimal Setup (Lambda + RDS t3.micro)
- Lambda: $5/month (1M requests)
- RDS t3.micro: $15/month
- S3: $1/month (10GB)
- CloudFront: $5/month (100GB transfer)
- **Total: ~$26/month**

### Production Setup (ECS + RDS t3.small)
- ECS Fargate: $35/month (0.5 vCPU, 1GB RAM)
- RDS t3.small: $30/month
- S3: $5/month (50GB)
- CloudFront: $15/month (500GB transfer)
- Bedrock: $10/month (estimated)
- **Total: ~$95/month**

## Deployment Timeline

### Quick Demo (Today)
- [ ] Fix APK crash with mock backend (30 min)
- [ ] Deploy minimal Lambda backend (1 hour)
- [ ] Test APK with real backend (15 min)
- **Total: ~2 hours**

### Full Production (This Week)
- [ ] Day 1: Backend infrastructure (RDS, Lambda, API Gateway)
- [ ] Day 2: Storage setup (S3, CloudFront)
- [ ] Day 3: AI service integration (Bedrock)
- [ ] Day 4: Web app deployment
- [ ] Day 5: Testing and monitoring setup
- **Total: ~5 days**

## Next Steps

### Immediate Actions (Choose One):

1. **Quick Demo Path**: Fix APK with mock backend
   - Pros: Works in 30 minutes
   - Cons: No real functionality

2. **Minimal Backend Path**: Deploy Lambda + API Gateway
   - Pros: Real backend, works in 2 hours
   - Cons: Limited features

3. **Full Deployment Path**: Complete AWS infrastructure
   - Pros: Production-ready
   - Cons: Takes 5 days

**Recommendation: Start with Minimal Backend Path (Option 2)**

This gives you:
- Working APK with real backend
- Demo-ready in 2 hours
- Foundation for full deployment
- Can iterate and add features incrementally

## Demo URL Structure

Once deployed, you'll have:
- **Web App**: https://ruralconnect.app
- **API**: https://api.ruralconnect.app
- **APK Download**: https://ruralconnect.app/download
- **Admin Panel**: https://admin.ruralconnect.app

