# RuralConnect AI - Quick Start Guide

## 🚀 Get Your System Running in 15 Minutes

### Prerequisites
- AWS Account with admin access
- AWS CLI configured locally
- Terminal/Command line access

---

## Step 1: Enable AWS Bedrock (5 minutes)

### Via AWS Console:
1. Go to https://console.aws.amazon.com/bedrock/
2. Make sure region is **us-east-1**
3. Click **"Model access"** in left sidebar
4. Click **"Manage model access"** button
5. Check these boxes:
   - ☑️ **Claude 3 Sonnet** (by Anthropic)
   - ☑️ **Titan Text Express** (by Amazon)
6. Click **"Request model access"**
7. Accept EULAs and click **"Submit"**
8. Wait for "Access granted" status (usually instant)

### Verify Access:
```bash
aws bedrock list-foundation-models --region us-east-1 \
  --query 'modelSummaries[?contains(modelId, `claude-3-sonnet`)].modelId'
```

Expected: `["anthropic.claude-3-sonnet-20240229-v1:0"]`

---

## Step 2: Deploy Backend (5 minutes)

### Run Deployment Script:
```bash
# Make script executable
chmod +x deploy-complete-backend.sh

# Run deployment
./deploy-complete-backend.sh
```

### What This Does:
1. ✅ Creates S3 bucket for data storage
2. ✅ Uploads remedies and crops data
3. ✅ Updates IAM permissions for Bedrock + S3
4. ✅ Packages Lambda function with dependencies
5. ✅ Deploys Lambda with AI integration
6. ✅ Configures environment variables

### Expected Output:
```
🎉 DEPLOYMENT SUCCESSFUL!

Backend API:
https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com

Features Enabled:
  ✅ AWS Bedrock AI (Claude 3 Sonnet + Titan)
  ✅ S3 Data Storage
  ✅ Crop Recommendations
  ✅ Soil Analysis
  ✅ Symptom Checker
  ✅ Natural Remedies Database
  ✅ Grievance Reporting
```

---

## Step 3: Test the System (5 minutes)

### Test 1: Health Check
```bash
curl https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/
```

Expected: `{"success":true,"message":"RuralConnect AI API",...}`

### Test 2: AI Crop Recommendations
```bash
curl -X POST https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/agriculture/crop-recommendations \
  -H "Content-Type: application/json" \
  -d '{"soilType":"Loam","season":"Kharif","location":"Punjab"}'
```

Expected: AI-generated crop recommendations with suitability scores

### Test 3: AI Symptom Checker
```bash
curl -X POST https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/health/symptom-check \
  -H "Content-Type: application/json" \
  -d '{"symptoms":"fever and cough for 2 days"}'
```

Expected: AI analysis with severity, conditions, and first aid steps

### Test 4: Grievance Submission
```bash
curl -X POST https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/infrastructure/grievance \
  -H "Content-Type: application/json" \
  -d '{"description":"Street light not working","location":"Main Road"}'
```

Expected: Ticket ID and AI categorization

### Test 5: Get Remedies
```bash
curl https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/health/remedies
```

Expected: List of natural remedies from database

---

## Step 4: Open the Web App

### Frontend URL:
**http://ruralconnect-web-032761628276.s3-website-us-east-1.amazonaws.com**

### Try These Features:
1. **Agriculture Module**
   - Click "Get Recommendations" button
   - See AI-powered crop suggestions

2. **Health Module**
   - Enter symptoms in text box
   - Click "Check Symptoms"
   - View AI analysis and remedies

3. **Infrastructure Module**
   - Enter grievance description
   - Click "Submit Grievance"
   - Get ticket ID

---

## Troubleshooting

### Issue: Bedrock "Access Denied"
**Fix:** Enable Bedrock models in AWS Console (Step 1)

### Issue: "Data not found"
**Fix:** Re-run deployment script to upload data files

### Issue: Slow responses
**Fix:** First request is slow (cold start), subsequent requests are fast

### Issue: Frontend buttons don't work
**Fix:** Check browser console for errors, verify API endpoint

---

## What's Working Now

✅ **Frontend:** Beautiful React app with all 4 modules
✅ **Backend:** Lambda with Bedrock AI integration
✅ **Data:** S3 storage with remedies, crops, grievances
✅ **AI:** Claude 3 Sonnet for intelligent responses
✅ **Fallback:** Titan Text + rule-based logic
✅ **APIs:** All endpoints functional

---

## Cost Estimate

- **Lambda:** $0 (Free Tier)
- **API Gateway:** $0 (Free Tier)
- **S3:** $0 (Free Tier)
- **Bedrock:** ~$15-20/month (moderate usage)

**Total:** ~$15-20/month

---

## Next Steps

### Expand Data (Optional)
Add more entries to data files:
- `data/remedies.json` - Add 295 more remedies
- `data/crops.json` - Add 95 more crops

Then re-upload:
```bash
aws s3 cp data/remedies.json s3://ruralconnect-data-032761628276/
aws s3 cp data/crops.json s3://ruralconnect-data-032761628276/
```

### Monitor Usage
```bash
# View Lambda logs
aws logs tail /aws/lambda/ruralconnect-api --follow

# Check Bedrock usage
aws ce get-cost-and-usage \
  --time-period Start=2024-03-01,End=2024-03-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://bedrock-filter.json
```

### Add Features
- User authentication (AWS Cognito)
- Real-time updates (WebSockets)
- Analytics dashboard
- Admin panel

---

## Support

**Documentation:**
- `COMPLETE_SYSTEM_READY.md` - Full system documentation
- `ENABLE_BEDROCK_GUIDE.md` - Detailed Bedrock setup
- `BACKEND_IMPLEMENTATION_PLAN.md` - Architecture details

**Logs:**
- CloudWatch Logs: `/aws/lambda/ruralconnect-api`
- API Gateway Logs: Check API Gateway console

**Help:**
- Check CloudWatch logs for errors
- Verify IAM permissions
- Test with curl commands
- Review AWS Bedrock console

---

## Success Checklist

- [ ] Bedrock models enabled (Claude + Titan)
- [ ] Deployment script completed successfully
- [ ] Health check returns success
- [ ] Crop recommendations work (AI response)
- [ ] Symptom checker works (AI response)
- [ ] Grievance submission works
- [ ] Frontend loads and buttons work
- [ ] All API calls return data

---

**Time to Complete:** 15 minutes
**Difficulty:** Easy
**Result:** Fully functional AI-powered system

**Let's go! 🚀**
