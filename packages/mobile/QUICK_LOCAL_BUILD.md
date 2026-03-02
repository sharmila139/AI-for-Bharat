# Quick Local Build Guide

Get your Android APK in 3 steps!

## Step 1: Set Up Environment (One-time setup)

Run the setup script:
```bash
cd packages/mobile
./setup-env.sh
```

Then reload your shell:
```bash
source ~/.zshrc  # or source ~/.bash_profile
```

Verify everything is ready:
```bash
./check-build-env.sh
```

## Step 2: Build the APK

Run the build script:
```bash
./build-local.sh
```

This will:
- Install dependencies
- Generate native Android project
- Build the release APK

⏱️ First build takes 10-20 minutes. Subsequent builds are faster (2-5 minutes).

## Step 3: Install on Your Device

### Option A: Via USB (Recommended)
1. Connect your Android device via USB
2. Enable USB debugging on your device (Settings → Developer Options → USB Debugging)
3. Run:
```bash
adb install android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

### Option B: Manual Install
1. Copy the APK to your device:
   - Location: `android/app/build/outputs/apk/release/app-arm64-v8a-release.apk`
2. Open the APK file on your device
3. Allow installation from unknown sources if prompted
4. Install the app

## Troubleshooting

### "Android SDK not found"
You need to install Android Studio first:
1. Download from: https://developer.android.com/studio
2. Install and run Android Studio
3. Go through the setup wizard
4. Install Android SDK when prompted
5. Run `./setup-env.sh` again

### "JAVA_HOME not set" after running setup
Reload your shell:
```bash
source ~/.zshrc
```

### Build fails with Gradle errors
Clean and rebuild:
```bash
cd android
./gradlew clean
./gradlew assembleRelease
cd ..
```

### "No space left on device"
Clean old builds:
```bash
cd android
./gradlew clean
cd ..
```

## What APK Should I Use?

The build generates multiple APKs for different CPU architectures:

- **app-arm64-v8a-release.apk** ← Use this for most modern Android devices (2015+)
- app-armeabi-v7a-release.apk ← For older 32-bit ARM devices
- app-x86_64-release.apk ← For Intel-based Android devices (rare)
- app-x86-release.apk ← For older Intel-based devices (rare)

When in doubt, use **arm64-v8a**.

## Need More Help?

See `LOCAL_BUILD_GUIDE.md` for detailed instructions and troubleshooting.
