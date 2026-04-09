import { getRedisClient } from "../cache/cache.js";

function getKeywordsRedisKey() {
  const configuredKey = process.env.KEYWORDS_REDIS_KEY?.trim();
  if (configuredKey) {
    return configuredKey;
  }

  const prefix = process.env.REDIS_KEY_PREFIX?.trim() || "vagas-full";
  return `${prefix}:keywords`;
}

export function normalizeKeywords(keywords) {
  if (!Array.isArray(keywords)) {
    return null;
  }

  return [...new Set(keywords.map((item) => String(item ?? "").trim()).filter(Boolean))];
}

function parseKeywordsFromEnv(value) {
  return normalizeKeywords(
    String(value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  ) ?? [];
}

function getFallbackKeywords(fallback = []) {
  const envKeywords = parseKeywordsFromEnv(process.env.SEARCH_KEYWORDS);
  if (envKeywords.length > 0) {
    return envKeywords;
  }

  return normalizeKeywords(fallback) ?? [];
}

export async function loadKeywords(fallback = []) {
  const fallbackKeywords = getFallbackKeywords(fallback);
  const client = await getRedisClient();

  if (!client) {
    return fallbackKeywords;
  }

  try {
    const raw = await client.get(getKeywordsRedisKey());
    if (!raw) {
      return fallbackKeywords;
    }

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return normalizeKeywords(parsed) ?? [];
    }

    if (Array.isArray(parsed?.KEYWORDS)) {
      return normalizeKeywords(parsed.KEYWORDS) ?? [];
    }
  } catch {
    // fallback below
  }

  return fallbackKeywords;
}

export async function saveKeywords(keywords) {
  const normalizedKeywords = normalizeKeywords(keywords);

  if (normalizedKeywords === null) {
    return null;
  }

  const client = await getRedisClient();
  if (!client) {
    throw new Error("Redis indisponivel para salvar keywords.");
  }

  await client.set(getKeywordsRedisKey(), JSON.stringify(normalizedKeywords));
  return normalizedKeywords;
}
