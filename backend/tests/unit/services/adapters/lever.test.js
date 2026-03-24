// import axios from "axios";
// import { beforeEach, describe, expect, it, vi } from "vitest";
// import { createLeverAdapter } from "../../../../src/adapters/lever.js";

// vi.mock("axios");

// const BASE_CONFIG = {
//   pageTimeoutMs: 1000,
// };

// describe("createLeverAdapter", () => {
//   const adapter = createLeverAdapter("acme", "ACME");

//   beforeEach(() => {
//     vi.clearAllMocks();
//   });

//   it("filtra vagas pela keyword e normaliza o retorno", async () => {
//     const createdAt = 1711274400000;

//     axios.get.mockResolvedValueOnce({
//       data: [
//         {
//           text: "React Engineer",
//           categories: {
//             location: "São Paulo",
//             commitment: "Full-time",
//           },
//           hostedUrl: "https://lever.co/job/1",
//           createdAt,
//         },
//         {
//           text: "Python Engineer",
//           categories: {
//             location: "Rio de Janeiro",
//             commitment: "Part-time",
//           },
//           hostedUrl: "https://lever.co/job/2",
//           createdAt,
//         },
//       ],
//     });

//     const jobs = await adapter.search("React", BASE_CONFIG);

//     expect(axios.get).toHaveBeenCalledTimes(1);
//     expect(jobs).toHaveLength(1);
//     expect(jobs[0]).toMatchObject({
//       source: "Lever",
//       keyword: "React",
//       titulo: "React Engineer",
//       empresa: "ACME",
//       local: "São Paulo",
//       link: "https://lever.co/job/1",
//       modalidade: "Full-time",
//       dataPublicacao: new Date(createdAt).toISOString(),
//     });
//   });

//   it("retorna lista vazia quando nenhuma vaga bate com a keyword", async () => {
//     axios.get.mockResolvedValueOnce({
//       data: [
//         {
//           text: "Python Engineer",
//           categories: { location: "RJ", commitment: "Full-time" },
//           hostedUrl: "https://lever.co/job/2",
//           createdAt: 1711274400000,
//         },
//       ],
//     });

//     const jobs = await adapter.search("React", BASE_CONFIG);

//     expect(jobs).toEqual([]);
//   });

//   it("retorna dataPublicacao vazia quando createdAt não existe", async () => {
//     axios.get.mockResolvedValueOnce({
//       data: [
//         {
//           text: "React Engineer",
//           categories: {
//             location: "Remoto",
//             commitment: "Contract",
//           },
//           hostedUrl: "https://lever.co/job/3",
//         },
//       ],
//     });

//     const jobs = await adapter.search("React", BASE_CONFIG);

//     expect(jobs).toHaveLength(1);
//     expect(jobs[0]).toMatchObject({
//       source: "Lever",
//       keyword: "React",
//       titulo: "React Engineer",
//       empresa: "ACME",
//       local: "Remoto",
//       link: "https://lever.co/job/3",
//       modalidade: "Contract",
//       dataPublicacao: "",
//     });
//   });

//   it("lança erro quando a requisição falha", async () => {
//     axios.get.mockRejectedValueOnce(new Error("falha lever"));

//     await expect(adapter.search("React", BASE_CONFIG)).rejects.toThrow(
//       "falha lever",
//     );
//   });
// });

import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLeverAdapter } from "../../../../src/adapters/lever.js";

vi.mock("axios");

const BASE_CONFIG = {
  pageTimeoutMs: 1000,
};

