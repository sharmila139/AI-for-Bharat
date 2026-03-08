# AWS Hosting Architecture - RuralConnect AI

## 📊 Complete Infrastructure Overview

---

## Web App Hosting

### Primary Storage: Amazon S3
**Bucket Name:** `ruralconnect-web-032761628276`  
**Region:** us-east-1 (N. Virginia)  
**Type:** Static Website Hosting

**What's Stored:**
- `index.html` - Main web app
- `assets/` - CSS and JavaScript files
- `RuralConnect-AI-v1.1.1.apk` - Android app (63 MB)
- `RuralConnect-AI-v1.1.0.apk` - Previous version

**S3 Configuration:**
- Static website hosting enabled
- Public read access enabled
- Index document: `index.html`
- Error document: `index.html` (for SPA routing)

**Direct S3 URL:**
http://ruralconnect-web-032761628276.s3-website-us-east-1.amazonaws.com

---

### Content Delivery: Amazon CloudFront (CDN)
**Distribution ID:** E3QXY9JKAZ57LV  
**Domain:** d37dunqrj3kbm8.cloudfront.net  
**Status:** Deployed

**What It Does:**
- Caches content at 400+ edge locations globally
- Provides HTTPS encryption
- Reduces latency for users worldwide
- Compresses content automatically
- Handles DDoS protection

**CloudFront URL:**
https://d37dunqrj3kbm8.cloudfront.net

---

## Backend API Hosting

### Compute: AWS Lambda
**Function Name:** ruralconnect-api  
**Region:** us-east-1  
**Runtime:** Node.js 20.x  
**Memory:** 512 MB  
**Timeout:** 30 seconds

**What It Does:**
- Handles AI requests to AWS Bedrock
- Processes API calls
- Manages authentication (when implemented)
- Serverless - scales automatically

### API Gateway
**Type:** REST API  
**Endpoint:** https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com  
**Stage:** Production

**Routes:**
- `/api/v1/ai/invoke` - AI model invocation
- `/api/v1/auth/*` - Authentication endpoints (future)

---

## AI Services

### AWS Bedrock
**Region:** us-east-1  
**Models Used:**
- Primary: `anthropic.claude-3-haiku-20240307-v1:0`
- Fallback: Same (Haiku is reliable)

**What It Does:**
- Soil analysis
- Crop recommendations
- Health assessments
- Education recommendations
- Grievance classification

---

## Complete Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
│              (Mobile App + Web Browser)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   CloudFront CDN                             │
│         d37dunqrj3kbm8.cloudfront.net                       │
│                                                              │
│  • 400+ Edge Locations Worldwide                            │
│  • HTTPS Encryption                                          │
│  • Content Caching                                           │
│  • DDoS Protection                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Amazon S3                                 │
│         ruralconnect-web-032761628276                       │
│                                                              │
│  • Static Website Hosting                                   │
│  • Web App Files (HTML, CSS, JS)                            │
│  • APK Files (Mobile App)                                   │
│  • Public Read Access                                        │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                   Mobile App                                 │
│              (Android APK v1.1.1)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Gateway                                 │
│   https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com   │
│                                                              │
│  • REST API Endpoints                                        │
│  • Request Routing                                           │
│  • Rate Limiting                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  AWS Lambda                                  │
│              ruralconnect-api                                │
│                                                              │
│  • Serverless Compute                                        │
│  • Node.js 20.x Runtime                                      │
│  • Auto-scaling                                              │
│  • Handles AI Requests                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  AWS Bedrock                                 │
│         (Claude 3 Haiku AI Model)                           │
│                                                              │
│  • Soil Analysis                                             │
│  • Crop Recommendations                                      │
│  • Health Assessments                                        │
│  • Education Content                                         │
│  • Grievance Classification                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## AWS Services Used

| Service | Purpose | Region | Resource Name |
|---------|---------|--------|---------------|
| **S3** | Static web hosting | us-east-1 | ruralconnect-web-032761628276 |
| **CloudFront** | Global CDN | Global | E3QXY9JKAZ57LV |
| **Lambda** | Backend API | us-east-1 | ruralconnect-api |
| **API Gateway** | API endpoint | us-east-1 | q5hy2fwp3i |
| **Bedrock** | AI models | us-east-1 | Claude 3 Haiku |
| **IAM** | Permissions | Global | Lambda execution role |
| **CloudWatch** | Logs & monitoring | us-east-1 | Log groups |

