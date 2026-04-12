import { MemoryCache } from "./memoryCache.js";
import { RedisCache } from "./redisCache.js";

export function createCache() {
  const hasRedis = Boolean(process.env.REDIS_URL?.trim());

  if (hasRedis) {
    return new RedisCache();
  }

  return new MemoryCache();
}

export const cache = createCache();