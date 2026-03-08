# AWS Bedrock AI Testing Guide

## Overview
This guide explains how to test the AWS Bedrock AI integration and understand whether the app is using the actual AI models or fallback responses.

---

## Enhanced Logging

I've added detailed logging to the Bedrock service. You'll see these log messages in the Metro bundler console:

### Log Indicators

**When AI is invoked:**
```
🤖 [Bedrock] Invoking AI for use case: crop_recommendation
🤖 [Bedrock] Temperature: 0.7
```

**When trying PRIMARY model (Claude 3 Sonnet):**
```
🤖 [Bedrock] Attempting PRIMARY model: anthropic.claude-3-sonnet-20240229-v1:0
📡 [Bedrock] Calling API: https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/v1/ai/invoke
📡 [Bedrock] Model: anthropic.claude-3-sonnet-20240229-v1:0
📡 [Bedrock] API Response Status: 200
✅ [Bedrock] PRIMARY model succeeded!
✅ [Bedrock] Response length: 1234 characters
```

**When PRIMARY fails and trying FALLBACK model (Claude 3 Haiku):**
```
⚠️ [Bedrock] Primary model failed, trying fallback: [Error details]
🤖 [Bedrock] Attempting FALLBACK model: anthropic.claude-3-haiku-20240307-v1:0
📡 [Bedrock] Calling API: https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/v1/ai/invoke
📡 [Bedrock] Model: anthropic.claude-3-haiku-20240307-v1:0
📡 [Bedrock] API Response Status: 200
✅ [Bedrock] FALLBACK model succeeded!
✅ [Bedrock] Response length: 987 characters
```

**When ALL AI models fail (using static fallback):**
```
❌ [Bedrock] All AI models failed!
❌ [Bedrock] Primary error: [Error details]
❌ [Bedrock] Fallback error: [Error details]
🔄 [Bedrock] Using STATIC fallback response
🔄 [Bedrock] Generating static fallback for: crop_recommendation
🔄 [Bedrock] Static fallback generated (456 characters)
```

---

## How to Test

### 1. Test Crop Recommendation (Agriculture Module)

**Steps:**
1. Open the app in emulator
2. Navigate to **Agriculture** module
3. Tap on **Crop Recommendation**
4. Fill in the form with sample data:
   - Location: "Karnataka"
   - Soil Type: "Red Soil"
   - Season: "Monsoon"
   - Farm Size: "5 acres"
   - Irrigation: Yes
5. Tap **Get Recommendations**
6. **Watch the Metro bundler console** for logs

**Expected Logs (Without Backend):**
```
🤖 [Bedrock] Invoking AI for use case: crop_recommendation
🤖 [Bedrock] Temperature: 0.7
🤖 [Bedrock] Attempting PRIMARY model: anthropic.claude-3-sonnet-20240229-v1:0
📡 [Bedrock] Calling API: https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/v1/ai/invoke
📡 [Bedrock] API Response Status: 404 (or network error)
⚠️ [Bedrock] Primary model failed, trying fallback: TypeError: Network request failed
🤖 [Bedrock] Attempting FALLBACK model: anthropic.claude-3-haiku-20240307-v1:0
📡 [Bedrock] Calling API: https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/v1/ai/invoke
📡 [Bedrock] API Response Status: 404 (or network error)
❌ [Bedrock] All AI models failed!
🔄 [Bedrock] Using STATIC fallback response
🔄 [Bedrock] Generating static fallback for: crop_recommendation
🔄 [Bedrock] Static fallback generated (XXX characters)
```

**Expected Result in App:**
- You'll see crop recommendations (Rice, Cotton, Maize for Monsoon)
- These are rule-based fallback recommendations
- A note saying "These are general recommendations. Consult local agricultural experts."

---

### 2. Test Health Symptom Checker (Health Module)

**Steps:**
1. Navigate to **Health** module
2. Tap on **Symptom Checker**
3. Enter symptoms: "fever, headache, body pain"
4. Tap **Check Symptoms**
5. **Watch the Metro bundler console** for logs

**Expected Logs (Without Backend):**
```
🤖 [Bedrock] Invoking AI for use case: health_assessment
🤖 [Bedrock] Temperature: 0.5
🤖 [Bedrock] Attempting PRIMARY model: anthropic.claude-3-sonnet-20240229-v1:0
📡 [Bedrock] Calling API: https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/v1/ai/invoke
❌ [Bedrock] All AI models failed!
🔄 [Bedrock] Using STATIC fallback response
🔄 [Bedrock] Generating static fallback for: health_assessment
```

**Expected Result in App:**
- Generic health advice
- Message: "AI health assessment is temporarily unavailable"
- Advice to seek medical attention if severe
- Emergency number (108)