---

## Data Flow

### Web App Access
1. User visits CloudFront URL
2. CloudFront checks cache
3. If cached: Returns content immediately
4. If not cached: Fetches from S3, caches, returns
5. User sees web app

### APK Download
1. User clicks "Download Android App"
2. CloudFront serves APK from cache (or S3)
3. APK downloads to user's device

### AI Request (from Mobile App)
1. Mobile app sends request to API Gateway
2. API Gateway routes to Lambda function
3. Lambda invokes AWS Bedrock
4. Bedrock processes with Claude AI
5. Response flows back: Bedrock → Lambda → API Gateway → Mobile App

---

## Storage Breakdown

### S3 Bucket Contents
```
ruralconnect-web-032761628276/
├── index.html (493 bytes)
├── assets/
│   ├── index-B4YbEMK9.css (30.66 KB)
│   └── index-BA4A0Omn.js (208.31 KB)
├── RuralConnect-AI-v1.1.1.apk (63 MB)
└── RuralConnect-AI-v1.1.0.apk (63 MB)

Total: ~126 MB
```

---

## Cost Breakdown

### Current Monthly Costs (Estimated)

**S3 Storage:**
- 126 MB stored = $0.003/month
- Data transfer: Covered by CloudFront

**CloudFront:**
- First 1 TB/month: FREE (first 12 months)
- After: ~$0.085/GB
- Estimated: $0-5/month

**Lambda:**
- First 1M requests: FREE
- First 400,000 GB-seconds: FREE
- Estimated: $0-2/month

**API Gateway:**
- First 1M requests: FREE
- Estimated: $0-1/month

**Bedrock (Claude Haiku):**
- Input: $0.25 per 1M tokens
- Output: $1.25 per 1M tokens
- Estimated: $5-20/month (depends on usage)

**Total Estimated:** $5-30/month

---

## Security Features

### S3
- ✅ Public read-only access
- ✅ Bucket policy configured
- ✅ No public write access
- ✅ Versioning available

### CloudFront
- ✅ HTTPS enforced
- ✅ AWS Shield Standard (DDoS protection)
- ✅ Origin access control
- ✅ Geo-restriction capable

### Lambda
- ✅ IAM role with minimal permissions
- ✅ VPC isolation (optional)
- ✅ Environment variables encrypted
- ✅ CloudWatch logging

### API Gateway
- ✅ HTTPS only
- ✅ Rate limiting
- ✅ API keys (optional)
- ✅ Request validation

---

## Monitoring & Logs

### CloudWatch Logs
- Lambda execution logs
- API Gateway access logs
- CloudFront access logs (optional)

### CloudWatch Metrics
- Lambda invocations
- API Gateway requests
- CloudFront requests
- S3 bucket metrics

---

## Scalability

### Auto-Scaling Components
- **Lambda:** Scales to 1000 concurrent executions
- **API Gateway:** Handles 10,000 requests/second
- **CloudFront:** Unlimited bandwidth
- **S3:** Unlimited storage

### Performance
- **CloudFront:** <100ms latency globally
- **Lambda:** Cold start ~1-2 seconds, warm ~100ms
- **Bedrock:** Response time ~2-3 seconds

---

## Backup & Disaster Recovery

### S3 Versioning
- Enabled for web app files
- Can restore previous versions
- Protects against accidental deletion

### Multi-Region
- CloudFront: Global distribution
- S3: Can replicate to other regions
- Lambda: Can deploy to multiple regions

---

## Summary

**Web App Hosting:**
- S3 (Storage) → CloudFront (CDN) → Users

**Backend API:**
- Mobile App → API Gateway → Lambda → Bedrock → Response

**All in AWS Region:** us-east-1 (N. Virginia)  
**Global Delivery:** CloudFront edge locations worldwide

---

*Last Updated: March 8, 2026*
