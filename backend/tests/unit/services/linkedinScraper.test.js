import axios from "axios";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  logInfoMock: vi.fn(),
  logWarnMock: vi.fn(),
}));

vi.mock("axios");
vi.mock("../../../src/logger.js", () => ({
  logInfo: mocks.logInfoMock,
  logWarn: mocks.logWarnMock,
}));

import { scrapeLinkedinJobs } from "../../../src/linkedinScraper.js";

const BASE_CONFIG = {
  searchLocation: "Brasil",
  searchGeoId: "106057199",
  searchLanguage: "pt",
  jobTypes: "C,F",
  timeFilter: "r604800",
  pageTimeoutMs: 1000,
  waitBetweenSearchesMs: 0,
  maxPagesPerKeyword: 1,
};

describe("scrapeLinkedinJobs", () => {
  it("faz parse e remove vagas duplicadas", async () => {
    axios.get.mockResolvedValue({
      data: `
        <div class="base-card">
          <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/1"></a>
          <h3 class="base-search-card__title">Dev 1</h3>
          <h4 class="base-search-card__subtitle">ACME</h4>
          <span class="job-search-card__location">BR</span>
        </div>
        <div class="base-card">
          <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/1"></a>
          <h3 class="base-search-card__title">Dev 1</h3>
          <h4 class="base-search-card__subtitle">ACME</h4>
          <span class="job-search-card__location">BR</span>
        </div>
      `,
    });

    const jobs = await scrapeLinkedinJobs({ ...BASE_CONFIG, keywords: ["React"] });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ palavra: "React", titulo: "Dev 1", empresa: "ACME" });
  });

  it("trata erro HTTP e retorna lista vazia", async () => {
    axios.get.mockRejectedValue(new Error("falha"));

    const jobs = await scrapeLinkedinJobs({ ...BASE_CONFIG, keywords: ["Node"] });

    expect(jobs).toEqual([]);
    expect(mocks.logWarnMock).toHaveBeenCalled();
  });
});
