#!/bin/bash

set -e

echo "🚀 Building RuralConnect AI Android APK locally..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check disk space
AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
echo "💾 Available disk space: $AVAILABLE_SPACE"
echo ""

# Step 1: Clean everything
echo "🧹 Step 1: Cleaning previous builds..."
rm -rf node_modules
rm -rf android
rm -rf ~/.gradle/caches
echo "  ✓ Cleaned node_modules, android directory, and all Gradle caches"
echo ""

# Step 2: Install dependencies
echo "📦 Step 2: Installing dependencies..."
npm install
echo ""

# Step 3: Generate assets
echo "🎨 Step 3: Generating assets..."
node generate-assets.js
echo ""

# Step 4: Run prebuild with clean flag
echo "🔧 Step 4: Generating native Android project with Expo..."
npx expo prebuild --platform android --clean
echo ""

# Step 5: Verify Gradle wrapper
echo "🔍 Step 5: Verifying Gradle setup..."
if [ ! -f "android/gradlew" ]; then
  echo "${RED}✗ Gradle wrapper not found!${NC}"
  exit 1
fi
chmod +x android/gradlew
echo "  ✓ Gradle wrapper is ready"
echo ""

# Step 6: Build the APK
echo "🏗️  Step 6: Building release APK..."
cd android
./gradlew clean
./gradlew assembleRelease --no-daemon --warning-mode all
cd ..
echo ""

# Step 7: Locate the APK
echo "📱 Step 7: Locating APK..."
APK_PATH=$(find android/app/build/outputs/apk/release -name "*.apk" | head -n 1)

if [ -z "$APK_PATH" ]; then
  echo "${RED}✗ APK not found!${NC}"
  exit 1
fi

echo "${GREEN}✅ Build successful!${NC}"
echo ""
echo "📦 APK Location:"
echo "   $APK_PATH"
echo ""
echo "📲 To install on your device:"
echo "   adb install $APK_PATH"
echo ""
