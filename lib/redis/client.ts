import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export async function logAuditEvent(
  action: string,
  userId: string,
  details: Record<string, any>
) {
  const event = {
    action,
    userId,
    details,
    timestamp: new Date().toISOString(),
  };

  try {
    // Store audit log with TTL of 30 days
    const key = `audit:${userId}:${Date.now()}`;
    await redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(event));
    
    // Also add to a list for easy retrieval
    await redis.lpush(`audit:${userId}:list`, JSON.stringify(event));
    await redis.ltrim(`audit:${userId}:list`, 0, 999); // Keep last 1000 events
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

export async function getAuditLogs(userId: string, limit = 100): Promise<any[]> {
  try {
    const logs = await redis.lrange(`audit:${userId}:list`, 0, limit - 1);
    return logs.map(log => JSON.parse(log));
  } catch (error) {
    console.error('Failed to retrieve audit logs:', error);
    return [];
  }
}
