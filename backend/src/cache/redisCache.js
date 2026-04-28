import { MemoryCache } from "./memoryCache.js";
import { getRedisClient } from "./redisConnection.js";

export class RedisCache {
  constructor(options = {}) {
    this.prefix =
      options.prefix || process.env.REDIS_KEY_PREFIX?.trim() || "app";

    this.memory = new MemoryCache();
  }

  buildKey(key) {
    return `${this.prefix}:${key}`;
  }

  safeParse(value) {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  async get(key) {
    const client = await getRedisClient();

    if (!client) {
      return this.memory.get(key);
    }

    try {
      const raw = await client.get(this.buildKey(key));
      return this.safeParse(raw);
    } catch (error) {
      console.warn(
        "Erro ao ler do Redis, usando cache em memória:",
        error.message,
      );
      return this.memory.get(key);
    }
  }

  async set(key, value, ttlMs) {
    const ttl = Math.max(1000, Number(ttlMs) || 1000);
    const client = await getRedisClient();

    if (!client) {
      this.memory.set(key, value, ttl);
      return;
    }

    try {
      await client.set(this.buildKey(key), JSON.stringify(value), { PX: ttl });
    } catch (error) {
      console.warn(
        "Erro ao salvar no Redis, usando cache em memória:",
        error.message,
      );
      this.memory.set(key, value, ttl);
    }
  }

  async delete(key) {
    this.memory.delete(key);

    const client = await getRedisClient();
    if (!client) return;

    try {
      await client.del(this.buildKey(key));
    } catch (error) {
      console.warn("Erro ao deletar chave do Redis:", error.message);
    }
  }

  async clear() {
    this.memory.clear();

    const client = await getRedisClient();
    if (!client) return;

    try {
      const keys = [];
      for await (const key of client.scanIterator({
        MATCH: `${this.prefix}:*`,
        COUNT: 100,
      })) {
        keys.push(key);
      }

      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      console.warn("Erro ao limpar o Redis:", error.message);
    }
  }

  async has(key) {
    return (await this.get(key)) !== null;
  }
}
