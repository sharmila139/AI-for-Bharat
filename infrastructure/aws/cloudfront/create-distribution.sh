#!/bin/bash

# RuralConnect AI - CloudFront Distribution Setup
# Creates CloudFront distributions for static assets and user uploads

set -e

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
STATIC_BUCKET="ruralconnect-static-assets-$ACCOUNT_ID"
UPLOADS_BUCKET="ruralconnect-user-uploads-$ACCOUNT_ID"

echo "Creating CloudFront distributions for RuralConnect AI..."

# Create Origin Access Identity
echo "Creating Origin Access Identity..."
OAI_ID=$(aws cloudfront create-cloud-front-origin-access-identity \
  --cloud-front-origin-access-identity-config \
    CallerReference="ruralconnect-oai-$(date +%s)",Comment="OAI for RuralConnect AI" \
  --query 'CloudFrontOriginAccessIdentity.Id' \
  --output text)

echo "✓ Origin Access Identity created: $OAI_ID"

# Update S3 bucket policy to allow CloudFront access
echo "Updating S3 bucket policy..."
cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAI",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity $OAI_ID"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$STATIC_BUCKET/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket "$STATIC_BUCKET" \
  --policy file:///tmp/bucket-policy.json

echo "✓ S3 bucket policy updated"

# Create distribution configuration
cat > /tmp/distribution-config.json <<EOF
{
  "CallerReference": "ruralconnect-$(date +%s)",
  "Comment": "RuralConnect AI Static Assets",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-$STATIC_BUCKET",
        "DomainName": "$STATIC_BUCKET.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": "origin-access-identity/cloudfront/$OAI_ID"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$STATIC_BUCKET",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "Compress": true,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    }
  },
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true,
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "PriceClass": "PriceClass_All",
  "HttpVersion": "http2and3",
  "IsIPV6Enabled": true
}
EOF

# Create CloudFront distribution
echo "Creating CloudFront distribution..."
DISTRIBUTION_ID=$(aws cloudfront create-distribution \
  --distribution-config file:///tmp/distribution-config.json \
  --query 'Distribution.Id' \
  --output text)

echo "✓ CloudFront distribution created: $DISTRIBUTION_ID"

# Get distribution domain name
DOMAIN_NAME=$(aws cloudfront get-distribution \
  --id "$DISTRIBUTION_ID" \
  --query 'Distribution.DomainName' \
  --output text)

echo ""
echo "✓ CloudFront setup complete!"
echo ""
echo "Distribution Details:"
echo "  Distribution ID: $DISTRIBUTION_ID"
echo "  Domain Name: $DOMAIN_NAME"
echo "  Origin Access Identity: $OAI_ID"
echo ""
echo "Add these to your .env file:"
echo "CLOUDFRONT_DISTRIBUTION_ID=$DISTRIBUTION_ID"
echo "CLOUDFRONT_DOMAIN=$DOMAIN_NAME"
echo "CDN_URL=https://$DOMAIN_NAME"
echo ""
echo "Note: Distribution deployment takes 15-20 minutes to complete."
echo "Check status with: aws cloudfront get-distribution --id $DISTRIBUTION_ID"

# Clean up temp files
rm /tmp/bucket-policy.json /tmp/distribution-config.json
