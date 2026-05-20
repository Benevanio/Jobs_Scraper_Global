import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  logWarn: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("../../../src/logger.ts", () => ({
  logWarn: mocks.logWarn,
}));

import {
  loadKeywords,
  normalizeKeywords,
  saveKeywords,
} from "../../../src/adapters/goKeywords.ts";

describe("goKeywords", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mocks.fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("normalizeKeywords", () => {
    it("returns null when input is not an array", () => {
      expect(normalizeKeywords("Java")).toBeNull();
      expect(normalizeKeywords(null)).toBeNull();
      expect(normalizeKeywords(123)).toBeNull();
      expect(normalizeKeywords({})).toBeNull();
    });

    it("returns empty array when all items are empty strings", () => {
      expect(normalizeKeywords(["", "  ", ""])).toEqual([]);
    });

    it("trims and deduplicates keywords", () => {
      expect(normalizeKeywords(["Java", " Java ", "Node.js", "Java"])).toEqual([
        "Java",
        "Node.js",
      ]);
    });

    it("converts non-string items to string", () => {
      expect(normalizeKeywords([1, true, "Node"])).toEqual([
        "1",
        "true",
        "Node",
      ]);
    });

    it("returns empty array for empty input", () => {
      expect(normalizeKeywords([])).toEqual([]);
    });
  });

  describe("loadKeywords", () => {
    it("returns keywords from Go when response is ok", async () => {
      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ keywords: ["Java", "Node.js"] }),
      });

      const result = await loadKeywords([]);
      expect(result).toEqual(["Java", "Node.js"]);
    });

    it("returns fallback when response is not ok", async () => {
      mocks.fetch.mockResolvedValueOnce({ ok: false });

      const result = await loadKeywords(["fallback"]);
      expect(result).toEqual(["fallback"]);
    });

    it("returns fallback when fetch throws", async () => {
      mocks.fetch.mockRejectedValueOnce(new Error("fetch failed"));

      const result = await loadKeywords(["fallback"]);
      expect(result).toEqual(["fallback"]);
      expect(mocks.logWarn).toHaveBeenCalledWith(
        "Erro ao carregar keywords do Go",
        { error: "fetch failed" },
      );
    });

    it("returns fallback when response keywords are invalid", async () => {
      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ keywords: "not-an-array" }),
      });

      const result = await loadKeywords(["fallback"]);
      expect(result).toEqual(["fallback"]);
    });

    it("uses empty array as default fallback", async () => {
      mocks.fetch.mockRejectedValueOnce(new Error("fetch failed"));

      const result = await loadKeywords();
      expect(result).toEqual([]);
    });
  });

  describe("saveKeywords", () => {
    it("saves and returns normalized keywords", async () => {
      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ keywords: ["Java", "Node.js"] }),
      });

      const result = await saveKeywords(["Java", "Node.js"]);
      expect(result).toEqual(["Java", "Node.js"]);
      expect(mocks.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/keywords"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    it("returns null when input is not an array", async () => {
      const result = await saveKeywords("invalid");
      expect(result).toBeNull();
      expect(mocks.fetch).not.toHaveBeenCalled();
    });

    it("throws when response is not ok", async () => {
      mocks.fetch.mockResolvedValueOnce({ ok: false });

      await expect(saveKeywords(["Java"])).rejects.toThrow(
        "Erro ao salvar keywords no Go",
      );
    });

    it("deduplicates keywords before saving", async () => {
      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ keywords: ["Java"] }),
      });

      await saveKeywords(["Java", "Java", " Java "]);

      const body = JSON.parse(mocks.fetch.mock.calls[0][1].body);
      expect(body.keywords).toEqual(["Java"]);
    });
  });
});
