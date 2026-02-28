import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import crypto from 'crypto';

interface UserProfile {
  userId: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  language?: string;
  location?: {
    district?: string;
    state?: string;
    pincode?: string;
  };
  occupation?: string;
  aadhaarHash?: string; // Hashed Aadhaar number
  profilePicture?: string;
  preferences?: {
    notifications?: boolean;
    language?: string;
    theme?: 'light' | 'dark';
  };
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export class UserProfileService {
  private docClient: DynamoDBDocumentClient;
  private userTable: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.docClient = DynamoDBDocumentClient.from(dynamoClient);
    this.userTable = process.env.USER_PROFILES_TABLE || 'ruralconnect-users';
  }

  async createUserProfile(
    phoneNumber: string,
    profileData?: Partial<Omit<UserProfile, 'userId' | 'phoneNumber' | 'createdAt' | 'updatedAt'>>
  ): Promise<UserProfile> {
    const userId = this.generateUserId();
    const timestamp = new Date().toISOString();

    const userProfile: UserProfile = {
      userId,
      phoneNumber,
      ...profileData,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    try {
      await this.docClient.send(
        new PutCommand({
          TableName: this.userTable,
          Item: userProfile,
          ConditionExpression: 'attribute_not_exists(userId)',
        })
      );

      return userProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw new Error('Failed to create user profile');
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const result = await this.docClient.send(
        new GetCommand({
          TableName: this.userTable,
          Key: { userId },
        })
      );

      return (result.Item as UserProfile) || null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<UserProfile | null> {
    // In production, this would use a GSI on phoneNumber
    // For now, this is a simplified implementation
    try {
      // This is a placeholder - would need GSI query in production
      return null;
    } catch (error) {
      console.error('Error getting user by phone:', error);
      return null;
    }
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<Omit<UserProfile, 'userId' | 'phoneNumber' | 'createdAt'>>
  ): Promise<UserProfile | null> {
    try {
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'userId' && key !== 'phoneNumber' && key !== 'createdAt') {
          updateExpressions.push(`#${key} = :${key}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:${key}`] = value;
        }
      });

      // Always update the updatedAt timestamp
      updateExpressions.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      if (updateExpressions.length === 0) {
        return this.getUserProfile(userId);
      }

      const result = await this.docClient.send(
        new UpdateCommand({
          TableName: this.userTable,
          Key: { userId },
          UpdateExpression: `SET ${updateExpressions.join(', ')}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: 'ALL_NEW',
        })
      );

      return result.Attributes as UserProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  }

  async deleteUserProfile(userId: string): Promise<boolean> {
    try {
      // Get user profile first to anonymize data
      const profile = await this.getUserProfile(userId);
      
      if (!profile) {
        return false;
      }

      // Anonymize user data before deletion (GDPR compliance)
      const anonymizedProfile = {
        ...profile,
        name: 'DELETED_USER',
        email: undefined,
        phoneNumber: 'DELETED',
        aadhaarHash: undefined,
        profilePicture: undefined,
        updatedAt: new Date().toISOString(),
      };

      // Update with anonymized data
      await this.docClient.send(
        new PutCommand({
          TableName: this.userTable,
          Item: anonymizedProfile,
        })
      );

      // Optionally, delete the record entirely
      // await this.docClient.send(
      //   new DeleteCommand({
      //     TableName: this.userTable,
      //     Key: { userId },
      //   })
      // );

      return true;
    } catch (error) {
      console.error('Error deleting user profile:', error);
      return false;
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.docClient.send(
        new UpdateCommand({
          TableName: this.userTable,
          Key: { userId },
          UpdateExpression: 'SET #lastLoginAt = :lastLoginAt',
          ExpressionAttributeNames: {
            '#lastLoginAt': 'lastLoginAt',
          },
          ExpressionAttributeValues: {
            ':lastLoginAt': new Date().toISOString(),
          },
        })
      );
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  async validateProfile(profile: Partial<UserProfile>): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (profile.email && !this.isValidEmail(profile.email)) {
      errors.push('Invalid email format');
    }

    if (profile.phoneNumber && !this.isValidPhoneNumber(profile.phoneNumber)) {
      errors.push('Invalid phone number format');
    }

    if (profile.dateOfBirth && !this.isValidDate(profile.dateOfBirth)) {
      errors.push('Invalid date of birth');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}
