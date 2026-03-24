import axios from "axios";

function buildAdzunaUrl(keyword, config, page, options) {
  const country = String(options.country).trim().toLowerCase();

  const url = new URL(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`,
  );

  url.searchParams.set("app_id", options.appId);
  url.searchParams.set("app_key", options.appKey);
  url.searchParams.set("results_per_page", String(config.resultsPerPage || 20));
  url.searchParams.set("what", keyword);

  if (config.searchLocation) {
    url.searchParams.set("where", config.searchLocation);
  }

  // teste sem isso primeiro
  // if (config.remoteOnly) {
  //   url.searchParams.set("work_from_home", "1");
  // }

  return url.toString();
}

export function createAdzunaAdapter(options) {
  return {
    sourceName: `Adzuna:${String(options.country).toLowerCase()}`,

    async search(keyword, config) {
      const allJobs = [];
      const maxPages = config.maxPagesPerKeyword || 3;

      for (let page = 1; page <= maxPages; page++) {
        const url = buildAdzunaUrl(keyword, config, page, options);

        try {
          const response = await axios.get(url, {
            timeout: config.pageTimeoutMs || 15000,
            headers: {
              Accept: "application/json",
            },
          });

          const results = Array.isArray(response.data?.results)
            ? response.data.results
            : [];

          if (!results.length) {
            break;
          }

          const normalized = results.map((job) => ({
            source: "Adzuna",
            keyword,
            titulo: String(job.title || "").trim(),
            empresa: String(job.company?.display_name || "").trim(),
            local: String(job.location?.display_name || "").trim(),
            link: String(job.redirect_url || job.url || "").trim(),
            salario:
              job.salary_min || job.salary_max
                ? `${job.salary_min || ""}-${job.salary_max || ""}`
                : "",
            dataPublicacao: job.created || "",
          }));

          allJobs.push(...normalized);

          await new Promise((resolve) =>
            setTimeout(resolve, config.waitBetweenSearchesMs || 1000),
          );
        } catch (error) {
          console.error("Adzuna URL:", url);
          console.error("Adzuna status:", error.response?.status);
          console.error("Adzuna body:", error.response?.data);
          throw error;
        }
      }

      return allJobs;
    },
  };
}
