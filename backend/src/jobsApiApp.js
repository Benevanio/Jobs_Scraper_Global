import cors from "cors";
import express from "express";
import { existsSync, mkdirSync, readdirSync, statSync } from "fs";
import path from "path";
import XLSX from "xlsx";

/**
 * @param {{ outputDir?: string }} [options]
 */
export function createJobsApiApp(options = {}) {
  const outputDir = options.outputDir ?? path.resolve(process.cwd(), "output");
  const app = express();

  app.use(cors());

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

  return app;
}
