import cors from "cors";
import express from "express";
import { existsSync, mkdirSync, readdirSync, statSync } from "fs";
import path from "path";
import XLSX from "xlsx";
import { run as runScraper } from "./app.js";
import { getCacheStatus } from "./cache/cache.js";
import { getConfig } from "./config.js";
import { loadKeywords, normalizeKeywords, saveKeywords } from "./db/keywordsStore.js";
import { searchJobsWithCache } from "./pipeline/searchJobsWithCache.js";
import { sources } from "./sources/index.js";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://painel-vagas-lake.vercel.app",
  "https://painel-vagas-m6hbzlqeh-bene-teslas-projects.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
];

function parseAllowedOrigins(value) {
  const configuredOrigins = String(value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set(configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS);
}

/**
 * @param {{ outputDir?: string }} [options]
 */
export function createJobsApiApp(options = {}) {
  const outputDir = options.outputDir ?? path.resolve(process.cwd(), "output");
  const allowedOrigins = parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS);
  const corsOptions = {
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false,
    maxAge: 86400,
  };
  const app = express();
  let activeScraperRun = null;

  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    if (req.secure || req.get("x-forwarded-proto") === "https") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    next();
  });
  app.use(cors(corsOptions));
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

  /**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Verifica se a API está online
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API funcionando corretamente
 */
  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      cache: getCacheStatus(),
    });
  });

  /**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Retorna vagas a partir do arquivo mais recente ou de um arquivo específico
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: file
 *         schema:
 *           type: string
 *         description: Nome do arquivo .xlsx
 *     responses:
 *       200:
 *         description: Lista de vagas
 *       404:
 *         description: Arquivo não encontrado
 */
  app.get("/api/jobs/files", (_req, res) => {
    const files = listXlsxFiles().map(({ file, modifiedAt, size }) => ({
      file,
      modifiedAt,
      size,
    }));

    res.json({ files });
  });

  /**
 * @swagger
 * /api/jobs/search:
 *   get:
 *     summary: Busca vagas utilizando cache
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         description: Lista de palavras-chave separadas por vírgula
 *     responses:
 *       200:
 *         description: Resultado da busca
 */
  // Novo endpoint para busca de vagas com cache
  app.get("/api/jobs/search", async (req, res) => {
    try {
      const baseConfig = getConfig();
      const config = {
        ...baseConfig,
        keywords: req.query.keywords
          ? String(req.query.keywords)
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean)
          : await loadKeywords(baseConfig.keywords),
      };

      const ttlMs = baseConfig.cacheTtlMs;
      const result = await searchJobsWithCache(sources, config, ttlMs);

      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        message: "Erro ao buscar vagas.",
        error: error?.message || "Erro desconhecido",
      });
    }
  });

  /**
 * @swagger
 * /api/jobs/search:
 *   get:
 *     summary: Busca vagas utilizando cache
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         description: Lista de palavras-chave separadas por vírgula
 *     responses:
 *       200:
 *         description: Resultado da busca
 */
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

  /**
 * @swagger
 * /api/keywords:
 *   post:
 *     summary: Atualiza palavras-chave
 *     tags: [Keywords]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Keywords atualizadas
 *       400:
 *         description: Dados inválidos
 */
  app.post("/api/keywords", async (req, res) => {
    try {
      const normalizedKeywords = normalizeKeywords(req.body?.keywords);

      if (normalizedKeywords === null) {
        return res.status(400).json({
          message: "O campo 'keywords' deve ser um array de strings.",
        });
      }

      const savedKeywords = await saveKeywords(normalizedKeywords);

      return res.json({
        ok: true,
        message: "Keywords atualizadas com sucesso.",
        keywords: savedKeywords,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Erro ao salvar keywords.",
        error: error?.message || "Erro desconhecido",
      });
    }
  });

 /**
 * @swagger
 * /api/keywords:
 *   get:
 *     summary: Retorna palavras-chave configuradas
 *     tags: [Keywords]
 *     responses:
 *       200:
 *         description: Lista de keywords
 */
  app.get("/api/keywords", async (_req, res) => {
    try {
      const keywords = await loadKeywords(getConfig().keywords);

      return res.json({
        ok: true,
        keywords,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Erro ao buscar keywords.",
        error: error?.message || "Erro desconhecido",
      });
    }
  });

  /**
 * @swagger
 * /api/scraper/run:
 *   post:
 *     summary: Executa o scraper de vagas
 *     tags: [Scraper]
 *     responses:
 *       200:
 *         description: Scraper executado com sucesso
 *       409:
 *         description: Scraper já em execução
 */
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

  app.use((error, _req, res, next) => {
    if (error?.message === "Origin not allowed by CORS") {
      return res.status(403).json({
        message: "Origem nao permitida.",
      });
    }

    return next(error);
  });

  return app;
}
