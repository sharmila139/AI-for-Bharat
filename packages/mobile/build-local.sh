#!/bin/bash

# RuralConnect AI - Local Android Build Script
# This script builds the Android APK locally

set -e  # Exit on error

echo "🚀 Building RuralConnect AI Android APK locally..."
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from packages/mobile directory"
    exit 1
fi

# Step 1: Install dependencies
echo -e "${BLUE}📦 Step 1: Installing dependencies...${NC}"
npm install
echo ""

# Step 2: Generate native Android project
echo -e "${BLUE}🔧 Step 2: Generating native Android project with Expo...${NC}"
npx expo prebuild --platform android --clean
echo ""

# Step 3: Build the APK
echo -e "${BLUE}🏗️  Step 3: Building release APK...${NC}"
cd android
./gradlew assembleRelease
cd ..
echo ""

# Step 4: Show results
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""
echo "📱 APK files are located at:"
echo ""

# List all generated APKs
if [ -d "android/app/build/outputs/apk/release" ]; then
    for apk in android/app/build/outputs/apk/release/*.apk; do
        if [ -f "$apk" ]; then
            SIZE=$(du -h "$apk" | cut -f1)
            echo "  • $(basename "$apk") ($SIZE)"
        fi
    done
fi

echo ""
echo "📲 To install on your device:"
echo "  1. Connect your Android device via USB"
echo "  2. Enable USB debugging on your device"
echo "  3. Run: adb install android/app/build/outputs/apk/release/app-arm64-v8a-release.apk"
echo ""
echo "Or copy the APK to your device and install manually."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
