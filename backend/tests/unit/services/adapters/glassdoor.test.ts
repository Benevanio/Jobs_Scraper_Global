import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { glassdoorAdapter } from "../../../../src/adapters/glassdoor.js";

vi.mock("axios");

describe("glassdoorAdapter", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("faz parse de JobPosting em JSON-LD", async () => {
    axios.get.mockResolvedValueOnce({
      data: `
        <script type="application/ld+json">
          {
            "@type": "JobPosting",
            "title": "Java Developer",
            "hiringOrganization": { "name": "Gamma" },
            "jobLocation": { "address": { "addressLocality": "Campinas" } },
            "url": "https://www.glassdoor.com.br/job1"
          }
        </script>
      `,
    });

    const jobs = await glassdoorAdapter.search("Java", {
      pageTimeoutMs: 1000,
      searchLocation: "Campinas",
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "Glassdoor",
      keyword: "Java",
      titulo: "Java Developer",
      empresa: "Gamma",
      local: "Campinas",
      link: "https://www.glassdoor.com.br/job1",
    });
  });

  it("faz fallback para parsing HTML", async () => {
    axios.get.mockResolvedValueOnce({
      data: `
        <li data-test="jobListing">
          <a data-test="job-link" href="/vaga/123">Frontend Engineer</a>
          <div data-test="employer-name">Delta</div>
          <div data-test="location">São Paulo</div>
        </li>
      `,
    });

    const jobs = await glassdoorAdapter.search("Frontend", {
      pageTimeoutMs: 1000,
      searchLocation: "Brasil",
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "Glassdoor",
      keyword: "Frontend",
      titulo: "Frontend Engineer",
      empresa: "Delta",
      local: "São Paulo",
      link: "https://www.glassdoor.com.br/vaga/123",
    });
  });
});
