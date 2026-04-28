import { getRedisClient } from "../cache/redisConnection";

type Keyword = string;

// 🔑 key builder
function getKeywordsRedisKey(): string {
  const configuredKey = process.env.KEYWORDS_REDIS_KEY?.trim();
  if (configuredKey) return configuredKey;

  const prefix = process.env.REDIS_KEY_PREFIX?.trim() || "vagas-full";
  return `${prefix}:keywords`;
}

// 🧹 normalização
export function normalizeKeywords(
  keywords: unknown
): Keyword[] | null {
  if (!Array.isArray(keywords)) {
    return null;
  }

  return [
    ...new Set(
      keywords
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
    ),
  ];
}

// 🌱 env parsing
function parseKeywordsFromEnv(value: unknown): Keyword[] {
  return (
    normalizeKeywords(
      String(value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    ) ?? []
  );
}

// 🔁 fallback inteligente
function getFallbackKeywords(fallback: Keyword[] = []): Keyword[] {
  const envKeywords = parseKeywordsFromEnv(process.env.SEARCH_KEYWORDS);

  if (envKeywords.length > 0) {
    return envKeywords;
  }

  return normalizeKeywords(fallback) ?? [];
}

// 📥 load (com Redis)
export async function loadKeywords(
  fallback: Keyword[] = []
): Promise<Keyword[]> {
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

    const parsed: unknown = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return normalizeKeywords(parsed) ?? [];
    }

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      Array.isArray((parsed as any).KEYWORDS)
    ) {
      return normalizeKeywords((parsed as any).KEYWORDS) ?? [];
    }
  } catch {
    // fallback silencioso
  }

  return fallbackKeywords;
}

// 📤 save
export async function saveKeywords(
  keywords: unknown
): Promise<Keyword[] | null> {
  const normalizedKeywords = normalizeKeywords(keywords);

  if (normalizedKeywords === null) {
    return null;
  }

  const client = await getRedisClient();

  if (!client) {
    throw new Error("Redis indisponivel para salvar keywords.");
  }

  await client.set(
    getKeywordsRedisKey(),
    JSON.stringify(normalizedKeywords)
  );

  return normalizedKeywords;
}