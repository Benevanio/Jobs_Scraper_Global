import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  logInfoMock: vi.fn(),
  logWarnMock: vi.fn(),
}));

vi.mock("../../../../src/logger.js", () => ({
  logInfo: mocks.logInfoMock,
  logWarn: mocks.logWarnMock,
}));

import { scrapeAllSources } from "../../../../src/pipeline/scrapeAllSources.js";

describe("scrapeAllSources", () => {
  const config = {
    keywords: ["React", "Node"],
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("normaliza vagas retornadas pelos adapters", async () => {
    const adapters = [
      {
        sourceName: "LinkedIn",
        search: vi.fn().mockResolvedValue([
          {
            titulo: "Frontend Dev",
            empresa: "ACME",
            local: "São Paulo",
            link: "https://linkedin.com/job/1",
          },
        ]),
      },
    ];

    const jobs = await scrapeAllSources(adapters, { keywords: ["React"] });

    expect(adapters[0].search).toHaveBeenCalledWith("React", {
      keywords: ["React"],
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "LinkedIn",
      keyword: "React",
      palavraChave: "React",
      palavra: "React",
      titulo: "Frontend Dev",
      empresa: "ACME",
      local: "São Paulo",
      link: "https://linkedin.com/job/1",
      keywords: ["React"],
    });
  });

  it("usa sourceName do adapter quando job.source não existe", async () => {
    const adapters = [
      {
        sourceName: "The Muse",
        search: vi.fn().mockResolvedValue([
          {
            titulo: "Designer",
            empresa: "Beta",
            local: "Remoto",
            link: "https://themuse.com/job/1",
          },
        ]),
      },
    ];

    const jobs = await scrapeAllSources(adapters, { keywords: ["Design"] });

    expect(jobs[0].source).toBe("The Muse");
  });

  it("mantém source do job quando ele já existe", async () => {
    const adapters = [
      {
        sourceName: "Adapter X",
        search: vi.fn().mockResolvedValue([
          {
            source: "Fonte Original",
            titulo: "Dev",
            empresa: "ACME",
            local: "SP",
            link: "https://site.com/job/1",
          },
        ]),
      },
    ];

    const jobs = await scrapeAllSources(adapters, { keywords: ["React"] });

    expect(jobs[0].source).toBe("Fonte Original");
  });

  it("deduplica vagas pelo link e faz merge das keywords", async () => {
    const adapters = [
      {
        sourceName: "LinkedIn",
        search: vi
          .fn()
          .mockResolvedValueOnce([
            {
              titulo: "Fullstack Dev",
              empresa: "ACME",
              local: "SP",
              link: "https://site.com/job/1",
            },
          ])
          .mockResolvedValueOnce([
            {
              titulo: "Fullstack Dev",
              empresa: "ACME",
              local: "SP",
              link: "https://site.com/job/1",
            },
          ]),
      },
    ];

    const jobs = await scrapeAllSources(adapters, config);

    expect(jobs).toHaveLength(1);
    expect(jobs[0].keywords).toEqual(["React", "Node"]);
    expect(jobs[0].keyword).toBe("React");
    expect(jobs[0].palavraChave).toBe("React");
    expect(jobs[0].palavra).toBe("React");
  });

  it("deduplica vagas sem link usando chave alternativa", async () => {
    const adapters = [
      {
        sourceName: "Green House",
        search: vi
          .fn()
          .mockResolvedValueOnce([
            {
              titulo: "Backend Dev",
              empresa: "ACME",
              local: "RJ",
            },
          ])
          .mockResolvedValueOnce([
            {
              titulo: "Backend Dev",
              empresa: "ACME",
              local: "RJ",
            },
          ]),
      },
    ];

    const jobs = await scrapeAllSources(adapters, config);

    expect(jobs).toHaveLength(1);
    expect(jobs[0].keywords).toEqual(["React", "Node"]);
  });

  it("ignora retorno inválido do adapter e chama logWarn", async () => {
    const adapters = [
      {
        sourceName: "Fonte Inválida",
        search: vi.fn().mockResolvedValue("nao-e-array"),
      },
    ];

    const jobs = await scrapeAllSources(adapters, { keywords: ["React"] });

    expect(jobs).toEqual([]);
    expect(mocks.logWarnMock).toHaveBeenCalledWith(
      'Fonte Inválida: retorno inválido para "React"',
    );
  });

  it("captura erro do adapter, chama logWarn e continua", async () => {
    const adapters = [
      {
        sourceName: "Fonte Quebrada",
        search: vi.fn().mockRejectedValue(new Error("falha HTTP")),
      },
    ];

    const jobs = await scrapeAllSources(adapters, { keywords: ["React"] });

    expect(jobs).toEqual([]);
    expect(mocks.logWarnMock).toHaveBeenCalledWith(
      'Fonte Quebrada: falha ao buscar "React" -> falha HTTP',
    );
  });

  it("continua processando outras fontes mesmo se uma falhar", async () => {
    const adapters = [
      {
        sourceName: "Fonte Quebrada",
        search: vi.fn().mockRejectedValue(new Error("falha HTTP")),
      },
      {
        sourceName: "LinkedIn",
        search: vi.fn().mockResolvedValue([
          {
            titulo: "React Dev",
            empresa: "ACME",
            local: "SP",
            link: "https://linkedin.com/job/1",
          },
        ]),
      },
    ];

    const jobs = await scrapeAllSources(adapters, { keywords: ["React"] });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      titulo: "React Dev",
      empresa: "ACME",
      source: "LinkedIn",
    });
  });

  it("processa múltiplos adapters e múltiplas keywords", async () => {
    const adapters = [
      {
        sourceName: "LinkedIn",
        search: vi.fn(async (keyword) => [
          {
            titulo: `${keyword} Dev`,
            empresa: "ACME",
            local: "SP",
            link: `https://linkedin.com/job/${keyword.toLowerCase()}`,
          },
        ]),
      },
      {
        sourceName: "The Muse",
        search: vi.fn(async (keyword) => [
          {
            titulo: `${keyword} Designer`,
            empresa: "Beta",
            local: "Remoto",
            link: `https://themuse.com/job/${keyword.toLowerCase()}`,
          },
        ]),
      },
    ];

    const jobs = await scrapeAllSources(adapters, {
      keywords: ["React", "Node"],
    });

    expect(adapters[0].search).toHaveBeenCalledTimes(2);
    expect(adapters[1].search).toHaveBeenCalledTimes(2);
    expect(jobs).toHaveLength(4);
  });

  it("gera keywords únicas ao deduplicar", async () => {
    const adapters = [
      {
        sourceName: "LinkedIn",
        search: vi
          .fn()
          .mockResolvedValueOnce([
            {
              titulo: "Dev",
              empresa: "ACME",
              local: "SP",
              link: "https://site.com/job/1",
              keyword: "React",
              palavraChave: "React",
              keywords: ["React"],
            },
          ])
          .mockResolvedValueOnce([
            {
              titulo: "Dev",
              empresa: "ACME",
              local: "SP",
              link: "https://site.com/job/1",
              keyword: "Node",
              palavraChave: "Node",
              keywords: ["Node", "React"],
            },
          ]),
      },
    ];

    const jobs = await scrapeAllSources(adapters, {
      keywords: ["React", "Node"],
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].keywords).toEqual(["React", "Node"]);
  });

  it("chama logInfo no início da fonte e após processar keyword", async () => {
    const adapters = [
      {
        sourceName: "LinkedIn",
        search: vi.fn().mockResolvedValue([
          {
            titulo: "Dev",
            empresa: "ACME",
            local: "SP",
            link: "https://site.com/job/1",
          },
        ]),
      },
    ];

    await scrapeAllSources(adapters, { keywords: ["React"] });

    expect(mocks.logInfoMock).toHaveBeenCalledWith("Iniciando fonte: LinkedIn");
    expect(mocks.logInfoMock).toHaveBeenCalledWith(
      'LinkedIn: 1 vagas para "React"',
    );
  });

  it("mantém keyword e palavraChave do job quando já vierem preenchidos", async () => {
    const adapters = [
      {
        sourceName: "LinkedIn",
        search: vi.fn().mockResolvedValue([
          {
            titulo: "Dev",
            empresa: "ACME",
            local: "SP",
            link: "https://site.com/job/1",
            keyword: "CustomKeyword",
            palavraChave: "CustomPalavra",
          },
        ]),
      },
    ];

    const jobs = await scrapeAllSources(adapters, { keywords: ["React"] });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "LinkedIn",
      keyword: "CustomKeyword",
      palavraChave: "CustomPalavra",
      palavra: "CustomKeyword",
    });
  });

  it("usa unknown quando job.source e adapter.sourceName não existem", async () => {
    const adapters = [
      {
        search: vi.fn().mockResolvedValue([
          {
            titulo: "Dev sem fonte",
            empresa: "ACME",
            local: "SP",
            link: "https://site.com/job/1",
          },
        ]),
      },
    ];

    const jobs = await scrapeAllSources(adapters, { keywords: ["React"] });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].source).toBe("unknown");
  });

  it("usa jobUrl como chave de deduplicação quando link não existe", async () => {
    const adapters = [
      {
        sourceName: "LinkedIn",
        search: vi
          .fn()
          .mockResolvedValueOnce([
            {
              titulo: "Dev",
              empresa: "ACME",
              local: "SP",
              jobUrl: "https://site.com/job/abc",
            },
          ])
          .mockResolvedValueOnce([
            {
              titulo: "Dev",
              empresa: "ACME",
              local: "SP",
              jobUrl: "https://site.com/job/abc",
            },
          ]),
      },
    ];

    const jobs = await scrapeAllSources(adapters, {
      keywords: ["React", "Node"],
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].keywords).toEqual(["React", "Node"]);
  });

  it("faz merge de existing.keywords com incoming.keywords ao deduplicar", async () => {
    const adapters = [
      {
        sourceName: "LinkedIn",
        search: vi
          .fn()
          .mockResolvedValueOnce([
            {
              titulo: "Dev",
              empresa: "ACME",
              local: "SP",
              link: "https://site.com/job/1",
              keywords: ["React", "Frontend"],
            },
          ])
          .mockResolvedValueOnce([
            {
              titulo: "Dev",
              empresa: "ACME",
              local: "SP",
              link: "https://site.com/job/1",
              keywords: ["Node", "Backend"],
            },
          ]),
      },
    ];

    const jobs = await scrapeAllSources(adapters, {
      keywords: ["React", "Node"],
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].keywords).toEqual(["React", "Frontend", "Node", "Backend"]);
  });

  it("usa a chave fallback na deduplicação mesmo quando não há link nem jobUrl", async () => {
    const adapters = [
      {
        sourceName: "Fonte X",
        search: vi
          .fn()
          .mockResolvedValueOnce([
            {
              titulo: "",
              empresa: "",
              local: "",
              source: "Fonte X",
              link: "",
              jobUrl: "",
            },
          ])
          .mockResolvedValueOnce([
            {
              titulo: "",
              empresa: "",
              local: "",
              source: "Fonte X",
              link: "",
              jobUrl: "",
            },
          ]),
      },
    ];

    const jobs = await scrapeAllSources(adapters, {
      keywords: ["React", "Node"],
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "Fonte X",
      keyword: "React",
      palavraChave: "React",
      palavra: "React",
      keywords: ["React", "Node"],
      titulo: "",
      empresa: "",
      local: "",
      link: "",
      jobUrl: "",
    });
  });

  it("trata erro desconhecido quando o adapter rejeita com valor que não é Error", async () => {
    const adapters = [
      {
        sourceName: "Fonte Estranha",
        search: vi.fn().mockRejectedValue("falhou estranho"),
      },
    ];

    const jobs = await scrapeAllSources(adapters, { keywords: ["React"] });

    expect(jobs).toEqual([]);
    expect(mocks.logWarnMock).toHaveBeenCalledWith(
      'Fonte Estranha: falha ao buscar "React" -> erro desconhecido',
    );
  });

  it("gera palavra a partir de palavraChave quando keyword não existe", async () => {
    const adapters = [
      {
        sourceName: "Fonte Y",
        search: vi.fn().mockResolvedValue([
          {
            titulo: "Dev",
            empresa: "ACME",
            local: "SP",
            link: "https://site.com/job/1",
            palavraChave: "Especial",
          },
        ]),
      },
    ];

    const jobs = await scrapeAllSources(adapters, { keywords: ["React"] });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      keyword: "Especial",
      palavraChave: "Especial",
      palavra: "Especial",
    });
  });
});
