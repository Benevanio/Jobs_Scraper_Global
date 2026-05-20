// import cors from "cors";
// import express, { NextFunction, Request, Response } from "express";
// import {
//   loadKeywords,
//   normalizeKeywords,
//   saveKeywords,
// } from "./adapters/goKeywords";
// import { searchJobs, type ScrapeParams } from "./adapters/goScraper";
// import { getConfig } from "./config";
// import { logWarn } from "./logger";
// import { authRoutes } from "./routes/auth.routes";
// import { userRoutes } from "./routes/users.routes";

// interface JobsApiAppOptions {
//   outputDir?: string;
// }

// const DEFAULT_ALLOWED_ORIGINS = [
//   "https://painel-vagas-lake.vercel.app",
//   "https://painel-vagas-m6hbzlqeh-bene-teslas-projects.vercel.app",
//   "https://jobsglobalscraper.ddns.net",
//   "http://jobsglobalscraper.ddns.net",
//   "http://localhost:5173",
//   "http://localhost:5174",
// ];

// function parseAllowedOrigins(value: string | undefined): Set<string> {
//   const configured = String(value ?? "")
//     .split(",")
//     .map((o) => o.trim())
//     .filter(Boolean);
//   return new Set(configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS);
// }

// export function createJobsApiApp(_options: JobsApiAppOptions = {}) {
//   const allowedOrigins = parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS);

//   const corsOptions: cors.CorsOptions = {
//     origin(origin, callback) {
//       if (!origin || allowedOrigins.has(origin)) return callback(null, true);
//       callback(new Error("Origin not allowed by CORS"));
//     },
//     methods: ["GET", "POST", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//     maxAge: 86400,
//   };

//   const app = express();

//   app.disable("x-powered-by");
//   app.use(express.json({ limit: "16kb" }));
//   app.use((_req: Request, res: Response, next: NextFunction) => {
//     res.setHeader("X-Content-Type-Options", "nosniff");
//     res.setHeader("X-Frame-Options", "DENY");
//     res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
//     res.setHeader(
//       "Permissions-Policy",
//       "camera=(), microphone=(), geolocation=()",
//     );
//     next();
//   });
//   app.use(cors(corsOptions));

//   app.use("/api/auth", authRoutes);
//   app.use("/api/users", userRoutes);

//   // ── health ────────────────────────────────────────────────────────────────

//   /**
//    * @swagger
//    * /api/health:
//    *   get:
//    *     summary: Verifica se a API está online
//    *     tags: [System]
//    *     responses:
//    *       200:
//    *         description: API funcionando
//    */
//   app.get("/api/health", (_req, res) => {
//     res.json({ ok: true });
//   });

//   // ── jobs ──────────────────────────────────────────────────────────────────

//   /**
//    * @swagger
//    * /api/jobs/search:
//    *   get:
//    *     summary: Busca vagas (cache e dedup gerenciados pelo Go)
//    *     tags: [Jobs]
//    *     parameters:
//    *       - in: query
//    *         name: keywords
//    *         schema:
//    *           type: string
//    *         description: Palavras-chave separadas por vírgula
//    *     responses:
//    *       200:
//    *         description: Resultado da busca com jobs, total, cachedAt, fromCache
//    */
//   app.get("/api/jobs/search", async (req: Request, res: Response) => {
//     try {
//       const baseConfig = getConfig();

//       const keywords = req.query.keywords
//         ? String(req.query.keywords)
//             .split(",")
//             .map((k) => k.trim())
//             .filter(Boolean)
//         : await loadKeywords(baseConfig.keywords);

//       const params: ScrapeParams = {
//         keywords,
//         location: baseConfig.searchLocation,
//       };

//       const result = await searchJobs(params);
//       return res.json(result);
//     } catch (error) {
//       logWarn("Erro ao buscar vagas", { error: (error as Error).message });
//       return res.status(500).json({
//         message: "Erro ao buscar vagas.",
//         error: (error as Error).message,
//       });
//     }
//   });

//   // ── keywords ──────────────────────────────────────────────────────────────

//   /**
//    * @swagger
//    * /api/keywords:
//    *   get:
//    *     summary: Retorna palavras-chave configuradas
//    *     tags: [Keywords]
//    *     responses:
//    *       200:
//    *         description: Lista de keywords
//    */
//   app.get("/api/keywords", async (_req, res) => {
//     try {
//       const keywords = await loadKeywords(getConfig().keywords);
//       return res.json({ ok: true, keywords });
//     } catch (error) {
//       return res.status(500).json({
//         message: "Erro ao buscar keywords.",
//         error: (error as Error).message,
//       });
//     }
//   });

//   /**
//    * @swagger
//    * /api/keywords:
//    *   post:
//    *     summary: Atualiza palavras-chave
//    *     tags: [Keywords]
//    *     requestBody:
//    *       required: true
//    *       content:
//    *         application/json:
//    *           schema:
//    *             type: object
//    *             properties:
//    *               keywords:
//    *                 type: array
//    *                 items:
//    *                   type: string
//    *     responses:
//    *       200:
//    *         description: Keywords atualizadas
//    *       400:
//    *         description: Dados inválidos
//    */
//   app.post("/api/keywords", async (req: Request, res: Response) => {
//     try {
//       const normalized = normalizeKeywords(req.body?.keywords);
//       if (normalized === null) {
//         return res.status(400).json({
//           message: "O campo 'keywords' deve ser um array de strings.",
//         });
//       }
//       const saved = await saveKeywords(normalized);
//       return res.json({
//         ok: true,
//         message: "Keywords atualizadas com sucesso.",
//         keywords: saved,
//       });
//     } catch (error) {
//       return res.status(500).json({
//         message: "Erro ao salvar keywords.",
//         error: (error as Error).message,
//       });
//     }
//   });

//   // ── error handler ─────────────────────────────────────────────────────────

//   app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
//     if (error.message === "Origin not allowed by CORS") {
//       return res.status(403).json({ message: "Origem não permitida." });
//     }
//     return res
//       .status(500)
//       .json({ message: "Erro interno.", error: error.message });
//   });

//   return app;
// }

import cors from "cors";
import express from "express";
import { corsOptions } from "./middleware/cors";
import { errorHandler } from "./middleware/errorHandler";
import { requireAuth } from "./middleware/requireAuth";
import { securityHeaders } from "./middleware/securityHeaders";
import { withSession } from "./middleware/withSession";
import { authRoutes } from "./routes/auth.routes";
import { jobsRoutes } from "./routes/jobs.routes";
import { keywordsRoutes } from "./routes/keywords.routes";
import { savedJobsRoutes } from "./routes/savedJobs.routes";
import { userRoutes } from "./routes/users.routes";

export function createJobsApiApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.use(securityHeaders);
  app.use(cors(corsOptions));

  app.use("/api/auth", withSession, authRoutes);
  app.use("/api/users", withSession, requireAuth, userRoutes);
  app.use("/api/jobs", withSession, requireAuth, jobsRoutes);
  app.use("/api/keywords", withSession, requireAuth, keywordsRoutes);
  app.use("/api/saved-jobs", withSession, requireAuth, savedJobsRoutes);

  /**
   * @swagger
   * /api/health:
   *   get:
   *     summary: Verifica se a API está online
   *     tags: [System]
   *     responses:
   *       200:
   *         description: API funcionando
   */
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use(errorHandler);

  return app;
}
