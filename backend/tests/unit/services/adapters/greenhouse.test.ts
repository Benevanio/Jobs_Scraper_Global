import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGreenhouseAdapter } from "../../../../src/adapters/greenhouse.js";

vi.mock("axios");

const BASE_CONFIG = {
  pageTimeoutMs: 1000,
};

describe("createGreenhouseAdapter", () => {
  const adapter = createGreenhouseAdapter("acme-board", "ACME");

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("filtra vagas pela keyword e normaliza o retorno", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        jobs: [
          {
            title: "Senior React Engineer",
            location: { name: "São Paulo" },
            absolute_url: "https://greenhouse.io/job/1",
            updated_at: "2026-03-24T10:00:00Z",
          },
          {
            title: "Backend Python Engineer",
            location: { name: "Rio de Janeiro" },
            absolute_url: "https://greenhouse.io/job/2",
            updated_at: "2026-03-24T11:00:00Z",
          },
        ],
      },
    });

    const jobs = await adapter.search("React", BASE_CONFIG);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "Green House",
      keyword: "React",
      titulo: "Senior React Engineer",
      empresa: "ACME",
      local: "São Paulo",
      link: "https://greenhouse.io/job/1",
      dataPublicacao: "2026-03-24T10:00:00Z",
    });
  });

  it("faz o filtro de keyword sem diferenciar maiúsculas e minúsculas", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        jobs: [
          {
            title: "Senior ReAcT Engineer",
            location: { name: "São Paulo" },
            absolute_url: "https://greenhouse.io/job/1",
            updated_at: "2026-03-24T10:00:00Z",
          },
        ],
      },
    });

    const jobs = await adapter.search("react", BASE_CONFIG);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      titulo: "Senior ReAcT Engineer",
      keyword: "react",
    });
  });

  it("retorna lista vazia quando nenhuma vaga bate com a keyword", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        jobs: [
          {
            title: "Backend Python Engineer",
            location: { name: "Rio de Janeiro" },
            absolute_url: "https://greenhouse.io/job/2",
            updated_at: "2026-03-24T11:00:00Z",
          },
        ],
      },
    });

    const jobs = await adapter.search("React", BASE_CONFIG);

    expect(jobs).toEqual([]);
  });

  it("retorna lista vazia quando jobs não é array", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        jobs: null,
      },
    });

    const jobs = await adapter.search("React", BASE_CONFIG);

    expect(jobs).toEqual([]);
  });

  it("retorna local vazio quando location não existe", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        jobs: [
          {
            title: "React Engineer",
            absolute_url: "https://greenhouse.io/job/3",
            updated_at: "2026-03-24T12:00:00Z",
          },
        ],
      },
    });

    const jobs = await adapter.search("React", BASE_CONFIG);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      titulo: "React Engineer",
      empresa: "ACME",
      local: "",
      link: "https://greenhouse.io/job/3",
      dataPublicacao: "2026-03-24T12:00:00Z",
    });
  });

  it("retorna link vazio quando absolute_url não existe", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        jobs: [
          {
            title: "React Engineer",
            location: { name: "Remoto" },
            updated_at: "2026-03-24T13:00:00Z",
          },
        ],
      },
    });

    const jobs = await adapter.search("React", BASE_CONFIG);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      titulo: "React Engineer",
      empresa: "ACME",
      local: "Remoto",
      link: "",
      dataPublicacao: "2026-03-24T13:00:00Z",
    });
  });

  it("retorna dataPublicacao vazia quando updated_at não existe", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        jobs: [
          {
            title: "React Engineer",
            location: { name: "Remoto" },
            absolute_url: "https://greenhouse.io/job/4",
          },
        ],
      },
    });

    const jobs = await adapter.search("React", BASE_CONFIG);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      titulo: "React Engineer",
      empresa: "ACME",
      local: "Remoto",
      link: "https://greenhouse.io/job/4",
      dataPublicacao: "",
    });
  });

  it("lança erro quando a requisição falha", async () => {
    axios.get.mockRejectedValueOnce(new Error("falha greenhouse"));

    await expect(adapter.search("React", BASE_CONFIG)).rejects.toThrow(
      "falha greenhouse",
    );
  });
});
