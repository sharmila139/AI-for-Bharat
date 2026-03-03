#!/bin/bash

# Configure AWS credentials locally for this repository only
# This won't affect your global AWS configuration

echo "🔧 Configure AWS Credentials for RuralConnect AI"
echo "================================================"
echo ""
echo "This will set AWS credentials ONLY for this repository."
echo "Your global AWS configuration will not be changed."
echo ""

# Prompt for credentials
read -p "Enter AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -sp "Enter AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo ""
read -p "Enter AWS Region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

echo ""
echo "Creating local AWS credentials file..."

# Create .aws directory in project root
mkdir -p .aws

# Create credentials file
cat > .aws/credentials << EOF
[default]
aws_access_key_id = ${AWS_ACCESS_KEY_ID}
aws_secret_access_key = ${AWS_SECRET_ACCESS_KEY}
EOF

# Create config file
cat > .aws/config << EOF
[default]
region = ${AWS_REGION}
output = json
EOF

# Add to .gitignore to prevent committing credentials
if ! grep -q ".aws/" .gitignore 2>/dev/null; then
    echo ".aws/" >> .gitignore
    echo "Added .aws/ to .gitignore"
fi

echo ""
echo "✅ Local AWS credentials configured!"
echo ""
echo "To use these credentials, run commands with:"
echo "  export AWS_CONFIG_FILE=\$(pwd)/.aws/config"
echo "  export AWS_SHARED_CREDENTIALS_FILE=\$(pwd)/.aws/credentials"
echo ""
echo "Or source the environment file:"
echo "  source .aws/env.sh"
echo ""

# Create environment file for easy sourcing
cat > .aws/env.sh << 'EOF'
#!/bin/bash
# Source this file to use local AWS credentials
export AWS_CONFIG_FILE="$(pwd)/.aws/config"
export AWS_SHARED_CREDENTIALS_FILE="$(pwd)/.aws/credentials"
echo "✅ Using local AWS credentials for this repository"
EOF

chmod +x .aws/env.sh

# Test credentials
echo "Testing credentials..."
export AWS_CONFIG_FILE="$(pwd)/.aws/config"
export AWS_SHARED_CREDENTIALS_FILE="$(pwd)/.aws/credentials"

if aws sts get-caller-identity > /dev/null 2>&1; then
    echo ""
    echo "✅ Credentials verified!"
    aws sts get-caller-identity
    echo ""
    echo "Ready to deploy!"
else
    echo ""
    echo "❌ Credentials verification failed. Please check your keys."
    exit 1
fi

