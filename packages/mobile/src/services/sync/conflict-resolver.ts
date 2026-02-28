/**
 * Conflict Resolution Service
 * Implements last-write-wins strategy for data conflicts
 */

export interface ConflictData {
  entityType: string;
  entityId: string;
  localVersion: any;
  serverVersion: any;
  localTimestamp: Date;
  serverTimestamp: Date;
}

export interface ResolvedConflict {
  entityType: string;
  entityId: string;
  resolvedVersion: any;
  strategy: 'local' | 'server' | 'merged';
  timestamp: Date;
}

export class ConflictResolver {
  /**
   * Resolve conflict using last-write-wins strategy
   */
  static resolveConflict(conflict: ConflictData): ResolvedConflict {
    // Last-write-wins: Choose the version with the most recent timestamp
    const useLocal = conflict.localTimestamp > conflict.serverTimestamp;

    return {
      entityType: conflict.entityType,
      entityId: conflict.entityId,
      resolvedVersion: useLocal ? conflict.localVersion : conflict.serverVersion,
      strategy: useLocal ? 'local' : 'server',
      timestamp: new Date()
    };
  }

  /**
   * Resolve conflict with custom merge logic for specific entity types
   */
  static resolveWithMerge(conflict: ConflictData): ResolvedConflict {
    const entityType = conflict.entityType;

    // Use entity-specific merge strategies
    switch (entityType) {
      case 'user':
      case 'profile':
        return this.mergeUserProfile(conflict);
      
      case 'farm':
        return this.mergeFarmProfile(conflict);
      
      case 'education_progress':
        return this.mergeEducationProgress(conflict);
      
      default:
        // Fall back to last-write-wins
        return this.resolveConflict(conflict);
    }
  }

  /**
   * Merge user profile data
   */
  private static mergeUserProfile(conflict: ConflictData): ResolvedConflict {
    const local = conflict.localVersion;
    const server = conflict.serverVersion;

    // Merge strategy: Take most recent value for each field
    const merged = {
      ...server,
      ...local,
      // Keep server's critical fields if they're newer
      phoneNumber: server.phoneNumber, // Never override phone number
      email: conflict.serverTimestamp > conflict.localTimestamp ? server.email : local.email,
      // Merge arrays
      preferences: this.mergeArrays(local.preferences, server.preferences),
      updatedAt: new Date()
    };

    return {
      entityType: conflict.entityType,
      entityId: conflict.entityId,
      resolvedVersion: merged,
      strategy: 'merged',
      timestamp: new Date()
    };
  }

  /**
   * Merge farm profile data
   */
  private static mergeFarmProfile(conflict: ConflictData): ResolvedConflict {
    const local = conflict.localVersion;
    const server = conflict.serverVersion;

    // For farm profiles, prefer local changes for operational data
    const merged = {
      ...server,
      ...local,
      // Keep server's ownership data
      userId: server.userId,
      // Merge crop lists
      crops: this.mergeArrays(local.crops, server.crops),
      updatedAt: new Date()
    };

    return {
      entityType: conflict.entityType,
      entityId: conflict.entityId,
      resolvedVersion: merged,
      strategy: 'merged',
      timestamp: new Date()
    };
  }

  /**
   * Merge education progress data
   */
  private static mergeEducationProgress(conflict: ConflictData): ResolvedConflict {
    const local = conflict.localVersion;
    const server = conflict.serverVersion;

    // For progress data, take the maximum values
    const merged = {
      ...server,
      ...local,
      // Take maximum progress values
      completedLessons: Math.max(local.completedLessons || 0, server.completedLessons || 0),
      totalScore: Math.max(local.totalScore || 0, server.totalScore || 0),
      // Merge completed lesson IDs
      completedLessonIds: this.mergeArrays(local.completedLessonIds, server.completedLessonIds),
      updatedAt: new Date()
    };

    return {
      entityType: conflict.entityType,
      entityId: conflict.entityId,
      resolvedVersion: merged,
      strategy: 'merged',
      timestamp: new Date()
    };
  }

  /**
   * Merge two arrays, removing duplicates
   */
  private static mergeArrays(arr1: any[] = [], arr2: any[] = []): any[] {
    const combined = [...arr1, ...arr2];
    return Array.from(new Set(combined));
  }

  /**
   * Detect if there's a conflict
   */
  static hasConflict(
    localData: any,
    serverData: any,
    localTimestamp: Date,
    serverTimestamp: Date
  ): boolean {
    // No conflict if timestamps are the same
    if (localTimestamp.getTime() === serverTimestamp.getTime()) {
      return false;
    }

    // No conflict if data is identical
    if (JSON.stringify(localData) === JSON.stringify(serverData)) {
      return false;
    }

    // Conflict exists if data differs and both have been modified
    return true;
  }

  /**
   * Get conflict resolution strategy for entity type
   */
  static getStrategyForEntity(entityType: string): 'last-write-wins' | 'merge' | 'manual' {
    const mergeEntities = ['user', 'profile', 'farm', 'education_progress'];
    const manualEntities = ['grievance', 'poll_vote']; // These should not have conflicts

    if (manualEntities.includes(entityType)) {
      return 'manual';
    }

    if (mergeEntities.includes(entityType)) {
      return 'merge';
    }

    return 'last-write-wins';
  }

  /**
   * Resolve batch of conflicts
   */
  static resolveBatch(conflicts: ConflictData[]): ResolvedConflict[] {
    return conflicts.map(conflict => {
      const strategy = this.getStrategyForEntity(conflict.entityType);
      
      if (strategy === 'merge') {
        return this.resolveWithMerge(conflict);
      } else {
        return this.resolveConflict(conflict);
      }
    });
  }

  /**
   * Create conflict data object
   */
  static createConflict(
    entityType: string,
    entityId: string,
    localVersion: any,
    serverVersion: any,
    localTimestamp: Date,
    serverTimestamp: Date
  ): ConflictData {
    return {
      entityType,
      entityId,
      localVersion,
      serverVersion,
      localTimestamp,
      serverTimestamp
    };
  }

  /**
   * Log conflict resolution
   */
  static logResolution(resolved: ResolvedConflict): void {
    console.log(`Conflict resolved for ${resolved.entityType}:${resolved.entityId}`);
    console.log(`Strategy: ${resolved.strategy}`);
    console.log(`Timestamp: ${resolved.timestamp.toISOString()}`);
  }

  /**
   * Validate resolved data
   */
  static validateResolved(resolved: ResolvedConflict): boolean {
    // Basic validation
    if (!resolved.entityType || !resolved.entityId) {
      return false;
    }

    if (!resolved.resolvedVersion) {
      return false;
    }

    return true;
  }
}

export default ConflictResolver;
