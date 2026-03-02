# Quick Build Guide

## TL;DR - Build Android APK Now

```bash
cd packages/mobile
./build-local.sh
```

Wait 10-15 minutes. Your APK will be at:
```
android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

## Install on Device

```bash
adb install android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

## What Was Fixed

1. ✅ Locked React Native to 0.74.5 (was trying to use 0.76.6)
2. ✅ Updated all dependencies to Expo SDK 54 compatible versions
3. ✅ Build script now cleans Gradle Kotlin DSL caches
4. ✅ Using --no-daemon flag to avoid cache corruption

## If Build Fails

### "No space left on device"
Free up disk space (need ~5GB), then retry.

### "Unrecognised filter type"
```bash
node generate-assets.js
```

### Gradle cache errors
```bash
rm -rf ~/.gradle/caches/*/kotlin-dsl
./build-local.sh
```

## EAS Build (Cloud)

Your config is correct. Free tier resets in 29 days. Then:
```bash
eas build --platform android --profile preview
```

## Need Help?

See `LOCAL_BUILD_FINAL.md` for detailed troubleshooting.
