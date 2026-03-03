#!/bin/bash
set -e

echo "Post-install hook: Verifying and fixing package versions for Expo SDK 51"

# Check installed versions
echo "Checking installed versions..."
MANIPULATOR_VERSION=$(npm list expo-image-manipulator --depth=0 2>/dev/null | grep expo-image-manipulator | awk '{print $2}' || echo "not found")
PICKER_VERSION=$(npm list expo-image-picker --depth=0 2>/dev/null | grep expo-image-picker | awk '{print $2}' || echo "not found")

echo "expo-image-manipulator: $MANIPULATOR_VERSION"
echo "expo-image-picker: $PICKER_VERSION"

# If wrong versions are installed, reinstall with correct versions
if [[ "$MANIPULATOR_VERSION" != "12.0.5"* ]]; then
  echo "Wrong version of expo-image-manipulator detected. Reinstalling..."
  npm install expo-image-manipulator@12.0.5 --legacy-peer-deps --force
fi

if [[ "$PICKER_VERSION" != "15.1.0"* ]]; then
  echo "Wrong version of expo-image-picker detected. Reinstalling..."
  npm install expo-image-picker@15.1.0 --legacy-peer-deps --force
fi

echo "Final versions:"
npm list expo-image-manipulator expo-image-picker --depth=0 || true

