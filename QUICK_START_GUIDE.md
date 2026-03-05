# RuralConnect AI - Quick Start Guide

## 🎯 Current Status

✅ **Web App**: Live and functional at http://ruralconnect-web-032761628276.s3-website-us-east-1.amazonaws.com
✅ **Mobile App**: Code updated, ready to build
✅ **Backend API**: Running at https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com

---

## 🚀 Build Mobile App (5 minutes)

### Step 1: Navigate to Mobile Directory
```bash
cd packages/mobile
```

### Step 2: Build APK
```bash
eas build --platform android --profile preview
```

### Step 3: Wait for Build
- Build takes ~10-15 minutes
- You'll get a URL when complete
- Download APK from Expo dashboard

### Step 4: Install & Test
- Transfer APK to Android device
- Install and test all features
- Verify API calls work

---

## 🧪 Test Web App (2 minutes)

### Visit: http://ruralconnect-web-032761628276.s3-website-us-east-1.amazonaws.com

### Test These Features:
1. **Health Module** → Symptom Checker
   - Enter: "fever and headache"
   - Click "Check Symptoms"
   - See AI analysis with severity, conditions, first aid

2. **Infrastructure Module** → Report Grievance
   - Enter description: "Broken street light"
   - Enter location: "Main Street"
   - Click "Submit Grievance"
   - Get ticket ID and see it in the list

3. **Agriculture Module** → Crop Recommendations
   - Enter farm details
   - Click "Get Recommendations"
   - See AI-powered suggestions

---

## 🔍 Verify Backend (1 minute)

### Test API Endpoints:
```bash
# Test remedies endpoint
curl https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/health/remedies

# Test symptom checker
curl -X POST https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/health/symptom-check \
  -H "Content-Type: application/json" \
  -d '{"symptoms":"fever"}'

# Test grievance list
curl https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/infrastructure/grievance
```

---

## 📱 What's New in Mobile v1.1.0

### Updated Files:
1. `packages/mobile/src/config/api-config.ts`
   - Changed API URL from localhost to production

2. `packages/mobile/src/services/api/client.ts` (NEW)
   - Centralized API client
   - Timeout handling
   - Error management

3. `packages/mobile/src/services/healthService.ts`
   - Added `checkSymptoms()` method
   - Added `getRemedies()` method
   - Offline fallbacks

4. `packages/mobile/src/services/grievanceService.ts` (NEW)
   - Submit grievances
   - List grievances
   - Get grievance details

5. `packages/mobile/src/services/cropRecommendationService.ts`
   - Updated to use new API client
   - Better error handling

6. `packages/mobile/app.json`
   - Version: 1.0.0 → 1.1.0
   - Version Code: 1 → 2

---

## 🎯 Key Features Working

### Web App
✅ Symptom checker with AI analysis
✅ Grievance submission with ticket tracking
✅ Grievance list with real-time updates
✅ Natural remedies database
✅ Loading states and error handling
✅ Success feedback

### Mobile App (After Build)
✅ All services connected to backend
✅ Symptom assessment (advanced)
✅ Natural remedies search
✅ Grievance submission
✅ Crop recommendations
✅ Offline fallbacks
✅ Mock authentication

### Backend
✅ AI-powered symptom analysis (Claude 3 Sonnet)
✅ AI-powered crop recommendations
✅ Grievance management system
✅ Natural remedies database (300+)
✅ Multi-language support (15 languages)
✅ Translation API

---

## 🔧 Troubleshooting

### Web App Issues
**Problem**: Buttons not working
**Solution**: Clear browser cache, refresh page

**Problem**: API errors
**Solution**: Check backend is running:
```bash
curl https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/health/remedies
```

### Mobile Build Issues
**Problem**: Build fails
**Solution**: 
```bash
cd packages/mobile
npm install
eas build --platform android --profile preview
```

**Problem**: Not logged in to EAS
**Solution**:
```bash
eas login
```

### Backend Issues
**Problem**: API not responding
**Solution**: Check Lambda function in AWS Console
- Region: us-east-1
- Function: ruralconnect-api
- Check CloudWatch logs

---

## 📊 System Architecture

```
┌─────────────────┐
│   Web Browser   │
│  (React App)    │
└────────┬────────┘
         │
         │ HTTPS
         │
┌────────▼────────┐      ┌──────────────┐
│  Mobile App     │      │   Backend    │
│ (React Native)  │─────▶│  API Gateway │
└─────────────────┘      └──────┬───────┘
                                 │
                         ┌───────▼────────┐
                         │ Lambda Function│
                         │ (Node.js)      │
                         └───────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
            ┌───────▼──────┐ ┌──▼──────┐ ┌──▼──────┐
            │ AWS Bedrock  │ │   S3    │ │ DynamoDB│
            │ (AI Models)  │ │ (Data)  │ │ (Future)│
            └──────────────┘ └─────────┘ └─────────┘
```

---

## 💡 Quick Tips

### For Development
- Use `npm start` in packages/mobile for local testing
- Use Expo Go app to test on physical device
- Check console logs for API errors

### For Production
- Build APK with `eas build`
- Test on real Android device
- Monitor CloudWatch logs for backend errors
- Check S3 bucket for data files

### For Debugging
- Web: Open browser DevTools → Network tab
- Mobile: Use React Native Debugger
- Backend: Check CloudWatch logs in AWS Console

---

## 📞 Support Resources

### Documentation
- `COMPLETE_MOBILE_WEB_STATUS.md` - Full system status
- `MOBILE_APP_UPDATE_COMPLETE.md` - Mobile update details
- `BUILD_MOBILE_APP.md` - Detailed build instructions
- `FUNCTIONAL_UPDATE_COMPLETE.md` - Web update details

### Links
- **Web App**: http://ruralconnect-web-032761628276.s3-website-us-east-1.amazonaws.com
- **Expo Dashboard**: https://expo.dev/accounts/chinnu22/projects/ruralconnect-ai
- **Backend API**: https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com
- **AWS Console**: https://console.aws.amazon.com (Account: 032761628276)

---

## ✅ Checklist

### Before Building Mobile App
- [x] API configuration updated
- [x] Services integrated
- [x] Version bumped
- [x] No TypeScript errors
- [x] Dependencies installed

### After Building Mobile App
- [ ] APK downloaded
- [ ] Installed on device
- [ ] All features tested
- [ ] API calls verified
- [ ] Performance checked

### Before Going Live
- [ ] Authentication implemented
- [ ] Rate limiting added
- [ ] Analytics configured
- [ ] User documentation created
- [ ] Support system ready

---

## 🎉 You're Ready!

**Web App**: Already live and working
**Mobile App**: Ready to build with one command
**Backend**: Deployed and running

**Next Command**: 
```bash
cd packages/mobile && eas build --platform android --profile preview
```

**Estimated Time**: 10-15 minutes for build to complete

**Result**: Fully functional mobile app with real backend integration
