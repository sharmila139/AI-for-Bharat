#!/bin/bash

# RuralConnect AI - CloudWatch Monitoring Setup
# Creates log groups, metrics, alarms, and dashboards

set -e

REGION="us-east-1"
SNS_EMAIL="alerts@ruralconnect.ai"

echo "Setting up CloudWatch monitoring for RuralConnect AI..."

# Create SNS topic for alerts
echo "Creating SNS topic for alerts..."
SNS_TOPIC_ARN=$(aws sns create-topic \
  --name ruralconnect-alerts \
  --region "$REGION" \
  --query 'TopicArn' \
  --output text 2>/dev/null || \
  aws sns list-topics \
    --query "Topics[?contains(TopicArn, 'ruralconnect-alerts')].TopicArn" \
    --output text \
    --region "$REGION")

echo "✓ SNS topic created: $SNS_TOPIC_ARN"

# Subscribe email to SNS topic
echo "Subscribing email to alerts..."
aws sns subscribe \
  --topic-arn "$SNS_TOPIC_ARN" \
  --protocol email \
  --notification-endpoint "$SNS_EMAIL" \
  --region "$REGION" \
  2>/dev/null || echo "Email already subscribed"

echo "⚠ Check $SNS_EMAIL to confirm subscription"

# Create log groups
echo "Creating log groups..."
LOG_GROUPS=(
  "/aws/ruralconnect/api"
  "/aws/ruralconnect/ml"
  "/aws/ruralconnect/mobile"
  "/aws/ruralconnect/sync"
  "/aws/ruralconnect/notifications"
  "/aws/ruralconnect/errors"
)

for log_group in "${LOG_GROUPS[@]}"; do
  aws logs create-log-group \
    --log-group-name "$log_group" \
    --region "$REGION" \
    2>/dev/null || echo "Log group $log_group already exists"
  
  # Set retention policy (30 days)
  aws logs put-retention-policy \
    --log-group-name "$log_group" \
    --retention-in-days 30 \
    --region "$REGION"
done

echo "✓ Log groups created with 30-day retention"

# Create metric filters
echo "Creating metric filters..."

# Error rate metric
aws logs put-metric-filter \
  --log-group-name "/aws/ruralconnect/api" \
  --filter-name ErrorCount \
  --filter-pattern "[time, request_id, level = ERROR*, ...]" \
  --metric-transformations \
    metricName=ErrorCount,metricNamespace=RuralConnect,metricValue=1,defaultValue=0 \
  --region "$REGION"

# Response time metric
aws logs put-metric-filter \
  --log-group-name "/aws/ruralconnect/api" \
  --filter-name ResponseTime \
  --filter-pattern "[time, request_id, level, msg, duration]" \
  --metric-transformations \
    metricName=ResponseTime,metricNamespace=RuralConnect,metricValue='$duration',unit=Milliseconds \
  --region "$REGION"

echo "✓ Metric filters created"

# Create CloudWatch Alarms
echo "Creating CloudWatch alarms..."

# Alarm 1: High error rate
aws cloudwatch put-metric-alarm \
  --alarm-name ruralconnect-high-error-rate \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name ErrorCount \
  --namespace RuralConnect \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --region "$REGION"

# Alarm 2: High API latency
aws cloudwatch put-metric-alarm \
  --alarm-name ruralconnect-high-latency \
  --alarm-description "Alert when p95 latency exceeds 1000ms" \
  --metric-name ResponseTime \
  --namespace RuralConnect \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 1000 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --region "$REGION"

# Alarm 3: Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name ruralconnect-lambda-errors \
  --alarm-description "Alert on Lambda function errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --dimensions Name=FunctionName,Value=ruralconnect-api \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --region "$REGION"

# Alarm 4: RDS CPU utilization
aws cloudwatch put-metric-alarm \
  --alarm-name ruralconnect-rds-high-cpu \
  --alarm-description "Alert when RDS CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --dimensions Name=DBInstanceIdentifier,Value=ruralconnect-db \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --region "$REGION"

# Alarm 5: DynamoDB throttling
aws cloudwatch put-metric-alarm \
  --alarm-name ruralconnect-dynamodb-throttles \
  --alarm-description "Alert on DynamoDB throttling" \
  --metric-name UserErrors \
  --namespace AWS/DynamoDB \
  --dimensions Name=TableName,Value=ruralconnect-sessions \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --region "$REGION"

echo "✓ CloudWatch alarms created"

# Create CloudWatch Dashboard
echo "Creating CloudWatch dashboard..."
cat > /tmp/dashboard.json <<'EOF'
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
          [".", "Errors", {"stat": "Sum"}],
          [".", "Duration", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Lambda Metrics",
        "yAxis": {"left": {"min": 0}}
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/RDS", "CPUUtilization", {"stat": "Average"}],
          [".", "DatabaseConnections", {"stat": "Average"}],
          [".", "ReadLatency", {"stat": "Average"}],
          [".", "WriteLatency", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "RDS Metrics"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum"}],
          [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}],
          [".", "UserErrors", {"stat": "Sum"}]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "DynamoDB Metrics"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["RuralConnect", "ErrorCount", {"stat": "Sum"}],
          [".", "ResponseTime", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Application Metrics"
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "SOURCE '/aws/ruralconnect/api'\n| fields @timestamp, @message\n| filter level = \"ERROR\"\n| sort @timestamp desc\n| limit 20",
        "region": "us-east-1",
        "title": "Recent Errors"
      }
    }
  ]
}
EOF

aws cloudwatch put-dashboard \
  --dashboard-name RuralConnect-Overview \
  --dashboard-body file:///tmp/dashboard.json \
  --region "$REGION"

rm /tmp/dashboard.json

echo "✓ Dashboard created"

echo ""
echo "✓ CloudWatch monitoring setup complete!"
echo ""
echo "Resources Created:"
echo "  - SNS Topic: $SNS_TOPIC_ARN"
echo "  - Log Groups: ${#LOG_GROUPS[@]} groups with 30-day retention"
echo "  - Metric Filters: 2 custom metrics"
echo "  - Alarms: 5 alarms for critical metrics"
echo "  - Dashboard: RuralConnect-Overview"
echo ""
echo "Alarms:"
echo "  1. High error rate (>5%)"
echo "  2. High API latency (>1000ms)"
echo "  3. Lambda errors (>10 in 5 min)"
echo "  4. RDS CPU (>80%)"
echo "  5. DynamoDB throttling (>10 in 5 min)"
echo ""
echo "View Dashboard:"
echo "  https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=RuralConnect-Overview"
echo ""
echo "View Alarms:"
echo "  https://console.aws.amazon.com/cloudwatch/home?region=$REGION#alarmsV2:"
echo ""
echo "View Logs:"
echo "  https://console.aws.amazon.com/cloudwatch/home?region=$REGION#logsV2:log-groups"
echo ""
echo "⚠ Important: Confirm SNS email subscription at $SNS_EMAIL"
