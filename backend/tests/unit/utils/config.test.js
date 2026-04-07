import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getConfig } from "../../../src/config.js";

const CONFIG_ENV_KEYS = [
  "HEADLESS",
  "WAIT_BETWEEN_SEARCHES_MS",
  "PAGE_TIMEOUT_MS",
  "MAX_PAGES_PER_KEYWORD",
  "VIEWPORT_WIDTH",
  "VIEWPORT_HEIGHT",
  "OUTPUT_FILE",
  "PDF_FILE",
  "SEARCH_LOCATION",
  "SEARCH_GEO_ID",
  "SEARCH_LANGUAGE",
  "REMOTE_ONLY",
  "JOB_TYPES",
  "TIME_FILTER",
  "SEARCH_KEYWORDS",
  "KEYWORDS_FILE_PATH",
];

describe("getConfig", () => {
  beforeEach(() => {
    for (const key of CONFIG_ENV_KEYS) {
      vi.stubEnv(key, undefined);
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa caminhos padrao em output/ para Excel e PDF", () => {
    const config = getConfig();
    expect(config.outputFile).toBe("output/vagas_remoto.xlsx");
    expect(config.pdfFile).toBe("output/vagas_remoto.pdf");
  });

  it("permite sobrescrever arquivos de saida via env", () => {
    vi.stubEnv("OUTPUT_FILE", "custom/out.xlsx");
    vi.stubEnv("PDF_FILE", "custom/out.pdf");
    const config = getConfig();
    expect(config.outputFile).toBe("custom/out.xlsx");
    expect(config.pdfFile).toBe("custom/out.pdf");
  });

  it("parseia SEARCH_KEYWORDS em lista", () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), "jobs-config-"));
    vi.stubEnv("KEYWORDS_FILE_PATH", path.join(tempDir, "missing-environment.json"));
    vi.stubEnv("SEARCH_KEYWORDS", "Java,Spring,RabbitMQ,Docker");

    const config = getConfig();
    expect(config.keywords).toEqual(["Java", "Spring", "RabbitMQ", "Docker"]);
  });

  it("rejeita TIME_FILTER invalido e usa fallback", () => {
    vi.stubEnv("TIME_FILTER", "invalid");
    const config = getConfig();
    expect(config.timeFilter).toBe("r604800");
  });

  it("aceita TIME_FILTER no formato r + digitos", () => {
    vi.stubEnv("TIME_FILTER", "r86400");
    const config = getConfig();
    expect(config.timeFilter).toBe("r86400");
  });

  it("parseia booleans validos e numericos positivos", () => {
    vi.stubEnv("HEADLESS", "true");
    vi.stubEnv("REMOTE_ONLY", "off");
    vi.stubEnv("WAIT_BETWEEN_SEARCHES_MS", "250");
    vi.stubEnv("PAGE_TIMEOUT_MS", "500");
    vi.stubEnv("MAX_PAGES_PER_KEYWORD", "3");
    vi.stubEnv("VIEWPORT_WIDTH", "1440");
    vi.stubEnv("VIEWPORT_HEIGHT", "900");

    const config = getConfig();

    expect(config.headless).toBe(true);
    expect(config.remoteOnly).toBe(false);
    expect(config.waitBetweenSearchesMs).toBe(250);
    expect(config.pageTimeoutMs).toBe(500);
    expect(config.maxPagesPerKeyword).toBe(3);
    expect(config.viewport).toEqual({ width: 1440, height: 900 });
  });

  it("faz fallback quando boolean e numero sao invalidos", () => {
    vi.stubEnv("HEADLESS", "talvez");
    vi.stubEnv("REMOTE_ONLY", "desconhecido");
    vi.stubEnv("WAIT_BETWEEN_SEARCHES_MS", "0");
    vi.stubEnv("PAGE_TIMEOUT_MS", "abc");
    vi.stubEnv("MAX_PAGES_PER_KEYWORD", "-1");

    const config = getConfig();

    expect(config.headless).toBe(false);
    expect(config.remoteOnly).toBe(true);
    expect(config.waitBetweenSearchesMs).toBe(5000);
    expect(config.pageTimeoutMs).toBe(10000);
    expect(config.maxPagesPerKeyword).toBe(5);
  });

  it("retorna keywords padrao quando lista informada e vazia", () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), "jobs-config-"));
    vi.stubEnv("KEYWORDS_FILE_PATH", path.join(tempDir, "missing-environment.json"));
    vi.stubEnv("SEARCH_KEYWORDS", " ,  , ");

    const config = getConfig();
    expect(config.keywords.length).toBeGreaterThan(0);
    expect(config.keywords).toContain("Java");
  });

  it("preserva lista vazia quando o arquivo de keywords ja existe", () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), "jobs-config-"));
    const keywordsFile = path.join(tempDir, "environment.json");
    writeFileSync(keywordsFile, JSON.stringify({ KEYWORDS: [] }), "utf-8");

    vi.stubEnv("KEYWORDS_FILE_PATH", keywordsFile);
    vi.stubEnv("SEARCH_KEYWORDS", "Java,Node");

    const config = getConfig();
    expect(config.keywords).toEqual([]);
  });
});
