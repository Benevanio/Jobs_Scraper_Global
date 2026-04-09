import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getRedisClient } from "../cache/cache.js";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

function getKeywordsStorageMode() {
  const configuredMode = String(process.env.KEYWORDS_STORAGE_MODE ?? "file")
    .trim()
    .toLowerCase();

  return configuredMode === "env" ? "env" : "file";
}

function getKeywordsFilePath() {
  const configuredPath = process.env.KEYWORDS_FILE_PATH?.trim();
  return configuredPath
    ? path.resolve(configuredPath)
    : path.resolve(MODULE_DIR, "environment.json");
}

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

function readKeywordsFromFile() {
  const envPath = getKeywordsFilePath();

  if (!existsSync(envPath)) {
    return null;
  }

  try {
    const data = JSON.parse(readFileSync(envPath, "utf-8"));
    return Array.isArray(data?.KEYWORDS) ? normalizeKeywords(data.KEYWORDS) ?? [] : [];
  } catch {
    return [];
  }
}

function writeKeywordsToFile(keywords) {
  const envPath = getKeywordsFilePath();
  mkdirSync(path.dirname(envPath), { recursive: true });
  writeFileSync(envPath, JSON.stringify({ KEYWORDS: keywords }, null, 2), "utf-8");
}

export async function loadKeywords(fallback = []) {
  const client = await getRedisClient();

  if (client) {
    try {
      const raw = await client.get(getKeywordsRedisKey());
      if (raw) {
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          return normalizeKeywords(parsed) ?? [];
        }

        if (Array.isArray(parsed?.KEYWORDS)) {
          return normalizeKeywords(parsed.KEYWORDS) ?? [];
        }
      }
    } catch {
      // fallback below
    }
  }

  const envKeywords = parseKeywordsFromEnv(process.env.SEARCH_KEYWORDS);
  if (envKeywords.length > 0) {
    return envKeywords;
  }

  const fileKeywords = readKeywordsFromFile();
  if (fileKeywords !== null) {
    return fileKeywords;
  }

  return normalizeKeywords(fallback) ?? [];
}

export async function saveKeywords(keywords) {
  const normalizedKeywords = normalizeKeywords(keywords);

  if (normalizedKeywords === null) {
    return null;
  }

  const client = await getRedisClient();
  if (client) {
    await client.set(getKeywordsRedisKey(), JSON.stringify(normalizedKeywords));
    return normalizedKeywords;
  }

  if (getKeywordsStorageMode() === "env") {
    process.env.SEARCH_KEYWORDS = normalizedKeywords.join(",");
    return normalizedKeywords;
  }

  writeKeywordsToFile(normalizedKeywords);
  return normalizedKeywords;
}
