import axios from "axios";
import * as cheerio from "cheerio";

function buildEmpregaCampinasSearchUrl(keyword) {
  const url = new URL("https://www.empregacampinas.com.br/");
  url.searchParams.set("s", keyword);
  return url.toString();
}

function buildEmpregaCampinasRssUrl(keyword) {
  const url = new URL("https://www.empregacampinas.com.br/feed/");
  url.searchParams.set("s", keyword);
  return url.toString();
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parseRssItems(xml, keyword) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const jobs = [];

  $("item").each((_, node) => {
    const item = $(node);
    const titulo = normalizeText(item.find("title").first().text());
    const link = normalizeText(item.find("link").first().text());
    const description = normalizeText(item.find("description").first().text());

    jobs.push({
      source: "Emprega Campinas",
      keyword,
      titulo,
      empresa: "",
      local: "Campinas/SP",
      link,
      descricao: description,
      dataPublicacao: normalizeText(item.find("pubDate").first().text()),
    });
  });

  return jobs.filter((job) => job.titulo || job.link);
}

function parseHtmlItems(html, keyword) {
  const $ = cheerio.load(html);
  const jobs = [];

  $("article, .post").each((_, node) => {
    const item = $(node);
    const link =
      item.find("h2 a, .entry-title a").first().attr("href") ||
      item.find("a").first().attr("href") ||
      "";

    const titulo =
      normalizeText(item.find("h2 a, .entry-title a").first().text()) ||
      normalizeText(item.find("h2, .entry-title").first().text());

    jobs.push({
      source: "Emprega Campinas",
      keyword,
      titulo,
      empresa: "",
      local: "Campinas/SP",
      link: normalizeText(link),
    });
  });

  return jobs.filter((job) => job.titulo || job.link);
}

export const empregaCampinasAdapter = {
  sourceName: "Emprega Campinas",

  async search(keyword, config) {
    const timeout = config.pageTimeoutMs || 15000;
    const headers = {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    };

    try {
      const rssUrl = buildEmpregaCampinasRssUrl(keyword);
      const rssResponse = await axios.get(rssUrl, { timeout, headers });
      const fromRss = parseRssItems(rssResponse.data, keyword);
      if (fromRss.length > 0) {
        return fromRss;
      }
    } catch {
      // fallback para HTML
    }

    try {
      const htmlUrl = buildEmpregaCampinasSearchUrl(keyword);
      const htmlResponse = await axios.get(htmlUrl, { timeout, headers });
      return parseHtmlItems(htmlResponse.data, keyword);
    } catch {
      return [];
    }
  },
};
