import { Pool, PoolClient, PoolConfig } from 'pg';
import { EventEmitter } from 'events';

/**
 * Adaptive Connection Pool Manager
 * 
 * Dynamically adjusts pool size based on load (5-20 connections)
 * Monitors connection usage and adjusts pool size accordingly
 */

interface PoolMetrics {
  totalConnections: number;
  idleConnections: number;
  activeConnections: number;
  waitingRequests: number;
  averageWaitTime: number;
  utilizationPercentage: number;
}

interface AdaptivePoolConfig extends PoolConfig {
  minPoolSize?: number;
  maxPoolSize?: number;
  scaleUpThreshold?: number; // Utilization % to scale up
  scaleDownThreshold?: number; // Utilization % to scale down
  adjustmentInterval?: number; // ms between adjustments
}

export class AdaptiveConnectionPool extends EventEmitter {
  private pool: Pool;
  private config: Required<AdaptivePoolConfig>;
  private metrics: PoolMetrics;
  private adjustmentTimer?: NodeJS.Timeout;
  private waitTimes: number[] = [];

  constructor(config: AdaptivePoolConfig = {}) {
    super();

    this.config = {
      host: config.host || process.env.DB_HOST || 'localhost',
      port: config.port || parseInt(process.env.DB_PORT || '5432'),
      database: config.database || process.env.DB_NAME || 'ruralconnect_db',
      user: config.user || process.env.DB_USER || 'ruralconnect_user',
      password: config.password || process.env.DB_PASSWORD || '',
      minPoolSize: config.minPoolSize || 5,
      maxPoolSize: config.maxPoolSize || 20,
      scaleUpThreshold: config.scaleUpThreshold || 80, // 80% utilization
      scaleDownThreshold: config.scaleDownThreshold || 30, // 30% utilization
      adjustmentInterval: config.adjustmentInterval || 60000, // 1 minute
      max: config.max || 10, // Initial pool size
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 10000,
      ssl: config.ssl || (process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false),
    };

    this.pool = new Pool(this.config);
    this.metrics = this.initializeMetrics();

    this.setupEventHandlers();
    this.startAdaptiveScaling();
  }

  private initializeMetrics(): PoolMetrics {
    return {
      totalConnections: 0,
      idleConnections: 0,
      activeConnections: 0,
      waitingRequests: 0,
      averageWaitTime: 0,
      utilizationPercentage: 0,
    };
  }

  private setupEventHandlers() {
    this.pool.on('connect', (client) => {
      this.emit('connect', client);
      this.updateMetrics();
    });

    this.pool.on('acquire', (client) => {
      this.emit('acquire', client);
      this.updateMetrics();
    });

    this.pool.on('remove', (client) => {
      this.emit('remove', client);
      this.updateMetrics();
    });

    this.pool.on('error', (err, client) => {
      console.error('Pool error:', err);
      this.emit('error', err, client);
    });
  }

  private updateMetrics() {
    this.metrics = {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      activeConnections: this.pool.totalCount - this.pool.idleCount,
      waitingRequests: this.pool.waitingCount,
      averageWaitTime: this.calculateAverageWaitTime(),
      utilizationPercentage: this.calculateUtilization(),
    };
  }

  private calculateAverageWaitTime(): number {
    if (this.waitTimes.length === 0) return 0;
    const sum = this.waitTimes.reduce((a, b) => a + b, 0);
    return sum / this.waitTimes.length;
  }

  private calculateUtilization(): number {
    if (this.metrics.totalConnections === 0) return 0;
    return (this.metrics.activeConnections / this.metrics.totalConnections) * 100;
  }

  private startAdaptiveScaling() {
    this.adjustmentTimer = setInterval(() => {
      this.adjustPoolSize();
    }, this.config.adjustmentInterval);
  }

  private async adjustPoolSize() {
    this.updateMetrics();

    const currentSize = this.pool.options.max || 10;
    const utilization = this.metrics.utilizationPercentage;
    const waitingRequests = this.metrics.waitingRequests;

    let newSize = currentSize;

    // Scale up if utilization is high or requests are waiting
    if (utilization >= this.config.scaleUpThreshold || waitingRequests > 0) {
      newSize = Math.min(currentSize + 2, this.config.maxPoolSize);
      
      if (newSize > currentSize) {
        console.log(
          `Scaling up connection pool: ${currentSize} -> ${newSize} ` +
          `(utilization: ${utilization.toFixed(1)}%, waiting: ${waitingRequests})`
        );
        await this.resizePool(newSize);
        this.emit('scale-up', { from: currentSize, to: newSize, utilization });
      }
    }
    // Scale down if utilization is low
    else if (utilization <= this.config.scaleDownThreshold && waitingRequests === 0) {
      newSize = Math.max(currentSize - 1, this.config.minPoolSize);
      
      if (newSize < currentSize) {
        console.log(
          `Scaling down connection pool: ${currentSize} -> ${newSize} ` +
          `(utilization: ${utilization.toFixed(1)}%)`
        );
        await this.resizePool(newSize);
        this.emit('scale-down', { from: currentSize, to: newSize, utilization });
      }
    }
  }

