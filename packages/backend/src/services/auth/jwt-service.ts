import jwt from 'jsonwebtoken';
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import crypto from 'crypto';

interface TokenPayload {
  userId: string;
  phoneNumber: string;
  role?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface RefreshTokenRecord {
  refreshToken: string;
  userId: string;
  phoneNumber: string;
  createdAt: string;
  expiresAt: string;
  revoked: boolean;
}

export class JWTService {
  private docClient: DynamoDBDocumentClient;
  private refreshTokenTable: string;
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string = '15m'; // 15 minutes
  private refreshTokenExpiry: string = '30d'; // 30 days

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.docClient = DynamoDBDocumentClient.from(dynamoClient);
    this.refreshTokenTable = process.env.REFRESH_TOKEN_TABLE || 'ruralconnect-refresh-tokens';

    // In production, these should be stored in AWS Secrets Manager
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || this.generateSecret();
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || this.generateSecret();
  }

  generateTokens(payload: TokenPayload): TokenPair {
    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      {
        userId: payload.userId,
        phoneNumber: payload.phoneNumber,
        role: payload.role || 'user',
        type: 'access',
      },
      this.accessTokenSecret,
      {
        expiresIn: this.accessTokenExpiry,
        issuer: 'ruralconnect-ai',
        audience: 'ruralconnect-api',
      }
    );

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
      {
        userId: payload.userId,
        phoneNumber: payload.phoneNumber,
        type: 'refresh',
        jti: crypto.randomBytes(16).toString('hex'), // Unique token ID
      },
      this.refreshTokenSecret,
      {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'ruralconnect-ai',
        audience: 'ruralconnect-api',
      }
    );

    // Store refresh token in database
    this.storeRefreshToken(refreshToken, payload.userId, payload.phoneNumber);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'ruralconnect-ai',
        audience: 'ruralconnect-api',
      }) as any;

      if (decoded.type !== 'access') {
        return null;
      }

      return {
        userId: decoded.userId,
        phoneNumber: decoded.phoneNumber,
        role: decoded.role,
      };
    } catch (error) {
      console.error('Error verifying access token:', error);
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
      // Verify JWT signature and expiry
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'ruralconnect-ai',
        audience: 'ruralconnect-api',
      }) as any;

      if (decoded.type !== 'refresh') {
        return null;
      }

      // Check if token is revoked in database
      const result = await this.docClient.send(
        new GetCommand({
          TableName: this.refreshTokenTable,
          Key: { refreshToken: token },
        })
      );

      const tokenRecord = result.Item as RefreshTokenRecord;

      if (!tokenRecord) {
        return null; // Token not found
      }

      if (tokenRecord.revoked) {
        return null; // Token has been revoked
      }

      if (new Date() > new Date(tokenRecord.expiresAt)) {
        return null; // Token expired
      }

      return {
        userId: decoded.userId,
        phoneNumber: decoded.phoneNumber,
      };
    } catch (error) {
      console.error('Error verifying refresh token:', error);
      return null;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
    const payload = await this.verifyRefreshToken(refreshToken);

    if (!payload) {
      return null;
    }

    // Generate new token pair
    return this.generateTokens(payload);
  }

  async revokeRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      const result = await this.docClient.send(
        new GetCommand({
          TableName: this.refreshTokenTable,
          Key: { refreshToken },
        })
      );

      const tokenRecord = result.Item as RefreshTokenRecord;

      if (!tokenRecord) {
        return false;
      }

      // Mark as revoked
      await this.docClient.send(
        new PutCommand({
          TableName: this.refreshTokenTable,
          Item: {
            ...tokenRecord,
            revoked: true,
          },
        })
      );

      return true;
    } catch (error) {
      console.error('Error revoking refresh token:', error);
      return false;
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    // In production, this would use a GSI to query by userId
    // For now, this is a placeholder
    console.log(`Revoking all tokens for user: ${userId}`);
  }

  private async storeRefreshToken(
    refreshToken: string,
    userId: string,
    phoneNumber: string
  ): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const tokenRecord: RefreshTokenRecord = {
      refreshToken,
      userId,
      phoneNumber,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      revoked: false,
    };

    try {
      await this.docClient.send(
        new PutCommand({
          TableName: this.refreshTokenTable,
          Item: tokenRecord,
        })
      );
    } catch (error) {
      console.error('Error storing refresh token:', error);
    }
  }

  private generateSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  }
}
