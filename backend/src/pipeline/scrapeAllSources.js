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

function normalizeComparableText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeComparableUrl(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return "";
  }

  try {
    const parsedUrl = new URL(rawValue);
    parsedUrl.search = "";
    parsedUrl.hash = "";
    return `${parsedUrl.origin}${parsedUrl.pathname}`.replace(/\/+$/, "");
  } catch {
    return rawValue.split(/[?#]/)[0].replace(/\/+$/, "");
  }
}

function getMergedKeywords(...jobs) {
  return [
    ...new Set(
      jobs.flatMap((job) =>
        [
          ...(Array.isArray(job.keywords) ? job.keywords : []),
          job.keyword,
          job.palavraChave,
          job.palavra,
        ]
          .filter(Boolean)
          .map((keyword) => String(keyword).trim()),
      ),
    ),
  ];
}

function getMergedSources(...jobs) {
  return [
    ...new Set(
      jobs.flatMap((job) =>
        [
          ...(Array.isArray(job.sources) ? job.sources : []),
          job.source,
        ]
          .filter(Boolean)
          .map((source) => String(source).trim()),
      ),
    ),
  ];
}

function pickPreferredValue(...values) {
  return (
    values
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .sort((left, right) => right.length - left.length)[0] || ""
  );
}

function mergeKeywords(existing, incoming) {
  const mergedKeywords = getMergedKeywords(existing, incoming);
  const mergedSources = getMergedSources(existing, incoming);

  return {
    ...existing,
    ...incoming,
    titulo: pickPreferredValue(existing.titulo, incoming.titulo, existing.title, incoming.title),
    empresa: pickPreferredValue(existing.empresa, incoming.empresa, existing.company, incoming.company),
    local: pickPreferredValue(existing.local, incoming.local, existing.location, incoming.location),
    link: pickPreferredValue(existing.link, incoming.link, existing.jobUrl, incoming.jobUrl),
    jobUrl: pickPreferredValue(existing.jobUrl, incoming.jobUrl, existing.link, incoming.link),
    source: mergedSources.join(", ") || existing.source || incoming.source || "",
    sources: mergedSources,
    keyword: mergedKeywords[0] || "",
    palavraChave: mergedKeywords[0] || "",
    keywords: mergedKeywords,
    palavra: mergedKeywords[0] || "",
  };
}

function buildDedupKey(job) {
  const title = normalizeComparableText(job.titulo || job.title);
  const company = normalizeComparableText(job.empresa || job.company);
  const location = normalizeComparableText(job.local || job.location);

  if (title && company && location) {
    return `identity:${title}|${company}|${location}`;
  }

  if (title && company) {
    return `identity:${title}|${company}|${location || "sem-local"}`;
  }

  const normalizedLink = normalizeComparableUrl(job.link || job.jobUrl);

  if (normalizedLink) {
    return `url:${normalizedLink}`;
  }

  return `fallback:${title}|${company}|${location}|${normalizeComparableText(job.source)}`;
}

function dedupeJobs(jobs) {
  const unique = new Map();

  for (const job of jobs) {
    const key = buildDedupKey(job);

    if (unique.has(key)) {
      const existing = unique.get(key);
      unique.set(key, mergeKeywords(existing, job));
      continue;
    }

    const mergedKeywords = getMergedKeywords(job);
    const mergedSources = getMergedSources(job);

    unique.set(key, {
      ...job,
      source: mergedSources.join(", ") || job.source || "",
      sources: mergedSources,
      palavra: job.keyword || job.palavraChave || job.palavra || "",
      keywords: mergedKeywords,
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
