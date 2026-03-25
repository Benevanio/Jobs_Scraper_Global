import axios from "axios";

function buildTheMuseUrl(keyword, config, page = 1) {
  const url = new URL("https://www.themuse.com/api/public/jobs");

  url.searchParams.set("page", String(page));
  url.searchParams.set("descending", "true");

  if (keyword) {
    url.searchParams.set("category", keyword);
  }

  if (config.searchLocation) {
    url.searchParams.set("location", config.searchLocation);
  }

  return url.toString();
}

export const theMuseAdapter = {
  sourceName: "The Muse",

  async search(keyword, config) {
    const allJobs = [];
    const maxPages = config.maxPagesPerKeyword || 3;

    for (let page = 1; page <= maxPages; page++) {
      const url = buildTheMuseUrl(keyword, config, page);

      const response = await axios.get(url, {
        timeout: config.pageTimeoutMs || 15000,
      });

      const results = Array.isArray(response.data?.results)
        ? response.data.results
        : [];

      if (!results.length) {
        break;
      }

      const normalized = results.map((job) => ({
        source: "The Muse",
        keyword,
        titulo: String(job.name || "").trim(),
        empresa: String(job.company?.name || "").trim(),
        local: Array.isArray(job.locations)
          ? job.locations.map((item) => item.name).join(", ")
          : "",
        link: String(job.refs?.landing_page || "").trim(),
        dataPublicacao: job.publication_date || "",
      }));

      allJobs.push(...normalized);

      await new Promise((resolve) =>
        setTimeout(resolve, config.waitBetweenSearchesMs || 1000),
      );
    }

    return allJobs;
  },
};
