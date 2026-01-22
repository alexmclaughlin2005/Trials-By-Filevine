import Redis from 'ioredis';
import { config } from '../config/index.js';

export class CacheService {
  private redis: Redis | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = config.cacheEnabled;

    if (this.enabled) {
      try {
        this.redis = new Redis(config.redisUrl, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true,
        });

        this.redis.on('error', (err) => {
          console.error('[CacheService] Redis error:', err);
        });

        this.redis.on('connect', () => {
          console.log('[CacheService] Redis connected');
        });

        // Connect asynchronously
        this.redis.connect().catch((err) => {
          console.error('[CacheService] Failed to connect to Redis:', err);
          this.enabled = false;
        });
      } catch (error) {
        console.error('[CacheService] Failed to initialize Redis:', error);
        this.enabled = false;
      }
    }
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) {
      return null;
    }

    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('[CacheService] Error getting from cache:', error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.enabled || !this.redis) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      const ttlSeconds = ttl || config.cacheTTL;

      await this.redis.setex(key, ttlSeconds, serialized);
    } catch (error) {
      console.error('[CacheService] Error setting cache:', error);
    }
  }

  /**
   * Delete cached value
   */
  async del(key: string): Promise<void> {
    if (!this.enabled || !this.redis) {
      return;
    }

    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('[CacheService] Error deleting from cache:', error);
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.enabled || !this.redis) {
      return;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('[CacheService] Error deleting pattern from cache:', error);
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  /**
   * Check if cache is enabled and connected
   */
  isEnabled(): boolean {
    return this.enabled && this.redis !== null && this.redis.status === 'ready';
  }
}
