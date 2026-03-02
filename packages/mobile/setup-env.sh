#!/bin/bash

# RuralConnect AI - Environment Setup Script
# This script helps set up environment variables for local Android builds

echo "🔧 Setting up environment variables for Android builds..."
echo ""

# Detect shell
SHELL_CONFIG=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
    SHELL_NAME="zsh"
elif [ -f "$HOME/.bash_profile" ]; then
    SHELL_CONFIG="$HOME/.bash_profile"
    SHELL_NAME="bash"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
    SHELL_NAME="bash"
else
    echo "❌ Could not find shell configuration file"
    exit 1
fi

echo "📝 Detected shell: $SHELL_NAME"
echo "📝 Config file: $SHELL_CONFIG"
echo ""

# Check if variables are already set
JAVA_HOME_SET=$(grep -c "JAVA_HOME" "$SHELL_CONFIG" || true)
ANDROID_HOME_SET=$(grep -c "ANDROID_HOME" "$SHELL_CONFIG" || true)

# Backup config file
cp "$SHELL_CONFIG" "${SHELL_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backed up $SHELL_CONFIG"
echo ""

# Add JAVA_HOME if not set
if [ "$JAVA_HOME_SET" -eq 0 ]; then
    echo "# Java Development Kit" >> "$SHELL_CONFIG"
    echo "export JAVA_HOME=\$(/usr/libexec/java_home -v 17)" >> "$SHELL_CONFIG"
    echo "export PATH=\$JAVA_HOME/bin:\$PATH" >> "$SHELL_CONFIG"
    echo "" >> "$SHELL_CONFIG"
    echo "✅ Added JAVA_HOME to $SHELL_CONFIG"
else
    echo "ℹ️  JAVA_HOME already configured"
fi

# Add ANDROID_HOME if not set
if [ "$ANDROID_HOME_SET" -eq 0 ]; then
    echo "# Android SDK" >> "$SHELL_CONFIG"
    echo "export ANDROID_HOME=\$HOME/Library/Android/sdk" >> "$SHELL_CONFIG"
    echo "export PATH=\$PATH:\$ANDROID_HOME/emulator" >> "$SHELL_CONFIG"
    echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools" >> "$SHELL_CONFIG"
    echo "export PATH=\$PATH:\$ANDROID_HOME/tools" >> "$SHELL_CONFIG"
    echo "export PATH=\$PATH:\$ANDROID_HOME/tools/bin" >> "$SHELL_CONFIG"
    echo "" >> "$SHELL_CONFIG"
    echo "✅ Added ANDROID_HOME to $SHELL_CONFIG"
else
    echo "ℹ️  ANDROID_HOME already configured"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Environment setup complete!"
echo ""
echo "⚠️  IMPORTANT: Reload your shell configuration:"
echo "   source $SHELL_CONFIG"
echo ""
echo "Or close and reopen your terminal."
echo ""
echo "Then run: ./check-build-env.sh to verify"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
