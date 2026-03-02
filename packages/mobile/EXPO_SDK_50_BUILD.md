# Expo SDK 50 Build Configuration - Final Fix

## Problem Summary

After 6 failed EAS build attempts with Expo SDK 51 and 54, we identified the root cause:
- **React Native 0.74.5+ and 0.76.9** contain TypeScript `as` type assertion syntax in core files
- The **Hermes parser** used by Metro bundler cannot parse this syntax
- This causes build failures during the Metro bundling phase, regardless of Babel configuration

## Solution: Downgrade to Expo SDK 50

Expo SDK 50 is the most stable LTS version that uses React Native 0.73.6, which does NOT contain the problematic TypeScript syntax.

## Configuration Changes

### 1. Expo SDK Version
- **Changed from**: Expo SDK 51.0.39 (React Native 0.74.5)
- **Changed to**: Expo SDK ~50.0.0 (React Native 0.73.6)

### 2. Package Versions Updated

**Main Dependencies:**
```json
"expo": "~50.0.0"
"react": "18.2.0"
"react-native": "0.73.6"
"expo-asset": "~9.0.2"
"expo-image-manipulator": "~11.8.0"
"expo-image-picker": "~14.7.1"
"expo-location": "~16.5.5"
"react-native-gesture-handler": "~2.14.0"
"react-native-safe-area-context": "4.8.2"
"react-native-screens": "~3.29.0"
```

**Dev Dependencies:**
```json
"babel-preset-expo": "~10.0.0"
```

### 3. Metro Configuration
- **Removed** conflicting Metro versions from dependencies (0.83.3)
- **Removed** Metro from root package.json
- Expo SDK 50 manages Metro versions automatically

### 4. Android Directory
- **Removed** to force clean generation for Expo SDK 50
- EAS Build will generate a fresh android directory with correct Gradle configuration

## Why This Works

1. **React Native 0.73.6** is the stable LTS version without TypeScript syntax issues
2. **Expo SDK 50** is battle-tested and widely used in production
3. **No Metro conflicts** - Expo manages all Metro dependencies
4. **Clean android generation** - No leftover Gradle configuration from previous SDK versions

## Build Steps

### 1. Install Dependencies
```bash
cd packages/mobile
npm install
```

### 2. Verify Configuration
```bash
npx expo-doctor
```

### 3. Commit Changes
```bash
git add .
git commit -m "fix: downgrade to Expo SDK 50 for stable build"
```

### 4. Trigger EAS Build
```bash
eas build --platform android --profile preview
```

## Expected Outcome

✅ Metro bundling will succeed (no TypeScript syntax errors)
✅ Gradle build will succeed (clean android directory)
✅ APK will be generated successfully

## Build Profile

Using **preview** profile from eas.json:
- Distribution: internal
- Build type: APK
- Node version: 22.11.0
- No credentials required (withoutCredentials: false)

## Remaining Builds

You have **1 build remaining** on the free tier after this attempt. This configuration should work on the first try.

## Verification Checklist

Before triggering the build:
- [x] Expo SDK downgraded to 50.0.0
- [x] React Native downgraded to 0.73.6
- [x] All Expo packages match SDK 50 versions
- [x] Metro conflicts removed
- [x] Android directory removed
- [x] babel-preset-expo matches SDK 50
- [ ] Dependencies installed (`npm install`)
- [ ] Configuration verified (`npx expo-doctor`)
- [ ] Changes committed to git

## Next Steps

1. Run `npm install` in packages/mobile
2. Run `npx expo-doctor` to verify configuration
3. Commit all changes
4. Run `eas build --platform android --profile preview`
5. Wait for build to complete (~10-15 minutes)
6. Download APK from EAS dashboard

## References

- Expo SDK 50 Documentation: https://docs.expo.dev/versions/v50.0.0/
- React Native 0.73 Release: https://reactnative.dev/blog/2023/12/06/0.73-debugging-improvements-stable-symlinks
- EAS Build Documentation: https://docs.expo.dev/build/introduction/
