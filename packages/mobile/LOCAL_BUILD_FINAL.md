# Local Android Build Guide - Final Version

## Current Configuration
- **Expo SDK**: 54.0.0
- **React Native**: 0.74.5 (locked)
- **Node**: 22.11.0
- **Gradle**: 8.8
- **Kotlin**: 2.0.21

## Prerequisites

1. **Android Studio** installed with:
   - Android SDK
   - Android SDK Platform-Tools
   - Android SDK Build-Tools

2. **Environment Variables** (run once):
   ```bash
   ./setup-env.sh
   source ~/.zshrc
   ```

3. **Verify Setup**:
   ```bash
   ./check-build-env.sh
   ```

## Build Steps

### Option 1: Automated Build (Recommended)
```bash
cd packages/mobile
chmod +x build-local.sh
./build-local.sh
```

This script will:
1. Clean all caches (node_modules, android, Gradle caches)
2. Install dependencies
3. Generate assets
4. Run expo prebuild
5. Build the release APK

### Option 2: Manual Build
```bash
cd packages/mobile

# 1. Clean everything
rm -rf node_modules android ~/.gradle/caches/*/kotlin-dsl

# 2. Install dependencies
npm install

# 3. Generate assets
node generate-assets.js

# 4. Generate Android project
npx expo prebuild --platform android --clean

# 5. Build APK
cd android
chmod +x gradlew
./gradlew clean
./gradlew assembleRelease --no-daemon
cd ..
```

## Finding Your APK

After a successful build, the APK will be at:
```
android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

Or find all APKs:
```bash
find android/app/build/outputs/apk/release -name "*.apk"
```

## Installing on Device

1. **Enable USB Debugging** on your Android device
2. **Connect via USB**
3. **Install**:
   ```bash
   adb install android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
   ```

## Troubleshooting

### Issue: "Unrecognised filter type" during prebuild
**Cause**: PNG assets have incompatible filter types
**Solution**: Regenerate assets with `node generate-assets.js`

### Issue: Gradle cache corruption
**Cause**: Corrupted Gradle metadata
**Solution**: 
```bash
rm -rf ~/.gradle/caches/*/kotlin-dsl
```

### Issue: "No space left on device"
**Check space**: `df -h .`
**Free space**: Delete unnecessary files, clear system caches

### Issue: React Native version mismatch
**Cause**: Expo trying to use newer RN version
**Solution**: The package.json now has `resolutions` field to lock RN to 0.74.5

### Issue: Kotlin compilation errors
**Cause**: Version mismatch
**Solution**: Using Kotlin 2.0.21 (configured in gradle.properties)

## EAS Build (Alternative)

Your EAS configuration is correct. Once your free tier resets (29 days), you can use:
```bash
eas build --platform android --profile preview
```

## Key Files Modified

1. `package.json` - Locked dependency versions, added resolutions
2. `build-local.sh` - Automated build script with cache cleaning
3. `generate-assets.js` - PNG generation without filter issues
4. `android/gradle.properties` - Kotlin version
5. `android/build.gradle` - Kotlin configuration

## Build Time

Expect the build to take:
- First build: 10-15 minutes
- Subsequent builds: 5-10 minutes

## Success Indicators

You'll see:
```
BUILD SUCCESSFUL in Xs
```

And the APK path will be displayed.
