# App Size Optimization Guide

## Overview

This document outlines the optimization strategies implemented to keep the RuralConnect AI mobile app under 50MB initial download size.

## Target

- **Initial Download Size**: < 50MB
- **Platform**: Android (primary focus)
- **Device Support**: Low-end devices with 1GB RAM minimum

## Optimization Strategies Implemented

### 1. Hermes JavaScript Engine

**Status**: ✅ Enabled by default in React Native 0.72+

**Benefits**:
- Reduced app size (smaller bytecode)
- Faster startup time
- Lower memory usage

**Configuration**: Already configured in `android/gradle.properties`:
```properties
hermesEnabled=true
```

### 2. ProGuard Minification

**Status**: ✅ Enabled for release builds

**Benefits**:
- Minifies Java bytecode
- Removes unused code
- Obfuscates code for security

**Configuration**: `android/app/build.gradle`
```gradle
def enableProguardInReleaseBuilds = true

buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
}
```

**ProGuard Rules**: See `android/app/proguard-rules.pro` for keep rules

### 3. App Bundle Splitting (ABI Splits)

**Status**: ✅ Enabled

**Benefits**:
- Generates separate APKs for different CPU architectures
- Users only download the APK for their device architecture
- Reduces download size by 30-40%

**Configuration**: `android/app/build.gradle`
```gradle
splits {
    abi {
        reset()
        enable true
        universalApk false
        include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
    }
}
```

**Supported Architectures**:
- `armeabi-v7a`: 32-bit ARM (most common for low-end devices)
- `arm64-v8a`: 64-bit ARM (modern devices)
- `x86`: 32-bit Intel (emulators)
- `x86_64`: 64-bit Intel (emulators)

### 4. Image and Asset Optimization

**Recommendations**:

1. **Image Compression**:
   - Use WebP format for images (smaller than PNG/JPG)
   - Compress images to < 500KB before bundling
   - Use appropriate resolutions (@1x, @2x, @3x)

2. **Asset Management**:
   - Store large assets (videos, datasets) on CDN
   - Download on-demand rather than bundling
   - Use progressive loading for images

3. **Icon Optimization**:
   - Use vector icons (react-native-vector-icons) instead of image files
   - Minimize custom icon sets

### 5. Dependency Management

**Current Dependencies**: Minimal and essential only

**Best Practices**:
- Audit dependencies regularly: `npm ls --depth=0`
- Remove unused dependencies
- Use tree-shaking compatible libraries
- Avoid large libraries when smaller alternatives exist

**Example Audit**:
```bash
cd packages/mobile
npm ls --depth=0
```

### 6. Code Splitting and Lazy Loading

**Recommendations**:

1. **Module Lazy Loading**:
   - Load feature modules on-demand
   - Use React.lazy() for screen components
   - Implement code splitting for large features

2. **Dynamic Imports**:
```typescript
// Instead of:
import HeavyComponent from './HeavyComponent';

// Use:
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
```

### 7. Offline Content Strategy

**Approach**: Download on-demand, not bundled

1. **Initial Bundle**:
   - Core UI components
   - Essential offline data (< 5MB)
   - Critical first-aid protocols

2. **On-Demand Downloads**:
   - Educational videos
   - Knowledge base articles
   - Weather data
   - Market prices

3. **User Control**:
   - Let users choose what to download
   - Provide storage management UI
   - Clear cache options

### 8. Build Configuration

**Metro Bundler Optimization**: `metro.config.js`

```javascript
module.exports = {
  transformer: {
    minifierConfig: {
      keep_classnames: false,
      keep_fnames: false,
      mangle: {
        keep_classnames: false,
        keep_fnames: false,
      },
    },
  },
};
```

## Measuring App Size

### Development Build

```bash
cd packages/mobile/android
./gradlew assembleRelease
```

Check size:
```bash
ls -lh app/build/outputs/apk/release/
```

### App Bundle (for Play Store)

```bash
cd packages/mobile/android
./gradlew bundleRelease
```

