import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import XLSX from "xlsx";
import { createJobsApiApp } from "../../src/jobsApiApp.js";

describe("jobs API", () => {
  let tmpDir;

  afterEach(() => {
    tmpDir = undefined;
  });

  it("GET /api/health retorna ok", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    const app = createJobsApiApp({ outputDir: tmpDir });
    const res = await request(app).get("/api/health").expect(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("GET /api/jobs/files retorna lista vazia sem xlsx", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "jobs-api-"));
    const app = createJobsApiApp({ outputDir: tmpDir });
    const res = await request(app).get("/api/jobs/files").expect(200);
    expect(res.body.files).toEqual([]);
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
});
