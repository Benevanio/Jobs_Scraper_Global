import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  logWarn: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("../../../src/logger.ts", () => ({
  logWarn: mocks.logWarn,
}));

import { searchJobs } from "../../../src/adapters/goScraper.ts";

const validParams = {
  keywords: ["Java", "Node.js"],
  location: "Brasil",
};

const validResponse = {
  jobs: [
    {
      id: "1",
      title: "Dev",
      company: "ACME",
      location: "Brasil",
      url: "https://example.com/job/1",
      source: "LinkedIn",
    },
  ],
  total: 1,
  cachedAt: "2026-01-01T00:00:00Z",
  fromCache: false,
};

describe("goScraper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mocks.fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns jobs when response is valid", async () => {
    mocks.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => validResponse,
    });

    const result = await searchJobs(validParams);

    expect(result.total).toBe(1);
    expect(result.jobs[0].title).toBe("Dev");
    expect(mocks.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/scrape"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("throws when response is not ok", async () => {
    mocks.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(searchJobs(validParams)).rejects.toThrow(
      "Go scraper: 500 Internal Server Error",
    );
  });

  it("throws when response does not match schema", async () => {
    mocks.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: "data" }),
    });

    await expect(searchJobs(validParams)).rejects.toThrow(
      "Go scraper: resposta invalida",
    );
    expect(mocks.logWarn).toHaveBeenCalledWith(
      "Go scraper: resposta fora do contrato",
      expect.objectContaining({ error: expect.any(String) }),
    );
  });

  it("throws when params are invalid", async () => {
    await expect(searchJobs({ keywords: [] })).rejects.toThrow();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("sends validated params to Go scraper", async () => {
    mocks.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => validResponse,
    });

    await searchJobs({
      keywords: ["Java", " Java ", "Node.js"],
      location: "SP",
    });

    const body = JSON.parse(mocks.fetch.mock.calls[0][1].body);
    expect(body.keywords).toEqual(["Java", " Java ", "Node.js"]);
    expect(body.location).toBe("SP");
  });

  it("uses GO_SCRAPER_URL from environment", async () => {
    process.env.GO_SCRAPER_URL = "http://custom-go:9999";
    vi.resetModules();

    vi.stubGlobal("fetch", mocks.fetch);
    mocks.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => validResponse,
    });

    const { searchJobs: searchJobsFresh } =
      await import("../../../src/adapters/goScraper.ts");
    await searchJobsFresh(validParams);

    expect(mocks.fetch).toHaveBeenCalledWith(
      "http://custom-go:9999/scrape",
      expect.anything(),
    );

    delete process.env.GO_SCRAPER_URL;
    vi.resetModules();
  });
});
