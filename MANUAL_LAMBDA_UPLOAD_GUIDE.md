# Manual Lambda Upload Guide

Since AWS CLI can't access the Lambda function, follow these steps to upload manually through the AWS Console:

## Step 1: Locate Your Deployment Package

The deployment package is ready at:
```
packages/backend/lambda-ai-deployment.zip
```

Size: 3.4MB

## Step 2: Upload to Lambda Function

1. **Go to AWS Lambda Console**
   - Open: https://console.aws.amazon.com/lambda
   - Region: N. Virginia (us-east-1)

2. **Select Your Function**
   - Click on `ruralconnect-ai`

3. **Upload the ZIP File**
   - Scroll down to "Code source" section
   - Click "Upload from" dropdown
   - Select ".zip file"
   - Click "Upload"
   - Browse and select: `packages/backend/lambda-ai-deployment.zip`
   - Click "Save"

4. **Wait for Upload**
   - The upload will take a few seconds (3.4MB file)
   - You'll see "Successfully updated the function ruralconnect-ai"

## Step 3: Configure Handler

After upload, update the handler:

1. Scroll to "Runtime settings" section
2. Click "Edit"
3. Set Handler to: `index.handler`
4. Click "Save"

## Step 4: Configure Environment Variables (Optional)

If you want to customize Bedrock settings:

1. Go to "Configuration" tab
2. Click "Environment variables"
3. Click "Edit"
4. Add these (optional):
   - `BEDROCK_REGION` = `us-east-1`
   - `BEDROCK_MAX_TOKENS` = `4096`
   - `BEDROCK_TEMPERATURE` = `0.7`

## Step 5: Verify Bedrock Permissions

Make sure the Lambda execution role has Bedrock access:

1. Go to "Configuration" tab
2. Click "Permissions"
3. Click on the "Execution role" link (opens IAM)
4. Click "Add permissions" → "Attach policies"
5. Search for: `AmazonBedrockFullAccess`
6. Select it and click "Add permissions"

## Step 6: Configure API Gateway Trigger

Now connect the Lambda to your API Gateway:

1. In Lambda function page, click "Add trigger"
2. Select "API Gateway"
3. Choose "Use existing API" if you have one, or "Create new API"
4. API type: REST API
5. Security: Open (or API key if you prefer)
6. Click "Add"

**OR** if you already have API Gateway `q5hy2fwp3i`:

1. Go to API Gateway Console
2. Find your API (ID: q5hy2fwp3i)
3. Create resource: `/api/v1/ai`
4. Create method: `POST` on `/api/v1/ai/invoke`
5. Integration type: Lambda Function
6. Lambda function: `ruralconnect-ai`
7. Click "Save"
8. Deploy API to your stage

## Step 7: Test the Function

Test directly in Lambda Console:

1. Go to "Test" tab
2. Create new test event
3. Event name: `test-ai-invoke`
4. Use this JSON:

```json
{
  "httpMethod": "POST",
  "body": "{\"modelId\":\"anthropic.claude-3-haiku-20240307-v1:0\",\"prompt\":\"Say hello in one sentence\",\"systemPrompt\":\"You are a helpful assistant\"}"
}
```

5. Click "Test"
6. Check the response - should see AI-generated text

## Step 8: Request Bedrock Model Access

If you haven't already:

1. Go to AWS Bedrock Console
2. Click "Model access" in left sidebar
3. Click "Request model access"
4. Select:
   - ✅ Claude 3 Sonnet
   - ✅ Claude 3 Haiku
5. Click "Request model access"
6. Wait for approval (usually instant)

## Step 9: Test from Mobile App

Once everything is configured:

1. Rebuild mobile app:
   ```bash
   cd packages/mobile
   npx expo run:android
   ```

2. Test AI features:
   - Soil Analysis
   - Crop Recommendation
   - Health Assessment

3. Check logs - should see:
   ```
   ✅ [Bedrock] PRIMARY model succeeded!
   ✅ [Bedrock] Response length: XXX characters
   ```

## Troubleshooting

### If Lambda test fails:

**Error: "Missing Authentication Token"**
- API Gateway not configured correctly
- Check trigger configuration

**Error: "AccessDeniedException"**
- Bedrock permissions missing
- Add `AmazonBedrockFullAccess` to execution role

**Error: "ModelNotReadyException"**
- Bedrock model access not granted
- Request access in Bedrock Console

**Error: "ThrottlingException"**
- Too many requests
- Wait a few seconds and try again

### If mobile app still shows fallback:

1. Check API Gateway URL matches: `https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com`
2. Check endpoint path: `/api/v1/ai/invoke`
3. Check Lambda logs in CloudWatch
4. Test Lambda function directly first

## What's in the Deployment Package?

The ZIP file contains:

```
index.js                          # Main Lambda handler
services/bedrock/
  ├── client.js                   # Bedrock client
  ├── service.js                  # Bedrock service
  ├── cache.js                    # Response caching
  └── index.js                    # Exports
node_modules/                     # AWS SDK dependencies
  ├── @aws-sdk/client-bedrock-runtime/
  ├── @aws-sdk/client-cloudwatch/
  └── ... (all dependencies)
package.json                      # Package metadata
```

## Expected Behavior

**Before Upload:**
- Mobile app calls API → 403 error → Static fallback

**After Upload:**
- Mobile app calls API → 200 success → Real AI response

## Next Steps

After successful upload and testing:
- ✅ Phase 1 complete!
- Move to Phase 3: Real Authentication
- Or Phase 4: Free APIs Integration

---

Need help with any step? Let me know!
