import { redis } from "../config/redis.config";
import { logger } from "../config/logger.config";

export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (!value) return null;
      logger.debug(`Cache hit: ${key}`);
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}: ${error}`);
      return null; // fail silently — cache miss is not a fatal error
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
      logger.debug(`Cache set: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      logger.error(`Cache set error for key ${key}: ${error}`);
      // fail silently — caching failure should never break the request
    }
  }

  async invalidate(key: string): Promise<void> {
    try {
      await redis.del(key);
      logger.debug(`Cache invalidated: ${key}`);
    } catch (error) {
      logger.error(`Cache invalidate error for key ${key}: ${error}`);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug(`Cache invalidated ${keys.length} keys matching: ${pattern}`);
      }
    } catch (error) {
      logger.error(`Cache invalidate pattern error for ${pattern}: ${error}`);
    }
  }
}

export const cacheService = new CacheService();
