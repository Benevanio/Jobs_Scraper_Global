import axios from "axios";

export function createGreenhouseAdapter(boardToken, companyName) {
  return {
    sourceName: `Green House:${companyName}`,

    async search(keyword, config) {
      const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs`;

      const response = await axios.get(url, {
        timeout: config.pageTimeoutMs || 15000,
      });

      const jobs = Array.isArray(response.data?.jobs) ? response.data.jobs : [];

      return jobs
        .filter((job) =>
          String(job.title || "")
            .toLowerCase()
            .includes(String(keyword).toLowerCase())
        )
        .map((job) => ({
          source: "Green House",
          keyword,
          titulo: String(job.title || "").trim(),
          empresa: companyName,
          local: String(job.location?.name || "").trim(),
          link: String(job.absolute_url || "").trim(),
          dataPublicacao: job.updated_at || "",
        }));
    },
  };
}