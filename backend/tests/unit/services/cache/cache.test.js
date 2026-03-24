import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryCache } from "../../../../src/cache/cache.js";

describe("MemoryCache", () => {
  let memoryCache;

  beforeEach(() => {
    memoryCache = new MemoryCache();
    vi.restoreAllMocks();
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

    nowSpy.mockReturnValueOnce(1000); // set
    memoryCache.set("jobs:node", [{ titulo: "Dev Node" }], 500);

    nowSpy.mockReturnValueOnce(1601); // get
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

    nowSpy.mockReturnValueOnce(2000); // set
    memoryCache.set("jobs", ["vaga 1"], 100);

    nowSpy.mockReturnValueOnce(2201); // has -> get
    expect(memoryCache.has("jobs")).toBe(false);
  });
});