import { fetchJobFiles, fetchJobsByFile } from "@/services/jobsService";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("jobsService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retorna lista de arquivos", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ files: [{ file: "vagas.xlsx" }] }) })),
    );

    const files = await fetchJobFiles();
    expect(files).toEqual([{ file: "vagas.xlsx" }]);
  });

  it("filtra entradas invalidas ao listar arquivos", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ files: [{ file: "ok.xlsx" }, null, { file: 1 }] }) })),
    );

    const files = await fetchJobFiles();
    expect(files).toEqual([{ file: "ok.xlsx" }]);
  });

  it("retorna lista vazia quando payload nao possui files array", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ files: "invalido" }) })));

    const files = await fetchJobFiles();
    expect(files).toEqual([]);
  });

  it("lanca erro com mensagem da API ao listar arquivos", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({ message: "erro-listagem" }) })),
    );

    await expect(fetchJobFiles()).rejects.toThrow("erro-listagem");
  });

  it("lanca erro padrao ao listar arquivos sem mensagem", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({}) })));

    await expect(fetchJobFiles()).rejects.toThrow("Falha ao listar arquivos de vagas.");
  });

  it("retorna jobs por arquivo", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ jobs: [{ titulo: "Dev" }], file: "vagas.xlsx", modifiedAt: 1, total: 1 }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchJobsByFile("vagas.xlsx");
    expect(response.total).toBe(1);
    expect(response.file).toBe("vagas.xlsx");
    expect(fetchMock).toHaveBeenCalledWith("/api/jobs?file=vagas.xlsx");
  });

  it("usa endpoint sem sufixo quando fileName vazio", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ jobs: [{ titulo: "Dev" }], file: "vagas.xlsx", modifiedAt: 1, total: 1 }),
      })),
    );

    await fetchJobsByFile("");
    expect(fetch).toHaveBeenCalledWith("/api/jobs");
  });

  it("normaliza payload invalido ao buscar jobs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ jobs: "x", file: 7, modifiedAt: {}, total: null }) })),
    );

    const response = await fetchJobsByFile("vagas com espaco.xlsx");
    expect(response).toEqual({ jobs: [], file: "", modifiedAt: null, total: 0 });
    expect(fetch).toHaveBeenCalledWith("/api/jobs?file=vagas%20com%20espaco.xlsx");
  });

  it("lanca erro com mensagem da API ao buscar jobs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({ message: "erro-jobs" }) })),
    );

    await expect(fetchJobsByFile("vagas.xlsx")).rejects.toThrow("erro-jobs");
  });

  it("lanca erro padrao ao buscar jobs sem mensagem", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({}) })));

    await expect(fetchJobsByFile("vagas.xlsx")).rejects.toThrow("Falha ao carregar vagas.");
  });
});
