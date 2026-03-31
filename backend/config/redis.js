import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL is required');
}

export const redis = new Redis(redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: null,
  reconnectOnError: (err) => {
    const msg = String(err?.message || err);
    return msg.includes('READONLY') || msg.includes('ECONNRESET');
  },
  retryStrategy: (times) => {
    // Exponential backoff with a cap.
    return Math.min(times * 200, 2000);
  },
});

export async function connectRedis() {
  if (redis.status === 'ready' || redis.status === 'connecting') return redis;
  try {
    await redis.connect();
  } catch (err) {
    if (!err?.message?.includes('already connecting')) throw err;
  }
  return redis;
}

