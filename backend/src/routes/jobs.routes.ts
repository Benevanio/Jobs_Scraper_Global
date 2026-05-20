import { Request, Response, Router } from "express";
import { loadKeywords } from "../adapters/goKeywords";
import { searchJobs, type ScrapeParams } from "../adapters/goScraper";
import { getConfig } from "../config";
import { logWarn } from "../logger";

export const jobsRoutes = Router();

/**
 * @swagger
 * /api/jobs/search:
 *   get:
 *     summary: Busca vagas (cache e dedup gerenciados pelo Go)
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         description: Palavras-chave separadas por vírgula
 *     responses:
 *       200:
 *         description: Resultado da busca com jobs, total, cachedAt, fromCache
 */
jobsRoutes.get("/search", async (req: Request, res: Response) => {
  try {
    const baseConfig = getConfig();

    const keywords = req.query.keywords
      ? String(req.query.keywords)
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean)
      : await loadKeywords(baseConfig.keywords);

    const params: ScrapeParams = {
      keywords,
      location: baseConfig.searchLocation,
    };

    const result = await searchJobs(params);
    return res.json(result);
  } catch (error) {
    logWarn("Erro ao buscar vagas", { error: (error as Error).message });
    return res.status(500).json({
      message: "Erro ao buscar vagas.",
      error: (error as Error).message,
    });
  }
});
