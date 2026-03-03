/**
 * Sync Queue Service
 * Manages offline operations with priority ordering
 * NOTE: Stubbed implementation without Realm (in-memory only)
 */

import { v4 as uuidv4 } from 'uuid';

// Stub OfflineOperation interface
export interface OfflineOperation {
  _id: string;
  operationType: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  data: string;
  priority: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  createdAt: Date;
  lastAttemptAt?: Date;
  error?: string;
}

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

// In-memory storage (stub)
const operationsStore: Map<string, OfflineOperation> = new Map();

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
    const operationId = uuidv4();
    const priority = customPriority || ENTITY_PRIORITY_MAP[entityType] || SyncPriority.MEDIUM;

    operationsStore.set(operationId, {
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

    return operationId;
  }

  /**
   * Get pending operations sorted by priority
   */
  static getPendingOperations(): OfflineOperation[] {
    return Array.from(operationsStore.values())
      .filter(op => op.status === 'pending' || op.status === 'failed')
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }

  /**
   * Get operations by entity
   */
  static getOperationsByEntity(entityType: string, entityId: string): OfflineOperation[] {
    return Array.from(operationsStore.values())
      .filter(op => op.entityType === entityType && op.entityId === entityId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Update operation status
   */
  static updateOperationStatus(
    operationId: string,
    status: 'pending' | 'syncing' | 'synced' | 'failed',
    error?: string
  ): void {
    const operation = operationsStore.get(operationId);
    if (operation) {
      operation.status = status;
      operation.lastAttemptAt = new Date();
      if (error) {
        operation.error = error;
      }
      if (status === 'failed') {
        operation.retryCount += 1;
      }
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
    operationsStore.delete(operationId);
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
    const stats = {
      total: operationsStore.size,
      pending: 0,
      syncing: 0,
      synced: 0,
      failed: 0,
      byPriority: {} as Record<number, number>
    };

    operationsStore.forEach(op => {
      if (op.status === 'pending') stats.pending++;
      else if (op.status === 'syncing') stats.syncing++;
      else if (op.status === 'synced') stats.synced++;
      else if (op.status === 'failed') stats.failed++;

      stats.byPriority[op.priority] = (stats.byPriority[op.priority] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear synced operations
   */
  static clearSyncedOperations(): void {
    Array.from(operationsStore.entries()).forEach(([id, op]) => {
      if (op.status === 'synced') {
        operationsStore.delete(id);
      }
    });
  }

  /**
   * Clear old synced operations (older than specified days)
   */
  static clearOldSyncedOperations(daysOld: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    Array.from(operationsStore.entries()).forEach(([id, op]) => {
      if (op.status === 'synced' && op.createdAt < cutoffDate) {
        operationsStore.delete(id);
      }
    });
  }

  /**
   * Reset failed operations for retry
   */
  static resetFailedOperations(): void {
    operationsStore.forEach(op => {
      if (op.status === 'failed' && op.retryCount < this.maxRetries) {
        op.status = 'pending';
        op.error = undefined;
      }
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
    return this.retryDelayMs * Math.pow(2, retryCount);
  }

  /**
   * Consolidate operations (remove duplicate updates)
   */
  static consolidateOperations(): void {
    const seen = new Map<string, OfflineOperation>();
    const toDelete: string[] = [];

    Array.from(operationsStore.entries())
      .filter(([_, op]) => op.status === 'pending')
      .sort(([_, a], [__, b]) => b.createdAt.getTime() - a.createdAt.getTime())
      .forEach(([id, op]) => {
        const key = `${op.entityType}:${op.entityId}`;
        
        if (seen.has(key)) {
          const existing = seen.get(key)!;
          if (existing.createdAt < op.createdAt) {
            toDelete.push(existing._id);
            seen.set(key, op);
          } else {
            toDelete.push(id);
          }
        } else {
          seen.set(key, op);
        }
      });

    toDelete.forEach(id => operationsStore.delete(id));
  }

  /**
   * Get operations by priority level
   */
  static getOperationsByPriority(priority: number): OfflineOperation[] {
    return Array.from(operationsStore.values())
      .filter(op => op.priority === priority && (op.status === 'pending' || op.status === 'failed'))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get high priority operations
   */
  static getHighPriorityOperations(): OfflineOperation[] {
    return Array.from(operationsStore.values())
      .filter(op => op.priority >= SyncPriority.HIGH && (op.status === 'pending' || op.status === 'failed'))
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }

  /**
   * Check if there are pending operations
   */
  static hasPendingOperations(): boolean {
    return Array.from(operationsStore.values())
      .some(op => op.status === 'pending' || op.status === 'failed');
  }

  /**
   * Get pending operations count
   */
  static getPendingCount(): number {
    return Array.from(operationsStore.values())
      .filter(op => op.status === 'pending' || op.status === 'failed').length;
  }

  /**
   * Clear all operations (for testing)
   */
  static clearAll(): void {
    operationsStore.clear();
  }
}

export default SyncQueue;
