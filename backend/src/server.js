import "dotenv/config";
import path from "path";
import { createJobsApiApp } from "./jobsApiApp.js";

const PORT = Number(process.env.PORT || 3001);
const app = createJobsApiApp({
  outputDir: path.resolve(process.cwd(), "output"),
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API de vagas rodando em http://localhost:${PORT}`);
});
