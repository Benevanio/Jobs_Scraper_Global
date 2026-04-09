import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  consoleWarn: vi.fn(),
}));

vi.mock("redis", () => ({
  createClient: mocks.createClient,
}));

function buildRedisClientMock(options = {}) {
  const handlers = {};
  const client = {
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
      return client;
    }),
    connect: vi.fn(async () => {
      if (options.connectError) {
        throw options.connectError;
      }

      if (options.triggerReady !== false) {
        handlers.ready?.();
      }
    }),
    ping: vi.fn(async () => options.ping ?? "PONG"),
    get: vi.fn(async () => options.get ?? null),
    set: vi.fn(async () => "OK"),
    del: vi.fn(async () => 1),
    scanIterator: vi.fn(async function* () {
      if (options.scanError) {
        throw options.scanError;
      }

      for (const key of options.scanKeys ?? []) {
        yield key;
      }
    }),
  };

  return { client, handlers };
}

async function importCacheModule() {
  return import("../../../../src/cache/cache.js");
}

describe("MemoryCache", () => {
  let memoryCache;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    delete process.env.REDIS_URL;
    delete process.env.REDIS_KEY_PREFIX;

    const { MemoryCache } = await importCacheModule();
    memoryCache = new MemoryCache();
  });

  it("retorna null quando a chave não existe", () => {
    expect(memoryCache.get("inexistente")).toBeNull();
  });

  it("salva e recupera um valor dentro do TTL", () => {
    memoryCache.set("jobs:react", [{ titulo: "Dev React" }], 1000);

    expect(memoryCache.get("jobs:react")).toEqual([
      { titulo: "Dev React" },
    ]);
  });

  it("remove e retorna null quando o item expirou", () => {
    const nowSpy = vi.spyOn(Date, "now");

    nowSpy.mockReturnValueOnce(1000);
    memoryCache.set("jobs:node", [{ titulo: "Dev Node" }], 500);

    nowSpy.mockReturnValueOnce(1601);
    expect(memoryCache.get("jobs:node")).toBeNull();

    expect(memoryCache.store.has("jobs:node")).toBe(false);
  });

  it("deleta uma chave específica", () => {
    memoryCache.set("a", 123, 1000);
    memoryCache.set("b", 456, 1000);

    memoryCache.delete("a");

    expect(memoryCache.get("a")).toBeNull();
    expect(memoryCache.get("b")).toBe(456);
  });

  it("limpa todo o cache", () => {
    memoryCache.set("a", 123, 1000);
    memoryCache.set("b", 456, 1000);

    memoryCache.clear();

    expect(memoryCache.get("a")).toBeNull();
    expect(memoryCache.get("b")).toBeNull();
  });

  it("has retorna true quando a chave existe e não expirou", () => {
    memoryCache.set("jobs", ["vaga 1"], 1000);

    expect(memoryCache.has("jobs")).toBe(true);
  });

  it("has retorna false quando a chave não existe", () => {
    expect(memoryCache.has("jobs")).toBe(false);
  });

  it("has retorna false quando a chave expirou", () => {
    const nowSpy = vi.spyOn(Date, "now");

    nowSpy.mockReturnValueOnce(2000);
    memoryCache.set("jobs", ["vaga 1"], 100);

    nowSpy.mockReturnValueOnce(2201);
    expect(memoryCache.has("jobs")).toBe(false);
  });
});

