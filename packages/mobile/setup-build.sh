#!/bin/bash

# RuralConnect AI - Build Setup Script
# This script helps prepare the project for Android APK build

set -e

echo "🚀 RuralConnect AI - Android Build Setup"
echo "========================================"
echo ""

# Check if we're in the mobile directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from packages/mobile directory"
    exit 1
fi

# Check Node version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "   Node version: $NODE_VERSION"

# Check if EAS CLI is installed
echo ""
echo "🔧 Checking EAS CLI..."
if ! command -v eas &> /dev/null; then
    echo "   EAS CLI not found. Installing..."
    npm install -g eas-cli
else
    EAS_VERSION=$(eas --version)
    echo "   EAS CLI version: $EAS_VERSION ✓"
fi

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
yarn install || npm install

# Check for required assets
echo ""
echo "🎨 Checking for required assets..."
ASSETS_MISSING=false

if [ ! -f "assets/icon.png" ]; then
    echo "   ⚠️  Missing: assets/icon.png"
    ASSETS_MISSING=true
fi

if [ ! -f "assets/adaptive-icon.png" ]; then
    echo "   ⚠️  Missing: assets/adaptive-icon.png"
    ASSETS_MISSING=true
fi

if [ ! -f "assets/splash.png" ]; then
    echo "   ⚠️  Missing: assets/splash.png"
    ASSETS_MISSING=true
fi

if [ ! -f "assets/favicon.png" ]; then
    echo "   ⚠️  Missing: assets/favicon.png"
    ASSETS_MISSING=true
fi

if [ "$ASSETS_MISSING" = true ]; then
    echo ""
    echo "⚠️  Some asset files are missing!"
    echo "   You can create placeholder assets or use your own images."
    echo "   See BUILD_GUIDE.md for details."
    echo ""
    read -p "   Create placeholder assets? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   Creating placeholder assets..."
        mkdir -p assets
        
        # Check if ImageMagick is available
        if command -v convert &> /dev/null; then
            convert -size 1024x1024 xc:#4CAF50 -gravity center -pointsize 200 -fill white -annotate +0+0 "RC" assets/icon.png
            convert -size 1024x1024 xc:#4CAF50 -gravity center -pointsize 200 -fill white -annotate +0+0 "RC" assets/adaptive-icon.png
            convert -size 1284x2778 xc:#4CAF50 -gravity center -pointsize 300 -fill white -annotate +0+0 "RuralConnect\nAI" assets/splash.png
            convert -size 48x48 xc:#4CAF50 assets/favicon.png
            echo "   ✓ Placeholder assets created!"
        else
            echo "   ⚠️  ImageMagick not found. Please create assets manually."
            echo "   See BUILD_GUIDE.md for requirements."
        fi
    fi
else
    echo "   ✓ All required assets found!"
fi

# Check EAS configuration
echo ""
echo "🔐 Checking EAS configuration..."
if ! eas whoami &> /dev/null; then
    echo "   Not logged in to Expo."
    echo "   Please run: eas login"
else
    EAS_USER=$(eas whoami)
    echo "   Logged in as: $EAS_USER ✓"
fi

# Summary
echo ""
echo "========================================"
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Ensure all assets are in place (see assets/ directory)"
echo "2. Run: eas build:configure (if not done already)"
echo "3. Update app.json with your EAS project ID"
echo "4. Run: eas build --platform android --profile preview"
echo ""
echo "For detailed instructions, see BUILD_GUIDE.md"
echo "========================================"
