/**
 * Sync Queue Service
 * Manages offline operations with priority ordering
 */

import { v4 as uuidv4 } from 'uuid';
import RealmDatabase, { OfflineOperation } from '../../database/realm-config';

export interface QueueOperation {
  id: string;
  operationType: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  data: any;
  priority: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  createdAt: Date;
  lastAttemptAt?: Date;
  error?: string;
}

// Priority levels
export enum SyncPriority {
  CRITICAL = 10,  // User authentication, critical data
  HIGH = 7,       // User profile updates, important transactions
  MEDIUM = 5,     // Regular data updates
  LOW = 3,        // Cache updates, non-critical data
  BACKGROUND = 1  // Analytics, logs
}

// Entity type priority mapping
const ENTITY_PRIORITY_MAP: Record<string, number> = {
  'user': SyncPriority.CRITICAL,
  'auth': SyncPriority.CRITICAL,
  'profile': SyncPriority.HIGH,
  'farm': SyncPriority.HIGH,
  'grievance': SyncPriority.HIGH,
  'poll_vote': SyncPriority.HIGH,
  'health_record': SyncPriority.MEDIUM,
  'education_progress': SyncPriority.MEDIUM,
  'market_price': SyncPriority.LOW,
  'weather': SyncPriority.LOW,
  'analytics': SyncPriority.BACKGROUND
};

export class SyncQueue {
  private static maxRetries = 3;
  private static retryDelayMs = 5000; // 5 seconds

  /**
   * Add operation to sync queue
   */
  static addOperation(
    operationType: 'create' | 'update' | 'delete',
    entityType: string,
    entityId: string,
    data: any,
    customPriority?: number
  ): string {
    const realm = RealmDatabase.getInstance();
    const operationId = uuidv4();
    
    // Determine priority
    const priority = customPriority || ENTITY_PRIORITY_MAP[entityType] || SyncPriority.MEDIUM;

    realm.write(() => {
      realm.create('OfflineOperation', {
        _id: operationId,
        operationType,
        entityType,
        entityId,
        data: JSON.stringify(data),
        priority,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date()
      });
    });

    return operationId;
  }

  /**
   * Get pending operations sorted by priority
   */
  static getPendingOperations(): OfflineOperation[] {
    const realm = RealmDatabase.getInstance();
    const operations = realm.objects<OfflineOperation>('OfflineOperation')
      .filtered('status = "pending" OR status = "failed"')
      .sorted([['priority', true], ['createdAt', false]]); // High priority first, then oldest first

    return Array.from(operations);
  }

  /**
   * Get operations by entity
   */
  static getOperationsByEntity(entityType: string, entityId: string): OfflineOperation[] {
    const realm = RealmDatabase.getInstance();
    const operations = realm.objects<OfflineOperation>('OfflineOperation')
      .filtered('entityType = $0 AND entityId = $1', entityType, entityId)
      .sorted('createdAt', false);

    return Array.from(operations);
  }

  /**
   * Update operation status
   */
  static updateOperationStatus(
    operationId: string,
    status: 'pending' | 'syncing' | 'synced' | 'failed',
    error?: string
  ): void {
    const realm = RealmDatabase.getInstance();
    const operation = realm.objectForPrimaryKey<OfflineOperation>('OfflineOperation', operationId);

    if (operation) {
      realm.write(() => {
        operation.status = status;
        operation.lastAttemptAt = new Date();
        if (error) {
          operation.error = error;
        }
        if (status === 'failed') {
          operation.retryCount += 1;
        }
      });
    }
  }

  /**
   * Mark operation as synced
   */
  static markAsSynced(operationId: string): void {
    this.updateOperationStatus(operationId, 'synced');
  }

  /**
   * Mark operation as failed
   */
  static markAsFailed(operationId: string, error: string): void {
    this.updateOperationStatus(operationId, 'failed', error);
  }

  /**
   * Delete operation from queue
   */
  static deleteOperation(operationId: string): void {
    const realm = RealmDatabase.getInstance();
    const operation = realm.objectForPrimaryKey<OfflineOperation>('OfflineOperation', operationId);

    if (operation) {
      realm.write(() => {
        realm.delete(operation);
      });
    }
  }

