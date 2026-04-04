import type { Job } from "@/types/jobs";
import { useMemo, useState } from "react";

export function useJobsFiltering(jobs: Job[]) {
  const [search, setSearch] = useState("");
  const [keywordFilter, setKeywordFilter] = useState<string[]>([]);

  const keywords = useMemo(() => {
    const values = Array.from(new Set(jobs.map((job) => String(job.palavra || "").trim()).filter(Boolean)));
    return values.sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const currentKeyword = String(job.palavra || "").trim();
      const byKeyword = keywordFilter.length === 0 || keywordFilter.includes(currentKeyword);
      if (!byKeyword) {
        return false;
      }

      if (!term) {
        return true;
      }

      const text = [job.titulo, job.empresa, job.local, job.link, job.palavra]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      return text.includes(term);
    });
  }, [jobs, search, keywordFilter]);

  return {
    search,
    setSearch,
    keywordFilter,
    setKeywordFilter,
    keywords,
    filteredJobs,
  };
}
