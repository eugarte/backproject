import { createClient, RedisClientType } from 'redis';

export class CacheService {
  private client: RedisClientType;
  private defaultTTL: number;
  private isConnected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.defaultTTL = parseInt(process.env.CACHE_TTL || '300', 10);
    
    this.client = createClient({
      url: redisUrl,
    });

    this.client.on('error', (err: Error) => {
      console.error('Redis error:', err);
    });

    this.client.connect().then(() => {
      this.isConnected = true;
    }).catch(() => {
      // Redis connection failed, continue without cache
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) return null;
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      if (!this.isConnected) return;
      const serialized = JSON.stringify(value);
      const expiration = ttl || this.defaultTTL;
      await this.client.setEx(key, expiration, serialized);
    } catch {
      // Ignore cache errors
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (!this.isConnected) return;
      await this.client.del(key);
    } catch {
      // Ignore cache errors
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      if (!this.isConnected) return;
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch {
      // Ignore cache errors
    }
  }

  async flush(): Promise<void> {
    try {
      if (!this.isConnected) return;
      await this.client.flushDb();
    } catch {
      // Ignore cache errors
    }
  }

  generateKey(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}
