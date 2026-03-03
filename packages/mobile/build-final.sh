#!/bin/bash

echo "🚀 RuralConnect AI - Final Build Script (Expo SDK 49)"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from packages/mobile/"
    exit 1
fi

# Step 1: Clean
echo "🧹 Step 1: Cleaning previous builds..."
rm -rf node_modules
rm -f package-lock.json
npm cache clean --force
echo "✅ Cleaned"
echo ""

# Step 2: Install dependencies
echo "📦 Step 2: Installing dependencies (Expo SDK 49)..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Error: npm install failed"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Step 3: Verify configuration
echo "🔍 Step 3: Verifying configuration..."
npx expo-doctor
echo ""

# Step 4: Show versions
echo "📋 Step 4: Installed versions:"
echo "- Expo SDK: $(npm list expo --depth=0 | grep expo@)"
echo "- React Native: $(npm list react-native --depth=0 | grep react-native@)"
echo "- React: $(npm list react --depth=0 | grep react@)"
echo ""

# Step 5: Commit reminder
echo "💾 Step 5: Commit changes"
echo "Run these commands:"
echo "  git add ."
echo "  git commit -m \"fix: use Expo SDK 49 for stable Android build\""
echo ""

# Step 6: Build command
echo "🏗️  Step 6: Ready to build!"
echo "Run this command to start the EAS build:"
echo "  eas build --platform android --profile preview"
echo ""
echo "⏱️  Expected build time: 12-18 minutes"
echo "📱 You will get an APK file that you can install on your Android device"
echo ""
echo "✅ Setup complete! Follow the steps above to build your app."
