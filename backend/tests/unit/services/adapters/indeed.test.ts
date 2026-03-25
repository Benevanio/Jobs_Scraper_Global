import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { indeedAdapter } from "../../../../src/adapters/indeed.js";

vi.mock("axios");

describe("indeedAdapter", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("faz parse de JobPosting em JSON-LD", async () => {
    axios.get.mockResolvedValueOnce({
      data: `
        <script type="application/ld+json">
          {
            "@type": "JobPosting",
            "title": "Senior React Engineer",
            "hiringOrganization": { "name": "ACME" },
            "jobLocation": { "address": { "addressLocality": "Campinas" } },
            "url": "https://www.indeed.com/viewjob?jk=123"
          }
        </script>
      `,
    });

    const jobs = await indeedAdapter.search("React", {
      pageTimeoutMs: 1000,
      searchLocation: "Campinas",
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "Indeed",
      keyword: "React",
      titulo: "Senior React Engineer",
      empresa: "ACME",
      local: "Campinas",
      link: "https://www.indeed.com/viewjob?jk=123",
    });
  });

  it("faz fallback para parsing HTML", async () => {
    axios.get.mockResolvedValueOnce({
      data: `
        <div class="job_seen_beacon">
          <h2><a href="/viewjob?jk=abc"><span>Backend Node</span></a></h2>
          <span class="companyName">Beta</span>
          <div class="companyLocation">Remoto</div>
        </div>
      `,
    });

    const jobs = await indeedAdapter.search("Node", {
      pageTimeoutMs: 1000,
      searchLocation: "Brasil",
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "Indeed",
      keyword: "Node",
      titulo: "Backend Node",
      empresa: "Beta",
      local: "Remoto",
      link: "https://www.indeed.com/viewjob?jk=abc",
    });
  });
});
