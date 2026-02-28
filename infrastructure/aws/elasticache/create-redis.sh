#!/bin/bash

# RuralConnect AI - ElastiCache Redis Setup
# Creates Redis cluster for caching layer

set -e

CLUSTER_ID="ruralconnect-redis"
NODE_TYPE="cache.t3.micro"
ENGINE_VERSION="7.0"
NUM_NODES=1
REGION="us-east-1"

echo "Creating ElastiCache Redis cluster for RuralConnect AI..."

# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=isDefault,Values=true" \
  --query 'Vpcs[0].VpcId' \
  --output text)

echo "Using VPC: $VPC_ID"

# Create cache subnet group
echo "Creating cache subnet group..."
SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[*].SubnetId' \
  --output text)

aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name ruralconnect-redis-subnet \
  --cache-subnet-group-description "Subnet group for RuralConnect Redis" \
  --subnet-ids $SUBNET_IDS \
  --region "$REGION" \
  2>/dev/null || echo "Subnet group already exists"

echo "✓ Cache subnet group created"

# Create security group
echo "Creating security group..."
SG_ID=$(aws ec2 create-security-group \
  --group-name ruralconnect-redis-sg \
  --description "Security group for RuralConnect Redis" \
  --vpc-id "$VPC_ID" \
  --query 'GroupId' \
  --output text 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=ruralconnect-redis-sg" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

# Allow Redis access from within VPC
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp \
  --port 6379 \
  --cidr "10.0.0.0/8" \
  2>/dev/null || echo "Security group rule already exists"

echo "✓ Security group created: $SG_ID"

# Create parameter group for custom configuration
echo "Creating parameter group..."
aws elasticache create-cache-parameter-group \
  --cache-parameter-group-name ruralconnect-redis-params \
  --cache-parameter-group-family redis7 \
  --description "Custom parameters for RuralConnect Redis" \
  --region "$REGION" \
  2>/dev/null || echo "Parameter group already exists"

# Set custom parameters
aws elasticache modify-cache-parameter-group \
  --cache-parameter-group-name ruralconnect-redis-params \
  --parameter-name-values \
    "ParameterName=maxmemory-policy,ParameterValue=allkeys-lru" \
    "ParameterName=timeout,ParameterValue=300" \
  --region "$REGION" \
  2>/dev/null || true

echo "✓ Parameter group configured"

# Create Redis cluster
echo "Creating Redis cluster (this takes 5-10 minutes)..."
aws elasticache create-cache-cluster \
  --cache-cluster-id "$CLUSTER_ID" \
  --cache-node-type "$NODE_TYPE" \
  --engine redis \
  --engine-version "$ENGINE_VERSION" \
  --num-cache-nodes "$NUM_NODES" \
  --cache-parameter-group-name ruralconnect-redis-params \
  --cache-subnet-group-name ruralconnect-redis-subnet \
  --security-group-ids "$SG_ID" \
  --snapshot-retention-limit 5 \
  --snapshot-window "03:00-05:00" \
  --preferred-maintenance-window "mon:05:00-mon:06:00" \
  --auto-minor-version-upgrade \
  --tags Key=Project,Value=RuralConnect Key=Environment,Value=Production \
  --region "$REGION" \
  2>/dev/null || echo "Redis cluster already exists"

echo "✓ Redis cluster creation initiated"

# Wait for cluster to be available
echo "Waiting for Redis cluster to become available..."
aws elasticache wait cache-cluster-available \
  --cache-cluster-id "$CLUSTER_ID" \
  --region "$REGION"

# Get endpoint
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id "$CLUSTER_ID" \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text \
  --region "$REGION")

REDIS_PORT=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id "$CLUSTER_ID" \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Port' \
  --output text \
  --region "$REGION")

echo ""
echo "✓ ElastiCache Redis setup complete!"
echo ""
echo "Redis Details:"
echo "  Cluster ID: $CLUSTER_ID"
echo "  Endpoint: $REDIS_ENDPOINT"
echo "  Port: $REDIS_PORT"
echo "  Engine: Redis $ENGINE_VERSION"
echo "  Node Type: $NODE_TYPE"
echo ""
echo "Connection string:"
echo "  redis://$REDIS_ENDPOINT:$REDIS_PORT"
echo ""
echo "Add these to your .env file:"
echo "REDIS_HOST=$REDIS_ENDPOINT"
echo "REDIS_PORT=$REDIS_PORT"
echo "REDIS_URL=redis://$REDIS_ENDPOINT:$REDIS_PORT"
echo ""
echo "Test connection with:"
echo "  redis-cli -h $REDIS_ENDPOINT -p $REDIS_PORT ping"
