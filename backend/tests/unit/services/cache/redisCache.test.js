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
      if (options.connectError) throw options.connectError;
      if (options.triggerReady !== false) handlers.ready?.();
    }),
    get: vi.fn(async () => options.get ?? null),
    set: vi.fn(async () => "OK"),
    del: vi.fn(async () => 1),
    scanIterator: vi.fn(async function* () {
      for (const key of options.scanKeys ?? []) yield key;
    }),
  };
  return { client, handlers };
}

describe("RedisCache", () => {
  const REDIS_URL = process.env.REDIS_URL;
  const REDIS_KEY_PREFIX = process.env.REDIS_KEY_PREFIX ?? "jobs-test";

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    process.env.REDIS_URL = REDIS_URL;
    process.env.REDIS_KEY_PREFIX = REDIS_KEY_PREFIX;
    vi.spyOn(console, "warn").mockImplementation(mocks.consoleWarn);
  });

  it("faz get e retorna valor do Redis", async () => {
    const { client } = buildRedisClientMock();
    client.get.mockResolvedValueOnce(JSON.stringify({ titulo: "Dev React" }));
    mocks.createClient.mockReturnValue(client);

    const { RedisCache } = await import("../../../../src/cache/redisCache.js");
    const cache = new RedisCache({ prefix: REDIS_KEY_PREFIX });

    expect(await cache.get("react")).toEqual({ titulo: "Dev React" });
    expect(client.get).toHaveBeenCalledWith(`${REDIS_KEY_PREFIX}:react`);
  });

  it("retorna null quando Redis retorna JSON inválido", async () => {
    const { client } = buildRedisClientMock();
    client.get.mockResolvedValueOnce("{invalid-json");
    mocks.createClient.mockReturnValue(client);

    const { RedisCache } = await import("../../../../src/cache/redisCache.js");
    const cache = new RedisCache({ prefix: REDIS_KEY_PREFIX });

    expect(await cache.get("react")).toBeNull();
  });

  it("faz fallback para memória quando Redis lança exceção no get", async () => {
    const { client } = buildRedisClientMock();
    client.get.mockRejectedValueOnce(new Error("get failed"));
    mocks.createClient.mockReturnValue(client);

    const { RedisCache } = await import("../../../../src/cache/redisCache.js");
    const cache = new RedisCache({ prefix: REDIS_KEY_PREFIX });
    cache.memory.set("react", { cached: true }, 5000);

    expect(await cache.get("react")).toEqual({ cached: true });
  });

  it("faz set no Redis com TTL correto", async () => {
    const { client } = buildRedisClientMock();
    mocks.createClient.mockReturnValue(client);

    const { RedisCache } = await import("../../../../src/cache/redisCache.js");
    const cache = new RedisCache({ prefix: REDIS_KEY_PREFIX });

    await cache.set("react", { ok: true }, 5000);

    expect(client.set).toHaveBeenCalledWith(
      `${REDIS_KEY_PREFIX}:react`,
      JSON.stringify({ ok: true }),
      { PX: 5000 },
    );
  });

  it("aplica TTL mínimo de 1000ms no set", async () => {
    const { client } = buildRedisClientMock();
    mocks.createClient.mockReturnValue(client);

    const { RedisCache } = await import("../../../../src/cache/redisCache.js");
    const cache = new RedisCache({ prefix: REDIS_KEY_PREFIX });

    await cache.set("react", { ok: true }, 0);

    expect(client.set).toHaveBeenCalledWith(
      `${REDIS_KEY_PREFIX}:react`,
      JSON.stringify({ ok: true }),
      { PX: 1000 },
    );
  });

  it("faz delete no Redis e na memória", async () => {
    const { client } = buildRedisClientMock();
    mocks.createClient.mockReturnValue(client);

    const { RedisCache } = await import("../../../../src/cache/redisCache.js");
    const cache = new RedisCache({ prefix: REDIS_KEY_PREFIX });

    await cache.delete("react");

    expect(client.del).toHaveBeenCalledWith(`${REDIS_KEY_PREFIX}:react`);
  });

  it("faz clear em lote no Redis", async () => {
    const scanKeys = [`${REDIS_KEY_PREFIX}:a`, `${REDIS_KEY_PREFIX}:b`];
    const { client } = buildRedisClientMock({ scanKeys });
    mocks.createClient.mockReturnValue(client);

    const { RedisCache } = await import("../../../../src/cache/redisCache.js");
    const cache = new RedisCache({ prefix: REDIS_KEY_PREFIX });

    await cache.clear();

    expect(client.del).toHaveBeenCalledWith(scanKeys);
  });

  it("faz fallback para memória quando REDIS_URL não está configurada", async () => {
    delete process.env.REDIS_URL;

    const { RedisCache } = await import("../../../../src/cache/redisCache.js");
    const cache = new RedisCache({ prefix: REDIS_KEY_PREFIX });

    cache.memory.set("react", { cached: true }, 5000);
    expect(await cache.get("react")).toEqual({ cached: true });
  });

  it("emite warn quando set falha e faz fallback para memória", async () => {
    const { client } = buildRedisClientMock();
    client.set.mockRejectedValueOnce(new Error("set failed"));
    mocks.createClient.mockReturnValue(client);

    const { RedisCache } = await import("../../../../src/cache/redisCache.js");
    const cache = new RedisCache({ prefix: REDIS_KEY_PREFIX });

    await cache.set("react", { ok: true }, 5000);

    expect(mocks.consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining("Erro ao salvar no Redis"),
      expect.any(String),
    );
  });

  it("emite warn quando delete falha", async () => {
    const { client } = buildRedisClientMock();
    client.del.mockRejectedValueOnce(new Error("del failed"));
    mocks.createClient.mockReturnValue(client);

    const { RedisCache } = await import("../../../../src/cache/redisCache.js");
    const cache = new RedisCache({ prefix: REDIS_KEY_PREFIX });

    await cache.delete("react");

    expect(mocks.consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining("Erro ao deletar chave do Redis"),
      expect.any(String),
    );
  });
});
