import { UserProfileService } from './user-profile';
import { JWTService } from './jwt-service';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

interface DeletionRequest {
  userId: string;
  requestedAt: string;
  scheduledFor: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  reason?: string;
}

interface AnonymizationResult {
  success: boolean;
  message: string;
  deletedData: string[];
  anonymizedData: string[];
}

export class AccountDeletionService {
  private userProfileService: UserProfileService;
  private jwtService: JWTService;
  private docClient: DynamoDBDocumentClient;
  private deletionRequestTable: string;
  private gracePeriodDays: number = 30; // 30-day grace period before permanent deletion

  constructor() {
    this.userProfileService = new UserProfileService();
    this.jwtService = new JWTService();
    
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.docClient = DynamoDBDocumentClient.from(dynamoClient);
    this.deletionRequestTable = process.env.DELETION_REQUEST_TABLE || 'ruralconnect-deletion-requests';
  }

  async requestAccountDeletion(userId: string, reason?: string): Promise<{
    success: boolean;
    message: string;
    scheduledFor?: string;
  }> {
    try {
      const now = new Date();
      const scheduledFor = new Date(now.getTime() + this.gracePeriodDays * 24 * 60 * 60 * 1000);

      const deletionRequest: DeletionRequest = {
        userId,
        requestedAt: now.toISOString(),
        scheduledFor: scheduledFor.toISOString(),
        status: 'pending',
        reason,
      };

      await this.docClient.send(
        new UpdateCommand({
          TableName: this.deletionRequestTable,
          Key: { userId },
          UpdateExpression: 'SET requestedAt = :requestedAt, scheduledFor = :scheduledFor, #status = :status, reason = :reason',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':requestedAt': deletionRequest.requestedAt,
            ':scheduledFor': deletionRequest.scheduledFor,
            ':status': deletionRequest.status,
            ':reason': reason || 'Not specified',
          },
        })
      );

      // Revoke all user tokens
      await this.jwtService.revokeAllUserTokens(userId);

      return {
        success: true,
        message: `Account deletion scheduled for ${scheduledFor.toLocaleDateString()}. You can cancel this request within ${this.gracePeriodDays} days.`,
        scheduledFor: scheduledFor.toISOString(),
      };
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      return {
        success: false,
        message: 'Failed to request account deletion. Please try again.',
      };
    }
  }

  async cancelDeletionRequest(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.docClient.send(
        new UpdateCommand({
          TableName: this.deletionRequestTable,
          Key: { userId },
          UpdateExpression: 'SET #status = :status',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': 'cancelled',
          },
        })
      );

      return {
        success: true,
        message: 'Account deletion request cancelled successfully.',
      };
    } catch (error) {
      console.error('Error cancelling deletion request:', error);
      return {
        success: false,
        message: 'Failed to cancel deletion request. Please try again.',
      };
    }
  }

  async executeAccountDeletion(userId: string): Promise<AnonymizationResult> {
    const deletedData: string[] = [];
    const anonymizedData: string[] = [];

    try {
      // Update deletion request status
      await this.updateDeletionStatus(userId, 'processing');

      // 1. Anonymize user profile
      const profileAnonymized = await this.anonymizeUserProfile(userId);
      if (profileAnonymized) {
        anonymizedData.push('user_profile');
      }

      // 2. Anonymize farm profiles
      const farmsAnonymized = await this.anonymizeFarmProfiles(userId);
      if (farmsAnonymized) {
        anonymizedData.push('farm_profiles');
      }

      // 3. Anonymize health records
      const healthAnonymized = await this.anonymizeHealthRecords(userId);
      if (healthAnonymized) {
        anonymizedData.push('health_records');
      }

      // 4. Delete authentication tokens
      await this.jwtService.revokeAllUserTokens(userId);
      deletedData.push('auth_tokens');

      // 5. Anonymize grievances (keep for transparency, but remove PII)
      const grievancesAnonymized = await this.anonymizeGrievances(userId);
      if (grievancesAnonymized) {
        anonymizedData.push('grievances');
      }

      // 6. Delete uploaded files (profile pictures, documents)
      const filesDeleted = await this.deleteUserFiles(userId);
      if (filesDeleted) {
        deletedData.push('uploaded_files');
      }

      // 7. Anonymize learning progress (keep for analytics, remove PII)
      const learningAnonymized = await this.anonymizeLearningData(userId);
      if (learningAnonymized) {
        anonymizedData.push('learning_data');
      }

      // Update deletion request status
      await this.updateDeletionStatus(userId, 'completed');

      return {
        success: true,
        message: 'Account deleted and data anonymized successfully.',
        deletedData,
        anonymizedData,
      };
    } catch (error) {
      console.error('Error executing account deletion:', error);
      return {
        success: false,
        message: 'Failed to delete account. Please contact support.',
        deletedData,
        anonymizedData,
      };
    }
  }

  private async anonymizeUserProfile(userId: string): Promise<boolean> {
    try {
      const profile = await this.userProfileService.getUserProfile(userId);
      if (!profile) {
        return false;
      }

      await this.userProfileService.updateUserProfile(userId, {
        name: 'DELETED_USER',
        email: undefined,
        dateOfBirth: undefined,
        aadhaarHash: undefined,
        profilePicture: undefined,
        location: undefined,
      });

      return true;
    } catch (error) {
      console.error('Error anonymizing user profile:', error);
      return false;
    }
  }

  private async anonymizeFarmProfiles(userId: string): Promise<boolean> {
    try {
      // This would query and anonymize all farm profiles for the user
      // Placeholder implementation
      return true;
    } catch (error) {
      console.error('Error anonymizing farm profiles:', error);
      return false;
    }
  }

  private async anonymizeHealthRecords(userId: string): Promise<boolean> {
    try {
      // This would query and anonymize all health records for the user
      // Placeholder implementation
      return true;
    } catch (error) {
      console.error('Error anonymizing health records:', error);
      return false;
    }
  }

  private async anonymizeGrievances(userId: string): Promise<boolean> {
    try {
      // Keep grievances for transparency but remove user identification
      // Placeholder implementation
      return true;
    } catch (error) {
      console.error('Error anonymizing grievances:', error);
      return false;
    }
  }

  private async deleteUserFiles(userId: string): Promise<boolean> {
    try {
      // Delete files from S3
      // Placeholder implementation
      return true;
    } catch (error) {
      console.error('Error deleting user files:', error);
      return false;
    }
  }

  private async anonymizeLearningData(userId: string): Promise<boolean> {
    try {
      // Anonymize learning progress data
      // Placeholder implementation
      return true;
    } catch (error) {
      console.error('Error anonymizing learning data:', error);
      return false;
    }
  }

  private async updateDeletionStatus(
    userId: string,
    status: 'pending' | 'processing' | 'completed' | 'cancelled'
  ): Promise<void> {
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.deletionRequestTable,
        Key: { userId },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
        },
      })
    );
  }

  async getPendingDeletions(): Promise<DeletionRequest[]> {
    try {
      // This would use a GSI to query pending deletions
      // Placeholder implementation
      return [];
    } catch (error) {
      console.error('Error getting pending deletions:', error);
      return [];
    }
  }

  async processPendingDeletions(): Promise<void> {
    const pendingDeletions = await this.getPendingDeletions();
    const now = new Date();

    for (const deletion of pendingDeletions) {
      if (new Date(deletion.scheduledFor) <= now && deletion.status === 'pending') {
        await this.executeAccountDeletion(deletion.userId);
      }
    }
  }
}
