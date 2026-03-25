import "dotenv/config";
import { run } from "./src/app.js";
import { logError } from "./src/logger.js";

run().catch((error) => {
  logError(error?.stack || error?.message || "Falha inesperada na execucao");
  process.exitCode = 1;
});
