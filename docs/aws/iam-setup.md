# IAM Setup Guide

This guide walks through setting up IAM roles and policies for RuralConnect AI with least privilege access.

## Prerequisites

- AWS Account with admin access
- AWS CLI installed and configured
- Basic understanding of IAM concepts

## Step 1: Create IAM Roles

### 1.1 Lambda Execution Role

```bash
aws iam create-role \
  --role-name RuralConnectLambdaRole \
  --assume-role-policy-document file://infrastructure/aws/iam/lambda-trust-policy.json

aws iam put-role-policy \
  --role-name RuralConnectLambdaRole \
  --policy-name LambdaExecutionPolicy \
  --policy-document file://infrastructure/aws/iam/policies.json
```

### 1.2 Bedrock Access Role

```bash
aws iam create-role \
  --role-name RuralConnectBedrockRole \
  --assume-role-policy-document file://infrastructure/aws/iam/bedrock-trust-policy.json

aws iam put-role-policy \
  --role-name RuralConnectBedrockRole \
  --policy-name BedrockAccessPolicy \
  --policy-document file://infrastructure/aws/iam/policies.json
```

### 1.3 EC2 Instance Role

```bash
aws iam create-role \
  --role-name RuralConnectEC2Role \
  --assume-role-policy-document file://infrastructure/aws/iam/ec2-trust-policy.json

aws iam put-role-policy \
  --role-name RuralConnectEC2Role \
  --policy-name EC2InstancePolicy \
  --policy-document file://infrastructure/aws/iam/policies.json

aws iam create-instance-profile \
  --instance-profile-name RuralConnectEC2Profile

aws iam add-role-to-instance-profile \
  --instance-profile-name RuralConnectEC2Profile \
  --role-name RuralConnectEC2Role
```

## Step 2: Create Service Users

### 2.1 CI/CD User

```bash
aws iam create-user --user-name ruralconnect-cicd

aws iam create-access-key --user-name ruralconnect-cicd

aws iam attach-user-policy \
  --user-name ruralconnect-cicd \
  --policy-arn arn:aws:iam::aws:policy/AWSLambdaFullAccess

aws iam attach-user-policy \
  --user-name ruralconnect-cicd \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess
```

**Important**: Save the access key ID and secret access key. Add them to GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Step 3: Enable AWS Services

### 3.1 Enable Amazon Bedrock

1. Go to AWS Console → Amazon Bedrock
2. Navigate to "Model access"
3. Request access to the following models:
   - Claude 3 Sonnet
   - Claude 3 Haiku
   - Amazon Titan Text G1 - Express
   - Amazon Titan Embeddings G1 - Text

### 3.2 Enable AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name ruralconnect/database \
  --secret-string '{"username":"admin","password":"CHANGE_ME"}'

aws secretsmanager create-secret \
  --name ruralconnect/jwt \
  --secret-string '{"secret":"CHANGE_ME_TO_RANDOM_STRING"}'
```

## Security Best Practices

1. **Rotate credentials regularly**: Set up automatic rotation for database passwords
2. **Use MFA**: Enable MFA for all IAM users with console access
3. **Monitor access**: Enable CloudTrail for audit logging
4. **Least privilege**: Only grant permissions that are absolutely necessary
5. **Use roles over users**: Prefer IAM roles for EC2 and Lambda over hardcoded credentials

## Verification

Verify roles are created:
```bash
aws iam list-roles | grep RuralConnect
```

Verify policies are attached:
```bash
aws iam list-attached-role-policies --role-name RuralConnectLambdaRole
```

## Troubleshooting

**Issue**: "Access Denied" when invoking Bedrock
**Solution**: Ensure the role has `bedrock:InvokeModel` permission and model access is enabled

**Issue**: Lambda can't access RDS
**Solution**: Check VPC configuration and security groups allow Lambda to reach RDS

## Next Steps

After IAM setup is complete:
1. Proceed to S3 bucket creation (task 2.2)
2. Set up RDS database (task 2.4)
3. Configure Bedrock integration (task 3.1)