---

### 3. Test Grievance Classification (Infrastructure Module)

**Steps:**
1. Navigate to **Infrastructure** module
2. Tap on **Report Grievance**
3. Fill in:
   - Title: "Pothole on main road"
   - Description: "Large pothole causing accidents"
4. Submit
5. **Watch the Metro bundler console** for logs

**Expected Logs (Without Backend):**
```
🤖 [Bedrock] Invoking AI for use case: grievance_classification
🤖 [Bedrock] Temperature: 0.3
🤖 [Bedrock] Attempting PRIMARY model: anthropic.claude-3-sonnet-20240229-v1:0
❌ [Bedrock] All AI models failed!
🔄 [Bedrock] Using STATIC fallback response
🔄 [Bedrock] Generating static fallback for: grievance_classification
```

**Expected Result in App:**
- Grievance classified as "general" category
- Severity: "medium"
- Note: "AI classification is temporarily unavailable. Manual review required."

---

## Current Status

### Without Backend API

Since your backend API endpoint (`https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/v1/ai/invoke`) is not yet implemented, the app will:

1. ✅ Try to call the PRIMARY model (Claude 3 Sonnet)
2. ❌ Fail (404 or network error)
3. ✅ Try to call the FALLBACK model (Claude 3 Haiku)
4. ❌ Fail (404 or network error)
5. ✅ Use STATIC fallback responses (rule-based)

**You'll see these logs:**
- 🤖 Attempting PRIMARY model
- ⚠️ Primary model failed
- 🤖 Attempting FALLBACK model
- ❌ All AI models failed
- 🔄 Using STATIC fallback response

### With Backend API (Future)

When you implement the backend endpoint, you'll see:

1. ✅ Try PRIMARY model
2. ✅ SUCCESS! (if backend is working)
3. ✅ Get AI-generated response

**You'll see these logs:**
- 🤖 Attempting PRIMARY model
- 📡 API Response Status: 200
- ✅ PRIMARY model succeeded!
- ✅ Response length: XXXX characters

---

## How to Implement Backend Endpoint

To make the AI actually work, you need to create this endpoint in your backend:

**Endpoint:** `POST /api/v1/ai/invoke`

**Request Body:**
```json
{
  "modelId": "anthropic.claude-3-sonnet-20240229-v1:0",
  "prompt": "Your prompt here...",
  "systemPrompt": "System instructions...",
  "context": {},
  "temperature": 0.7,
  "maxTokens": 2048
}
```

**Response:**
```json
{
  "content": "AI generated response...",
  "usage": {
    "inputTokens": 123,
    "outputTokens": 456
  }
}
```

**Backend Implementation (AWS Lambda + Bedrock):**
```python
import boto3
import json

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

def lambda_handler(event, context):
    body = json.loads(event['body'])
    
    # Call AWS Bedrock
    response = bedrock.invoke_model(
        modelId=body['modelId'],
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": body['maxTokens'],
            "temperature": body['temperature'],
            "system": body['systemPrompt'],
            "messages": [
                {
                    "role": "user",
                    "content": body['prompt']
                }
            ]
        })
    )
    
    result = json.loads(response['body'].read())
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'content': result['content'][0]['text'],
            'usage': result['usage']
        })
    }
```

---

## Testing Checklist

- [ ] Open Metro bundler console
- [ ] Navigate to Agriculture → Crop Recommendation
- [ ] Fill form and submit
- [ ] Check console for Bedrock logs
- [ ] Verify you see "🤖 [Bedrock] Invoking AI"
- [ ] Verify you see "🔄 [Bedrock] Using STATIC fallback" (without backend)
- [ ] Check app shows fallback recommendations
- [ ] Test Health Symptom Checker
- [ ] Test Grievance Classification
- [ ] Verify all show appropriate fallback responses

---

## Summary

**Current Behavior (Without Backend):**
- ✅ AI integration code is working
- ✅ Fallback logic is working
- ✅ Static responses are being returned
- ❌ Actual AI models are not being called (backend not implemented)

**Logs You'll See:**
- 🤖 Attempting to call AI
- ❌ API calls failing (expected without backend)
- 🔄 Using static fallback responses

**To Enable Real AI:**
- Implement the `/api/v1/ai/invoke` endpoint in your backend
- Connect it to AWS Bedrock
- The app will automatically start using real AI!

---

## Quick Test Command

To see the logs clearly, you can filter them:

```bash
# In the Metro bundler terminal, look for lines containing "[Bedrock]"
```

Or use adb logcat:
```bash
adb logcat | grep -i bedrock
```

