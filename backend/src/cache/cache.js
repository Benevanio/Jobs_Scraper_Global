// let redisClientPromise = null;
// let redisClientUrl = "";
// let redisWarningShown = false;

// const cacheStatus = {
//   provider: "memory",
//   configured: false,
//   connected: false,
//   lastError: null,
// };

// function readRedisUrl() {
//   return process.env.REDIS_URL?.trim() || "";
// }

// function syncCacheStatus() {
//   const redisUrl = readRedisUrl();
//   cacheStatus.configured = Boolean(redisUrl);
//   cacheStatus.provider = redisUrl ? "redis" : "memory";

//   if (!redisUrl) {
//     cacheStatus.connected = false;
//     cacheStatus.lastError = null;
//   }
// }

// function warnRedisFallback(message, error) {
//   cacheStatus.connected = false;
//   cacheStatus.lastError = error instanceof Error ? error.message : null;

//   if (redisWarningShown) {
//     return;
//   }

//   redisWarningShown = true;

//   const errorMessage = error instanceof Error ? error.message : "";
//   // eslint-disable-next-line no-console
//   console.warn(`${message}${errorMessage ? ` (${errorMessage})` : ""}`);
// }

// export async function getRedisClient() {
//   const redisUrl = readRedisUrl();
//   syncCacheStatus();

//   if (!redisUrl) {
//     return null;
//   }

//   if (redisClientUrl !== redisUrl) {
//     redisClientPromise = null;
//     redisClientUrl = redisUrl;
//   }

//   if (!redisClientPromise) {
//     redisClientPromise = import("redis")
//       .then(async ({ createClient }) => {
//         const client = createClient({
//           url: redisUrl,
//           socket: {
//             connectTimeout: 3_000,
//             reconnectStrategy(retries) {
//               if (retries >= 2) {
//                 return false;
//               }

//               return Math.min((retries + 1) * 100, 500);
//             },
//           },
//         });

//         client.on("ready", () => {
//           cacheStatus.connected = true;
//           cacheStatus.lastError = null;
//         });

//         client.on("end", () => {
//           cacheStatus.connected = false;
//         });

//         client.on("error", (error) => {
//           warnRedisFallback("Redis indisponivel, usando cache em memoria.", error);
//         });

//         await client.connect();
//         return client;
//       })
//       .catch((error) => {
//         warnRedisFallback("Falha ao conectar no Redis, usando cache em memoria.", error);
//         redisClientPromise = null;
//         return null;
//       });
//   }

//   return redisClientPromise;
// }

// export function getCacheStatus() {
//   syncCacheStatus();
//   return {
//     ...cacheStatus,
//     type: cache.constructor.name,
//   };
// }

// export async function warmupCache() {
//   syncCacheStatus();

//   if (!cacheStatus.configured) {
//     return getCacheStatus();
//   }

//   const client = await getRedisClient();
//   if (!client) {
//     return getCacheStatus();
//   }

//   try {
//     const pong = await client.ping();
//     cacheStatus.connected = pong === "PONG";
//     cacheStatus.lastError = cacheStatus.connected ? null : "PING sem resposta esperada";
//   } catch (error) {
//     warnRedisFallback("Falha ao validar conexao com Redis.", error);
//   }

//   return getCacheStatus();
// }

// export class MemoryCache {
//   constructor() {
//     this.store = new Map();
//   }

//   get(key) {
//     const entry = this.store.get(key);

//     if (!entry) {
//       return null;
//     }

//     if (Date.now() > entry.expiresAt) {
//       this.store.delete(key);
//       return null;
//     }

//     return entry.value;
//   }

//   set(key, value, ttlMs) {
//     this.store.set(key, {
//       value,
//       expiresAt: Date.now() + ttlMs,
//     });
//   }

//   delete(key) {
//     this.store.delete(key);
//   }

//   clear() {
//     this.store.clear();
//   }

//   has(key) {
//     return this.get(key) !== null;
//   }
// }

// export class RedisCache {
//   constructor(options = {}) {
//     this.prefix = options.prefix || process.env.REDIS_KEY_PREFIX?.trim() || "vagas-full";
//     this.memoryFallback = new MemoryCache();
//   }

//   buildKey(key) {
//     return `${this.prefix}:${key}`;
//   }

//   async get(key) {
//     const client = await getRedisClient();

//     if (!client) {
//       return this.memoryFallback.get(key);
//     }

//     try {
//       const raw = await client.get(this.buildKey(key));
//       return raw ? JSON.parse(raw) : null;
//     } catch (error) {
//       warnRedisFallback("Erro ao ler do Redis, usando cache em memoria.", error);
//       return this.memoryFallback.get(key);
//     }
//   }

//   async set(key, value, ttlMs) {
//     this.memoryFallback.set(key, value, ttlMs);

//     const client = await getRedisClient();
//     if (!client) {
//       return;
//     }

//     try {
//       await client.set(this.buildKey(key), JSON.stringify(value), {
//         PX: Math.max(1, Number(ttlMs) || 1),
//       });
//     } catch (error) {
//       warnRedisFallback("Erro ao salvar no Redis, usando cache em memoria.", error);
//     }
//   }

//   async delete(key) {
//     this.memoryFallback.delete(key);

//     const client = await getRedisClient();
//     if (!client) {
//       return;
//     }

//     try {
//       await client.del(this.buildKey(key));
//     } catch (error) {
//       warnRedisFallback("Erro ao remover chave do Redis.", error);
//     }
//   }

//   async clear() {
//     this.memoryFallback.clear();

//     const client = await getRedisClient();
//     if (!client) {
//       return;
//     }

//     try {
//       const keys = [];
//       for await (const key of client.scanIterator({ MATCH: `${this.prefix}:*` })) {
//         keys.push(key);
//       }

//       if (keys.length > 0) {
//         await client.del(keys);
//       }
//     } catch (error) {
//       warnRedisFallback("Erro ao limpar o Redis.", error);
//     }
//   }

//   async has(key) {
//     return (await this.get(key)) !== null;
//   }
// }

// export const cache = process.env.REDIS_URL?.trim() ? new RedisCache() : new MemoryCache();

//Código acima refatorado para melhor organização e reutilização de código, além de melhorias na detecção e tratamento de falhas na conexão com o Redis.
//O cache em memória agora é usado como fallback automático em caso de falhas no Redis, garantindo maior resiliência do sistema.
//Abaixo está o facade simplificado para criação do cache, além de um módulo separado para o status do cache e outro para a conexão com o Redis.

import { cache } from "./cacheFactory.js";
import { getCacheStatus } from "./cacheStatus.js";
import { getRedisClient } from "./redisConnection.js";

export { cache, getCacheStatus };

export async function warmupCache() {
  const status = getCacheStatus();

  if (!status.configured) {
    return getCacheStatus();
  }

  const client = await getRedisClient();
  if (!client) {
    return getCacheStatus();
  }

  try {
    const pong = await client.ping();
    if (pong !== "PONG") {
      console.warn("Redis PING sem resposta esperada.");
    }
  } catch (error) {
    console.warn("Falha ao validar conexão com Redis:", error.message);
  }

  return getCacheStatus();
}
