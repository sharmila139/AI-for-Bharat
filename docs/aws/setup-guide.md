# AWS Infrastructure Setup Guide

Complete guide for setting up AWS infrastructure for RuralConnect AI.

## Prerequisites

- AWS Account with admin access
- AWS CLI installed and configured
- Basic understanding of AWS services
- Bash shell (Linux/macOS) or WSL (Windows)

## Quick Start

Run all setup scripts in order:

```bash
# 1. Set up IAM roles and policies
cd infrastructure/aws/iam
# Follow instructions in docs/aws/iam-setup.md

# 2. Create S3 buckets
cd ../s3
./create-buckets.sh

# 3. Set up CloudFront CDN
cd ../cloudfront
./create-distribution.sh

# 4. Create RDS PostgreSQL database
cd ../rds
./create-database.sh

# 5. Create DynamoDB tables
cd ../dynamodb
./create-tables.sh

# 6. Set up ElastiCache Redis (see below)
# 7. Configure API Gateway (see below)
# 8. Set up Lambda functions (see below)
# 9. Configure Bedrock access (see below)
```

## Detailed Setup Steps

### 1. IAM Configuration

See [iam-setup.md](./iam-setup.md) for detailed IAM setup instructions.

Key roles to create:
- `RuralConnectLambdaRole` - For Lambda functions
- `RuralConnectBedrockRole` - For Bedrock access
- `RuralConnectEC2Role` - For EC2 instances

### 2. S3 Buckets

Creates 5 buckets with proper encryption, versioning, and lifecycle policies:

```bash
cd infrastructure/aws/s3
./create-buckets.sh
```

Buckets created:
- `ruralconnect-static-assets-{ACCOUNT_ID}` - Static content
- `ruralconnect-user-uploads-{ACCOUNT_ID}` - User photos/documents
- `ruralconnect-backups-{ACCOUNT_ID}` - Database backups
- `ruralconnect-ml-models-{ACCOUNT_ID}` - ML model artifacts
- `ruralconnect-logs-{ACCOUNT_ID}` - Application logs

### 3. CloudFront CDN

Sets up CloudFront distribution with Origin Access Identity:

```bash
cd infrastructure/aws/cloudfront
./create-distribution.sh
```

Features:
- HTTPS redirect
- Gzip compression
- Custom cache behaviors for images/videos
- Global edge locations

### 4. RDS PostgreSQL

Creates PostgreSQL 15.4 instance with read replica:

```bash
cd infrastructure/aws/rds
./create-database.sh
```

Configuration:
- Instance class: db.t3.medium
- Storage: 100GB GP3 (encrypted)
- Backup retention: 7 days
- Multi-AZ: Optional (add `--multi-az` flag)
- Read replica for scaling

After creation, initialize schema:
```bash
# Get database endpoint from output
psql -h YOUR_ENDPOINT -U admin -d ruralconnect -f init-schema.sql
```

### 5. DynamoDB Tables

Creates 4 tables for sessions, cache, notifications, and analytics:

```bash
cd infrastructure/aws/dynamodb
./create-tables.sh
```

Tables:
- `ruralconnect-sessions` - User sessions with TTL
- `ruralconnect-cache` - Application cache with TTL
- `ruralconnect-notifications` - Push notifications
- `ruralconnect-analytics` - Event tracking with streams

### 6. ElastiCache Redis

Create Redis cluster for caching:

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id ruralconnect-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name default \
  --security-group-ids sg-YOUR_SG_ID \
  --tags Key=Project,Value=RuralConnect
```

Get endpoint:
```bash
aws elasticache describe-cache-clusters \
  --cache-cluster-id ruralconnect-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint'
```

### 7. API Gateway

Create REST API:

```bash
aws apigateway create-rest-api \
  --name "RuralConnect API" \
  --description "API for RuralConnect AI" \
  --endpoint-configuration types=REGIONAL
```

### 8. Lambda Functions

Package and deploy backend:

```bash
cd packages/backend
yarn build
zip -r function.zip dist node_modules

aws lambda create-function \
  --function-name ruralconnect-api \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/RuralConnectLambdaRole \
  --handler dist/lambda.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 1024 \
  --environment Variables="{NODE_ENV=production}"
```

### 9. Amazon Bedrock

Enable Bedrock and request model access:

1. Go to AWS Console → Amazon Bedrock
2. Navigate to "Model access"
3. Click "Request model access"
4. Select models:
   - ✅ Claude 3 Sonnet
   - ✅ Claude 3 Haiku
   - ✅ Amazon Titan Text G1 - Express
   - ✅ Amazon Titan Embeddings G1 - Text
5. Submit request (approval takes 1-2 hours)

Test Bedrock access:
```bash
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
  --body '{"prompt":"Hello","max_tokens":100}' \
  --cli-binary-format raw-in-base64-out \
  output.json
```

### 10. AWS Amplify (Mobile App)

Deploy mobile app:

```bash
aws amplify create-app \
  --name ruralconnect-mobile \
  --repository https://github.com/your-org/ruralconnect-ai \
  --access-token YOUR_GITHUB_TOKEN

aws amplify create-branch \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --enable-auto-build
```

## Environment Configuration

After setup, update `.env` file:

```bash
cp .env.example .env
# Edit .env with actual values from setup outputs
```

## Cost Estimation

Monthly costs (approximate):

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| RDS PostgreSQL | db.t3.medium | $60 |
| ElastiCache Redis | cache.t3.micro | $15 |
| DynamoDB | On-demand | $25-50 |
| S3 | 100GB storage | $2-5 |
| CloudFront | 1TB transfer | $85 |
| Lambda | 1M requests | $0.20 |
| Bedrock | 10M tokens | $30-100 |
| **Total** | | **~$220-320/month** |

## Monitoring Setup

Enable CloudWatch monitoring:

```bash
# Create log groups
aws logs create-log-group --log-group-name /aws/ruralconnect/api
aws logs create-log-group --log-group-name /aws/ruralconnect/ml

# Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name ruralconnect-high-error-rate \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold
```

## Security Checklist

- [ ] IAM roles follow least privilege principle
- [ ] All S3 buckets have encryption enabled
- [ ] RDS has encryption at rest enabled
- [ ] Security groups restrict access appropriately
- [ ] Secrets stored in Secrets Manager
- [ ] CloudTrail enabled for audit logging
- [ ] MFA enabled for root account
- [ ] VPC configured with private subnets
- [ ] WAF rules configured for API Gateway

## Troubleshooting

### Issue: Lambda can't connect to RDS
**Solution**: Ensure Lambda is in same VPC as RDS and security groups allow traffic

### Issue: Bedrock access denied
**Solution**: Check IAM role has `bedrock:InvokeModel` permission and model access is approved

### Issue: S3 bucket access denied
**Solution**: Verify bucket policy allows CloudFront OAI access

### Issue: High DynamoDB costs
**Solution**: Switch from provisioned to on-demand capacity

## Next Steps

After infrastructure setup:
1. Deploy backend code to Lambda
2. Deploy ML services to EC2/ECS
3. Build and deploy mobile app
4. Run integration tests
5. Set up monitoring dashboards
6. Configure backup automation

## Support

For issues or questions:
- Check AWS documentation
- Review CloudWatch logs
- Contact AWS Support (if you have a support plan)
