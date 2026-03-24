import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  withRequestDedup: vi.fn(),
  scrapeAllSources: vi.fn(),
}));

vi.mock("../../../../src/cache/cache.js", () => ({
  cache: {
    get: mocks.cacheGet,
    set: mocks.cacheSet,
  },
}));

vi.mock("../../../../src/pipeline/requestDedup.js", () => ({
  withRequestDedup: mocks.withRequestDedup,
}));

vi.mock("../../../../src/pipeline/scrapeAllSources.js", () => ({
  scrapeAllSources: mocks.scrapeAllSources,
}));

import { searchJobsWithCache } from "../../../../src/pipeline/searchJobsWithCache.js";

const BASE_CONFIG = {
  keywords: ["React", "Node"],
  searchLocation: "Brasil",
  searchGeoId: "106057199",
  searchLanguage: "pt",
  jobTypes: "C,F",
  timeFilter: "r604800",
  remoteOnly: false,
};

describe("searchJobsWithCache", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("retorna do cache quando já existe resultado salvo", async () => {
    mocks.cacheGet.mockReturnValueOnce({
      jobs: [{ titulo: "Dev React" }],
      total: 1,
      cachedAt: "2026-03-24T20:00:00.000Z",
      fromCache: false,
    });

    const result = await searchJobsWithCache([], BASE_CONFIG);

    expect(mocks.cacheGet).toHaveBeenCalledTimes(1);
    expect(mocks.withRequestDedup).not.toHaveBeenCalled();
    expect(mocks.scrapeAllSources).not.toHaveBeenCalled();

    expect(result).toEqual({
      jobs: [{ titulo: "Dev React" }],
      total: 1,
      cachedAt: "2026-03-24T20:00:00.000Z",
      fromCache: true,
    });
  });

  it("busca nas fontes, salva no cache e retorna resultado quando não há cache", async () => {
    mocks.cacheGet
      .mockReturnValueOnce(null) // antes do dedup
      .mockReturnValueOnce(null); // dentro do dedup

    mocks.scrapeAllSources.mockResolvedValueOnce([
      { titulo: "Dev React" },
      { titulo: "Dev Node" },
    ]);

    mocks.withRequestDedup.mockImplementation(async (_key, fn) => fn());

    const result = await searchJobsWithCache([], BASE_CONFIG, 5000);

    expect(mocks.cacheGet).toHaveBeenCalledTimes(2);
    expect(mocks.withRequestDedup).toHaveBeenCalledTimes(1);
    expect(mocks.scrapeAllSources).toHaveBeenCalledTimes(1);
    expect(mocks.scrapeAllSources).toHaveBeenCalledWith([], BASE_CONFIG);

    expect(mocks.cacheSet).toHaveBeenCalledTimes(1);

    const [cacheKey, cachedResult, ttl] = mocks.cacheSet.mock.calls[0];

    expect(cacheKey).toBe(
      "jobs:node,react:brasil:106057199:pt:C,F:r604800:all",
    );
    expect(ttl).toBe(5000);
    expect(cachedResult.jobs).toEqual([
      { titulo: "Dev React" },
      { titulo: "Dev Node" },
    ]);
    expect(cachedResult.total).toBe(2);
    expect(cachedResult.fromCache).toBe(false);
    expect(typeof cachedResult.cachedAt).toBe("string");

    expect(result).toMatchObject({
      jobs: [{ titulo: "Dev React" }, { titulo: "Dev Node" }],
      total: 2,
      fromCache: false,
    });
    expect(typeof result.cachedAt).toBe("string");
  });

  it("retorna do cache dentro do dedup se outro fluxo já tiver populado", async () => {
    mocks.cacheGet
      .mockReturnValueOnce(null) // antes do dedup
      .mockReturnValueOnce({
        jobs: [{ titulo: "Dev Fullstack" }],
        total: 1,
        cachedAt: "2026-03-24T20:10:00.000Z",
        fromCache: false,
      }); // dentro do dedup

    mocks.withRequestDedup.mockImplementation(async (_key, fn) => fn());

    const result = await searchJobsWithCache([], BASE_CONFIG);

    expect(mocks.cacheGet).toHaveBeenCalledTimes(2);
    expect(mocks.withRequestDedup).toHaveBeenCalledTimes(1);
    expect(mocks.scrapeAllSources).not.toHaveBeenCalled();
    expect(mocks.cacheSet).not.toHaveBeenCalled();

    expect(result).toEqual({
      jobs: [{ titulo: "Dev Fullstack" }],
      total: 1,
      cachedAt: "2026-03-24T20:10:00.000Z",
      fromCache: true,
    });
  });

  it("normaliza keywords e campos opcionais ao montar a chave do cache", async () => {
    const config = {
      keywords: ["  Node ", "react", "React"],
      searchLocation: "  Brasil  ",
      searchGeoId: " 106057199 ",
      searchLanguage: " PT ",
      jobTypes: "C,F",
      timeFilter: "r604800",
      remoteOnly: true,
    };

    mocks.cacheGet.mockReturnValueOnce(null).mockReturnValueOnce(null);

    mocks.scrapeAllSources.mockResolvedValueOnce([]);
    mocks.withRequestDedup.mockImplementation(async (_key, fn) => fn());

    await searchJobsWithCache([], config, 1234);

    const [cacheKey] = mocks.cacheSet.mock.calls[0];

    expect(cacheKey).toBe(
      "jobs:node,react,react:brasil:106057199:pt:C,F:r604800:remote",
    );
  });
});
