# Build Mobile App - Quick Guide

## 🎯 What's Ready

✅ API configuration updated to production backend
✅ Services integrated with real backend
✅ Version updated to 1.1.0 (versionCode: 2)
✅ All dependencies in place
✅ Ready to build

---

## 🚀 Build Instructions

### Step 1: Navigate to Mobile Package
```bash
cd packages/mobile
```

### Step 2: Build APK
```bash
eas build --platform android --profile preview
```

This will:
- Upload your code to Expo servers
- Build the APK on their infrastructure
- Take approximately 10-15 minutes
- Provide a download link when complete

### Step 3: Monitor Build Progress
```bash
# Check build status
eas build:list

# Or visit Expo dashboard
# https://expo.dev/accounts/chinnu22/projects/ruralconnect-ai/builds
```

### Step 4: Download APK
Once build completes, you'll get a URL like:
```
https://expo.dev/accounts/chinnu22/projects/ruralconnect-ai/builds/[build-id]
```

Click the download button to get the APK file.

---

## 🧪 Test Before Building (Optional but Recommended)

### Option A: Test on Android Emulator
```bash
cd packages/mobile
npm start
# Then press 'a' to open in Android emulator
```

### Option B: Test on Physical Device
```bash
cd packages/mobile
npm start
# Scan QR code with Expo Go app
```

### What to Test
1. Open Health module → Try symptom checker
2. Open Infrastructure → Submit a test grievance
3. Check if loading states work
4. Check if error messages display
5. Test offline mode (turn off WiFi)

---

## 📱 After Build Completes

### 1. Download APK
Download from Expo dashboard or use the direct link provided

### 2. Install on Android Device
```bash
# Transfer APK to device
adb install path/to/app.apk

# Or share via cloud storage/email
```

### 3. Test on Real Device
- Install the APK
- Open the app
- Test all features
- Check performance
- Verify API calls work

### 4. Share with Users
- Upload to Google Drive
- Share download link
- Update landing page with new APK link

---

## 🔍 Troubleshooting

### Build Fails
```bash
# Check build logs
eas build:view [build-id]

# Common issues:
# - Missing dependencies: npm install
# - Invalid app.json: Check JSON syntax
# - EAS credentials: eas login
```

### App Crashes on Launch
- Check if all dependencies are installed
- Verify app.json configuration
- Check for TypeScript errors: `npm run tsc`

### API Calls Fail
- Verify backend is running
- Check API_BASE_URL in api-config.ts
- Test backend directly:
```bash
curl https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/health/remedies
```

---

## 📊 Build Configuration

**Current Settings** (from `eas.json`):
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

**App Version**:
- Version: 1.1.0
- Version Code: 2
- Package: com.ruralconnectai

---

## 🎉 What's New in v1.1.0

✅ Production API integration
✅ Real backend connectivity
✅ Symptom checker with AI
✅ Natural remedies database
✅ Grievance submission system
✅ Offline fallbacks
✅ Better error handling
✅ Improved loading states

---

## 📞 Quick Commands Reference

```bash
# Build APK
eas build --platform android --profile preview

# Check builds
eas build:list

# View specific build
eas build:view [build-id]

# Cancel build
eas build:cancel

# Login to EAS
eas login

# Check project status
eas project:info
```

---

## 🔗 Important Links

- **Expo Dashboard**: https://expo.dev/accounts/chinnu22/projects/ruralconnect-ai
- **Backend API**: https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com
- **Web App**: http://ruralconnect-web-032761628276.s3-website-us-east-1.amazonaws.com
- **Previous APK**: https://expo.dev/accounts/chinnu22/projects/ruralconnect-ai/builds/b36d0e44-bc7d-46d9-a65d-eb19eab973e7

---

**Ready to build?** Run: `cd packages/mobile && eas build --platform android --profile preview`
