import { existsSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import XLSX from "xlsx";

const mocks = vi.hoisted(() => ({
  run: vi.fn(),
  searchJobsWithCache: vi.fn(),
  loadKeywords: vi.fn(),
  saveKeywords: vi.fn(),
  getCacheStatus: vi.fn(),
}));

vi.mock("../../src/app.js", () => ({
  run: mocks.run,
}));

vi.mock("../../src/pipeline/searchJobsWithCache.js", () => ({
  searchJobsWithCache: mocks.searchJobsWithCache,
}));

vi.mock("../../src/db/keywordsStore.js", () => ({
  loadKeywords: mocks.loadKeywords,
  normalizeKeywords: (keywords) => {
    if (!Array.isArray(keywords)) {
      return null;
    }

    return [...new Set(keywords.map((item) => String(item ?? "").trim()).filter(Boolean))];
  },
  saveKeywords: mocks.saveKeywords,
}));

vi.mock("../../src/cache/cache.js", () => ({
  getCacheStatus: mocks.getCacheStatus,
}));

import { createJobsApiApp } from "../../src/jobsApiApp.js";

describe("jobs API", () => {
  let tmpDir;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.run.mockResolvedValue(undefined);
    mocks.searchJobsWithCache.mockResolvedValue({
      jobs: [{ titulo: "Dev", empresa: "ACME" }],
      total: 1,
      fromCache: false,
      cachedAt: "2026-04-09T00:00:00.000Z",
    });
    mocks.loadKeywords.mockResolvedValue(["Java", "Spring", "RabbitMQ", "Docker"]);
    mocks.saveKeywords.mockImplementation(async (keywords) => {
      if (process.env.KEYWORDS_STORAGE_MODE === "env") {
        process.env.SEARCH_KEYWORDS = keywords.join(",");
      }

      return keywords;
    });
    mocks.getCacheStatus.mockReturnValue({
      configured: false,
      connected: false,
      provider: "memory",
      type: "MemoryCache",
    });
    delete process.env.KEYWORDS_FILE_PATH;
    delete process.env.KEYWORDS_STORAGE_MODE;
    delete process.env.SEARCH_KEYWORDS;
    delete process.env.REDIS_URL;
    delete process.env.KEYWORDS_REDIS_KEY;
  });

  afterEach(() => {
    delete process.env.KEYWORDS_FILE_PATH;
    delete process.env.KEYWORDS_STORAGE_MODE;
    delete process.env.SEARCH_KEYWORDS;
    delete process.env.REDIS_URL;
    delete process.env.KEYWORDS_REDIS_KEY;
    tmpDir = undefined;
  });

  it("GET /api/health retorna ok com status do cache", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    const app = createJobsApiApp({ outputDir: tmpDir });
    const res = await request(app).get("/api/health").expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.cache).toMatchObject({
      configured: false,
      connected: false,
      provider: "memory",
    });
  });
  
  it("GET /api/jobs/files retorna lista vazia sem xlsx", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    const app = createJobsApiApp({ outputDir: tmpDir });
    const res = await request(app).get("/api/jobs/files").expect(200);
    expect(res.body.files).toEqual([]);
  });

  it("permite CORS para o frontend oficial", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    const app = createJobsApiApp({ outputDir: tmpDir });
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "https://painel-vagas-lake.vercel.app")
      .expect(200);

    expect(res.headers["access-control-allow-origin"]).toBe("https://painel-vagas-lake.vercel.app");
  });

  it("bloqueia origens nao autorizadas", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    const app = createJobsApiApp({ outputDir: tmpDir });
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "https://malicioso.example")
      .expect(403);

    expect(res.body.message).toBe("Origem nao permitida.");
  });
  
  it("GET /api/jobs retorna 404 quando nao ha planilhas", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    const app = createJobsApiApp({ outputDir: tmpDir });
    const res = await request(app).get("/api/jobs").expect(404);
    expect(res.body.message).toBe("Nenhum arquivo .xlsx encontrado na pasta output.");
  });

  it("GET /api/jobs le o xlsx mais recente e retorna linhas", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    const xlsxPath = join(tmpDir, "vagas.xlsx");
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet([
      { palavra: "React", titulo: "Dev", empresa: "ACME", local: "BR", link: "" },
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Vagas");
    XLSX.writeFile(workbook, xlsxPath);

    const app = createJobsApiApp({ outputDir: tmpDir });
    const res = await request(app).get("/api/jobs").expect(200);
    expect(res.body.file).toBe("vagas.xlsx");
    expect(res.body.total).toBe(1);
    expect(res.body.jobs).toHaveLength(1);
    expect(res.body.jobs[0].titulo).toBe("Dev");
  });

  it("GET /api/jobs?file= retorna 404 para nome inexistente", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet([{ titulo: "x" }]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Vagas");
    XLSX.writeFile(workbook, join(tmpDir, "a.xlsx"));
    
    const app = createJobsApiApp({ outputDir: tmpDir });
    const res = await request(app).get("/api/jobs").query({ file: "nao-existe.xlsx" }).expect(404);
    expect(res.body.message).toBe("Arquivo solicitado nao encontrado.");
  });

  it("POST /api/scraper/run executa scraper e retorna metadados", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet([{ titulo: "x" }]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Vagas");
    XLSX.writeFile(workbook, join(tmpDir, "resultado.xlsx"));

    const app = createJobsApiApp({ outputDir: tmpDir });
    const res = await request(app).post("/api/scraper/run").expect(200);
    
    expect(mocks.run).toHaveBeenCalledTimes(1);
    expect(res.body.ok).toBe(true);
    expect(res.body.file).toBe("resultado.xlsx");
    expect(res.body.totalFiles).toBe(1);
  });

  it("POST /api/scraper/run retorna 409 quando ja existe execucao ativa", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    let finishRun;
    mocks.run.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishRun = resolve;
        }),
      );
      
      const app = createJobsApiApp({ outputDir: tmpDir });
      
    const firstRequest = new Promise((resolve, reject) => {
      request(app)
        .post("/api/scraper/run")
        .end((error, response) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(response);
        });
    });

    await vi.waitFor(() => {
      expect(mocks.run).toHaveBeenCalledTimes(1);
    });

    const conflict = await request(app).post("/api/scraper/run").expect(409);
    expect(conflict.body.message).toBe("O scraper ja esta em execucao.");

    finishRun();
    const firstResult = await firstRequest;
    expect(firstResult.status).toBe(200);
  });

  it("POST /api/scraper/run retorna 500 quando scraper falha", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    mocks.run.mockRejectedValue(new Error("falha no scraper"));

    const app = createJobsApiApp({ outputDir: tmpDir });
    const res = await request(app).post("/api/scraper/run").expect(500);

    expect(res.body.message).toBe("Erro ao executar o scraper.");
    expect(res.body.error).toBe("falha no scraper");
  });
  
  it("POST /api/keywords retorna 200 quando salvar as keywords", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    mocks.run.mockRejectedValue(new Error("Erro em pegar Keywords"));
    
    const app = createJobsApiApp({ outputDir: tmpDir });
    const payload = { keywords: ["Java","Spring","RabbitMQ","Docker"] };
    
    const res = await request(app).post("/api/keywords").send(payload).expect(200);

    expect(res.body).toEqual({
      ok: true,
      message: "Keywords atualizadas com sucesso.",
      keywords: ["Java","Spring","RabbitMQ","Docker"]
    });
  });

  it("POST /api/keywords cria o arquivo configurado e aceita lista vazia", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    process.env.KEYWORDS_FILE_PATH = join(tmpDir, "nested", "environment.json");

    const app = createJobsApiApp({ outputDir: tmpDir });
    const res = await request(app)
      .post("/api/keywords")
      .send({ keywords: ["  ", ""] })
      .expect(200);

    expect(res.body).toEqual({
      ok: true,
      message: "Keywords atualizadas com sucesso.",
      keywords: [],
    });
  });

  it("POST /api/keywords em modo env atualiza sem depender de arquivo json", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    process.env.KEYWORDS_STORAGE_MODE = "env";
    process.env.KEYWORDS_FILE_PATH = join(tmpDir, "nested", "environment.json");
    process.env.SEARCH_KEYWORDS = "Java,Node";

    const app = createJobsApiApp({ outputDir: tmpDir });
    const res = await request(app)
      .post("/api/keywords")
      .send({ keywords: ["Redis", "PostgreSQL"] })
      .expect(200);

    expect(res.body).toEqual({
      ok: true,
      message: "Keywords atualizadas com sucesso.",
      keywords: ["Redis", "PostgreSQL"],
    });
    expect(process.env.SEARCH_KEYWORDS).toBe("Redis,PostgreSQL");
    expect(existsSync(process.env.KEYWORDS_FILE_PATH)).toBe(false);
  });

  it("GET /api/keywords retorna 200 com as keywords", async () => {
    const app = createJobsApiApp({ outputDir: tmpDir });
    const res = await request(app)
      .get("/api/keywords").expect(200);
    expect(res.body).toEqual({
      ok: true,
      keywords: ["Java","Spring","RabbitMQ","Docker"]
    });
  });

  it("GET /api/jobs/search usa keywords da query quando fornecidas", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    const app = createJobsApiApp({ outputDir: tmpDir });

    const res = await request(app)
      .get("/api/jobs/search")
      .query({ keywords: " Node, React ,, " })
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(mocks.loadKeywords).not.toHaveBeenCalled();
    expect(mocks.searchJobsWithCache).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ keywords: ["Node", "React"] }),
      expect.anything(),
    );
  });

  it("GET /api/jobs/search usa keywords salvas quando a query não é enviada", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    mocks.loadKeywords.mockResolvedValueOnce(["Redis", "PostgreSQL"]);
    const app = createJobsApiApp({ outputDir: tmpDir });

    await request(app).get("/api/jobs/search").expect(200);

    expect(mocks.loadKeywords).toHaveBeenCalledTimes(1);
    expect(mocks.searchJobsWithCache).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ keywords: ["Redis", "PostgreSQL"] }),
      expect.anything(),
    );
  });

  it("GET /api/jobs/search retorna 500 quando a busca falha", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    mocks.searchJobsWithCache.mockRejectedValueOnce(new Error("falha na busca"));
    const app = createJobsApiApp({ outputDir: tmpDir });

    const res = await request(app)
      .get("/api/jobs/search")
      .query({ keywords: "Java" })
      .expect(500);

    expect(res.body).toEqual({
      message: "Erro ao buscar vagas.",
      error: "falha na busca",
    });
  });

  it("POST /api/keywords retorna 400 quando keywords não é array", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    const app = createJobsApiApp({ outputDir: tmpDir });

    const res = await request(app)
      .post("/api/keywords")
      .send({ keywords: "Java" })
      .expect(400);

    expect(res.body.message).toBe("O campo 'keywords' deve ser um array de strings.");
  });

  it("POST /api/keywords retorna 500 quando saveKeywords falha", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    mocks.saveKeywords.mockRejectedValueOnce(new Error("redis down"));
    const app = createJobsApiApp({ outputDir: tmpDir });

    const res = await request(app)
      .post("/api/keywords")
      .send({ keywords: ["Java"] })
      .expect(500);

    expect(res.body).toEqual({
      message: "Erro ao salvar keywords.",
      error: "redis down",
    });
  });

  it("GET /api/keywords retorna 500 quando loadKeywords falha", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    mocks.loadKeywords.mockRejectedValueOnce(new Error("read failed"));
    const app = createJobsApiApp({ outputDir: tmpDir });

    const res = await request(app).get("/api/keywords").expect(500);

    expect(res.body).toEqual({
      message: "Erro ao buscar keywords.",
      error: "read failed",
    });
  });

  it("adiciona HSTS quando a requisição chega por HTTPS via proxy", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    const app = createJobsApiApp({ outputDir: tmpDir });

    const res = await request(app)
      .get("/api/health")
      .set("x-forwarded-proto", "https")
      .expect(200);

    expect(res.headers["strict-transport-security"]).toContain("max-age=31536000");
  });

});
