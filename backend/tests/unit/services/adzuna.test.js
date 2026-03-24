import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAdzunaAdapter } from "../../../src/adapters/adzuna.js";

vi.mock("axios");

const BASE_CONFIG = {
  searchLocation: "Brasil",
  resultsPerPage: 20,
  pageTimeoutMs: 1000,
  waitBetweenSearchesMs: 0,
  maxPagesPerKeyword: 1,
};

describe("createAdzunaAdapter", () => {
  const adapter = createAdzunaAdapter({
    country: "br",
    appId: "test-app-id",
    appKey: "test-app-key",
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("faz parse das vagas retornadas pela API", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        results: [
          {
            title: "Frontend React Developer",
            company: { display_name: "ACME" },
            location: { display_name: "São Paulo" },
            redirect_url: "https://adzuna.com/job/1",
            salary_min: 3000,
            salary_max: 5000,
            created: "2026-03-24T10:00:00Z",
          },
        ],
      },
    });

    const jobs = await adapter.search("React", BASE_CONFIG);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "Adzuna",
      keyword: "React",
      titulo: "Frontend React Developer",
      empresa: "ACME",
      local: "São Paulo",
      link: "https://adzuna.com/job/1",
      salario: "3000-5000",
      dataPublicacao: "2026-03-24T10:00:00Z",
    });
  });

  it("usa url alternativa quando redirect_url não existe", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        results: [
          {
            title: "Node Developer",
            company: { display_name: "Beta" },
            location: { display_name: "Remoto" },
            url: "https://adzuna.com/job/2",
            created: "2026-03-24T11:00:00Z",
          },
        ],
      },
    });

    const jobs = await adapter.search("Node", BASE_CONFIG);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "Adzuna",
      keyword: "Node",
      titulo: "Node Developer",
      empresa: "Beta",
      local: "Remoto",
      link: "https://adzuna.com/job/2",
      salario: "",
      dataPublicacao: "2026-03-24T11:00:00Z",
    });
  });

  it("busca mais de uma página enquanto houver resultados", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              title: "React Dev 1",
              company: { display_name: "ACME" },
              location: { display_name: "SP" },
              redirect_url: "https://adzuna.com/job/1",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              title: "React Dev 2",
              company: { display_name: "ACME 2" },
              location: { display_name: "RJ" },
              redirect_url: "https://adzuna.com/job/2",
            },
          ],
        },
      });

    const jobs = await adapter.search("React", {
      ...BASE_CONFIG,
      maxPagesPerKeyword: 2,
    });

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(jobs).toHaveLength(2);
    expect(jobs[0].titulo).toBe("React Dev 1");
    expect(jobs[1].titulo).toBe("React Dev 2");
  });

  it("interrompe a paginação quando a API retorna results vazio", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              title: "React Dev 1",
              company: { display_name: "ACME" },
              location: { display_name: "SP" },
              redirect_url: "https://adzuna.com/job/1",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          results: [],
        },
      });

    const jobs = await adapter.search("React", {
      ...BASE_CONFIG,
      maxPagesPerKeyword: 2,
    });

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(jobs).toHaveLength(1);
  });

  it("lança erro quando a requisição falha", async () => {
    axios.get.mockRejectedValueOnce(new Error("falha na API"));

    await expect(adapter.search("React", BASE_CONFIG)).rejects.toThrow(
      "falha na API",
    );
  });
});
