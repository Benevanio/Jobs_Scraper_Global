import cors from "cors";
import express from "express";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";
import XLSX from "xlsx";
import { run as runScraper } from "./app.js";
import { getConfig } from "./config.js";
import { searchJobsWithCache } from "./pipeline/searchJobsWithCache.js";
import { sources } from "./sources/index.js";

/**
 * @param {{ outputDir?: string }} [options]
 */
export function createJobsApiApp(options = {}) {
  const outputDir = options.outputDir ?? path.resolve(process.cwd(), "output");
  const app = express();
  let activeScraperRun = null;

  app.use(cors());
  app.use(express.json());

  function listXlsxFiles() {
    // Garante que a pasta exista tambem no primeiro boot em ambiente Docker.
    mkdirSync(outputDir, { recursive: true });

    if (!existsSync(outputDir)) {
      return [];
    }

    return readdirSync(outputDir)
      .filter((file) => file.toLowerCase().endsWith(".xlsx"))
      .map((file) => {
        const fullPath = path.join(outputDir, file);
        const stats = statSync(fullPath);
        return {
          file,
          fullPath,
          modifiedAt: stats.mtimeMs,
          size: stats.size,
        };
      })
      .sort((a, b) => b.modifiedAt - a.modifiedAt);
  }

  function readJobsFromFile(fullPath) {
    const workbook = XLSX.readFile(fullPath);
    const firstSheet = workbook.SheetNames[0];
    if (!firstSheet) {
      return [];
    }

    return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], {
      defval: "",
      raw: false,
    });
  }

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/jobs/files", (_req, res) => {
    const files = listXlsxFiles().map(({ file, modifiedAt, size }) => ({
      file,
      modifiedAt,
      size,
    }));

    res.json({ files });
  });

  // Novo endpoint para busca de vagas com cache
  app.get("/api/jobs/search", async (req, res) => {
    try {
      const config = {
        ...getConfig(),
        keywords: req.query.keywords
          ? String(req.query.keywords)
              .split(",")
              .map((k) => k.trim())
          : getConfig().keywords,
      };

      const ttlMs = 10 * 60 * 1000; // 10 minutos
      const result = await searchJobsWithCache(sources, config, ttlMs);

      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        message: "Erro ao buscar vagas.",
        error: error?.message || "Erro desconhecido",
      });
    }
  });

  app.get("/api/jobs", (req, res) => {
    try {
      const files = listXlsxFiles();
      if (files.length === 0) {
        return res.status(404).json({
          message: "Nenhum arquivo .xlsx encontrado na pasta output.",
        });
      }

      const requested = req.query.file ? String(req.query.file) : null;
      const target = requested
        ? files.find((item) => item.file === requested)
        : files[0];

      if (!target) {
        return res.status(404).json({
          message: "Arquivo solicitado nao encontrado.",
        });
      }

      const jobs = readJobsFromFile(target.fullPath);
      return res.json({
        file: target.file,
        modifiedAt: target.modifiedAt,
        size: target.size,
        total: jobs.length,
        jobs,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Erro ao ler arquivo de vagas.",
        error: error?.message || "Erro desconhecido",
      });
    }
  });

  app.post("/api/keywords", (req, res) => {
    try {
      const { keywords } = req.body;

      if (!Array.isArray(keywords)) {
        return res.status(400).json({
          message: "O campo 'keywords' deve ser um array de strings.",
        });
      }

      const envPath = path.resolve(process.cwd(), "src", "db", "environment.json");
      let envData = { KEYWORDS: [] };

      if (existsSync(envPath)) {
        try {
          envData = JSON.parse(readFileSync(envPath, "utf-8"));
        } catch (e) {
          // Se o arquivo estiver corrompido, reinicia com o objeto padrao
        }
      }

      envData.KEYWORDS = keywords;
      writeFileSync(envPath, JSON.stringify(envData, null, 2), "utf-8");

      return res.json({
        ok: true,
        message: "Keywords atualizadas com sucesso.",
        keywords: envData.KEYWORDS,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Erro ao salvar keywords.",
        error: error?.message || "Erro desconhecido",
      });
    }
  });

  app.get("/api/keywords", (req, res) => {
  try {
    const envPath = path.resolve(process.cwd(), "src", "db", "environment.json");
    
    if (!existsSync(envPath)) {
      return res.json({ keywords: [] });
    }

    const fileContent = readFileSync(envPath, "utf-8");
    const envData = JSON.parse(fileContent);

    return res.json({
      ok: true,
      keywords: envData.KEYWORDS || [],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao buscar keywords.",
      error: error?.message || "Erro desconhecido",
    });
  }
});

  app.post("/api/scraper/run", async (_req, res) => {
    if (activeScraperRun) {
      return res.status(409).json({
        message: "O scraper ja esta em execucao.",
      });
    }

    try {
      activeScraperRun = runScraper();
      await activeScraperRun;

      const files = listXlsxFiles();
      return res.json({
        ok: true,
        file: files[0]?.file ?? null,
        modifiedAt: files[0]?.modifiedAt ?? null,
        totalFiles: files.length,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Erro ao executar o scraper.",
        error: error?.message || "Erro desconhecido",
      });
    } finally {
      activeScraperRun = null;
    }
  });

  return app;
}