  private async resizePool(newSize: number) {
    // Create new pool with updated size
    const oldPool = this.pool;
    
    this.pool = new Pool({
      ...this.config,
      max: newSize,
    });

    this.setupEventHandlers();

    // Gracefully drain old pool
    setTimeout(async () => {
      try {
        await oldPool.end();
      } catch (error) {
        console.error('Error draining old pool:', error);
      }
    }, 5000); // Wait 5 seconds before draining
  }

  /**
   * Get a connection from the pool
   */
  async connect(): Promise<PoolClient> {
    const startTime = Date.now();
    
    try {
      const client = await this.pool.connect();
      const waitTime = Date.now() - startTime;
      
      this.waitTimes.push(waitTime);
      if (this.waitTimes.length > 100) {
        this.waitTimes.shift(); // Keep only last 100 wait times
      }
      
      return client;
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  /**
   * Execute a query
   */
  async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.connect();
    
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
   * Get current pool metrics
   */
  getMetrics(): PoolMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get pool configuration
   */
  getConfig() {
    return {
      currentSize: this.pool.options.max,
      minSize: this.config.minPoolSize,
      maxSize: this.config.maxPoolSize,
      scaleUpThreshold: this.config.scaleUpThreshold,
      scaleDownThreshold: this.config.scaleDownThreshold,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health');
      return result.rows[0].health === 1;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Get pool statistics for monitoring
   */
  getStats() {
    return {
      ...this.getMetrics(),
      config: this.getConfig(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Close the pool
   */
  async close() {
    if (this.adjustmentTimer) {
      clearInterval(this.adjustmentTimer);
    }
    
    await this.pool.end();
    console.log('Connection pool closed');
  }

  /**
   * Force pool size adjustment (for testing or manual control)
   */
  async setPoolSize(size: number) {
    const newSize = Math.max(
      this.config.minPoolSize,
      Math.min(size, this.config.maxPoolSize)
    );
    
    await this.resizePool(newSize);
    console.log(`Pool size manually set to ${newSize}`);
  }
}

// Singleton instance
let poolInstance: AdaptiveConnectionPool | null = null;

export function getConnectionPool(config?: AdaptivePoolConfig): AdaptiveConnectionPool {
  if (!poolInstance) {
    poolInstance = new AdaptiveConnectionPool(config);
    
    // Log metrics periodically
    setInterval(() => {
      const metrics = poolInstance!.getMetrics();
      console.log('Pool metrics:', {
        total: metrics.totalConnections,
        active: metrics.activeConnections,
        idle: metrics.idleConnections,
        waiting: metrics.waitingRequests,
        utilization: `${metrics.utilizationPercentage.toFixed(1)}%`,
      });
    }, 300000); // Every 5 minutes
  }
  
  return poolInstance;
}

/**
 * Connection pool middleware for Express
 */
export function connectionPoolMiddleware() {
  const pool = getConnectionPool();
  
  return async (req: any, res: any, next: any) => {
    req.db = pool;
    
    // Add connection to request for convenience
    req.getDbConnection = () => pool.connect();
    
    next();
  };
}

/**
 * Monitor pool health and emit warnings
 */
export function startPoolMonitoring(pool: AdaptiveConnectionPool) {
  setInterval(() => {
    const metrics = pool.getMetrics();
    
    // Warn if utilization is consistently high
    if (metrics.utilizationPercentage > 90) {
      console.warn(
        `High pool utilization: ${metrics.utilizationPercentage.toFixed(1)}% ` +
        `(${metrics.activeConnections}/${metrics.totalConnections} connections active)`
      );
    }
    
    // Warn if requests are waiting
    if (metrics.waitingRequests > 5) {
      console.warn(
        `${metrics.waitingRequests} requests waiting for connections. ` +
        `Consider increasing max pool size.`
      );
    }
    
    // Warn if average wait time is high
    if (metrics.averageWaitTime > 1000) {
      console.warn(
        `High average wait time: ${metrics.averageWaitTime.toFixed(0)}ms`
      );
    }
  }, 60000); // Check every minute
}
