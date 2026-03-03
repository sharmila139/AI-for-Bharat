# AWS Bedrock Setup Guide

## Prerequisites
- AWS Account with admin access
- AWS CLI configured

## Step 1: Enable Bedrock Service

1. **Open AWS Console**
   - Go to https://console.aws.amazon.com/bedrock/

2. **Select Region**
   - Make sure you're in `us-east-1` (N. Virginia)
   - Bedrock is available in limited regions

3. **Request Model Access**
   - Click "Model access" in the left sidebar
   - Click "Manage model access" button

## Step 2: Request Access to Models

### Required Models:

#### 1. Claude 3 Sonnet (Primary AI Model)
- **Model ID:** `anthropic.claude-3-sonnet-20240229-v1:0`
- **Provider:** Anthropic
- **Use Case:** Primary AI for all intelligent features
- **Action:** Check the box next to "Claude 3 Sonnet"

#### 2. Titan Text Express (Fallback Model)
- **Model ID:** `amazon.titan-text-express-v1`
- **Provider:** Amazon
- **Use Case:** Fallback when Claude is unavailable
- **Action:** Check the box next to "Titan Text Express"

### Request Process:
1. Select both models
2. Click "Request model access" button
3. Review and accept the End User License Agreements (EULAs)
4. Click "Submit"

## Step 3: Wait for Approval

- **Claude 3 Sonnet:** Usually instant approval
- **Titan Text:** Usually instant approval
- **Status:** Check "Model access" page for "Access granted" status

## Step 4: Verify Access

Run this command to verify:

```bash
aws bedrock list-foundation-models --region us-east-1 --query 'modelSummaries[?contains(modelId, `claude-3-sonnet`) || contains(modelId, `titan-text`)].{ModelId:modelId, Status:modelStatus}'
```

Expected output:
```json
[
    {
        "ModelId": "anthropic.claude-3-sonnet-20240229-v1:0",
        "Status": "ACTIVE"
    },
    {
        "ModelId": "amazon.titan-text-express-v1",
        "Status": "ACTIVE"
    }
]
```

## Step 5: Test Bedrock Access

Test with AWS CLI:

```bash
aws bedrock-runtime invoke-model \
    --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
    --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}' \
    --region us-east-1 \
    /tmp/response.json

cat /tmp/response.json
```

## Troubleshooting

### Issue: "Access Denied" Error
**Solution:** 
- Verify model access is granted in Bedrock console
- Check IAM permissions include `bedrock:InvokeModel`
- Ensure you're in the correct region (us-east-1)

### Issue: "Model Not Found"
**Solution:**
- Double-check model ID spelling
- Verify model is available in your region
- Wait a few minutes after requesting access

### Issue: "Throttling" Error
**Solution:**
- Bedrock has rate limits
- Implement exponential backoff in code (already done in Lambda)
- Request quota increase if needed

## Pricing

### Claude 3 Sonnet
- **Input:** $0.003 per 1K tokens (~750 words)
- **Output:** $0.015 per 1K tokens (~750 words)

### Titan Text Express
- **Input:** $0.0008 per 1K tokens
- **Output:** $0.0016 per 1K tokens

### Example Costs:
- 1000 API calls with avg 500 tokens each: ~$10-15/month
- Light usage (100 calls/day): ~$5-10/month
- Heavy usage (1000 calls/day): ~$50-100/month

## Alternative: Use Without Bedrock

If you can't enable Bedrock, the Lambda function has fallback logic:

1. **Rule-based responses:** Uses predefined data from S3
2. **No AI features:** But all other functionality works
3. **Update Lambda:** Set environment variable `DISABLE_BEDROCK=true`

## Security Best Practices

1. **IAM Permissions:** Only grant `bedrock:InvokeModel` to Lambda role
2. **Model Access:** Only enable models you need
3. **Rate Limiting:** Implement in application layer
4. **Cost Monitoring:** Set up CloudWatch alarms for Bedrock costs
5. **Input Validation:** Sanitize all user inputs before sending to Bedrock

## Next Steps

After enabling Bedrock:
1. Run the deployment script: `./deploy-complete-backend.sh`
2. Test the API endpoints
3. Verify AI responses are working
4. Monitor costs in AWS Cost Explorer

## Support

- **AWS Bedrock Documentation:** https://docs.aws.amazon.com/bedrock/
- **Anthropic Claude Docs:** https://docs.anthropic.com/claude/docs
- **AWS Support:** Open a support ticket if access is denied

---

**Status Checklist:**
- [ ] Bedrock service enabled in us-east-1
- [ ] Claude 3 Sonnet access granted
- [ ] Titan Text Express access granted
- [ ] IAM permissions updated
- [ ] Test API call successful
- [ ] Lambda function deployed
- [ ] Frontend connected to backend
