# RuralConnect AI - Android APK Build Guide

## Prerequisites

1. **Node.js**: v18.0.0 or higher (currently using v24.6.0 ✓)
2. **EAS CLI**: Installed globally (currently v18.0.6 ✓)
3. **Expo Account**: Required for EAS Build

## Setup Steps

### 1. Install Dependencies

```bash
# From the mobile package directory
cd packages/mobile
npm install
# or
yarn install
```

### 2. Create Required Assets

You need to create the following image assets in `packages/mobile/assets/`:

- `icon.png` - App icon (1024x1024px)
- `adaptive-icon.png` - Android adaptive icon (1024x1024px)
- `splash.png` - Splash screen image (1284x2778px)
- `favicon.png` - Web favicon (48x48px)

**Quick Solution**: Use placeholder images or generate them using:
```bash
# Install expo-cli if not already installed
npm install -g expo-cli

# Generate default assets
npx expo-cli init-assets
```

Or create simple placeholder images:
```bash
# Create a simple colored square as placeholder (requires ImageMagick)
convert -size 1024x1024 xc:#4CAF50 assets/icon.png
convert -size 1024x1024 xc:#4CAF50 assets/adaptive-icon.png
convert -size 1284x2778 xc:#4CAF50 assets/splash.png
convert -size 48x48 xc:#4CAF50 assets/favicon.png
```

### 3. Configure EAS Project

```bash
# Login to Expo account
eas login

# Configure the project (this will create/update eas.json)
eas build:configure
```

When prompted:
- Select "Android" platform
- Choose "Generate new keystore"

### 4. Update app.json with Project ID

After running `eas build:configure`, update the `projectId` in `packages/mobile/app.json`:

```json
"extra": {
  "eas": {
    "projectId": "your-actual-project-id"
  }
}
```

## Building the APK

### Option 1: Preview Build (Recommended for Testing)

```bash
# Build APK for testing
eas build --platform android --profile preview
```

This will:
- Build an APK (not AAB)
- Use internal distribution
- Be installable directly on Android devices

### Option 2: Production Build

```bash
# Build production APK
eas build --platform android --profile production
```

### Option 3: Local Build (if you have Android SDK)

```bash
# Build locally instead of on EAS servers
eas build --platform android --profile preview --local
```

## Build Profiles

The `eas.json` file contains three build profiles:

1. **development**: Debug build with development client
2. **preview**: Release build as APK for testing
3. **production**: Production-ready APK

## Download and Install APK

After the build completes:

1. EAS will provide a download link
2. Download the APK file
3. Transfer to your Android device
4. Enable "Install from Unknown Sources" in Android settings
5. Install the APK

## Troubleshooting

### Issue: Missing Assets Error

**Solution**: Create the required image assets (see Step 2 above)

### Issue: "No project ID found"

**Solution**: Run `eas build:configure` and update `app.json` with the project ID

### Issue: Build fails with "Gradle error"

**Solution**: 
```bash
# Clean the Android build
cd packages/mobile/android
./gradlew clean
cd ..
```

### Issue: "Expo SDK version mismatch"

**Solution**: Ensure all Expo packages match the SDK version (55.0.4):
```bash
npx expo install --fix
```

### Issue: Out of memory during build

**Solution**: Add to `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
```

## Package Version Information

Current versions:
- React Native: 0.72.6
- Expo SDK: 55.0.4
- Node: v24.6.0
- EAS CLI: 18.0.6

## Alternative: Direct Android Build (Without EAS)

If you prefer not to use EAS Build:

```bash
# Ensure Android SDK is installed and configured
# Set ANDROID_HOME environment variable

# Build debug APK
cd packages/mobile/android
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# APK location:
# Debug: android/app/build/outputs/apk/debug/app-debug.apk
# Release: android/app/build/outputs/apk/release/app-release.apk
```

## Next Steps

1. Create the required asset images
2. Run `eas build:configure` to set up your project
3. Run `eas build --platform android --profile preview`
4. Download and test the APK

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android App Signing](https://docs.expo.dev/app-signing/app-credentials/)
- [Expo Asset Guide](https://docs.expo.dev/guides/assets/)
