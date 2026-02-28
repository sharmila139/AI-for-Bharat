#!/bin/bash

# RuralConnect AI - RDS PostgreSQL Setup
# Creates RDS PostgreSQL instance with read replicas

set -e

DB_INSTANCE_ID="ruralconnect-db"
DB_NAME="ruralconnect"
DB_USERNAME="admin"
DB_PASSWORD=$(openssl rand -base64 32)
DB_INSTANCE_CLASS="db.t3.medium"
ALLOCATED_STORAGE=100
REGION="us-east-1"

echo "Creating RDS PostgreSQL instance for RuralConnect AI..."
echo "Instance ID: $DB_INSTANCE_ID"
echo "Database Name: $DB_NAME"

# Create DB subnet group
echo "Creating DB subnet group..."
SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=default-for-az,Values=true" \
  --query 'Subnets[*].SubnetId' \
  --output text)

aws rds create-db-subnet-group \
  --db-subnet-group-name ruralconnect-db-subnet \
  --db-subnet-group-description "Subnet group for RuralConnect DB" \
  --subnet-ids $SUBNET_IDS \
  2>/dev/null || echo "Subnet group already exists"

# Create security group
echo "Creating security group..."
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=isDefault,Values=true" \
  --query 'Vpcs[0].VpcId' \
  --output text)

SG_ID=$(aws ec2 create-security-group \
  --group-name ruralconnect-db-sg \
  --description "Security group for RuralConnect RDS" \
  --vpc-id "$VPC_ID" \
  --query 'GroupId' \
  --output text 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=ruralconnect-db-sg" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

# Allow PostgreSQL access from within VPC
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp \
  --port 5432 \
  --cidr "10.0.0.0/8" \
  2>/dev/null || echo "Security group rule already exists"

echo "✓ Security group created: $SG_ID"

# Store password in Secrets Manager
echo "Storing database credentials in Secrets Manager..."
aws secretsmanager create-secret \
  --name ruralconnect/database \
  --description "RuralConnect database credentials" \
  --secret-string "{\"username\":\"$DB_USERNAME\",\"password\":\"$DB_PASSWORD\",\"engine\":\"postgres\",\"host\":\"\",\"port\":5432,\"dbname\":\"$DB_NAME\"}" \
  2>/dev/null || \
  aws secretsmanager update-secret \
    --secret-id ruralconnect/database \
    --secret-string "{\"username\":\"$DB_USERNAME\",\"password\":\"$DB_PASSWORD\",\"engine\":\"postgres\",\"host\":\"\",\"port\":5432,\"dbname\":\"$DB_NAME\"}"

echo "✓ Credentials stored in Secrets Manager"

# Create RDS instance
echo "Creating RDS PostgreSQL instance (this takes 10-15 minutes)..."
aws rds create-db-instance \
  --db-instance-identifier "$DB_INSTANCE_ID" \
  --db-instance-class "$DB_INSTANCE_CLASS" \
  --engine postgres \
  --engine-version 15.4 \
  --master-username "$DB_USERNAME" \
  --master-user-password "$DB_PASSWORD" \
  --allocated-storage "$ALLOCATED_STORAGE" \
  --storage-type gp3 \
  --storage-encrypted \
  --db-name "$DB_NAME" \
  --vpc-security-group-ids "$SG_ID" \
  --db-subnet-group-name ruralconnect-db-subnet \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --enable-cloudwatch-logs-exports '["postgresql"]' \
  --auto-minor-version-upgrade \
  --publicly-accessible false \
  --tags Key=Project,Value=RuralConnect Key=Environment,Value=Production

echo "✓ RDS instance creation initiated"

# Wait for instance to be available
echo "Waiting for RDS instance to become available..."
aws rds wait db-instance-available --db-instance-identifier "$DB_INSTANCE_ID"

# Get endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "$DB_INSTANCE_ID" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "✓ RDS instance is available"

# Update Secrets Manager with endpoint
aws secretsmanager update-secret \
  --secret-id ruralconnect/database \
  --secret-string "{\"username\":\"$DB_USERNAME\",\"password\":\"$DB_PASSWORD\",\"engine\":\"postgres\",\"host\":\"$DB_ENDPOINT\",\"port\":5432,\"dbname\":\"$DB_NAME\"}"

# Create read replica
echo "Creating read replica..."
aws rds create-db-instance-read-replica \
  --db-instance-identifier "$DB_INSTANCE_ID-replica" \
  --source-db-instance-identifier "$DB_INSTANCE_ID" \
  --db-instance-class "$DB_INSTANCE_CLASS" \
  --publicly-accessible false \
  --tags Key=Project,Value=RuralConnect Key=Environment,Value=Production Key=Type,Value=ReadReplica

echo ""
echo "✓ RDS PostgreSQL setup complete!"
echo ""
echo "Database Details:"
echo "  Instance ID: $DB_INSTANCE_ID"
echo "  Endpoint: $DB_ENDPOINT"
echo "  Port: 5432"
echo "  Database: $DB_NAME"
echo "  Username: $DB_USERNAME"
echo "  Password: (stored in Secrets Manager)"
echo ""
echo "Connection string:"
echo "  postgresql://$DB_USERNAME:[PASSWORD]@$DB_ENDPOINT:5432/$DB_NAME"
echo ""
echo "Add these to your .env file:"
echo "DATABASE_URL=postgresql://$DB_USERNAME:[GET_FROM_SECRETS_MANAGER]@$DB_ENDPOINT:5432/$DB_NAME"
echo "DATABASE_REPLICA_URL=postgresql://$DB_USERNAME:[GET_FROM_SECRETS_MANAGER]@$DB_INSTANCE_ID-replica.[REGION].rds.amazonaws.com:5432/$DB_NAME"
echo ""
echo "Retrieve password with:"
echo "  aws secretsmanager get-secret-value --secret-id ruralconnect/database --query SecretString --output text"
