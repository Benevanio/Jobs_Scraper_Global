import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_KEYWORDS = [  
  "Java",
  "JavaScript",
  "React",
  "Node.js",
  "Mulesoft",
  "Desenvolvedor Junior",
  "Desenvolvedor Pleno",
];

function parseBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "n", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function parseNumber(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getKeywordsFilePath() {
  const configuredPath = process.env.KEYWORDS_FILE_PATH?.trim();
  return configuredPath
    ? path.resolve(configuredPath)
    : path.resolve(MODULE_DIR, "db", "environment.json");
}

function normalizeKeywords(keywords) {
  if (!Array.isArray(keywords)) {
    return null;
  }

  return [...new Set(keywords.map((item) => String(item ?? "").trim()).filter(Boolean))];
}

function parseKeywords(value) {
  // Tenta pegar do arquivo environment.json
  try {
    const envPath = getKeywordsFilePath();
    if (existsSync(envPath)) {
      const data = JSON.parse(readFileSync(envPath, "utf-8"));
      if (Array.isArray(data.KEYWORDS)) {
        return normalizeKeywords(data.KEYWORDS) ?? [];
      }
    }
  } catch (err) {
    // Se falhar, fallback
  }

  // Tenta pegar da variavel de ambiente
  if (value) {
    const keywords = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (keywords.length > 0) return keywords;
  }

  // Fallback para as keywords padrao
  return DEFAULT_KEYWORDS;
}

function parseTimeFilter(value, fallback) {
  if (!value) {
    return fallback;
  }

  const normalized = String(value).trim();
  return /^r\d+$/.test(normalized) ? normalized : fallback;
}

export function getConfig() {
  return {
    headless: parseBoolean(process.env.HEADLESS, false),
    waitBetweenSearchesMs: parseNumber(process.env.WAIT_BETWEEN_SEARCHES_MS, 5000),
    pageTimeoutMs: parseNumber(process.env.PAGE_TIMEOUT_MS, 10000),
    maxPagesPerKeyword: parseNumber(process.env.MAX_PAGES_PER_KEYWORD, 5),
    viewport: {
      width: parseNumber(process.env.VIEWPORT_WIDTH, 1280),
      height: parseNumber(process.env.VIEWPORT_HEIGHT, 800)
    },
    outputFile: process.env.OUTPUT_FILE || "output/vagas_remoto.xlsx",
    pdfFile: process.env.PDF_FILE || "output/vagas_remoto.pdf",
    searchLocation: process.env.SEARCH_LOCATION || "Brasil",
    searchGeoId: process.env.SEARCH_GEO_ID || "106057199",
    searchLanguage: process.env.SEARCH_LANGUAGE || "pt",
    remoteOnly: parseBoolean(process.env.REMOTE_ONLY, true),
    jobTypes: process.env.JOB_TYPES || "C,F",
    // f_TPR examples: r86400 (24h), r604800 (7 dias), r2592000 (30 dias)
    timeFilter: parseTimeFilter(process.env.TIME_FILTER, "r604800"),
    keywords: parseKeywords(process.env.SEARCH_KEYWORDS)
  };
}
