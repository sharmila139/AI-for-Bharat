/**
 * AWS Configuration
 * Centralized AWS service configuration
 */

export const AWS_CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  
  // AWS Bedrock Configuration
  bedrock: {
    region: process.env.AWS_BEDROCK_REGION || 'us-east-1',
    
    // Primary AI Model (Claude 3 Haiku - fast and cost-effective)
    primaryModel: 'anthropic.claude-3-haiku-20240307-v1:0',
    
    // Fallback AI Model (same as primary for now)
    fallbackModel: 'anthropic.claude-3-haiku-20240307-v1:0',
    
    // Request configuration
    timeout: 30000, // 30 seconds
    maxTokens: 2048,
    
    // Temperature settings by use case
    temperature: {
      recommendations: 0.7, // More creative for recommendations
      analysis: 0.3,        // More precise for analysis
      classification: 0.2,  // Very precise for classification
    },
  },
  
  // API Gateway Configuration
  apiGateway: {
    baseUrl: process.env.API_BASE_URL || 'https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com',
    timeout: 30000,
  },
  
  // S3 Configuration (for future use)
  s3: {
    region: process.env.AWS_S3_REGION || 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET || 'ruralconnect-uploads',
  },
  
  // DynamoDB Configuration (for future use)
  dynamodb: {
    region: process.env.AWS_DYNAMODB_REGION || 'us-east-1',
    sessionTable: process.env.AWS_DYNAMODB_SESSION_TABLE || 'ruralconnect-sessions',
    otpTable: process.env.AWS_DYNAMODB_OTP_TABLE || 'ruralconnect-otps',
  },
};

export default AWS_CONFIG;
