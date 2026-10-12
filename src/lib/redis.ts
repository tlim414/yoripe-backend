import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL is not defined in environment variables');
}

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: false,
});

redis.on('connect', () => console.log('Connected to Redis'));
redis.on('error', (err) => console.error('Redis Client Error:', err));
