#!/bin/bash

# RuralConnect AI - API Gateway Setup
# Creates REST API with Lambda integrations

set -e

REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
API_NAME="RuralConnect API"

echo "Creating API Gateway for RuralConnect AI..."

# Create REST API
echo "Creating REST API..."
API_ID=$(aws apigateway create-rest-api \
  --name "$API_NAME" \
  --description "RESTful API for RuralConnect AI mobile application" \
  --endpoint-configuration types=REGIONAL \
  --region "$REGION" \
  --query 'id' \
  --output text 2>/dev/null || \
  aws apigateway get-rest-apis \
    --query "items[?name=='$API_NAME'].id" \
    --output text \
    --region "$REGION")

echo "✓ API created: $API_ID"

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id "$API_ID" \
  --query 'items[?path==`/`].id' \
  --output text \
  --region "$REGION")

# Create /api resource
echo "Creating /api resource..."
API_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id "$API_ID" \
  --parent-id "$ROOT_ID" \
  --path-part api \
  --region "$REGION" \
  --query 'id' \
  --output text 2>/dev/null || \
  aws apigateway get-resources \
    --rest-api-id "$API_ID" \
    --query "items[?path=='/api'].id" \
    --output text \
    --region "$REGION")

# Create /api/v1 resource
echo "Creating /api/v1 resource..."
V1_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id "$API_ID" \
  --parent-id "$API_RESOURCE_ID" \
  --path-part v1 \
  --region "$REGION" \
  --query 'id' \
  --output text 2>/dev/null || \
  aws apigateway get-resources \
    --rest-api-id "$API_ID" \
    --query "items[?path=='/api/v1'].id" \
    --output text \
    --region "$REGION")

# Create proxy resource for Lambda
echo "Creating proxy resource..."
PROXY_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id "$API_ID" \
  --parent-id "$V1_RESOURCE_ID" \
  --path-part '{proxy+}' \
  --region "$REGION" \
  --query 'id' \
  --output text 2>/dev/null || \
  aws apigateway get-resources \
    --rest-api-id "$API_ID" \
    --query "items[?path=='/api/v1/{proxy+}'].id" \
    --output text \
    --region "$REGION")

# Create ANY method for proxy
echo "Creating ANY method..."
aws apigateway put-method \
  --rest-api-id "$API_ID" \
  --resource-id "$PROXY_RESOURCE_ID" \
  --http-method ANY \
  --authorization-type NONE \
  --region "$REGION" \
  2>/dev/null || echo "Method already exists"

# Set up Lambda integration
LAMBDA_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:ruralconnect-api"
LAMBDA_URI="arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"

echo "Setting up Lambda integration..."
aws apigateway put-integration \
  --rest-api-id "$API_ID" \
  --resource-id "$PROXY_RESOURCE_ID" \
  --http-method ANY \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "$LAMBDA_URI" \
  --region "$REGION" \
  2>/dev/null || echo "Integration already exists"

# Grant API Gateway permission to invoke Lambda
echo "Granting API Gateway permissions..."
aws lambda add-permission \
  --function-name ruralconnect-api \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*" \
  --region "$REGION" \
  2>/dev/null || echo "Permission already exists"

# Create deployment
echo "Creating deployment..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name prod \
  --stage-description "Production stage" \
  --description "Initial deployment" \
  --region "$REGION" \
  --query 'id' \
  --output text)

echo "✓ Deployment created: $DEPLOYMENT_ID"

# Configure stage settings
echo "Configuring stage settings..."
aws apigateway update-stage \
  --rest-api-id "$API_ID" \
  --stage-name prod \
  --patch-operations \
    op=replace,path=/throttle/rateLimit,value=1000 \
    op=replace,path=/throttle/burstLimit,value=2000 \
    op=replace,path=/tracingEnabled,value=true \
    op=replace,path=/metricsEnabled,value=true \
    op=replace,path=/loggingLevel,value=INFO \
  --region "$REGION"

# Enable CORS
echo "Enabling CORS..."
aws apigateway put-method-response \
  --rest-api-id "$API_ID" \
  --resource-id "$PROXY_RESOURCE_ID" \
  --http-method ANY \
  --status-code 200 \
  --response-parameters \
    method.response.header.Access-Control-Allow-Origin=true \
    method.response.header.Access-Control-Allow-Headers=true \
    method.response.header.Access-Control-Allow-Methods=true \
  --region "$REGION" \
  2>/dev/null || echo "Method response already exists"

# Create usage plan
echo "Creating usage plan..."
USAGE_PLAN_ID=$(aws apigateway create-usage-plan \
  --name "RuralConnect Standard Plan" \
  --description "Standard usage plan for RuralConnect API" \
  --throttle rateLimit=1000,burstLimit=2000 \
  --quota limit=1000000,period=MONTH \
  --api-stages apiId="$API_ID",stage=prod \
  --region "$REGION" \
  --query 'id' \
  --output text 2>/dev/null || \
  aws apigateway get-usage-plans \
    --query "items[?name=='RuralConnect Standard Plan'].id" \
    --output text \
    --region "$REGION")

echo "✓ Usage plan created: $USAGE_PLAN_ID"

# Get API endpoint
API_ENDPOINT="https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

echo ""
echo "✓ API Gateway setup complete!"
echo ""
echo "API Details:"
echo "  API ID: $API_ID"
echo "  Stage: prod"
echo "  Endpoint: $API_ENDPOINT"
echo "  Usage Plan: $USAGE_PLAN_ID"
echo ""
echo "API Endpoints:"
echo "  Base URL: $API_ENDPOINT/api/v1"
echo "  Health: $API_ENDPOINT/api/v1/health"
echo "  Auth: $API_ENDPOINT/api/v1/auth"
echo ""
echo "Rate Limits:"
echo "  Rate: 1000 requests/second"
echo "  Burst: 2000 requests"
echo "  Quota: 1M requests/month"
echo ""
echo "Add these to your .env file:"
echo "API_GATEWAY_ID=$API_ID"
echo "API_ENDPOINT=$API_ENDPOINT"
echo "API_BASE_URL=$API_ENDPOINT/api/v1"
echo ""
echo "Test the API:"
echo "  curl $API_ENDPOINT/api/v1/health"
