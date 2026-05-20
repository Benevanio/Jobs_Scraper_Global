import { Request, Response, Router } from "express";
import {
  loadKeywords,
  normalizeKeywords,
  saveKeywords,
} from "../adapters/goKeywords";
import { getConfig } from "../config";

export const keywordsRoutes = Router();

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
keywordsRoutes.get("/", async (_req, res) => {
  try {
    const keywords = await loadKeywords(getConfig().keywords);
    return res.json({ ok: true, keywords });
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao buscar keywords.",
      error: (error as Error).message,
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
keywordsRoutes.post("/", async (req: Request, res: Response) => {
  try {
    const normalized = normalizeKeywords(req.body?.keywords);
    if (normalized === null) {
      return res.status(400).json({
        message: "O campo 'keywords' deve ser um array de strings.",
      });
    }
    const saved = await saveKeywords(normalized);
    return res.json({
      ok: true,
      message: "Keywords atualizadas com sucesso.",
      keywords: saved,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao salvar keywords.",
      error: (error as Error).message,
    });
  }
});
