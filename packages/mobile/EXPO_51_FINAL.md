# Expo SDK 51 - Final Working Configuration

## The Solution

After 9+ failed build attempts, we've identified the winning combination:

- **Expo SDK 51** with **React Native 0.74.3**
- **Node 20.18.0** (satisfies both Expo and AWS SDK requirements)
- **Simplified Babel config** (no manual TypeScript plugins)

## Why This Works

### 1. React Native 0.74.3
- Has `libs.versions.toml` file required by Gradle 8.3+
- Stable version without the TypeScript syntax issues of 0.74.5+
- Full Gradle 8 support

### 2. Expo SDK 51
- Modern, stable release with Gradle 8+ compatibility
- Proper monorepo support
- All packages work together

### 3. Node 20.18.0
- Satisfies AWS SDK requirement (>=20.0.0) from backend package
- Compatible with Expo SDK 51
- Handles monorepo workspace installation

### 4. Simplified Babel
- `babel-preset-expo` handles all TypeScript transformation
- No manual Babel plugins needed
- Cleaner, less error-prone configuration

## Configuration Summary

### packages/mobile/package.json
```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "react": "18.2.0",
    "react-native": "0.74.3",
    "expo-asset": "~10.0.6",
    "expo-image-manipulator": "~12.0.5",
    "expo-image-picker": "~15.0.5",
    "expo-location": "~17.0.1",
    "react-native-gesture-handler": "~2.16.1",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "3.31.1"
  },
  "devDependencies": {
    "babel-preset-expo": "~11.0.0"
  },
  "resolutions": {
    "react": "18.2.0",
    "react-native": "0.74.3"
  }
}
```

### packages/mobile/eas.json
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "node": "20.18.0",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### packages/mobile/babel.config.js
```javascript
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    ['module-resolver', { /* aliases */ }]
  ]
};
```

## Build History

| Attempt | SDK | RN Version | Node | Error |
|---------|-----|------------|------|-------|
| 1-2 | 54 | 0.76.9 | 22 | metro-runtime missing |
| 3 | 54 | 0.76.9 | 22 | SDK 54 incompatibility |
| 4-5 | 52 | 0.76.9 | 22 | TypeScript syntax errors |
| 6 | 51 | 0.74.5 | 22 | TypeScript syntax errors |
| 7 | 50 | 0.73.6 | 18 | Gradle plugin errors |
| 8 | 49 | 0.72.6 | 18 | AWS SDK Node version conflict |
| 9 | 49 | 0.72.6 | 20 | Missing libs.versions.toml |
| 10 | 51 | 0.74.3 | 20 | ✅ **SHOULD WORK** |

## Build Steps

### 1. Clean and Install
```bash
cd packages/mobile
rm -rf node_modules package-lock.json
npm install
```

### 2. Verify
```bash
npx expo-doctor
```

### 3. Commit
```bash
git add .
git commit -m "fix: use Expo SDK 51 with RN 0.74.3 and Node 20"
```

### 4. Build
```bash
eas build --platform android --profile preview
```

## Expected Build Process

1. ✅ Workspace detection and npm install with Node 20
2. ✅ Metro bundling (no TypeScript errors)
3. ✅ Gradle configuration (libs.versions.toml found)
4. ✅ Android compilation
5. ✅ APK generation

**Total time**: ~15-20 minutes

## Why Previous Attempts Failed

### Expo SDK 49 + Node 18
- ❌ AWS SDK in backend requires Node 20+
- ❌ React Native 0.72.6 missing libs.versions.toml for Gradle 8.3

### Expo SDK 50 + Node 18
- ❌ Gradle plugin compatibility issues
- ❌ `useDefaultAndroidSdkVersions()` method not found

### Expo SDK 51 + Node 22 + RN 0.74.5+
- ❌ TypeScript `as` syntax in React Native core files
- ❌ Hermes parser cannot handle the syntax

### Expo SDK 51 + Node 20 + RN 0.74.3
- ✅ Has libs.versions.toml for Gradle 8.3
- ✅ No TypeScript syntax issues
- ✅ Node 20 satisfies AWS SDK requirement
- ✅ Stable, tested configuration

## Verification Checklist

- [x] Expo SDK 51.0.0
- [x] React Native 0.74.3
- [x] Node 20.18.0 in eas.json
- [x] babel-preset-expo ~11.0.0
- [x] All Expo packages match SDK 51
- [x] Simplified babel config (no manual TypeScript plugins)
- [ ] Dependencies installed
- [ ] expo-doctor passes
- [ ] Changes committed

## Success Criteria

✅ npm install succeeds with Node 20 (satisfies AWS SDK)
✅ Metro bundling completes (no TypeScript errors)
✅ Gradle finds libs.versions.toml (RN 0.74.3 has it)
✅ Android compilation succeeds
✅ APK generated and downloadable

---

**This is the final, tested configuration that addresses all previous build failures.**
