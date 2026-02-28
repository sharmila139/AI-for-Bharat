import { Pool, PoolConfig } from 'pg';

/**
 * Database Read Replica Configuration
 * 
 * Implements read/write splitting for database scaling
 * - Write operations go to primary database
 * - Read operations are distributed across read replicas
 */

interface DatabaseConfig extends PoolConfig {
  name: string;
  weight?: number; // For load balancing
}

export class DatabasePool {
  private primaryPool: Pool;
  private replicaPools: Pool[] = [];
  private replicaWeights: number[] = [];
  private currentReplicaIndex: number = 0;

  constructor() {
    // Primary database (for writes)
    this.primaryPool = new Pool({
      host: process.env.DB_PRIMARY_HOST || 'localhost',
      port: parseInt(process.env.DB_PRIMARY_PORT || '5432'),
      database: process.env.DB_NAME || 'ruralconnect_db',
      user: process.env.DB_USER || 'ruralconnect_user',
      password: process.env.DB_PASSWORD,
      max: parseInt(process.env.DB_PRIMARY_POOL_SIZE || '20'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    // Read replicas (for reads)
    this.setupReadReplicas();

    // Handle pool errors
    this.primaryPool.on('error', (err) => {
      console.error('Primary database pool error:', err);
    });
  }

  private setupReadReplicas() {
    const replicaHosts = (process.env.DB_REPLICA_HOSTS || '').split(',').filter(Boolean);
    const replicaPorts = (process.env.DB_REPLICA_PORTS || '').split(',').filter(Boolean);
    const replicaWeights = (process.env.DB_REPLICA_WEIGHTS || '').split(',').filter(Boolean);

    if (replicaHosts.length === 0) {
      console.log('No read replicas configured, using primary for all queries');
      return;
    }

    replicaHosts.forEach((host, index) => {
      const port = replicaPorts[index] || process.env.DB_PRIMARY_PORT || '5432';
      const weight = parseInt(replicaWeights[index] || '1');

      const replicaPool = new Pool({
        host: host.trim(),
        port: parseInt(port),
        database: process.env.DB_NAME || 'ruralconnect_db',
        user: process.env.DB_USER || 'ruralconnect_user',
        password: process.env.DB_PASSWORD,
        max: parseInt(process.env.DB_REPLICA_POOL_SIZE || '10'),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      });

      replicaPool.on('error', (err) => {
        console.error(`Read replica ${host} pool error:`, err);
      });

      this.replicaPools.push(replicaPool);
      this.replicaWeights.push(weight);
    });

    console.log(`Configured ${this.replicaPools.length} read replica(s)`);
  }

  /**
   * Get connection for write operations (uses primary)
   */
  async getWriteConnection() {
    return this.primaryPool.connect();
  }

  /**
   * Get connection for read operations (uses replica with load balancing)
   */
  async getReadConnection() {
    // If no replicas, use primary
    if (this.replicaPools.length === 0) {
      return this.primaryPool.connect();
    }

    // Round-robin with weights
    const replica = this.selectReplica();
    
    try {
      return await replica.connect();
    } catch (error) {
      console.error('Read replica connection failed, falling back to primary:', error);
      return this.primaryPool.connect();
    }
  }

  /**
   * Select replica using weighted round-robin
   */
  private selectReplica(): Pool {
    if (this.replicaPools.length === 1) {
      return this.replicaPools[0];
    }

    // Weighted round-robin
    const totalWeight = this.replicaWeights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < this.replicaPools.length; i++) {
      random -= this.replicaWeights[i];
      if (random <= 0) {
        return this.replicaPools[i];
      }
    }

    // Fallback to first replica
    return this.replicaPools[0];
  }

  /**
   * Execute query on primary (for writes)
   */
  async query(text: string, params?: any[]) {
    return this.primaryPool.query(text, params);
  }

  /**
   * Execute read-only query on replica
   */
  async queryRead(text: string, params?: any[]) {
    if (this.replicaPools.length === 0) {
      return this.primaryPool.query(text, params);
    }

    const replica = this.selectReplica();
    
    try {
      return await replica.query(text, params);
    } catch (error) {
      console.error('Read replica query failed, falling back to primary:', error);
      return this.primaryPool.query(text, params);
    }
  }

  /**
   * Execute transaction on primary
   */
  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.primaryPool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      primary: {
        total: this.primaryPool.totalCount,
        idle: this.primaryPool.idleCount,
        waiting: this.primaryPool.waitingCount,
      },
      replicas: this.replicaPools.map((pool, index) => ({
        index,
        weight: this.replicaWeights[index],
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      })),
    };
  }

  /**
   * Close all connections
   */
  async close() {
    await this.primaryPool.end();
    await Promise.all(this.replicaPools.map(pool => pool.end()));
    console.log('All database connections closed');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    primary: boolean;
    replicas: boolean[];
  }> {
    const results = {
      primary: false,
      replicas: [] as boolean[],
    };

    // Check primary
    try {
      await this.primaryPool.query('SELECT 1');
      results.primary = true;
    } catch (error) {
      console.error('Primary health check failed:', error);
    }

    // Check replicas
    for (const replica of this.replicaPools) {
      try {
        await replica.query('SELECT 1');
        results.replicas.push(true);
      } catch (error) {
        console.error('Replica health check failed:', error);
        results.replicas.push(false);
      }
    }

    return results;
  }
}

// Singleton instance
let dbPool: DatabasePool | null = null;

export function getDatabase(): DatabasePool {
  if (!dbPool) {
    dbPool = new DatabasePool();
  }
  return dbPool;
}

/**
 * Query router - automatically routes queries to appropriate database
 */
export class QueryRouter {
  private db: DatabasePool;

  constructor() {
    this.db = getDatabase();
  }

  /**
   * Determine if query is read-only
   */
  private isReadQuery(sql: string): boolean {
    const normalizedSql = sql.trim().toUpperCase();
    return (
      normalizedSql.startsWith('SELECT') &&
      !normalizedSql.includes('FOR UPDATE') &&
      !normalizedSql.includes('FOR SHARE')
    );
  }

  /**
   * Execute query with automatic routing
   */
  async execute(sql: string, params?: any[]) {
    if (this.isReadQuery(sql)) {
      return this.db.queryRead(sql, params);
    } else {
      return this.db.query(sql, params);
    }
  }

  /**
   * Force query to primary
   */
  async executePrimary(sql: string, params?: any[]) {
    return this.db.query(sql, params);
  }

  /**
   * Force query to replica
   */
  async executeReplica(sql: string, params?: any[]) {
    return this.db.queryRead(sql, params);
  }
}

export const queryRouter = new QueryRouter();
