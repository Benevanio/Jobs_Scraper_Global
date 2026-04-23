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
    ping: vi.fn(async () => options.ping ?? "PONG"),
    get: vi.fn(async () => null),
    set: vi.fn(async () => "OK"),
    del: vi.fn(async () => 1),
    scanIterator: vi.fn(async function* () {}),
  };
  return { client, handlers };
}

describe("redisConnection", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    delete process.env.REDIS_URL;
    vi.spyOn(console, "warn").mockImplementation(mocks.consoleWarn);
  });

  it("retorna null quando REDIS_URL não está configurada", async () => {
    const { getRedisClient } =
      await import("../../../../src/cache/redisConnection.js");
    expect(await getRedisClient()).toBeNull();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("conecta ao Redis e reutiliza o cliente na segunda chamada", async () => {
    process.env.REDIS_URL = "redis://127.0.0.1:6379";
    const { client } = buildRedisClientMock();
    mocks.createClient.mockReturnValue(client);

    const { getRedisClient } =
      await import("../../../../src/cache/redisConnection.js");

    const first = await getRedisClient();
    const second = await getRedisClient();

    expect(first).toBe(client);
    expect(second).toBe(client);
    expect(mocks.createClient).toHaveBeenCalledTimes(1);
  });

  it("reconecta quando a REDIS_URL muda", async () => {
    process.env.REDIS_URL = "redis://127.0.0.1:6379";
    const { client: clientA } = buildRedisClientMock();
    const { client: clientB } = buildRedisClientMock();
    mocks.createClient
      .mockReturnValueOnce(clientA)
      .mockReturnValueOnce(clientB);

    const { getRedisClient } =
      await import("../../../../src/cache/redisConnection.js");

    await getRedisClient();
    process.env.REDIS_URL = "redis://127.0.0.1:6380";
    await getRedisClient();

    expect(mocks.createClient).toHaveBeenCalledTimes(2);
  });

  it("configura reconnectStrategy corretamente", async () => {
    process.env.REDIS_URL = "redis://127.0.0.1:6379";
    const { client } = buildRedisClientMock();
    mocks.createClient.mockReturnValue(client);

    const { getRedisClient } =
      await import("../../../../src/cache/redisConnection.js");
    await getRedisClient();

    const socketConfig = mocks.createClient.mock.calls[0][0].socket;
    expect(socketConfig.reconnectStrategy(0)).toBe(100);
    expect(socketConfig.reconnectStrategy(1)).toBe(200);
    expect(socketConfig.reconnectStrategy(3)).toBe(false);
  });

  it("retorna null e emite warn quando a conexão falha", async () => {
    process.env.REDIS_URL = "redis://127.0.0.1:6379";
    const { client } = buildRedisClientMock({
      connectError: new Error("connect failed"),
      triggerReady: false,
    });
    mocks.createClient.mockReturnValue(client);

    const { getRedisClient } =
      await import("../../../../src/cache/redisConnection.js");

    expect(await getRedisClient()).toBeNull();
    expect(mocks.consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining("Falha ao conectar no Redis"),
      expect.any(String),
    );
  });

  it("isRedisConnected retorna true após conexão e false após end", async () => {
    process.env.REDIS_URL = "redis://127.0.0.1:6379";
    const { client, handlers } = buildRedisClientMock();
    mocks.createClient.mockReturnValue(client);

    const { getRedisClient, isRedisConnected } =
      await import("../../../../src/cache/redisConnection.js");

    await getRedisClient();
    expect(isRedisConnected()).toBe(true);

    handlers.end?.();
    expect(isRedisConnected()).toBe(false);
  });

  it("isRedisConnected retorna false após erro de conexão", async () => {
    process.env.REDIS_URL = "redis://127.0.0.1:6379";
    const { client, handlers } = buildRedisClientMock();
    mocks.createClient.mockReturnValue(client);

    const { getRedisClient, isRedisConnected } =
      await import("../../../../src/cache/redisConnection.js");

    await getRedisClient();
    handlers.error?.(new Error("redis error"));
    expect(isRedisConnected()).toBe(false);
  });
});
