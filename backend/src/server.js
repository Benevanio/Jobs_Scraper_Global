import "dotenv/config";
import express from "express";
import { existsSync } from "fs";
import path from "path";
import { warmupCache } from "./cache/cache.js";
import { createJobsApiApp } from "./jobsApiApp.js";

const PORT = Number(process.env.PORT || 3001);

// When running inside Electron, main.js sets ELECTRON_OUTPUT_DIR to a
// writable user-data path. Fall back to the CWD-relative folder for dev/CLI.
const outputDir = process.env.ELECTRON_OUTPUT_DIR
  ? process.env.ELECTRON_OUTPUT_DIR
  : path.resolve(process.cwd(), "output");

const app = createJobsApiApp({ outputDir });
app.set("trust proxy", 1);

async function registerSwaggerDocs() {
  try {
    const [{ default: swaggerUi }, { default: swaggerSpec }] = await Promise.all([
      import("swagger-ui-express"),
      import("./swagger.js"),
    ]);

    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Swagger desabilitado:", error instanceof Error ? error.message : error);
  }
}

async function startServer() {
  await registerSwaggerDocs();

  const cacheStatus = await warmupCache();
  // eslint-disable-next-line no-console
  console.log(
    cacheStatus.configured
      ? `Cache provider: ${cacheStatus.provider} (${cacheStatus.connected ? "conectado" : "fallback em memoria"})`
      : "Cache provider: memory (REDIS_URL nao configurada)",
  );

  // ── Electron static-file serving ─────────────────────────────────────────
  // When ELECTRON_STATIC_DIR is set, serve the React production build so that
  // the Electron window can load everything from http://localhost:<PORT>.
  const staticDir = process.env.ELECTRON_STATIC_DIR;
  if (staticDir && existsSync(staticDir)) {
    app.use(express.static(staticDir));

    // SPA catch-all: return index.html for any non-API route so that React
    // Router (if used in future) works correctly.
    app.use((req, res) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ error: "Rota não encontrada." });
      }
      res.sendFile(path.join(staticDir, "index.html"));
    });
  }

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API de vagas rodando em http://localhost:${PORT}`);
    console.log(`Documentação da API em http://localhost:${PORT}/docs`);
  });
}

void startServer();
