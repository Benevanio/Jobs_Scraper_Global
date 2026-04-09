import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRedisClient: vi.fn(),
}));

vi.mock("../../../../src/cache/cache.js", () => ({
  getRedisClient: mocks.getRedisClient,
}));

async function importKeywordsStore() {
  return import("../../../../src/db/keywordsStore.js");
}

describe("keywordsStore", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.SEARCH_KEYWORDS;
    delete process.env.KEYWORDS_STORAGE_MODE;
    delete process.env.KEYWORDS_REDIS_KEY;
    delete process.env.REDIS_KEY_PREFIX;
    delete process.env.KEYWORDS_FILE_PATH;
    mocks.getRedisClient.mockResolvedValue(null);
  });

  it("normaliza keywords removendo vazios e duplicadas", async () => {
    const { normalizeKeywords } = await importKeywordsStore();

    expect(normalizeKeywords([" Node ", "React", "Node", "", null])).toEqual([
      "Node",
      "React",
    ]);
    expect(normalizeKeywords("Node")).toBeNull();
  });

  it("carrega keywords do Redis quando existe um array salvo", async () => {
    process.env.KEYWORDS_REDIS_KEY = "custom:keywords";
    const client = {
      get: vi.fn().mockResolvedValue(JSON.stringify([" Node ", "React", "Node"])),
    };
    mocks.getRedisClient.mockResolvedValue(client);

    const { loadKeywords } = await importKeywordsStore();

    await expect(loadKeywords(["fallback"])) .resolves.toEqual(["Node", "React"]);
    expect(client.get).toHaveBeenCalledWith("custom:keywords");
  });

  it("carrega keywords do formato legado KEYWORDS vindo do Redis", async () => {
    const client = {
      get: vi.fn().mockResolvedValue(JSON.stringify({ KEYWORDS: ["Java", "Spring", "Java"] })),
    };
    mocks.getRedisClient.mockResolvedValue(client);

    const { loadKeywords } = await importKeywordsStore();

    await expect(loadKeywords(["fallback"])) .resolves.toEqual(["Java", "Spring"]);
  });

  it("faz fallback para SEARCH_KEYWORDS quando Redis não retorna valor", async () => {
    process.env.SEARCH_KEYWORDS = " Suporte, Node, Suporte ";
    const client = { get: vi.fn().mockResolvedValue(null) };
    mocks.getRedisClient.mockResolvedValue(client);

    const { loadKeywords } = await importKeywordsStore();

    await expect(loadKeywords(["fallback"])) .resolves.toEqual(["Suporte", "Node"]);
  });

  it("usa o fallback recebido quando Redis está indisponível ou retorna JSON inválido", async () => {
    const { loadKeywords } = await importKeywordsStore();

    await expect(loadKeywords([" Produto ", "Produto", "Dados "])) .resolves.toEqual([
      "Produto",
      "Dados",
    ]);

    const client = { get: vi.fn().mockResolvedValue("{invalid-json") };
    mocks.getRedisClient.mockResolvedValue(client);

    await expect(loadKeywords(["QA", "Dados"])) .resolves.toEqual(["QA", "Dados"]);
  });

  it("salva no Redis usando a chave configurada", async () => {
    process.env.REDIS_KEY_PREFIX = "vagas-full";
    const client = { set: vi.fn().mockResolvedValue("OK") };
    mocks.getRedisClient.mockResolvedValue(client);

    const { saveKeywords } = await importKeywordsStore();

    await expect(saveKeywords([" Node ", "React", "Node"])) .resolves.toEqual(["Node", "React"]);
    expect(client.set).toHaveBeenCalledWith("vagas-full:keywords", JSON.stringify(["Node", "React"]));
  });

  it("retorna null para payload inválido e falha quando Redis está indisponível", async () => {
    const { saveKeywords } = await importKeywordsStore();

    await expect(saveKeywords("invalido")).resolves.toBeNull();
    await expect(saveKeywords(["Backend", "Java"])) .rejects.toThrow(
      "Redis indisponivel para salvar keywords.",
    );
  });
});