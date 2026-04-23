import { isRedisConnected } from "./redisConnection.js";

export function getCacheStatus() {
  const hasRedis = Boolean(process.env.REDIS_URL?.trim());

  return {
    provider: hasRedis ? "redis" : "memory",
    configured: hasRedis,
    connected: hasRedis ? isRedisConnected() : false,
  };
}