import axios from "axios";
import * as cheerio from "cheerio";

function buildIndeedSearchUrl(keyword, location) {
  const url = new URL("https://www.indeed.com/jobs");
  url.searchParams.set("q", keyword);
  if (location) {
    url.searchParams.set("l", location);
  }
  url.searchParams.set("sort", "date");
  return url.toString();
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parseJsonLdJobs(html, keyword) {
  const $ = cheerio.load(html);
  const jobs = [];

  $("script[type='application/ld+json']").each((_, node) => {
    const rawJson = $(node).contents().text();

    try {
      const parsed = JSON.parse(rawJson);
      const items = Array.isArray(parsed)
        ? parsed
        : parsed?.itemListElement || [parsed];

      for (const item of items) {
        const payload = item?.item || item;
        if (payload?.['@type'] !== "JobPosting") {
          continue;
        }

        const title = normalizeText(payload.title);
        const company = normalizeText(payload.hiringOrganization?.name);
        const location = normalizeText(
          payload.jobLocation?.address?.addressLocality ||
            payload.jobLocation?.address?.addressRegion,
        );
        const link = normalizeText(payload.url);

        jobs.push({
          source: "Indeed",
          keyword,
          titulo: title,
          empresa: company,
          local: location,
          link,
          dataPublicacao: normalizeText(payload.datePosted),
        });
      }
    } catch {
      // ignora blocos JSON inválidos
    }
  });

  return jobs;
}

function parseHtmlJobs(html, keyword) {
  const $ = cheerio.load(html);
  const jobs = [];

  $("[data-jk], .job_seen_beacon").each((_, node) => {
    const card = $(node);
    const title = normalizeText(
      card.find("h2 a span, .jobTitle span, h2").first().text(),
    );
    const company = normalizeText(
      card.find("[data-testid='company-name'], .companyName").first().text(),
    );
    const location = normalizeText(
      card.find("[data-testid='text-location'], .companyLocation").first().text(),
    );

    const href =
      card.find("h2 a").first().attr("href") ||
      card.find("a").first().attr("href") ||
      "";

    const link = href.startsWith("http")
      ? href
      : href
        ? `https://www.indeed.com${href}`
        : "";

    jobs.push({
      source: "Indeed",
      keyword,
      titulo: title,
      empresa: company,
      local: location,
      link: normalizeText(link),
    });
  });

  return jobs.filter((job) => job.titulo || job.link);
}

export const indeedAdapter = {
  sourceName: "Indeed",

  async search(keyword, config) {
    const timeout = config.pageTimeoutMs || 15000;
    const url = buildIndeedSearchUrl(keyword, config.searchLocation || "");

    try {
      const response = await axios.get(url, {
        timeout,
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });

      const fromJsonLd = parseJsonLdJobs(response.data, keyword);
      if (fromJsonLd.length > 0) {
        return fromJsonLd;
      }

      return parseHtmlJobs(response.data, keyword);
    } catch {
      return [];
    }
  },
};
