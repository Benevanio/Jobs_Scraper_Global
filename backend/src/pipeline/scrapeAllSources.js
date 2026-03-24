import { logInfo, logWarn } from "../logger.js";

function normalizeJob(job, keyword, adapter) {
  return {
    ...job,
    source: job.source || adapter.sourceName || "unknown",
    keyword: job.keyword || job.palavraChave || keyword,
    palavraChave: job.palavraChave || job.keyword || keyword,
    palavra: job.keyword || job.palavraChave || keyword,
  };
}

function mergeKeywords(existing, incoming) {
  const keywords = new Set([
    ...(existing.keywords || []),
    ...(existing.keyword ? [existing.keyword] : []),
    ...(existing.palavraChave ? [existing.palavraChave] : []),
    ...(incoming.keywords || []),
    ...(incoming.keyword ? [incoming.keyword] : []),
    ...(incoming.palavraChave ? [incoming.palavraChave] : []),
  ]);

  const mergedKeywords = [...keywords].filter(Boolean);

  return {
    ...existing,
    ...incoming,
    keyword: mergedKeywords[0] || "",
    palavraChave: mergedKeywords[0] || "",
    keywords: mergedKeywords,
    palavra: mergedKeywords[0] || "",
  };
}

function dedupeJobs(jobs) {
  const unique = new Map();

  for (const job of jobs) {
    const key =
      job.link ||
      job.jobUrl ||
      `${job.source}-${job.titulo || job.title}-${job.empresa || job.company}-${job.local || job.location}`;

    if (!key) continue;

    if (unique.has(key)) {
      const existing = unique.get(key);
      unique.set(key, mergeKeywords(existing, job));
      continue;
    }

    unique.set(key, {
      ...job,
      palavra: job.keyword || job.palavraChave || job.palavra || "",
      keywords: [
        ...new Set(
          [job.keyword, job.palavraChave, ...(job.keywords || [])].filter(
            Boolean,
          ),
        ),
      ],
    });
  }

  return [...unique.values()];
}

export async function scrapeAllSources(adapters, config) {
  const allJobs = [];

  for (const adapter of adapters) {
    logInfo(`Iniciando fonte: ${adapter.sourceName}`);

    for (const keyword of config.keywords) {
      try {
        const jobs = await adapter.search(keyword, config);

        if (!Array.isArray(jobs)) {
          logWarn(`${adapter.sourceName}: retorno inválido para "${keyword}"`);
          continue;
        }

        const normalizedJobs = jobs.map((job) =>
          normalizeJob(job, keyword, adapter),
        );

        allJobs.push(...normalizedJobs);
        logInfo(
          `${adapter.sourceName}: ${normalizedJobs.length} vagas para "${keyword}"`,
        );
      } catch (error) {
        logWarn(
          `${adapter.sourceName}: falha ao buscar "${keyword}" -> ${
            error instanceof Error ? error.message : "erro desconhecido"
          }`,
        );
      }
    }
  }

  return dedupeJobs(allJobs);
}
