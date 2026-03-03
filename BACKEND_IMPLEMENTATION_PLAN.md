# RuralConnect AI - Complete Backend Implementation Plan

## Current State
- ✅ Beautiful React frontend deployed
- ❌ Backend has only mock data
- ❌ No real AI integration
- ❌ No database for storing data
- ❌ Buttons don't trigger real functionality

## Goal
Build a complete, working backend with:
1. AWS Bedrock for AI features
2. S3 for data storage (JSON files as database)
3. Real API endpoints for all modules
4. Fallback mechanisms for reliability

---

## Architecture

```
Frontend (React on S3)
    ↓
API Gateway
    ↓
Lambda Function (Node.js)
    ↓
├── AWS Bedrock (AI Models)
│   ├── Claude 3 Sonnet (primary)
│   └── Titan Text (fallback)
├── S3 Buckets (Data Storage)
│   ├── remedies.json
│   ├── crops.json
│   ├── grievances.json
│   └── education-content.json
└── External APIs
    ├── Weather API
    └── Market Prices
```

---

## Implementation Phases

### Phase 1: Data Storage Setup (S3 as Database)
**Why S3?** Simple, serverless, no database management needed

**Data Files to Create:**
1. `data/remedies.json` - 300+ natural remedies
2. `data/crops.json` - Crop information and recommendations
3. `data/symptoms.json` - Symptom-to-remedy mappings
4. `data/grievances.json` - Store submitted grievances
5. `data/education-content.json` - Learning materials

**Actions:**
- Create S3 bucket: `ruralconnect-data-032761628276`
- Upload JSON data files
- Set up Lambda IAM permissions to read/write S3

### Phase 2: AWS Bedrock Integration
**Models to Use:**
1. **Primary:** Claude 3 Sonnet (`anthropic.claude-3-sonnet-20240229-v1:0`)
2. **Fallback:** Titan Text (`amazon.titan-text-express-v1`)

**Use Cases:**
- **Agriculture:** Crop recommendations based on soil/climate
- **Health:** Symptom analysis and first aid guidance
- **Education:** Content recommendations
- **Infrastructure:** Grievance categorization

**Actions:**
- Enable Bedrock in AWS account
- Request model access
- Create Bedrock client in Lambda
- Implement fallback logic

### Phase 3: Lambda Function Implementation
**Structure:**
```
lambda-handler.js
├── /handlers
│   ├── agriculture.js
│   ├── health.js
│   ├── education.js
│   └── infrastructure.js
├── /services
│   ├── bedrock.js
│   ├── s3-data.js
│   └── fallback.js
└── /utils
    ├── validators.js
    └── responses.js
```

**Endpoints to Implement:**

#### Agriculture Module
- `POST /api/agriculture/crop-recommendations`
  - Input: soil type, location, season
  - AI: Bedrock analyzes and recommends crops
  - Data: Read from crops.json
  
- `POST /api/agriculture/soil-analysis`
  - Input: soil photo (base64) or parameters
  - AI: Bedrock analyzes soil health
  - Output: Health score, recommendations

#### Health Module
- `POST /api/health/symptom-check`
  - Input: symptoms description
  - AI: Bedrock analyzes severity and provides guidance
  - Data: Read from symptoms.json
  
- `GET /api/health/remedies`
  - Input: condition/search query
  - Data: Read from remedies.json
  - AI: Bedrock ranks by relevance

- `POST /api/health/remedy-details`
  - Input: remedy ID
  - Data: Read from remedies.json

#### Education Module
- `GET /api/education/subjects`
  - Data: Read from education-content.json
  
- `POST /api/education/recommend`
  - Input: student profile, current progress
  - AI: Bedrock recommends next topics

#### Infrastructure Module
- `POST /api/infrastructure/grievance`
  - Input: description, category, location
  - AI: Bedrock categorizes and assigns priority
  - Data: Write to grievances.json in S3
  
- `GET /api/infrastructure/grievances`
  - Data: Read from grievances.json
  
- `GET /api/infrastructure/projects`
  - Data: Read from projects.json