  /**
   * Get queue statistics
   */
  static getQueueStats(): {
    total: number;
    pending: number;
    syncing: number;
    synced: number;
    failed: number;
    byPriority: Record<number, number>;
  } {
    const realm = RealmDatabase.getInstance();
    const allOperations = realm.objects<OfflineOperation>('OfflineOperation');

    const stats = {
      total: allOperations.length,
      pending: 0,
      syncing: 0,
      synced: 0,
      failed: 0,
      byPriority: {} as Record<number, number>
    };

    allOperations.forEach(op => {
      // Count by status
      if (op.status === 'pending') stats.pending++;
      else if (op.status === 'syncing') stats.syncing++;
      else if (op.status === 'synced') stats.synced++;
      else if (op.status === 'failed') stats.failed++;

      // Count by priority
      stats.byPriority[op.priority] = (stats.byPriority[op.priority] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear synced operations
   */
  static clearSyncedOperations(): void {
    const realm = RealmDatabase.getInstance();
    const syncedOps = realm.objects<OfflineOperation>('OfflineOperation')
      .filtered('status = "synced"');

    realm.write(() => {
      realm.delete(syncedOps);
    });
  }

  /**
   * Clear old synced operations (older than specified days)
   */
  static clearOldSyncedOperations(daysOld: number = 7): void {
    const realm = RealmDatabase.getInstance();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldSyncedOps = realm.objects<OfflineOperation>('OfflineOperation')
      .filtered('status = "synced" AND createdAt < $0', cutoffDate);

    realm.write(() => {
      realm.delete(oldSyncedOps);
    });
  }

  /**
   * Reset failed operations for retry
   */
  static resetFailedOperations(): void {
    const realm = RealmDatabase.getInstance();
    const failedOps = realm.objects<OfflineOperation>('OfflineOperation')
      .filtered('status = "failed" AND retryCount < $0', this.maxRetries);

    realm.write(() => {
      failedOps.forEach(op => {
        op.status = 'pending';
        op.error = undefined;
      });
    });
  }

  /**
   * Check if operation should be retried
   */
  static shouldRetry(operation: OfflineOperation): boolean {
    return operation.status === 'failed' && operation.retryCount < this.maxRetries;
  }

  /**
   * Get retry delay for operation
   */
  static getRetryDelay(retryCount: number): number {
    // Exponential backoff: 5s, 10s, 20s
    return this.retryDelayMs * Math.pow(2, retryCount);
  }

  /**
   * Consolidate operations (remove duplicate updates)
   */
  static consolidateOperations(): void {
    const realm = RealmDatabase.getInstance();
    const pendingOps = realm.objects<OfflineOperation>('OfflineOperation')
      .filtered('status = "pending"')
      .sorted('createdAt', false);

    const seen = new Map<string, OfflineOperation>();

    realm.write(() => {
      pendingOps.forEach(op => {
        const key = `${op.entityType}:${op.entityId}`;
        
        if (seen.has(key)) {
          // If we've seen this entity before, keep only the latest operation
          const existing = seen.get(key)!;
          
          // Delete the older operation
          if (existing.createdAt < op.createdAt) {
            realm.delete(existing);
            seen.set(key, op);
          } else {
            realm.delete(op);
          }
        } else {
          seen.set(key, op);
        }
      });
    });
  }

  /**
   * Get operations by priority level
   */
  static getOperationsByPriority(priority: number): OfflineOperation[] {
    const realm = RealmDatabase.getInstance();
    const operations = realm.objects<OfflineOperation>('OfflineOperation')
      .filtered('priority = $0 AND (status = "pending" OR status = "failed")', priority)
      .sorted('createdAt', false);

    return Array.from(operations);
  }

  /**
   * Get high priority operations
   */
  static getHighPriorityOperations(): OfflineOperation[] {
    const realm = RealmDatabase.getInstance();
    const operations = realm.objects<OfflineOperation>('OfflineOperation')
      .filtered('priority >= $0 AND (status = "pending" OR status = "failed")', SyncPriority.HIGH)
      .sorted([['priority', true], ['createdAt', false]]);

    return Array.from(operations);
  }

  /**
   * Check if there are pending operations
   */
  static hasPendingOperations(): boolean {
    const realm = RealmDatabase.getInstance();
    const pendingCount = realm.objects<OfflineOperation>('OfflineOperation')
      .filtered('status = "pending" OR status = "failed"').length;

    return pendingCount > 0;
  }

  /**
   * Get pending operations count
   */
  static getPendingCount(): number {
    const realm = RealmDatabase.getInstance();
    return realm.objects<OfflineOperation>('OfflineOperation')
      .filtered('status = "pending" OR status = "failed"').length;
  }

  /**
   * Clear all operations (for testing)
   */
  static clearAll(): void {
    const realm = RealmDatabase.getInstance();
    const allOps = realm.objects<OfflineOperation>('OfflineOperation');

    realm.write(() => {
      realm.delete(allOps);
    });
  }
}

export default SyncQueue;