describe("Redis cache helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    delete process.env.REDIS_URL;
    delete process.env.REDIS_KEY_PREFIX;
    vi.spyOn(console, "warn").mockImplementation(mocks.consoleWarn);
  });

  it("retorna status de memoria quando REDIS_URL não está configurada", async () => {
    const { MemoryCache, cache, getCacheStatus, getRedisClient, warmupCache } = await importCacheModule();

    expect(await getRedisClient()).toBeNull();
    expect(cache).toBeInstanceOf(MemoryCache);
    expect(getCacheStatus()).toMatchObject({
      provider: "memory",
      configured: false,
      connected: false,
      type: "MemoryCache",
    });
    expect(await warmupCache()).toMatchObject({
      provider: "memory",
      configured: false,
      connected: false,
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("conecta ao Redis, reaproveita o cliente e executa operações no RedisCache", async () => {
    process.env.REDIS_URL = "redis://127.0.0.1:6379";
    process.env.REDIS_KEY_PREFIX = "jobs-test";

    const { client, handlers } = buildRedisClientMock({
      scanKeys: ["jobs-test:a", "jobs-test:b"],
    });
    mocks.createClient.mockReturnValue(client);

    const { RedisCache, getCacheStatus, getRedisClient, warmupCache } = await importCacheModule();

    const firstClient = await getRedisClient();
    const secondClient = await getRedisClient();
    expect(firstClient).toBe(client);
    expect(secondClient).toBe(client);
    expect(mocks.createClient).toHaveBeenCalledTimes(1);

    const socketConfig = mocks.createClient.mock.calls[0][0].socket;
    expect(socketConfig.reconnectStrategy(0)).toBe(100);
    expect(socketConfig.reconnectStrategy(3)).toBe(false);

    const redisCache = new RedisCache({ prefix: "jobs-test" });
    await redisCache.set("react", { ok: true }, 5000);
    client.get.mockResolvedValueOnce(JSON.stringify({ ok: true }));
    expect(await redisCache.get("react")).toEqual({ ok: true });

    await redisCache.delete("react");
    await redisCache.clear();

    expect(client.set).toHaveBeenCalledWith("jobs-test:react", JSON.stringify({ ok: true }), {
      PX: 5000,
    });
    expect(client.del).toHaveBeenCalledWith("jobs-test:react");
    expect(client.del).toHaveBeenCalledWith(["jobs-test:a", "jobs-test:b"]);

    expect(await warmupCache()).toMatchObject({
      provider: "redis",
      configured: true,
      connected: true,
      type: "RedisCache",
    });

    handlers.end?.();
    expect(getCacheStatus().connected).toBe(false);

    process.env.REDIS_URL = "redis://127.0.0.1:6380";
    await getRedisClient();
    expect(mocks.createClient).toHaveBeenCalledTimes(2);
  });

  it("faz fallback quando a conexão com Redis falha", async () => {
    process.env.REDIS_URL = "redis://127.0.0.1:6379";

    const { client } = buildRedisClientMock({
      connectError: new Error("connect failed"),
      triggerReady: false,
    });
    mocks.createClient.mockReturnValue(client);

    const { getCacheStatus, getRedisClient } = await importCacheModule();

    await expect(getRedisClient()).resolves.toBeNull();
    expect(mocks.consoleWarn).toHaveBeenCalledTimes(1);
    expect(mocks.consoleWarn.mock.calls[0][0]).toContain("Falha ao conectar no Redis");
    expect(getCacheStatus()).toMatchObject({
      provider: "redis",
      configured: true,
      connected: false,
      lastError: "connect failed",
    });
  });

  it("usa fallback em memória quando operações do Redis lançam erro", async () => {
    process.env.REDIS_URL = "redis://127.0.0.1:6379";

    const { client } = buildRedisClientMock();
    client.get.mockResolvedValueOnce("{invalid-json");
    client.set.mockRejectedValueOnce(new Error("set failed"));
    client.del.mockRejectedValueOnce(new Error("del failed"));
    client.scanIterator.mockImplementationOnce(async function* () {
      throw new Error("scan failed");
    });
    mocks.createClient.mockReturnValue(client);

    const { RedisCache } = await importCacheModule();

    const redisCache = new RedisCache({ prefix: "jobs-test" });
    redisCache.memoryFallback.set("node", { cached: true }, 1000);

    await expect(redisCache.get("node")).resolves.toEqual({ cached: true });
    await expect(redisCache.set("node", { cached: false }, 1000)).resolves.toBeUndefined();
    await expect(redisCache.delete("node")).resolves.toBeUndefined();
    await expect(redisCache.clear()).resolves.toBeUndefined();

    expect(mocks.consoleWarn).toHaveBeenCalledTimes(1);
  });

  it("marca o status como desconectado quando o ping não retorna PONG", async () => {
    process.env.REDIS_URL = "redis://127.0.0.1:6379";

    const { client } = buildRedisClientMock({ ping: "NOPE" });
    mocks.createClient.mockReturnValue(client);

    const { warmupCache } = await importCacheModule();

    await expect(warmupCache()).resolves.toMatchObject({
      configured: true,
      connected: false,
      lastError: "PING sem resposta esperada",
    });
  });
});