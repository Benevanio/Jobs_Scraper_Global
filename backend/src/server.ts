import "dotenv/config";
import { createJobsApiApp } from "./app";
import { logInfo, logWarn } from "./logger";

const PORT = Number(process.env.PORT ?? 3001);

const app = createJobsApiApp();
app.set("trust proxy", 1);

async function registerSwaggerDocs(): Promise<void> {
  try {
    const [{ default: swaggerUi }, { default: swaggerSpec }] =
      await Promise.all([import("swagger-ui-express"), import("./swagger")]);
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  } catch (error) {
    logWarn("Swagger desabilitado", {
      error: error instanceof Error ? error.message : error,
    });
  }
}

async function startServer(): Promise<void> {
  await registerSwaggerDocs();

  app.listen(PORT, () => {
    logInfo(`API rodando em http://localhost:${PORT}`);
    logInfo(`Documentação da API em http://localhost:${PORT}/docs`);
  });
}

void startServer();
