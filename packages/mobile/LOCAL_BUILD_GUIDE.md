# Local Android Build Guide for RuralConnect AI

This guide will help you build the Android APK locally on your macOS machine without using EAS Build.

## Prerequisites

### 1. Install Java Development Kit (JDK)
You need JDK 17 for React Native 0.76.6:

```bash
# Install using Homebrew
brew install openjdk@17

# Add to your shell profile (~/.zshrc or ~/.bash_profile)
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH=$JAVA_HOME/bin:$PATH

# Reload your shell
source ~/.zshrc  # or source ~/.bash_profile
```

Verify installation:
```bash
java -version  # Should show version 17.x.x
```

### 2. Install Android Studio and SDK

1. Download Android Studio from: https://developer.android.com/studio
2. Install Android Studio
3. Open Android Studio and go through the setup wizard
4. Install the following via SDK Manager (Tools → SDK Manager):
   - Android SDK Platform 34 (or the version matching your targetSdkVersion)
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
   - Android SDK Platform-Tools
   - Android Emulator (optional, for testing)

### 3. Set up Android Environment Variables

Add to your `~/.zshrc` or `~/.bash_profile`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Reload your shell:
```bash
source ~/.zshrc  # or source ~/.bash_profile
```

Verify installation:
```bash
adb --version
```

## Build Steps

### 1. Navigate to Mobile Package
```bash
cd packages/mobile
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Pre-build with Expo (Generate Native Projects)
Since you're using Expo, you need to generate the native Android project first:

```bash
npx expo prebuild --platform android
```

This will:
- Generate/update the `android` directory with all necessary native code
- Configure the project based on your `app.json`
- Set up all Expo modules

### 4. Build the APK

#### Option A: Build Release APK (Recommended for Testing)
```bash
cd android
./gradlew assembleRelease
```

The APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

#### Option B: Build Debug APK (Faster, for Development)
```bash
cd android
./gradlew assembleDebug
```

The APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 5. Install APK on Your Device

#### Via USB:
1. Enable USB debugging on your Android device
2. Connect your device via USB
3. Run:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

#### Via File Transfer:
1. Copy the APK file to your device
2. Open the APK file on your device to install
3. You may need to enable "Install from Unknown Sources" in your device settings

## Troubleshooting

### Issue: "SDK location not found"
Create `android/local.properties`:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```
Replace `YOUR_USERNAME` with your actual username.

### Issue: Gradle build fails
Try cleaning the build:
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### Issue: "JAVA_HOME is not set"
Make sure you've set JAVA_HOME correctly:
```bash
echo $JAVA_HOME  # Should show path to JDK 17
```

### Issue: Metro bundler conflicts
If you have Metro running, stop it before building:
```bash
# Kill any running Metro processes
pkill -f "react-native"
```

### Issue: Out of memory during build
Add to `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

## Quick Build Script

For convenience, here's a one-command build:

```bash
# From packages/mobile directory
npx expo prebuild --platform android && cd android && ./gradlew assembleRelease && cd ..
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Build Variants

The project is configured to generate multiple APKs for different CPU architectures:
- `app-armeabi-v7a-release.apk` (32-bit ARM)
- `app-arm64-v8a-release.apk` (64-bit ARM, most modern devices)
- `app-x86-release.apk` (32-bit Intel)
- `app-x86_64-release.apk` (64-bit Intel)

For most Android devices, use the `arm64-v8a` variant.

## Next Steps

After successful build:
1. Install the APK on your Android device
2. Test all features
3. Check for any runtime errors
4. Monitor performance

## Notes

- The first build will take longer (10-20 minutes) as Gradle downloads dependencies
- Subsequent builds will be faster (2-5 minutes)
- Release builds are optimized and minified with ProGuard
- Debug builds are larger but build faster
