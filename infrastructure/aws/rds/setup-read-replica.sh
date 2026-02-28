#!/bin/bash

# ============================================================================
# RDS Read Replica Setup Script
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PRIMARY_DB_IDENTIFIER="${PRIMARY_DB_IDENTIFIER:-ruralconnect-db-primary}"
REPLICA_DB_IDENTIFIER="${REPLICA_DB_IDENTIFIER:-ruralconnect-db-replica-1}"
REPLICA_INSTANCE_CLASS="${REPLICA_INSTANCE_CLASS:-db.t3.medium}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo -e "${GREEN}=== RDS Read Replica Setup ===${NC}\n"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check if primary database exists
echo "Checking primary database..."
if ! aws rds describe-db-instances \
    --db-instance-identifier "$PRIMARY_DB_IDENTIFIER" \
    --region "$AWS_REGION" &> /dev/null; then
    echo -e "${RED}Error: Primary database $PRIMARY_DB_IDENTIFIER not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Primary database found${NC}"

# Check if replica already exists
if aws rds describe-db-instances \
    --db-instance-identifier "$REPLICA_DB_IDENTIFIER" \
    --region "$AWS_REGION" &> /dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Replica $REPLICA_DB_IDENTIFIER already exists${NC}"
    exit 0
fi

# Create read replica
echo -e "\nCreating read replica: $REPLICA_DB_IDENTIFIER"
echo "Instance class: $REPLICA_INSTANCE_CLASS"
echo "Region: $AWS_REGION"

aws rds create-db-instance-read-replica \
    --db-instance-identifier "$REPLICA_DB_IDENTIFIER" \
    --source-db-instance-identifier "$PRIMARY_DB_IDENTIFIER" \
    --db-instance-class "$REPLICA_INSTANCE_CLASS" \
    --publicly-accessible \
    --auto-minor-version-upgrade \
    --copy-tags-to-snapshot \
    --region "$AWS_REGION" \
    --tags \
        Key=Name,Value="RuralConnect DB Replica" \
        Key=Environment,Value=production \
        Key=Project,Value=RuralConnect-AI \
        Key=Type,Value=read-replica

echo -e "${GREEN}✓ Read replica creation initiated${NC}"

# Wait for replica to be available
echo -e "\nWaiting for replica to become available (this may take 10-15 minutes)..."

aws rds wait db-instance-available \
    --db-instance-identifier "$REPLICA_DB_IDENTIFIER" \
    --region "$AWS_REGION"

echo -e "${GREEN}✓ Read replica is now available${NC}"

# Get replica endpoint
REPLICA_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier "$REPLICA_DB_IDENTIFIER" \
    --region "$AWS_REGION" \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

REPLICA_PORT=$(aws rds describe-db-instances \
    --db-instance-identifier "$REPLICA_DB_IDENTIFIER" \
    --region "$AWS_REGION" \
    --query 'DBInstances[0].Endpoint.Port' \
    --output text)

echo -e "\n${GREEN}=== Read Replica Configuration ===${NC}"
echo "Replica Identifier: $REPLICA_DB_IDENTIFIER"
echo "Endpoint: $REPLICA_ENDPOINT"
echo "Port: $REPLICA_PORT"

# Update environment variables
echo -e "\n${YELLOW}Add these to your .env file:${NC}"
echo "DB_REPLICA_HOSTS=$REPLICA_ENDPOINT"
echo "DB_REPLICA_PORTS=$REPLICA_PORT"
echo "DB_REPLICA_WEIGHTS=1"

# Create monitoring alarms
echo -e "\n${GREEN}Setting up CloudWatch alarms for replica...${NC}"

# Replica lag alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "${REPLICA_DB_IDENTIFIER}-replica-lag" \
    --alarm-description "Alert when replica lag exceeds 60 seconds" \
    --metric-name ReplicaLag \
    --namespace AWS/RDS \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 60 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=DBInstanceIdentifier,Value="$REPLICA_DB_IDENTIFIER" \
    --region "$AWS_REGION"

echo -e "${GREEN}✓ Replica lag alarm created${NC}"

# CPU utilization alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "${REPLICA_DB_IDENTIFIER}-high-cpu" \
    --alarm-description "Alert when CPU exceeds 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/RDS \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=DBInstanceIdentifier,Value="$REPLICA_DB_IDENTIFIER" \
    --region "$AWS_REGION"

echo -e "${GREEN}✓ CPU utilization alarm created${NC}"

# Connection count alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "${REPLICA_DB_IDENTIFIER}-high-connections" \
    --alarm-description "Alert when connections exceed 80% of max" \
    --metric-name DatabaseConnections \
    --namespace AWS/RDS \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=DBInstanceIdentifier,Value="$REPLICA_DB_IDENTIFIER" \
    --region "$AWS_REGION"

echo -e "${GREEN}✓ Connection count alarm created${NC}"

echo -e "\n${GREEN}=== Read Replica Setup Complete ===${NC}"
echo -e "\nNext steps:"
echo "1. Update your .env file with the replica endpoint"
echo "2. Restart your application to use the read replica"
echo "3. Monitor replica lag in CloudWatch"
echo "4. Consider creating additional replicas for higher read load"

# Create additional replicas script
cat > create-additional-replica.sh << 'EOF'
#!/bin/bash
# Create additional read replicas

REPLICA_NUMBER="${1:-2}"
REPLICA_ID="ruralconnect-db-replica-${REPLICA_NUMBER}"

./setup-read-replica.sh
EOF

chmod +x create-additional-replica.sh

echo -e "\n${YELLOW}To create additional replicas, run:${NC}"
echo "./create-additional-replica.sh <replica_number>"
