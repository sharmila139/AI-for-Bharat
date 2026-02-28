import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import crypto from 'crypto';

interface OTPRecord {
  phoneNumber: string;
  otp: string;
  createdAt: string;
  expiresAt: string;
  attempts: number;
  verified: boolean;
}

export class OTPService {
  private snsClient: SNSClient;
  private docClient: DynamoDBDocumentClient;
  private otpTable: string;
  private otpLength: number = 6;
  private otpExpiryMinutes: number = 10;
  private maxAttempts: number = 3;

  constructor() {
    this.snsClient = new SNSClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.docClient = DynamoDBDocumentClient.from(dynamoClient);
    this.otpTable = process.env.OTP_TABLE || 'ruralconnect-otp';
  }

  async sendOTP(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    // Validate phone number format (Indian format)
    if (!this.isValidPhoneNumber(phoneNumber)) {
      return {
        success: false,
        message: 'Invalid phone number format. Use +91XXXXXXXXXX',
      };
    }

    // Generate OTP
    const otp = this.generateOTP();

    // Store OTP in database
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.otpExpiryMinutes * 60 * 1000);

    const otpRecord: OTPRecord = {
      phoneNumber,
      otp,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      attempts: 0,
      verified: false,
    };

    try {
      await this.docClient.send(
        new PutCommand({
          TableName: this.otpTable,
          Item: otpRecord,
        })
      );

      // Send OTP via SMS using AWS SNS
      await this.sendSMS(phoneNumber, otp);

      return {
        success: true,
        message: `OTP sent successfully to ${phoneNumber}`,
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.',
      };
    }
  }

  async verifyOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      // Retrieve OTP record
      const result = await this.docClient.send(
        new GetCommand({
          TableName: this.otpTable,
          Key: { phoneNumber },
        })
      );

      const otpRecord = result.Item as OTPRecord;

      if (!otpRecord) {
        return {
          success: false,
          message: 'No OTP found for this phone number. Please request a new OTP.',
        };
      }

      // Check if OTP is expired
      if (new Date() > new Date(otpRecord.expiresAt)) {
        await this.deleteOTP(phoneNumber);
        return {
          success: false,
          message: 'OTP has expired. Please request a new OTP.',
        };
      }

      // Check if max attempts exceeded
      if (otpRecord.attempts >= this.maxAttempts) {
        await this.deleteOTP(phoneNumber);
        return {
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new OTP.',
        };
      }

      // Check if already verified
      if (otpRecord.verified) {
        return {
          success: false,
          message: 'OTP already used. Please request a new OTP.',
        };
      }

      // Verify OTP
      if (otpRecord.otp !== otp) {
        // Increment attempts
        await this.docClient.send(
          new PutCommand({
            TableName: this.otpTable,
            Item: {
              ...otpRecord,
              attempts: otpRecord.attempts + 1,
            },
          })
        );

        return {
          success: false,
          message: `Invalid OTP. ${this.maxAttempts - otpRecord.attempts - 1} attempts remaining.`,
        };
      }

      // Mark as verified
      await this.docClient.send(
        new PutCommand({
          TableName: this.otpTable,
          Item: {
            ...otpRecord,
            verified: true,
          },
        })
      );

      // Delete OTP record after successful verification
      await this.deleteOTP(phoneNumber);

      return {
        success: true,
        message: 'OTP verified successfully.',
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'Failed to verify OTP. Please try again.',
      };
    }
  }

  private generateOTP(): string {
    // Generate cryptographically secure random OTP
    const otp = crypto.randomInt(0, Math.pow(10, this.otpLength));
    return otp.toString().padStart(this.otpLength, '0');
  }

  private async sendSMS(phoneNumber: string, otp: string): Promise<void> {
    const message = `Your RuralConnect AI verification code is: ${otp}. Valid for ${this.otpExpiryMinutes} minutes. Do not share this code with anyone.`;

    try {
      await this.snsClient.send(
        new PublishCommand({
          PhoneNumber: phoneNumber,
          Message: message,
          MessageAttributes: {
            'AWS.SNS.SMS.SenderID': {
              DataType: 'String',
              StringValue: 'RuralAI',
            },
            'AWS.SNS.SMS.SMSType': {
              DataType: 'String',
              StringValue: 'Transactional',
            },
          },
        })
      );
    } catch (error) {
      console.error('Error sending SMS via SNS:', error);
      throw error;
    }
  }

  private async deleteOTP(phoneNumber: string): Promise<void> {
    try {
      await this.docClient.send(
        new DeleteCommand({
          TableName: this.otpTable,
          Key: { phoneNumber },
        })
      );
    } catch (error) {
      console.error('Error deleting OTP:', error);
    }
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Indian phone number format: +91XXXXXXXXXX (10 digits after +91)
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  }

  async resendOTP(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    // Delete existing OTP
    await this.deleteOTP(phoneNumber);

    // Send new OTP
    return this.sendOTP(phoneNumber);
  }
}
