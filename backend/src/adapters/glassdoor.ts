import axios from "axios";
import * as cheerio from "cheerio";

function buildGlassdoorUrl(keyword, location) {
  const url = new URL("https://www.glassdoor.com.br/Job/jobs.htm");
  url.searchParams.set("sc.keyword", keyword);
  if (location) {
    url.searchParams.set("locT", "C");
    url.searchParams.set("locId", location);
  }
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
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        if (item?.['@type'] !== "JobPosting") {
          continue;
        }

        jobs.push({
          source: "Glassdoor",
          keyword,
          titulo: normalizeText(item.title),
          empresa: normalizeText(item.hiringOrganization?.name),
          local: normalizeText(
            item.jobLocation?.address?.addressLocality ||
              item.jobLocation?.address?.addressRegion,
          ),
          link: normalizeText(item.url),
          dataPublicacao: normalizeText(item.datePosted),
        });
      }
    } catch {
      // ignora JSON inválido
    }
  });

  return jobs;
}

function parseHtmlJobs(html, keyword) {
  const $ = cheerio.load(html);
  const jobs = [];

  $("li[data-test='jobListing'], article").each((_, node) => {
    const item = $(node);

    const title = normalizeText(
      item.find("a[data-test='job-link'], a.jobLink, a").first().text(),
    );

    const company = normalizeText(
      item.find("[data-test='employer-name'], .EmployerProfile_compactEmployerName__LE242").first().text(),
    );

    const location = normalizeText(
      item.find("[data-test='emp-location'], [data-test='location'], .JobCard_location__Ds1fM").first().text(),
    );

    const href =
      item.find("a[data-test='job-link'], a.jobLink, a").first().attr("href") || "";

    const link = href.startsWith("http")
      ? href
      : href
        ? `https://www.glassdoor.com.br${href}`
        : "";

    jobs.push({
      source: "Glassdoor",
      keyword,
      titulo: title,
      empresa: company,
      local: location,
      link: normalizeText(link),
    });
  });

  return jobs.filter((job) => job.titulo || job.link);
}

export const glassdoorAdapter = {
  sourceName: "Glassdoor",

  async search(keyword, config) {
    const timeout = config.pageTimeoutMs || 15000;
    const url = buildGlassdoorUrl(keyword, config.searchLocation || "");

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
