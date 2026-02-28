import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

interface FarmProfile {
  userId: string;
  farmId: string;
  farmName: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    district: string;
    state: string;
    pincode: string;
  };
  landSize: {
    value: number;
    unit: 'acre' | 'hectare';
  };
  soilType?: string;
  irrigationType?: 'drip' | 'sprinkler' | 'flood' | 'rainfed' | 'mixed';
  currentCrops?: Array<{
    cropName: string;
    sowingDate: string;
    expectedHarvestDate: string;
    area: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export class FarmProfileService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = process.env.FARM_PROFILES_TABLE || 'ruralconnect-farm-profiles';
  }

  async createFarmProfile(profile: Omit<FarmProfile, 'farmId' | 'createdAt' | 'updatedAt'>): Promise<FarmProfile> {
    const farmId = `farm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const farmProfile: FarmProfile = {
      ...profile,
      farmId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: farmProfile,
        ConditionExpression: 'attribute_not_exists(farmId)',
      })
    );

    return farmProfile;
  }

  async getFarmProfile(userId: string, farmId: string): Promise<FarmProfile | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { userId, farmId },
      })
    );

    return (result.Item as FarmProfile) || null;
  }

  async getUserFarms(userId: string): Promise<FarmProfile[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      })
    );

    return (result.Items as FarmProfile[]) || [];
  }

  async updateFarmProfile(
    userId: string,
    farmId: string,
    updates: Partial<Omit<FarmProfile, 'userId' | 'farmId' | 'createdAt'>>
  ): Promise<FarmProfile> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'userId' && key !== 'farmId' && key !== 'createdAt') {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { userId, farmId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    return result.Attributes as FarmProfile;
  }

  async deleteFarmProfile(userId: string, farmId: string): Promise<void> {
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { userId, farmId },
      })
    );
  }
}
