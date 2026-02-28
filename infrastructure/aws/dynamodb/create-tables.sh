#!/bin/bash

# RuralConnect AI - DynamoDB Tables Setup
# Creates DynamoDB tables for sessions, cache, and real-time data

set -e

REGION="us-east-1"

echo "Creating DynamoDB tables for RuralConnect AI..."

# Create Sessions table
echo "Creating Sessions table..."
aws dynamodb create-table \
  --table-name ruralconnect-sessions \
  --attribute-definitions \
    AttributeName=sessionId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=sessionId,KeyType=HASH \
  --global-secondary-indexes \
    "[{
      \"IndexName\": \"UserIdIndex\",
      \"KeySchema\": [{\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"}],
      \"Projection\": {\"ProjectionType\":\"ALL\"},
      \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
    }]" \
  --provisioned-throughput \
    ReadCapacityUnits=10,WriteCapacityUnits=10 \
  --stream-specification \
    StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
  --tags \
    Key=Project,Value=RuralConnect \
    Key=Environment,Value=Production \
  --region "$REGION" \
  2>/dev/null || echo "Sessions table already exists"

# Enable TTL for sessions
aws dynamodb update-time-to-live \
  --table-name ruralconnect-sessions \
  --time-to-live-specification \
    "Enabled=true,AttributeName=expiresAt" \
  --region "$REGION"

echo "✓ Sessions table created"

# Create Cache table
echo "Creating Cache table..."
aws dynamodb create-table \
  --table-name ruralconnect-cache \
  --attribute-definitions \
    AttributeName=cacheKey,AttributeType=S \
  --key-schema \
    AttributeName=cacheKey,KeyType=HASH \
  --provisioned-throughput \
    ReadCapacityUnits=20,WriteCapacityUnits=10 \
  --tags \
    Key=Project,Value=RuralConnect \
    Key=Environment,Value=Production \
  --region "$REGION" \
  2>/dev/null || echo "Cache table already exists"

# Enable TTL for cache
aws dynamodb update-time-to-live \
  --table-name ruralconnect-cache \
  --time-to-live-specification \
    "Enabled=true,AttributeName=ttl" \
  --region "$REGION"

echo "✓ Cache table created"

# Create Notifications table
echo "Creating Notifications table..."
aws dynamodb create-table \
  --table-name ruralconnect-notifications \
  --attribute-definitions \
    AttributeName=notificationId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=N \
  --key-schema \
    AttributeName=notificationId,KeyType=HASH \
  --global-secondary-indexes \
    "[{
      \"IndexName\": \"UserIdCreatedAtIndex\",
      \"KeySchema\": [
        {\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},
        {\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}
      ],
      \"Projection\": {\"ProjectionType\":\"ALL\"},
      \"ProvisionedThroughput\": {\"ReadCapacityUnits\":10,\"WriteCapacityUnits\":5}
    }]" \
  --provisioned-throughput \
    ReadCapacityUnits=10,WriteCapacityUnits=10 \
  --tags \
    Key=Project,Value=RuralConnect \
    Key=Environment,Value=Production \
  --region "$REGION" \
  2>/dev/null || echo "Notifications table already exists"

echo "✓ Notifications table created"

# Create Analytics Events table
echo "Creating Analytics Events table..."
aws dynamodb create-table \
  --table-name ruralconnect-analytics \
  --attribute-definitions \
    AttributeName=eventId,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=eventId,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --global-secondary-indexes \
    "[{
      \"IndexName\": \"UserIdTimestampIndex\",
      \"KeySchema\": [
        {\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},
        {\"AttributeName\":\"timestamp\",\"KeyType\":\"RANGE\"}
      ],
      \"Projection\": {\"ProjectionType\":\"ALL\"},
      \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":10}
    }]" \
  --provisioned-throughput \
    ReadCapacityUnits=10,WriteCapacityUnits=20 \
  --stream-specification \
    StreamEnabled=true,StreamViewType=NEW_IMAGE \
  --tags \
    Key=Project,Value=RuralConnect \
    Key=Environment,Value=Production \
  --region "$REGION" \
  2>/dev/null || echo "Analytics table already exists"

# Enable TTL for analytics (keep for 90 days)
aws dynamodb update-time-to-live \
  --table-name ruralconnect-analytics \
  --time-to-live-specification \
    "Enabled=true,AttributeName=expiresAt" \
  --region "$REGION"

echo "✓ Analytics table created"

# Wait for tables to be active
echo "Waiting for tables to become active..."
aws dynamodb wait table-exists --table-name ruralconnect-sessions --region "$REGION"
aws dynamodb wait table-exists --table-name ruralconnect-cache --region "$REGION"
aws dynamodb wait table-exists --table-name ruralconnect-notifications --region "$REGION"
aws dynamodb wait table-exists --table-name ruralconnect-analytics --region "$REGION"

echo ""
echo "✓ All DynamoDB tables created successfully!"
echo ""
echo "Tables:"
echo "  - ruralconnect-sessions (with TTL)"
echo "  - ruralconnect-cache (with TTL)"
echo "  - ruralconnect-notifications"
echo "  - ruralconnect-analytics (with TTL and streams)"
echo ""
echo "Add these to your .env file:"
echo "DYNAMODB_SESSIONS_TABLE=ruralconnect-sessions"
echo "DYNAMODB_CACHE_TABLE=ruralconnect-cache"
echo "DYNAMODB_NOTIFICATIONS_TABLE=ruralconnect-notifications"
echo "DYNAMODB_ANALYTICS_TABLE=ruralconnect-analytics"
echo "AWS_REGION=$REGION"
