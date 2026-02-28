/**
 * Background Sync Service
 * Handles automatic syncing with connectivity detection
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import BackgroundFetch from 'react-native-background-fetch';
import SyncQueue, { SyncPriority } from './sync-queue';
import { OfflineOperation } from '../../database/realm-config';

export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // minutes
  wifiOnly: boolean;
  batchSize: number;
  maxConcurrent: number;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
  duration: number;
}

export class BackgroundSyncService {
  private static isOnline: boolean = false;
  private static isWifi: boolean = false;
  private static isSyncing: boolean = false;
  private static syncListeners: Array<(result: SyncResult) => void> = [];
  private static connectivityListeners: Array<(isOnline: boolean) => void> = [];

  private static config: SyncConfig = {
    autoSync: true,
    syncInterval: 15, // 15 minutes
    wifiOnly: false,
    batchSize: 10,
    maxConcurrent: 3
  };

  /**
   * Initialize background sync service
   */
  static async initialize(config?: Partial<SyncConfig>): Promise<void> {
    // Update config
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Setup connectivity monitoring
    await this.setupConnectivityMonitoring();

    // Setup background fetch
    await this.setupBackgroundFetch();

    console.log('Background sync service initialized');
  }

  /**
   * Setup connectivity monitoring
   */
  private static async setupConnectivityMonitoring(): Promise<void> {
    // Get initial state
    const state = await NetInfo.fetch();
    this.updateConnectivityState(state);

    // Subscribe to connectivity changes
    NetInfo.addEventListener((state: NetInfoState) => {
      this.updateConnectivityState(state);
    });
  }

  /**
   * Update connectivity state
   */
  private static updateConnectivityState(state: NetInfoState): void {
    const wasOnline = this.isOnline;
    this.isOnline = state.isConnected === true && state.isInternetReachable === true;
    this.isWifi = state.type === 'wifi';

    console.log(`Connectivity changed: ${this.isOnline ? 'Online' : 'Offline'} (${state.type})`);

    // Notify listeners
    this.connectivityListeners.forEach(listener => listener(this.isOnline));

    // Trigger sync if we just came online
    if (!wasOnline && this.isOnline && this.config.autoSync) {
      this.triggerSync();
    }
  }

  /**
   * Setup background fetch for periodic sync
   */
  private static async setupBackgroundFetch(): Promise<void> {
    const status = await BackgroundFetch.configure(
      {
        minimumFetchInterval: this.config.syncInterval,
        stopOnTerminate: false,
        startOnBoot: true,
        enableHeadless: true
      },
      async (taskId: string) => {
        console.log('[BackgroundFetch] Task started:', taskId);
        
        // Perform sync
        await this.performSync();
        
        // Finish task
        BackgroundFetch.finish(taskId);
      },
      (taskId: string) => {
        console.log('[BackgroundFetch] Task timeout:', taskId);
        BackgroundFetch.finish(taskId);
      }
    );

    console.log('[BackgroundFetch] Status:', status);
  }

  /**
   * Check if sync is allowed based on connectivity
   */
  static canSync(): boolean {
    if (!this.isOnline) {
      return false;
    }

    if (this.config.wifiOnly && !this.isWifi) {
      return false;
    }

    return true;
  }

  /**
   * Trigger manual sync
   */
  static async triggerSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: ['Sync already in progress'],
        duration: 0
      };
    }

    if (!this.canSync()) {
      console.log('Sync not allowed - offline or wifi-only mode');
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: ['No internet connection or wifi-only mode enabled'],
        duration: 0
      };
    }

    return await this.performSync();
  }

  /**
   * Perform sync operation
   */
  private static async performSync(): Promise<SyncResult> {
    const startTime = Date.now();
    this.isSyncing = true;

    let syncedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    try {
      // Get pending operations
      const operations = SyncQueue.getPendingOperations();
      console.log(`Starting sync: ${operations.length} operations pending`);

      if (operations.length === 0) {
        return {
          success: true,
          syncedCount: 0,
          failedCount: 0,
          errors: [],
          duration: Date.now() - startTime
        };
      }

      // Process operations in batches
      for (let i = 0; i < operations.length; i += this.config.batchSize) {
        const batch = operations.slice(i, i + this.config.batchSize);
        
        // Process batch concurrently
        const results = await Promise.allSettled(
          batch.map(op => this.syncOperation(op))
        );

        // Count results
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            syncedCount++;
            SyncQueue.markAsSynced(batch[index]._id);
          } else {
            failedCount++;
            const error = result.status === 'rejected' ? result.reason : 'Unknown error';
            errors.push(`${batch[index].entityType}:${batch[index].entityId} - ${error}`);
            SyncQueue.markAsFailed(batch[index]._id, error);
          }
        });

        // Check if still online
        if (!this.canSync()) {
          console.log('Lost connectivity during sync');
          break;
        }
      }

      // Clean up old synced operations
      SyncQueue.clearOldSyncedOperations(7);

      const result: SyncResult = {
        success: failedCount === 0,
        syncedCount,
        failedCount,
        errors,
        duration: Date.now() - startTime
      };

      console.log(`Sync completed: ${syncedCount} synced, ${failedCount} failed`);

      // Notify listeners
      this.syncListeners.forEach(listener => listener(result));

      return result;

    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        syncedCount,
        failedCount,
        errors: [...errors, String(error)],
        duration: Date.now() - startTime
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync single operation
   */
  private static async syncOperation(operation: OfflineOperation): Promise<boolean> {
    try {
      const data = JSON.parse(operation.data);
      
      // Mark as syncing
      SyncQueue.updateOperationStatus(operation._id, 'syncing');

      // TODO: Replace with actual API calls
      const apiEndpoint = this.getApiEndpoint(operation.entityType);
      const response = await this.makeApiCall(
        apiEndpoint,
        operation.operationType,
        operation.entityId,
        data
      );

      return response.success;

    } catch (error) {
      console.error(`Failed to sync operation ${operation._id}:`, error);
      throw error;
    }
  }

  /**
   * Get API endpoint for entity type
   */
  private static getApiEndpoint(entityType: string): string {
    const endpoints: Record<string, string> = {
      'user': '/api/users',
      'profile': '/api/profiles',
      'farm': '/api/farms',
      'grievance': '/api/grievances',
      'poll_vote': '/api/polls/votes',
      'health_record': '/api/health/records',
      'education_progress': '/api/education/progress'
    };

    return endpoints[entityType] || '/api/sync';
  }

  /**
   * Make API call (placeholder)
   */
  private static async makeApiCall(
    endpoint: string,
    method: string,
    entityId: string,
    data: any
  ): Promise<{ success: boolean }> {
    // TODO: Implement actual API calls
    // This is a placeholder that simulates API calls
    
    console.log(`API Call: ${method} ${endpoint}/${entityId}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate 90% success rate
    return { success: Math.random() > 0.1 };
  }

  /**
   * Add sync listener
   */
  static addSyncListener(listener: (result: SyncResult) => void): void {
    this.syncListeners.push(listener);
  }

  /**
   * Remove sync listener
   */
  static removeSyncListener(listener: (result: SyncResult) => void): void {
    this.syncListeners = this.syncListeners.filter(l => l !== listener);
  }

  /**
   * Add connectivity listener
   */
  static addConnectivityListener(listener: (isOnline: boolean) => void): void {
    this.connectivityListeners.push(listener);
  }

  /**
   * Remove connectivity listener
   */
  static removeConnectivityListener(listener: (isOnline: boolean) => void): void {
    this.connectivityListeners = this.connectivityListeners.filter(l => l !== listener);
  }

  /**
   * Get connectivity status
   */
  static getConnectivityStatus(): {
    isOnline: boolean;
    isWifi: boolean;
    canSync: boolean;
  } {
    return {
      isOnline: this.isOnline,
      isWifi: this.isWifi,
      canSync: this.canSync()
    };
  }

  /**
   * Get sync status
   */
  static getSyncStatus(): {
    isSyncing: boolean;
    pendingCount: number;
    lastSyncTime?: Date;
  } {
    return {
      isSyncing: this.isSyncing,
      pendingCount: SyncQueue.getPendingCount(),
      lastSyncTime: undefined // TODO: Store last sync time
    };
  }

  /**
   * Update configuration
   */
  static updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Sync config updated:', this.config);
  }

  /**
   * Force sync high priority operations
   */
  static async syncHighPriority(): Promise<SyncResult> {
    if (!this.canSync()) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: ['No internet connection'],
        duration: 0
      };
    }

    const startTime = Date.now();
    const operations = SyncQueue.getHighPriorityOperations();
    
    let syncedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const op of operations) {
      try {
        const success = await this.syncOperation(op);
        if (success) {
          syncedCount++;
          SyncQueue.markAsSynced(op._id);
        } else {
          failedCount++;
          SyncQueue.markAsFailed(op._id, 'Sync failed');
        }
      } catch (error) {
        failedCount++;
        errors.push(String(error));
        SyncQueue.markAsFailed(op._id, String(error));
      }
    }

    return {
      success: failedCount === 0,
      syncedCount,
      failedCount,
      errors,
      duration: Date.now() - startTime
    };
  }

  /**
   * Pause auto sync
   */
  static pauseAutoSync(): void {
    this.config.autoSync = false;
    console.log('Auto sync paused');
  }

  /**
   * Resume auto sync
   */
  static resumeAutoSync(): void {
    this.config.autoSync = true;
    console.log('Auto sync resumed');
    
    // Trigger sync if online
    if (this.canSync()) {
      this.triggerSync();
    }
  }
}

export default BackgroundSyncService;
