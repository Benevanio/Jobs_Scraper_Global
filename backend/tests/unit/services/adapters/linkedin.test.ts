import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  logInfoMock: vi.fn(),
  logWarnMock: vi.fn(),
}));

vi.mock("axios");
vi.mock("../../../../src/logger.js", () => ({
  logInfo: mocks.logInfoMock,
  logWarn: mocks.logWarnMock,
}));

import { linkedinAdapter } from "../../../../src/adapters/linkedin.js";

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

describe("linkedinAdapter", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

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

    const jobs = await linkedinAdapter.search("React", BASE_CONFIG);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "LinkedIn",
      keyword: "React",
      titulo: "Dev 1",
      empresa: "ACME",
    });
  });

  it("retorna lista vazia quando o HTML não contém vagas", async () => {
    axios.get.mockResolvedValue({
      data: `<div class="sem-resultado">Nenhuma vaga encontrada</div>`,
    });

    const jobs = await linkedinAdapter.search("React", BASE_CONFIG);

    expect(jobs).toEqual([]);
  });

  it("faz parse de cards mesmo quando um deles não tem link", async () => {
    axios.get.mockResolvedValue({
      data: `
      <div class="base-card">
        <h3 class="base-search-card__title">Dev sem link</h3>
        <h4 class="base-search-card__subtitle">ACME</h4>
        <span class="job-search-card__location">BR</span>
      </div>
      <div class="base-card">
        <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/2"></a>
        <h3 class="base-search-card__title">Dev com link</h3>
        <h4 class="base-search-card__subtitle">BETA</h4>
        <span class="job-search-card__location">SP</span>
      </div>
    `,
    });

    const jobs = await linkedinAdapter.search("React", BASE_CONFIG);

    expect(jobs).toHaveLength(2);

    expect(jobs[0]).toMatchObject({
      source: "LinkedIn",
      keyword: "React",
      titulo: "Dev sem link",
      empresa: "ACME",
      local: "BR",
    });

    expect(jobs[0].link ?? "").toBe("");

    expect(jobs[1]).toMatchObject({
      source: "LinkedIn",
      keyword: "React",
      titulo: "Dev com link",
      empresa: "BETA",
      local: "SP",
      link: "https://www.linkedin.com/jobs/view/2",
    });
  });

  it("faz parse mesmo com campos textuais ausentes", async () => {
    axios.get.mockResolvedValue({
      data: `
        <div class="base-card">
          <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/3"></a>
        </div>
      `,
    });

    const jobs = await linkedinAdapter.search("Node", BASE_CONFIG);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "LinkedIn",
      keyword: "Node",
      link: "https://www.linkedin.com/jobs/view/3",
    });

    expect(jobs[0].titulo ?? "").toBe("");
    expect(jobs[0].empresa ?? "").toBe("");
    expect(jobs[0].local ?? "").toBe("");
  });

  it("mantém vagas diferentes quando os links são diferentes", async () => {
    axios.get.mockResolvedValue({
      data: `
        <div class="base-card">
          <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/10"></a>
          <h3 class="base-search-card__title">Dev 10</h3>
          <h4 class="base-search-card__subtitle">ACME</h4>
          <span class="job-search-card__location">BR</span>
        </div>
        <div class="base-card">
          <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/11"></a>
          <h3 class="base-search-card__title">Dev 11</h3>
          <h4 class="base-search-card__subtitle">ACME</h4>
          <span class="job-search-card__location">BR</span>
        </div>
      `,
    });

    const jobs = await linkedinAdapter.search("React", BASE_CONFIG);

    expect(jobs).toHaveLength(2);
    expect(jobs[0].link).not.toBe(jobs[1].link);
  });

  it("trata erro HTTP e retorna lista vazia", async () => {
    axios.get.mockRejectedValue(new Error("falha"));

    const jobs = await linkedinAdapter.search("Node", BASE_CONFIG);

    expect(jobs).toEqual([]);
    expect(mocks.logWarnMock).toHaveBeenCalled();
  });
});