describe("createLeverAdapter", () => {
  const adapter = createLeverAdapter("acme", "ACME");

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("filtra vagas pela keyword e normaliza o retorno", async () => {
    const createdAt = 1711274400000;

    axios.get.mockResolvedValueOnce({
      data: [
        {
          text: "React Engineer",
          categories: {
            location: "São Paulo",
            commitment: "Full-time",
          },
          hostedUrl: "https://lever.co/job/1",
          createdAt,
        },
        {
          text: "Python Engineer",
          categories: {
            location: "Rio de Janeiro",
            commitment: "Part-time",
          },
          hostedUrl: "https://lever.co/job/2",
          createdAt,
        },
      ],
    });

    const jobs = await adapter.search("React", BASE_CONFIG);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "Lever",
      keyword: "React",
      titulo: "React Engineer",
      empresa: "ACME",
      local: "São Paulo",
      link: "https://lever.co/job/1",
      modalidade: "Full-time",
      dataPublicacao: new Date(createdAt).toISOString(),
    });
  });

  it("faz o filtro sem diferenciar maiúsculas e minúsculas", async () => {
    const createdAt = 1711274400000;

    axios.get.mockResolvedValueOnce({
      data: [
        {
          text: "ReAcT Engineer",
          categories: {
            location: "São Paulo",
            commitment: "Full-time",
          },
          hostedUrl: "https://lever.co/job/1",
          createdAt,
        },
      ],
    });

    const jobs = await adapter.search("react", BASE_CONFIG);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      titulo: "ReAcT Engineer",
      keyword: "react",
    });
  });

  it("retorna lista vazia quando nenhuma vaga bate com a keyword", async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        {
          text: "Python Engineer",
          categories: { location: "RJ", commitment: "Full-time" },
          hostedUrl: "https://lever.co/job/2",
          createdAt: 1711274400000,
        },
      ],
    });

    const jobs = await adapter.search("React", BASE_CONFIG);

    expect(jobs).toEqual([]);
  });

  it("retorna lista vazia quando a resposta não é array", async () => {
    axios.get.mockResolvedValueOnce({
      data: null,
    });

    const jobs = await adapter.search("React", BASE_CONFIG);

    expect(jobs).toEqual([]);
  });

  it("retorna local e modalidade vazios quando categories não existe", async () => {
    const createdAt = 1711274400000;

    axios.get.mockResolvedValueOnce({
      data: [
        {
          text: "React Engineer",
          hostedUrl: "https://lever.co/job/3",
          createdAt,
        },
      ],
    });

    const jobs = await adapter.search("React", BASE_CONFIG);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "Lever",
      keyword: "React",
      titulo: "React Engineer",
      empresa: "ACME",
      local: "",
      link: "https://lever.co/job/3",
      modalidade: "",
      dataPublicacao: new Date(createdAt).toISOString(),
    });
  });

  it("retorna link vazio quando hostedUrl não existe", async () => {
    const createdAt = 1711274400000;

    axios.get.mockResolvedValueOnce({
      data: [
        {
          text: "React Engineer",
          categories: {
            location: "Remoto",
            commitment: "Contract",
          },
          createdAt,
        },
      ],
    });

    const jobs = await adapter.search("React", BASE_CONFIG);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      titulo: "React Engineer",
      empresa: "ACME",
      local: "Remoto",
      link: "",
      modalidade: "Contract",
      dataPublicacao: new Date(createdAt).toISOString(),
    });
  });

  it("retorna dataPublicacao vazia quando createdAt não existe", async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        {
          text: "React Engineer",
          categories: {
            location: "Remoto",
            commitment: "Contract",
          },
          hostedUrl: "https://lever.co/job/4",
        },
      ],
    });

    const jobs = await adapter.search("React", BASE_CONFIG);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "Lever",
      keyword: "React",
      titulo: "React Engineer",
      empresa: "ACME",
      local: "Remoto",
      link: "https://lever.co/job/4",
      modalidade: "Contract",
      dataPublicacao: "",
    });
  });

  it("lança erro quando a requisição falha", async () => {
    axios.get.mockRejectedValueOnce(new Error("falha lever"));

    await expect(adapter.search("React", BASE_CONFIG)).rejects.toThrow(
      "falha lever",
    );
  });
});
