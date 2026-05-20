import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  searchJobs: vi.fn(),
  loadKeywords: vi.fn(),
  saveKeywords: vi.fn(),
  normalizeKeywords: vi.fn(),
  getConfig: vi.fn(),
  logWarn: vi.fn(),
}));

vi.mock("../../src/adapters/goScraper.js", () => ({
  searchJobs: mocks.searchJobs,
}));

vi.mock("../../src/adapters/goKeywords.js", () => ({
  loadKeywords: mocks.loadKeywords,
  saveKeywords: mocks.saveKeywords,
  normalizeKeywords: mocks.normalizeKeywords,
}));

vi.mock("../../src/config.js", () => ({
  getConfig: mocks.getConfig,
}));

vi.mock("../../src/logger.js", () => ({
  logWarn: mocks.logWarn,
}));

vi.mock("../../src/modules/auth/auth.routes.js", async () => {
  const { Router } = await import("express");
  return { authRoutes: Router() };
});

import { createJobsApiApp } from "../../src/jobsApiApp.js";

describe("jobsApiApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getConfig.mockReturnValue({
      searchLocation: "Brasil",
      keywords: ["Java", "Node.js"],
    });

    mocks.loadKeywords.mockResolvedValue(["Java", "Node.js"]);
    mocks.saveKeywords.mockResolvedValue(["Java", "Node.js"]);
    mocks.normalizeKeywords.mockImplementation((kws) =>
      Array.isArray(kws) ? kws.map(String).filter(Boolean) : null,
    );
    mocks.searchJobs.mockResolvedValue({
      jobs: [{ id: "1", title: "Dev", company: "ACME" }],
      total: 1,
      cachedAt: "2026-01-01T00:00:00Z",
      fromCache: false,
    });
  });

  // ── health ────────────────────────────────────────────────────────────

  it("GET /api/health retorna ok", async () => {
    const app = createJobsApiApp();
    const res = await request(app).get("/api/health").expect(200);
    expect(res.body).toEqual({ ok: true });
  });

  // ── CORS ──────────────────────────────────────────────────────────────

  it("permite CORS para origem autorizada", async () => {
    const app = createJobsApiApp();
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5173")
      .expect(200);

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
  });

  it("bloqueia origens não autorizadas", async () => {
    const app = createJobsApiApp();
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "https://malicioso.example")
      .expect(403);

    expect(res.body.message).toBe("Origem não permitida.");
  });

  it("usa origens do CORS_ALLOWED_ORIGINS quando definido", async () => {
    process.env.CORS_ALLOWED_ORIGINS = "https://meuapp.com";
    const app = createJobsApiApp();

    const allowed = await request(app)
      .get("/api/health")
      .set("Origin", "https://meuapp.com")
      .expect(200);

    expect(allowed.headers["access-control-allow-origin"]).toBe(
      "https://meuapp.com",
    );

    const blocked = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5173")
      .expect(403);

    expect(blocked.body.message).toBe("Origem não permitida.");
    delete process.env.CORS_ALLOWED_ORIGINS;
  });

  // ── security headers ──────────────────────────────────────────────────

  it("adiciona headers de segurança", async () => {
    const app = createJobsApiApp();
    const res = await request(app).get("/api/health").expect(200);

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("DENY");
    expect(res.headers["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin",
    );
  });

  // ── jobs/search ───────────────────────────────────────────────────────

  it("GET /api/jobs/search usa keywords da query", async () => {
    const app = createJobsApiApp();
    const res = await request(app)
      .get("/api/jobs/search")
      .query({ keywords: "React,Node.js" })
      .expect(200);

    expect(mocks.searchJobs).toHaveBeenCalledWith(
      expect.objectContaining({ keywords: ["React", "Node.js"] }),
    );
    expect(res.body.total).toBe(1);
  });

  it("GET /api/jobs/search usa keywords salvas quando query ausente", async () => {
    const app = createJobsApiApp();
    await request(app).get("/api/jobs/search").expect(200);

    expect(mocks.loadKeywords).toHaveBeenCalledTimes(1);
    expect(mocks.searchJobs).toHaveBeenCalledWith(
      expect.objectContaining({ keywords: ["Java", "Node.js"] }),
    );
  });

  it("GET /api/jobs/search retorna 500 quando searchJobs falha", async () => {
    mocks.searchJobs.mockRejectedValueOnce(new Error("go scraper down"));
    const app = createJobsApiApp();

    const res = await request(app)
      .get("/api/jobs/search")
      .query({ keywords: "Java" })
      .expect(500);

    expect(res.body.message).toBe("Erro ao buscar vagas.");
    expect(res.body.error).toBe("go scraper down");
  });

  // ── keywords ──────────────────────────────────────────────────────────

  it("GET /api/keywords retorna keywords", async () => {
    const app = createJobsApiApp();
    const res = await request(app).get("/api/keywords").expect(200);

    expect(res.body).toEqual({ ok: true, keywords: ["Java", "Node.js"] });
  });

  it("GET /api/keywords retorna 500 quando loadKeywords falha", async () => {
    mocks.loadKeywords.mockRejectedValueOnce(new Error("redis down"));
    const app = createJobsApiApp();

    const res = await request(app).get("/api/keywords").expect(500);
    expect(res.body.message).toBe("Erro ao buscar keywords.");
  });

  it("POST /api/keywords salva e retorna keywords", async () => {
    const app = createJobsApiApp();
    const res = await request(app)
      .post("/api/keywords")
      .send({ keywords: ["Java", "Node.js"] })
      .expect(200);

    expect(res.body).toEqual({
      ok: true,
      message: "Keywords atualizadas com sucesso.",
      keywords: ["Java", "Node.js"],
    });
  });

  it("POST /api/keywords retorna 400 quando keywords não é array", async () => {
    mocks.normalizeKeywords.mockReturnValueOnce(null);
    const app = createJobsApiApp();

    const res = await request(app)
      .post("/api/keywords")
      .send({ keywords: "Java" })
      .expect(400);

    expect(res.body.message).toBe(
      "O campo 'keywords' deve ser um array de strings.",
    );
  });

  it("POST /api/keywords retorna 500 quando saveKeywords falha", async () => {
    mocks.normalizeKeywords.mockReturnValueOnce(["Java"]);
    mocks.saveKeywords.mockRejectedValueOnce(new Error("redis down"));
    const app = createJobsApiApp();

    const res = await request(app)
      .post("/api/keywords")
      .send({ keywords: ["Java"] })
      .expect(500);

    expect(res.body.message).toBe("Erro ao salvar keywords.");
  });
});
