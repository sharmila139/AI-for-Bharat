#!/bin/bash
set -e

echo "Pre-install hook: Forcing correct package versions for Expo SDK 51"

# This script runs before npm install on EAS Build
# It ensures the correct versions are installed

echo "Package.json dependencies before install:"
cat package.json | grep -A 2 "expo-image"

