# Android APK Build Checklist

Use this checklist to track your progress toward building the APK.

## ✅ Pre-Build Setup (Completed)

- [x] EAS CLI installed (v18.0.6)
- [x] Node.js installed (v24.6.0)
- [x] Dependencies installed
- [x] `eas.json` configured
- [x] `app.json` configured with Expo settings
- [x] Build scripts added to package.json
- [x] Android configuration verified
- [x] Documentation created

## 📋 Your Action Items

### Step 1: Create Asset Files

- [ ] Create `assets/icon.png` (1024x1024px)
- [ ] Create `assets/adaptive-icon.png` (1024x1024px)
- [ ] Create `assets/splash.png` (1284x2778px)
- [ ] Create `assets/favicon.png` (48x48px)

**How to do this:**

Option A - Use the generator:
```bash
node create-placeholder-assets.js
# Then convert SVG to PNG
```

Option B - Use online tool:
- Visit https://www.appicon.co/
- Upload your logo
- Download assets

Option C - Create manually:
- Use Figma, Photoshop, or GIMP
- Export at required sizes

### Step 2: Configure EAS

- [ ] Run `eas login` (create account if needed)
- [ ] Run `eas build:configure`
- [ ] Copy the project ID shown
- [ ] Update `app.json` with project ID:
  ```json
  "extra": {
    "eas": {
      "projectId": "paste-id-here"
    }
  }
  ```

### Step 3: Build APK

- [ ] Run `eas build --platform android --profile preview`
- [ ] Wait for build to complete (10-20 minutes)
- [ ] Download APK from provided link

### Step 4: Install on Android

- [ ] Transfer APK to Android device
- [ ] Enable "Install from Unknown Sources"
- [ ] Install APK
- [ ] Test the app

## 🎯 Build Commands Reference

```bash
# Preview build (for testing)
eas build --platform android --profile preview

# Production build (for release)
eas build --platform android --profile production

# Check build status
eas build:list

# View specific build
eas build:view [build-id]
```

## 📱 After Build

- [ ] APK downloaded
- [ ] Installed on test device
- [ ] App launches successfully
- [ ] Core features tested
- [ ] No critical bugs found

## 🐛 Troubleshooting

If you encounter issues, check:

1. [ ] All assets are PNG format (not SVG)
2. [ ] Project ID is updated in app.json
3. [ ] You're logged into EAS (`eas whoami`)
4. [ ] Build logs for specific errors (`eas build:view`)

## 📚 Help Resources

- `QUICK_START_BUILD.md` - Fast-track guide
- `BUILD_GUIDE.md` - Detailed instructions
- `BUILD_READY_SUMMARY.md` - What was fixed
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)

## ⏱️ Time Estimate

- [ ] Asset creation: 5-10 minutes
- [ ] EAS setup: 5 minutes
- [ ] Build time: 10-20 minutes
- [ ] Testing: 10-15 minutes

**Total: ~30-50 minutes**

## ✨ Success Criteria

You're done when:
- ✅ APK builds without errors
- ✅ APK installs on Android device
- ✅ App launches and runs
- ✅ No critical crashes

## 🎉 Next Steps After Success

Once you have a working APK:

1. Test on multiple Android devices
2. Gather user feedback
3. Fix any bugs found
4. Create production build
5. Consider publishing to Google Play Store

---

**Current Status:** Ready to build! Complete the action items above.

**Last Updated:** March 1, 2026
