import { createClient, RedisClientType } from 'redis';

class RedisConnectionManager {
  private static instance: RedisConnectionManager;
  private client: RedisClientType | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;
  private lastReconnectAttempt = 0;
  private readonly reconnectCooldown = 5000; // 5 seconds cooldown between reconnect attempts
  
  private constructor() {
    if (typeof window === 'undefined' && process.env.REDIS_URL) {
      this.initializeClient();
    }
  }

  private initializeClient() {
    this.client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          const now = Date.now();
          if (now - this.lastReconnectAttempt < this.reconnectCooldown) {
            return new Error('Too many reconnection attempts');
          }
          this.lastReconnectAttempt = now;
          return Math.min(retries * 100, 3000); // Exponential backoff with max 3s
        }
      }
    });

    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis client connected');
      this.isConnected = true;
    });
  }

  public static getInstance(): RedisConnectionManager {
    if (!RedisConnectionManager.instance) {
      RedisConnectionManager.instance = new RedisConnectionManager();
    }
    return RedisConnectionManager.instance;
  }

  public async getClient(): Promise<RedisClientType> {
    if (typeof window !== 'undefined') {
      throw new Error('Redis client can only be used server-side');
    }

    if (!this.client) {
      this.initializeClient();
    }

    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    // Only attempt to connect if we're not already connected or in the process of connecting
    if (!this.isConnected && !this.connectionPromise) {
      this.connectionPromise = this.client.connect()
        .then(async () => {
          await this.client!.ping(); // Test connection
          this.isConnected = true;
          this.connectionPromise = null;
        })
        .catch((err) => {
          console.error('Redis connection error:', err);
          this.connectionPromise = null;
          throw err;
        });
    }

    if (this.connectionPromise) {
      await this.connectionPromise;
    }

    return this.client;
  }

  public async disconnect(): Promise<void> {
    if (this.client && this.client.isOpen) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }
}

// Export a singleton instance
const redisManager = RedisConnectionManager.getInstance();

export async function getRedisClient(): Promise<RedisClientType> {
  return await redisManager.getClient();
}

// Ensure cleanup on process termination
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    await redisManager.disconnect();
  });
  
  process.on('SIGINT', async () => {
    await redisManager.disconnect();
  });
}
