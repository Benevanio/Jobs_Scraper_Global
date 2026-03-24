import axios from "axios";
import * as cheerio from "cheerio";

import { logInfo, logWarn } from "../logger.js";


function buildSearchUrl(keyword, config, start = 0) {
  const url = new URL(
    "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
  );

  url.searchParams.set("keywords", keyword);

  if (config.searchLocation) {
    url.searchParams.set("location", config.searchLocation);
  }

  if (config.searchGeoId) {
    url.searchParams.set("geoId", config.searchGeoId);
  }

  if (config.searchLanguage) {
    url.searchParams.set("lang", config.searchLanguage);
  }

  if (config.remoteOnly !== false) {
    url.searchParams.set("f_WT", "2");
  }

  if (config.jobTypes) {
    url.searchParams.set("f_JT", config.jobTypes);
  }

  if (config.timeFilter) {
    url.searchParams.set("f_TPR", config.timeFilter);
  }

  url.searchParams.set("start", String(start));

  return url.toString();
}

async function fetchJobsChunk(keyword, config, start) {
  const url = buildSearchUrl(keyword, config, start);

  const response = await axios.get(url, {
    timeout: config.pageTimeoutMs,
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  const $ = cheerio.load(response.data);
  const jobs = [];

  $(".base-card, .job-search-card").each((_, card) => {
    const node = $(card);

    const titulo =
      node.find(".base-search-card__title").text().trim() ||
      node.find("h3").first().text().trim() ||
      "";

    const empresa =
      node.find(".base-search-card__subtitle").text().trim() ||
      node.find("h4").first().text().trim() ||
      "";

    const local = node.find(".job-search-card__location").text().trim() || "";

    const link =
      node.find("a.base-card__full-link").attr("href") ||
      node.find("a[href*='/jobs/view/']").attr("href") ||
      "";

    jobs.push({ titulo, empresa, local, link });
  });

  return jobs;
}

function normalizeJob(keyword, job) {
  return {
    source: "LinkedIn",
    keyword,
    titulo: job.titulo?.trim() || "",
    empresa: job.empresa?.trim() || "",
    local: job.local?.trim() || "",
    link: job.link?.trim() || "",
  };
}

function dedupeJobs(jobs) {
  const unique = new Map();

  for (const job of jobs) {
    const key = job.link || `${job.titulo}-${job.empresa}-${job.local}`;
    if (!key || unique.has(key)) {
      continue;
    }
    unique.set(key, job);
  }

  return [...unique.values()];
}

export const linkedinAdapter = {
  sourceName: "linkedin",

  async search(keyword, config) {
    const allJobs = [];
    const maxPagesPerKeyword = config.maxPagesPerKeyword || 5;
    const pageStep = 25;

    logInfo(`LinkedIn: buscando vagas para "${keyword}"`);

    for (let pageIndex = 0; pageIndex < maxPagesPerKeyword; pageIndex++) {
      const start = pageIndex * pageStep;
      let jobs = [];

      try {
        jobs = await fetchJobsChunk(keyword, config, start);
      } catch (error) {
        logWarn(
          `LinkedIn: falha HTTP na busca para "${keyword}" (start=${start})`,
          error instanceof Error ? error.message : error
        );
      }

      if (jobs.length === 0) {
        if (pageIndex === 0) {
          logWarn(`LinkedIn: elementos de vaga não encontrados para "${keyword}"`);
        }
        break;
      }

      allJobs.push(...jobs.map((job) => normalizeJob(keyword, job)));

      await new Promise((resolve) =>
        setTimeout(resolve, config.waitBetweenSearchesMs || 1000)
      );
    }

    return dedupeJobs(allJobs);
  },
};