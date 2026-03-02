#!/bin/bash

# RuralConnect AI - Local Build Environment Check Script
# This script checks if all prerequisites for local Android builds are installed

echo "🔍 Checking Local Android Build Environment..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if all checks pass
ALL_CHECKS_PASSED=true

# Check Node.js
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 18+"
    ALL_CHECKS_PASSED=false
fi
echo ""

# Check npm
echo "📦 Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm installed: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    ALL_CHECKS_PASSED=false
fi
echo ""

# Check Java
echo "☕ Checking Java..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo -e "${GREEN}✓${NC} Java installed: $JAVA_VERSION"
    
    # Check if JAVA_HOME is set
    if [ -z "$JAVA_HOME" ]; then
        echo -e "${YELLOW}⚠${NC} JAVA_HOME is not set. Add to ~/.zshrc:"
        echo "    export JAVA_HOME=\$(/usr/libexec/java_home -v 17)"
        ALL_CHECKS_PASSED=false
    else
        echo -e "${GREEN}✓${NC} JAVA_HOME is set: $JAVA_HOME"
    fi
else
    echo -e "${RED}✗${NC} Java not found. Install with: brew install openjdk@17"
    ALL_CHECKS_PASSED=false
fi
echo ""

# Check Android SDK
echo "🤖 Checking Android SDK..."
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${RED}✗${NC} ANDROID_HOME is not set"
    echo "    Install Android Studio and add to ~/.zshrc:"
    echo "    export ANDROID_HOME=\$HOME/Library/Android/sdk"
    echo "    export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
    ALL_CHECKS_PASSED=false
else
    echo -e "${GREEN}✓${NC} ANDROID_HOME is set: $ANDROID_HOME"
    
    # Check if Android SDK directory exists
    if [ -d "$ANDROID_HOME" ]; then
        echo -e "${GREEN}✓${NC} Android SDK directory exists"
    else
        echo -e "${RED}✗${NC} Android SDK directory not found at $ANDROID_HOME"
        ALL_CHECKS_PASSED=false
    fi
fi
echo ""

# Check adb
echo "🔧 Checking Android Debug Bridge (adb)..."
if command -v adb &> /dev/null; then
    ADB_VERSION=$(adb --version | head -n 1)
    echo -e "${GREEN}✓${NC} adb installed: $ADB_VERSION"
else
    echo -e "${RED}✗${NC} adb not found. Install Android SDK Platform-Tools"
    ALL_CHECKS_PASSED=false
fi
echo ""

# Check if gradlew exists
echo "🐘 Checking Gradle wrapper..."
if [ -f "android/gradlew" ]; then
    echo -e "${GREEN}✓${NC} Gradle wrapper found"
else
    echo -e "${YELLOW}⚠${NC} Gradle wrapper not found. Run 'npx expo prebuild --platform android' first"
fi
echo ""

# Check if node_modules exists
echo "📚 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules found"
else
    echo -e "${YELLOW}⚠${NC} node_modules not found. Run 'npm install' first"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ALL_CHECKS_PASSED" = true ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "You're ready to build. Run:"
    echo "  npx expo prebuild --platform android"
    echo "  cd android && ./gradlew assembleRelease"
else
    echo -e "${RED}✗ Some checks failed${NC}"
    echo ""
    echo "Please fix the issues above before building."
    echo "See LOCAL_BUILD_GUIDE.md for detailed setup instructions."
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
