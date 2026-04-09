import { cache } from "../cache/cache.js";

import { withRequestDedup } from "./requestDedup.js";
import { scrapeAllSources } from "./scrapeAllSources.js";

function normalizeKeywords(keywords) {
  return [...keywords]
    .map((k) => String(k).trim().toLowerCase())
    .filter(Boolean)
    .sort();
}

function buildCacheKey(config) {
  return [
    "jobs",
    normalizeKeywords(config.keywords).join(","),
    String(config.searchLocation || "")
      .trim()
      .toLowerCase(),
    String(config.searchGeoId || "").trim(),
    String(config.searchLanguage || "")
      .trim()
      .toLowerCase(),
    String(config.jobTypes || "").trim(),
    String(config.timeFilter || "").trim(),
    String(config.remoteOnly ? "remote" : "all"),
  ].join(":");
}

export async function searchJobsWithCache(
  adapters,
  config,
  ttlMs = 10 * 60 * 1000,
) {
  const cacheKey = buildCacheKey(config);

  const cached = await cache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      fromCache: true,
    };
  }

  return withRequestDedup(cacheKey, async () => {
    const cachedInsideDedup = await cache.get(cacheKey);
    if (cachedInsideDedup) {
      return {
        ...cachedInsideDedup,
        fromCache: true,
      };
    }

    const jobs = await scrapeAllSources(adapters, config);

    const result = {
      jobs,
      total: jobs.length,
      cachedAt: new Date().toISOString(),
      fromCache: false,
    };

    await cache.set(cacheKey, result, ttlMs);

    return result;
  });
}
