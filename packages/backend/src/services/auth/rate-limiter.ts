import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

interface RateLimitRecord {
  identifier: string; // userId or IP address
  requestCount: number;
  windowStart: string;
  windowEnd: string;
  blocked: boolean;
  ttl: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export class RateLimiterService {
  private docClient: DynamoDBDocumentClient;
  private rateLimitTable: string;
  private requestsPerHour: number = 1000;
  private windowSizeMs: number = 60 * 60 * 1000; // 1 hour in milliseconds

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.docClient = DynamoDBDocumentClient.from(dynamoClient);
    this.rateLimitTable = process.env.RATE_LIMIT_TABLE || 'ruralconnect-rate-limits';
  }

  async checkRateLimit(identifier: string): Promise<RateLimitResult> {
    try {
      const now = new Date();
      const windowStart = now.toISOString();
      const windowEnd = new Date(now.getTime() + this.windowSizeMs).toISOString();

      // Get current rate limit record
      const result = await this.docClient.send(
        new GetCommand({
          TableName: this.rateLimitTable,
          Key: { identifier },
        })
      );

      const record = result.Item as RateLimitRecord;

      // No existing record - create new one
      if (!record) {
        await this.createRateLimitRecord(identifier, windowStart, windowEnd);
        return {
          allowed: true,
          remaining: this.requestsPerHour - 1,
          resetAt: new Date(windowEnd),
        };
      }

      // Check if window has expired
      if (new Date() > new Date(record.windowEnd)) {
        // Reset the window
        await this.resetRateLimitWindow(identifier, windowStart, windowEnd);
        return {
          allowed: true,
          remaining: this.requestsPerHour - 1,
          resetAt: new Date(windowEnd),
        };
      }

      // Check if blocked
      if (record.blocked) {
        const resetAt = new Date(record.windowEnd);
        const retryAfter = Math.ceil((resetAt.getTime() - now.getTime()) / 1000);
        return {
          allowed: false,
          remaining: 0,
          resetAt,
          retryAfter,
        };
      }

      // Check if limit exceeded
      if (record.requestCount >= this.requestsPerHour) {
        // Block the identifier
        await this.blockIdentifier(identifier);
        const resetAt = new Date(record.windowEnd);
        const retryAfter = Math.ceil((resetAt.getTime() - now.getTime()) / 1000);
        return {
          allowed: false,
          remaining: 0,
          resetAt,
          retryAfter,
        };
      }

      // Increment request count
      await this.incrementRequestCount(identifier);

      return {
        allowed: true,
        remaining: this.requestsPerHour - record.requestCount - 1,
        resetAt: new Date(record.windowEnd),
      };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        remaining: this.requestsPerHour,
        resetAt: new Date(Date.now() + this.windowSizeMs),
      };
    }
  }

  private async createRateLimitRecord(
    identifier: string,
    windowStart: string,
    windowEnd: string
  ): Promise<void> {
    const ttl = Math.floor(new Date(windowEnd).getTime() / 1000) + 3600; // Add 1 hour buffer

    const record: RateLimitRecord = {
      identifier,
      requestCount: 1,
      windowStart,
      windowEnd,
      blocked: false,
      ttl,
    };

    await this.docClient.send(
      new PutCommand({
        TableName: this.rateLimitTable,
        Item: record,
      })
    );
  }

  private async resetRateLimitWindow(
    identifier: string,
    windowStart: string,
    windowEnd: string
  ): Promise<void> {
    const ttl = Math.floor(new Date(windowEnd).getTime() / 1000) + 3600;

    await this.docClient.send(
      new PutCommand({
        TableName: this.rateLimitTable,
        Item: {
          identifier,
          requestCount: 1,
          windowStart,
          windowEnd,
          blocked: false,
          ttl,
        },
      })
    );
  }

  private async incrementRequestCount(identifier: string): Promise<void> {
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.rateLimitTable,
        Key: { identifier },
        UpdateExpression: 'SET requestCount = requestCount + :inc',
        ExpressionAttributeValues: {
          ':inc': 1,
        },
      })
    );
  }

  private async blockIdentifier(identifier: string): Promise<void> {
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.rateLimitTable,
        Key: { identifier },
        UpdateExpression: 'SET blocked = :blocked',
        ExpressionAttributeValues: {
          ':blocked': true,
        },
      })
    );
  }

  async getRateLimitStatus(identifier: string): Promise<{
    requestCount: number;
    limit: number;
    remaining: number;
    resetAt: Date;
    blocked: boolean;
  } | null> {
    try {
      const result = await this.docClient.send(
        new GetCommand({
          TableName: this.rateLimitTable,
          Key: { identifier },
        })
      );

      const record = result.Item as RateLimitRecord;

      if (!record) {
        return null;
      }

      return {
        requestCount: record.requestCount,
        limit: this.requestsPerHour,
        remaining: Math.max(0, this.requestsPerHour - record.requestCount),
        resetAt: new Date(record.windowEnd),
        blocked: record.blocked,
      };
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      return null;
    }
  }

  async resetRateLimit(identifier: string): Promise<boolean> {
    try {
      const now = new Date();
      const windowStart = now.toISOString();
      const windowEnd = new Date(now.getTime() + this.windowSizeMs).toISOString();

      await this.resetRateLimitWindow(identifier, windowStart, windowEnd);
      return true;
    } catch (error) {
      console.error('Error resetting rate limit:', error);
      return false;
    }
  }

  // Custom rate limit for specific endpoints
  async checkCustomRateLimit(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const originalLimit = this.requestsPerHour;
    const originalWindow = this.windowSizeMs;

    this.requestsPerHour = limit;
    this.windowSizeMs = windowMs;

    const result = await this.checkRateLimit(`${identifier}_custom`);

    this.requestsPerHour = originalLimit;
    this.windowSizeMs = originalWindow;

    return result;
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiterService | null = null;

export function getRateLimiter(): RateLimiterService {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiterService();
  }
  return rateLimiterInstance;
}
