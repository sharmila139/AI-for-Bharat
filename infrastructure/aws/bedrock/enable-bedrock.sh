#!/bin/bash

# RuralConnect AI - Amazon Bedrock Setup
# Enables Bedrock and requests model access

set -e

REGION="us-east-1"

echo "Amazon Bedrock Setup for RuralConnect AI"
echo "========================================"
echo ""
echo "Amazon Bedrock provides access to foundation models from leading AI companies."
echo "This script will guide you through enabling Bedrock and requesting model access."
echo ""

# Check if Bedrock is available in region
echo "Checking Bedrock availability in $REGION..."
aws bedrock list-foundation-models --region "$REGION" > /dev/null 2>&1 && \
  echo "✓ Bedrock is available in $REGION" || \
  echo "⚠ Bedrock may not be available in $REGION. Try us-east-1 or us-west-2"

echo ""
echo "Step 1: Request Model Access"
echo "============================"
echo ""
echo "You need to request access to foundation models through the AWS Console."
echo "This is a one-time process that typically takes 1-2 hours for approval."
echo ""
echo "Required Models for RuralConnect AI:"
echo "  1. Anthropic Claude 3 Sonnet - Conversational AI, complex reasoning"
echo "  2. Anthropic Claude 3 Haiku - Fast responses, simple queries"
echo "  3. Amazon Titan Text G1 - Express - Text generation"
echo "  4. Amazon Titan Embeddings G1 - Text - Vector embeddings for RAG"
echo ""
echo "Instructions:"
echo "  1. Open AWS Console: https://console.aws.amazon.com/bedrock"
echo "  2. Navigate to 'Model access' in the left sidebar"
echo "  3. Click 'Request model access' or 'Manage model access'"
echo "  4. Select the following models:"
echo "     ☐ Anthropic Claude 3 Sonnet"
echo "     ☐ Anthropic Claude 3 Haiku"
echo "     ☐ Amazon Titan Text G1 - Express"
echo "     ☐ Amazon Titan Embeddings G1 - Text"
echo "  5. Review and submit the request"
echo "  6. Wait for approval (check email for notification)"
echo ""
read -p "Press Enter after you've requested model access..."

echo ""
echo "Step 2: Verify Model Access"
echo "==========================="
echo ""
echo "Checking model access status..."

# List available models
echo "Available foundation models:"
aws bedrock list-foundation-models \
  --region "$REGION" \
  --query 'modelSummaries[?contains(modelId, `anthropic`) || contains(modelId, `amazon`)].{ModelId:modelId,Name:modelName,Provider:providerName}' \
  --output table

echo ""
echo "Checking specific model access..."

# Check Claude 3 Sonnet
CLAUDE_SONNET="anthropic.claude-3-sonnet-20240229-v1:0"
echo -n "Testing $CLAUDE_SONNET... "
aws bedrock-runtime invoke-model \
  --model-id "$CLAUDE_SONNET" \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/bedrock-test.json \
  --region "$REGION" \
  2>/dev/null && echo "✓ Access granted" || echo "✗ Access denied or pending"

# Check Claude 3 Haiku
CLAUDE_HAIKU="anthropic.claude-3-haiku-20240307-v1:0"
echo -n "Testing $CLAUDE_HAIKU... "
aws bedrock-runtime invoke-model \
  --model-id "$CLAUDE_HAIKU" \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/bedrock-test.json \
  --region "$REGION" \
  2>/dev/null && echo "✓ Access granted" || echo "✗ Access denied or pending"

# Check Titan Text
TITAN_TEXT="amazon.titan-text-express-v1"
echo -n "Testing $TITAN_TEXT... "
aws bedrock-runtime invoke-model \
  --model-id "$TITAN_TEXT" \
  --body '{"inputText":"Hi","textGenerationConfig":{"maxTokenCount":10}}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/bedrock-test.json \
  --region "$REGION" \
  2>/dev/null && echo "✓ Access granted" || echo "✗ Access denied or pending"

# Check Titan Embeddings
TITAN_EMBED="amazon.titan-embed-text-v1"
echo -n "Testing $TITAN_EMBED... "
aws bedrock-runtime invoke-model \
  --model-id "$TITAN_EMBED" \
  --body '{"inputText":"test"}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/bedrock-test.json \
  --region "$REGION" \
  2>/dev/null && echo "✓ Access granted" || echo "✗ Access denied or pending"

# Clean up
rm -f /tmp/bedrock-test.json

echo ""
echo "Step 3: Configure Environment"
echo "============================="
echo ""
echo "Add these to your .env file:"
echo ""
echo "# Amazon Bedrock Configuration"
echo "BEDROCK_REGION=$REGION"
echo "BEDROCK_MODEL_CLAUDE_SONNET=$CLAUDE_SONNET"
echo "BEDROCK_MODEL_CLAUDE_HAIKU=$CLAUDE_HAIKU"
echo "BEDROCK_MODEL_TITAN_TEXT=$TITAN_TEXT"
echo "BEDROCK_MODEL_TITAN_EMBED=$TITAN_EMBED"
echo "BEDROCK_MAX_TOKENS=4096"
echo "BEDROCK_TEMPERATURE=0.7"
echo ""
echo "Step 4: Cost Optimization"
echo "========================"
echo ""
echo "Bedrock pricing (approximate per 1M tokens):"
echo "  - Claude 3 Sonnet: \$3 input / \$15 output"
echo "  - Claude 3 Haiku: \$0.25 input / \$1.25 output"
echo "  - Titan Text Express: \$0.20 input / \$0.60 output"
echo "  - Titan Embeddings: \$0.10 per 1M tokens"
echo ""
echo "Cost optimization tips:"
echo "  1. Use Claude Haiku for simple queries (10x cheaper)"
echo "  2. Use Claude Sonnet for complex reasoning"
echo "  3. Implement caching for repeated queries"
echo "  4. Set appropriate max_tokens limits"
echo "  5. Monitor usage with CloudWatch"
echo ""
echo "✓ Bedrock setup complete!"
echo ""
echo "Next steps:"
echo "  1. Wait for model access approval (if pending)"
echo "  2. Configure Bedrock client in application code"
echo "  3. Implement RAG workflow (task 3.4)"
echo "  4. Set up prompt templates (task 3.6)"
echo ""
echo "Documentation:"
echo "  - Bedrock User Guide: https://docs.aws.amazon.com/bedrock/"
echo "  - Model pricing: https://aws.amazon.com/bedrock/pricing/"
echo "  - API Reference: https://docs.aws.amazon.com/bedrock/latest/APIReference/"
