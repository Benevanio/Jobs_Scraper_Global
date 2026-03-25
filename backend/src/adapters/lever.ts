import axios from "axios";

export function createLeverAdapter(companySlug, companyName) {
  return {
    sourceName: `Lever:${companyName}`,

    async search(keyword, config) {
      const url = `https://api.lever.co/v0/postings/${companySlug}?mode=json`;

      const response = await axios.get(url, {
        timeout: config.pageTimeoutMs || 15000,
      });

      const jobs = Array.isArray(response.data) ? response.data : [];

      return jobs
        .filter((job) =>
          String(job.text || "")
            .toLowerCase()
            .includes(String(keyword).toLowerCase())
        )
        .map((job) => ({
          source: "Lever",
          keyword,
          titulo: String(job.text || "").trim(),
          empresa: companyName,
          local: String(job.categories?.location || "").trim(),
          link: String(job.hostedUrl || "").trim(),
          modalidade: String(job.categories?.commitment || "").trim(),
          dataPublicacao: job.createdAt
            ? new Date(job.createdAt).toISOString()
            : "",
        }));
    },
  };
}