### Phase 4: Data Population
**Create realistic data files:**

1. **remedies.json** (300+ entries)
```json
[
  {
    "id": "REM001",
    "name": "Ginger Tea",
    "localNames": {"hi": "अदरक की चाय", "ta": "இஞ்சி தேநீர்"},
    "condition": "Cold & Cough",
    "efficacy": 92,
    "preparation": "Boil fresh ginger...",
    "benefits": ["Reduces inflammation", "Soothes throat"],
    "contraindications": ["Pregnancy", "Blood thinners"],
    "ageRestrictions": "Safe for 2+ years"
  }
]
```

2. **crops.json** (100+ crops)
```json
[
  {
    "id": "CROP001",
    "name": "Rice",
    "season": "Kharif",
    "soilTypes": ["Clay", "Loam"],
    "waterRequirement": "High",
    "duration": "120-150 days",
    "expectedYield": "4-5 tons/hectare",
    "marketPrice": "₹2000-2500/quintal"
  }
]
```

3. **symptoms.json** (500+ symptom mappings)
4. **grievances.json** (initially empty, populated by users)
5. **education-content.json** (subjects, topics, videos)

### Phase 5: Error Handling & Fallbacks
**Fallback Strategy:**
1. Try Bedrock Claude 3 Sonnet
2. If fails → Try Bedrock Titan
3. If fails → Use rule-based logic
4. If fails → Return cached/default response

**Error Handling:**
- Validate all inputs
- Sanitize user data
- Rate limiting
- Timeout handling (30s max)
- Graceful degradation

---

## Implementation Steps

### Step 1: Create Data Files (Local)
```bash
mkdir -p data
# Create JSON files with sample data
```

### Step 2: Create S3 Data Bucket
```bash
aws s3 mb s3://ruralconnect-data-032761628276
aws s3 sync data/ s3://ruralconnect-data-032761628276/
```

### Step 3: Enable Bedrock
```bash
# Via AWS Console:
# 1. Go to Bedrock service
# 2. Request model access for:
#    - Claude 3 Sonnet
#    - Titan Text Express
```

### Step 4: Update Lambda Function
```bash
# Create new Lambda handler with:
# - Bedrock integration
# - S3 data access
# - All API endpoints
# - Error handling
```

### Step 5: Update IAM Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "s3:GetObject",
        "s3:PutObject",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

### Step 6: Deploy & Test
```bash
# Package and deploy Lambda
# Test each endpoint
# Update frontend if needed
```

---

## Cost Estimation (AWS Free Tier)

### Lambda
- 1M requests/month free
- 400,000 GB-seconds free
- **Cost:** $0 (within free tier)

### S3
- 5GB storage free
- 20,000 GET requests free
- 2,000 PUT requests free
- **Cost:** $0 (within free tier)

### Bedrock
- Pay per token
- Claude 3 Sonnet: $0.003/1K input tokens, $0.015/1K output tokens
- Estimated: ~$5-10/month for moderate usage

### API Gateway
- 1M requests/month free
- **Cost:** $0 (within free tier)

**Total Estimated Cost:** $5-10/month (mostly Bedrock)

---

## Timeline

- **Step 1-2 (Data Files & S3):** 1-2 hours
- **Step 3 (Bedrock Setup):** 30 minutes
- **Step 4 (Lambda Implementation):** 3-4 hours
- **Step 5 (IAM & Permissions):** 30 minutes
- **Step 6 (Deploy & Test):** 1 hour

**Total:** 6-8 hours for complete implementation

---

## Success Criteria

✅ All frontend buttons trigger real API calls
✅ Bedrock AI provides intelligent responses
✅ Data persists in S3
✅ Fallback mechanisms work
✅ Error handling is robust
✅ Response times < 3 seconds
✅ No crashes or 500 errors

---

## Next Steps

1. **Approve this plan**
2. **Start with Phase 1:** Create data files
3. **Enable Bedrock:** Request model access
4. **Implement Lambda:** Build complete backend
5. **Test thoroughly:** Verify all endpoints
6. **Deploy:** Update production Lambda

Ready to proceed?