Check size:
```bash
ls -lh app/build/outputs/bundle/release/
```

### Analyze APK

Use Android Studio APK Analyzer:
1. Build > Analyze APK
2. Select the APK file
3. Review size breakdown by component

Or use command line:
```bash
# Install bundletool
brew install bundletool  # macOS
# or download from https://github.com/google/bundletool

# Generate APKs from bundle
bundletool build-apks --bundle=app-release.aab --output=app.apks

# Get size estimate
bundletool get-size total --apks=app.apks
```

## Size Breakdown Targets

| Component | Target Size | Notes |
|-----------|-------------|-------|
| Native Code | < 15MB | React Native, Realm, native modules |
| JavaScript Bundle | < 5MB | Minified and compressed |
| Assets (Images, Fonts) | < 3MB | Optimized images, minimal fonts |
| Resources | < 2MB | XML layouts, strings |
| **Total (per architecture)** | **< 25MB** | Uncompressed APK size |
| **Download Size** | **< 15MB** | Compressed (Play Store) |

## Verification Checklist

- [x] Hermes enabled
- [x] ProGuard enabled for release builds
- [x] Resource shrinking enabled
- [x] ABI splits configured
- [x] ProGuard rules defined
- [ ] Images optimized (WebP format)
- [ ] Unused dependencies removed
- [ ] Large assets moved to CDN
- [ ] Code splitting implemented
- [ ] APK size measured and verified < 50MB

## Continuous Monitoring

### CI/CD Integration

Add size check to GitHub Actions:

```yaml
- name: Build Release APK
  run: |
    cd packages/mobile/android
    ./gradlew assembleRelease

- name: Check APK Size
  run: |
    APK_SIZE=$(stat -f%z packages/mobile/android/app/build/outputs/apk/release/app-armeabi-v7a-release.apk)
    MAX_SIZE=$((50 * 1024 * 1024))  # 50MB in bytes
    if [ $APK_SIZE -gt $MAX_SIZE ]; then
      echo "APK size ($APK_SIZE bytes) exceeds 50MB limit"
      exit 1
    fi
    echo "APK size: $(($APK_SIZE / 1024 / 1024))MB - OK"
```

### Regular Audits

1. **Weekly**: Check dependency sizes
2. **Before Release**: Full APK analysis
3. **After Adding Features**: Measure size impact

## Troubleshooting

### APK Too Large

1. **Identify Large Components**:
   - Use APK Analyzer to find largest files
   - Check for duplicate dependencies
   - Look for unoptimized images

2. **Common Issues**:
   - Multiple versions of same library
   - Uncompressed images
   - Debug symbols in release build
   - Unused native libraries

3. **Solutions**:
   - Remove duplicate dependencies
   - Optimize/compress assets
   - Enable ProGuard and resource shrinking
   - Use ABI splits

### Build Errors with ProGuard

1. Check ProGuard rules in `proguard-rules.pro`
2. Add keep rules for libraries causing issues
3. Test thoroughly after enabling ProGuard

## Future Optimizations

1. **Dynamic Feature Modules**: Split app into installable modules
2. **On-Demand Resources**: Download resources as needed
3. **WebP Animation**: Replace GIF animations
4. **Font Subsetting**: Include only used characters
5. **Native Module Optimization**: Remove unused native features

## References

- [React Native Performance](https://reactnative.dev/docs/performance)
- [Android App Bundle](https://developer.android.com/guide/app-bundle)
- [ProGuard](https://www.guardsquare.com/manual/home)
- [Hermes Engine](https://hermesengine.dev/)

## Summary

With these optimizations, the RuralConnect AI app should comfortably stay under the 50MB target:

- **Hermes**: Reduces JS bundle size by ~30%
- **ProGuard**: Reduces native code by ~20%
- **ABI Splits**: Reduces download by ~35%
- **Asset Optimization**: Saves 5-10MB

**Expected Final Size**: 15-25MB per architecture (compressed download)
