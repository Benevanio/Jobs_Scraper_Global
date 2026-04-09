import { getConfig } from "./config.js";
import { loadKeywords } from "./db/keywordsStore.js";
import { exportToExcel, exportToPDF } from "./exporter.js";
import { logInfo } from "./logger.js";
import { searchJobsWithCache } from "./pipeline/searchJobsWithCache.js";
import { sources } from "./sources/index.js";

export async function run() {
  const baseConfig = getConfig();
  const config = {
    ...baseConfig,
    keywords: await loadKeywords(baseConfig.keywords),
  };

  logInfo(`Localização da busca: ${config.searchLocation}`);
  logInfo(`Total de palavras-chave: ${config.keywords.length}`);
  logInfo(`Total de fontes ativas: ${sources.length}`);

  const { jobs, total, fromCache } = await searchJobsWithCache(sources, config);

  logInfo(`Resultado do cache: ${fromCache ? "HIT" : "MISS"}`);

  exportToExcel(jobs, config.outputFile);
  await exportToPDF(jobs, config.pdfFile);

  logInfo(`Total de vagas únicas exportadas: ${total}`);
}
