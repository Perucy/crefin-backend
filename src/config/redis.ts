/**
 * Redis Cache Configuration
 * Used for caching market rates (15-min TTL)
 */
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';
import { config } from './environment';


// ============================================================================
// REDIS CLIENT
// ============================================================================

let redis: RedisClientType;

class RedisConnection {
    private client: RedisClientType | null = null;

    async connect(): Promise<void> {
        try {
            this.client = createClient({
                url: config.REDIS_URL,
                socket: {
                    reconnectStrategy: (retries) => {
                        //exponential backoff: 50ms, 100ms, 200ms...
                        //max 3 secs btn retries
                        return Math.min(retries * 50, 3000);
                    },
                },
            });
            // Error handling
            this.client.on('error', (err) => {
                logger.error('Redis error:', err);
            });
            
            this.client.on('reconnecting', () => {
                logger.warn('Redis reconnecting...');
            });
            
            this.client.on('ready', () => {
                logger.info('Redis ready');
            });
            
            await this.client.connect();
            redis = this.client;
            
            logger.info('✅ Redis connected');
        } catch (error) {
            logger.error('❌ Failed to connect to Redis:', error);
            throw error;
        }
    }
    async disconnect(): Promise<void> {
        if(this.client) {
            await this.client.quit();
            logger.info('🔌 Redis disconnected');
        }
    }
    getClient(): RedisClientType {
        if (!this.client) {
            throw new Error('Redis initialized. Call connect() first.');
        }
        return this.client;
    }
}
// ============================================================================
// CACHE HELPERS
// ============================================================================
// Get cached value
export async function getCache<T>(key: string): Promise<T | null> {
    try {
        const value = await redis.get(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        logger.error('Cache get error:', { key, error });
        return null; // Fail gracefully
    }
}
// Set cached value with TTL
export async function setCache(
    key: string,
    value: any,
    ttlSeconds: number = config.REDIS_TTL
): Promise<void> {
    try {
        await redis.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
        logger.error('Cache set error:', { key, error });
    }
}
// Delete cached value
export async function deleteCache(key: string): Promise<void> {
    try {
        await redis.del(key);
    } catch (error) {
        logger.error('Cache delete error:', { key, error });
    }
}
// Delete pattern (e.g., "rate:*")
export async function deleteCachePattern(pattern: string): Promise<void> {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
        await redis.del(keys);
        }
    } catch (error) {
        logger.error('Cache pattern delete error:', { pattern, error });
    }
}
// ============================================================================
// EXPORTS
// ============================================================================

export const connectRedis = new RedisConnection();
export { redis };