import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isRedisConnected: vi.fn(),
}));

vi.mock("../../../../src/cache/redisConnection.js", () => ({
  isRedisConnected: mocks.isRedisConnected,
  getRedisClient: vi.fn(),
}));

describe("getCacheStatus", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.REDIS_URL;
  });

  it("retorna provider memory quando REDIS_URL não está configurada", async () => {
    mocks.isRedisConnected.mockReturnValue(false);
    const { getCacheStatus } =
      await import("../../../../src/cache/cacheStatus.js");

    expect(getCacheStatus()).toEqual({
      provider: "memory",
      configured: false,
      connected: false,
    });
  });

  it("retorna provider redis e connected true quando Redis está conectado", async () => {
    process.env.REDIS_URL = "redis://127.0.0.1:6379";
    mocks.isRedisConnected.mockReturnValue(true);
    const { getCacheStatus } =
      await import("../../../../src/cache/cacheStatus.js");

    expect(getCacheStatus()).toEqual({
      provider: "redis",
      configured: true,
      connected: true,
    });
  });

  it("retorna connected false quando Redis está configurado mas desconectado", async () => {
    process.env.REDIS_URL = "redis://127.0.0.1:6379";
    mocks.isRedisConnected.mockReturnValue(false);
    const { getCacheStatus } =
      await import("../../../../src/cache/cacheStatus.js");

    expect(getCacheStatus()).toEqual({
      provider: "redis",
      configured: true,
      connected: false,
    });
  });
});
