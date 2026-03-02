# Quick Start: Build Android APK

## TL;DR - Fast Track to APK

```bash
# 1. Install dependencies
cd packages/mobile
yarn install

# 2. Create placeholder assets (or use your own)
node create-placeholder-assets.js
# Then convert the SVG files to PNG or use online tools

# 3. Login to Expo
eas login

# 4. Configure EAS (first time only)
eas build:configure

# 5. Update app.json with your project ID (shown after step 4)

# 6. Build APK
eas build --platform android --profile preview

# 7. Download APK from the link provided and install on Android device
```

## What Was Fixed

✅ Created `eas.json` with build configurations
✅ Updated `app.json` with complete Expo config
✅ Added missing Expo dependencies
✅ Added build scripts to package.json
✅ Created setup and asset generation scripts

## Required Before Building

### 1. Asset Files (REQUIRED)

You need these images in `packages/mobile/assets/`:

| File | Size | Purpose |
|------|------|---------|
| icon.png | 1024x1024 | App icon |
| adaptive-icon.png | 1024x1024 | Android adaptive icon |
| splash.png | 1284x2778 | Splash screen |
| favicon.png | 48x48 | Web favicon |

**Quick Solutions:**

**Option A**: Use the asset generator script
```bash
node create-placeholder-assets.js
# Then convert SVG to PNG using online converter
```

**Option B**: Download free icons
- Visit https://www.flaticon.com/ or https://icons8.com/
- Download 1024x1024 PNG images
- Rename and place in assets/ folder

**Option C**: Use online app icon generator
- Visit https://www.appicon.co/
- Upload your logo/image
- Download the generated assets

### 2. EAS Project ID (REQUIRED)

After running `eas build:configure`, you'll get a project ID.

Update `packages/mobile/app.json`:
```json
"extra": {
  "eas": {
    "projectId": "paste-your-project-id-here"
  }
}
```

## Build Commands

### For Testing (Recommended)
```bash
eas build --platform android --profile preview
```
- Builds APK file
- Can be installed directly on devices
- No Google Play Store needed

### For Production
```bash
eas build --platform android --profile production
```
- Production-ready build
- Optimized and minified

## After Build Completes

1. EAS will show a build URL
2. Click the URL or run `eas build:list`
3. Download the APK file
4. Transfer to Android device via:
   - USB cable
   - Email
   - Cloud storage (Google Drive, Dropbox)
   - Direct download on device
5. Enable "Install from Unknown Sources" on Android
6. Install the APK

## Alternative: Build Locally

If you have Android SDK installed:

```bash
cd packages/mobile/android
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

## Troubleshooting

### "No project ID found"
Run `eas build:configure` and update app.json

### "Missing assets"
Create the required PNG files in assets/ directory

### "Build failed - Gradle error"
```bash
cd android
./gradlew clean
cd ..
```

### "Expo SDK version mismatch"
```bash
npx expo install --fix
```

## Current Setup

- ✅ React Native: 0.72.6
- ✅ Expo SDK: 55.0.4
- ✅ EAS CLI: 18.0.6
- ✅ Node: v24.6.0
- ✅ Build configs: Ready
- ⚠️ Assets: Need to be created
- ⚠️ EAS Project: Need to configure

## Need Help?

See detailed guides:
- `BUILD_GUIDE.md` - Comprehensive build instructions
- `ANDROID_BUILD_FIXES.md` - What was fixed and why
- `setup-build.sh` - Automated setup script

## Estimated Time

- First time setup: 10-15 minutes
- Asset creation: 5-10 minutes
- Build time (on EAS): 10-20 minutes
- Total: ~30-45 minutes

## Ready to Build?

1. ✅ Dependencies installed?
2. ✅ Assets created?
3. ✅ EAS configured?
4. ✅ Project ID updated?

If yes to all, run:
```bash
eas build --platform android --profile preview
```

🎉 Your APK will be ready soon!
