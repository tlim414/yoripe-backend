import { redis } from '../lib/redis.js';

const DEFAULT_TTL = 3600;

/**
 * Wrapper function to check for cache hits before querying database
 * @param key
 * @param cb
 * @param ttlSeconds
 * @returns
 */
export async function getOrSetCache<T>(
  key: string,
  cb: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL
): Promise<T> {
  try {
    // If redis is online try getting cached data
    if (redis.status === 'ready') {
      const cachedData = await redis.get(key);
      if (cachedData) {
        console.log(`Cache Hit: ${key}`);
        return JSON.parse(cachedData) as T;
      }
    } else {
      console.warn(
        `[Redis Notice] Status is "${redis.status}". Bypassing cache read for key "${key}".`
      );
    }
  } catch (err) {
    console.warn(`Redis fetch error for key "${key}", falling back to DB:`, err);
  }

  // Cache miss: Query postgres db
  const freshData = await cb();

  // Set cache to fetched data
  if (freshData !== null && freshData !== undefined) {
    try {
      // If redis is online try setting cache
      if (redis.status === 'ready') {
        await redis.set(key, JSON.stringify(freshData), 'EX', ttlSeconds);
        console.log(`Cache Miss: set cache data for key "${key}"`);
      }
    } catch (err) {
      console.warn(`Redis set error for key "${key}":`, err);
    }
  }

  return freshData;
}

/**
 * Wrapper function to invalidate a cache key after update/delete
 * @param keys
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  try {
    // If redis is offline do nothing
    if (redis.status !== 'ready') {
      console.warn(`[Redis Notice] Status is "${redis.status}". Skipping key invalidation.`);
      return;
    }

    // Filter undefined null or empty string keys
    const validKeys = keys.filter((key) => Boolean(key) && key.trim() !== '');

    if (validKeys.length > 0) {
      await redis.del(...validKeys);
      console.log(`Invalidated cache key: ${validKeys}`);
    }
  } catch (err) {
    console.error('Redis cache invalidation error:', err);
  }
}

/**
 * Wrapper function to invalidate cache keys matching wildcard pattern
 * @param pattern
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    // If redis is offline do nothing\
    if (redis.status !== 'ready') {
      console.warn(
        `[Redis Notice] Status is "${redis.status}". Skipping pattern invalidation for "${pattern}".`
      );
      return;
    }

    // Find all matching keys in Redis
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Invalidated pattern "${pattern}": deleted ${keys.length} key(s)`, keys);
    } else {
      console.log(`Invalidated pattern "${pattern}": no matching keys found`);
    }
  } catch (err) {
    console.error(`Redis pattern invalidation error for "${pattern}":`, err);
  }
}
