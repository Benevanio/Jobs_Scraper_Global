// import axios from "axios";
// import { beforeEach, describe, expect, it, vi } from "vitest";
// import { theMuseAdapter } from "../../../../src/adapters/theMuse.js";

// vi.mock("axios");

// const BASE_CONFIG = {
//   searchLocation: "Brasil",
//   pageTimeoutMs: 1000,
//   waitBetweenSearchesMs: 0,
//   maxPagesPerKeyword: 1,
// };

// describe("theMuseAdapter", () => {
//   beforeEach(() => {
//     vi.resetAllMocks();
//   });

//   it("faz parse das vagas retornadas pela API", async () => {
//     axios.get.mockResolvedValueOnce({
//       data: {
//         results: [
//           {
//             name: "Product Designer",
//             company: { name: "ACME" },
//             locations: [{ name: "São Paulo" }, { name: "Remoto" }],
//             refs: { landing_page: "https://themuse.com/job/1" },
//             publication_date: "2026-03-24T10:00:00Z",
//           },
//         ],
//       },
//     });

//     const jobs = await theMuseAdapter.search("Design", BASE_CONFIG);

//     expect(axios.get).toHaveBeenCalledTimes(1);
//     expect(jobs).toHaveLength(1);
//     expect(jobs[0]).toMatchObject({
//       source: "The Muse",
//       keyword: "Design",
//       titulo: "Product Designer",
//       empresa: "ACME",
//       local: "São Paulo, Remoto",
//       link: "https://themuse.com/job/1",
//       dataPublicacao: "2026-03-24T10:00:00Z",
//     });
//   });

//   it("busca mais de uma página enquanto houver resultados", async () => {
//     axios.get
//       .mockResolvedValueOnce({
//         data: {
//           results: [
//             {
//               name: "Designer 1",
//               company: { name: "ACME" },
//               locations: [{ name: "SP" }],
//               refs: { landing_page: "https://themuse.com/job/1" },
//               publication_date: "2026-03-24T10:00:00Z",
//             },
//           ],
//         },
//       })
//       .mockResolvedValueOnce({
//         data: {
//           results: [
//             {
//               name: "Designer 2",
//               company: { name: "Beta" },
//               locations: [{ name: "RJ" }],
//               refs: { landing_page: "https://themuse.com/job/2" },
//               publication_date: "2026-03-24T11:00:00Z",
//             },
//           ],
//         },
//       });

//     const jobs = await theMuseAdapter.search("Design", {
//       ...BASE_CONFIG,
//       maxPagesPerKeyword: 2,
//     });

//     expect(axios.get).toHaveBeenCalledTimes(2);
//     expect(jobs).toHaveLength(2);
//     expect(jobs[0].titulo).toBe("Designer 1");
//     expect(jobs[1].titulo).toBe("Designer 2");
//   });

//   it("interrompe a paginação quando não há resultados", async () => {
//     axios.get
//       .mockResolvedValueOnce({
//         data: {
//           results: [
//             {
//               name: "Designer 1",
//               company: { name: "ACME" },
//               locations: [{ name: "SP" }],
//               refs: { landing_page: "https://themuse.com/job/1" },
//               publication_date: "2026-03-24T10:00:00Z",
//             },
//           ],
//         },
//       })
//       .mockResolvedValueOnce({
//         data: {
//           results: [],
//         },
//       });

//     const jobs = await theMuseAdapter.search("Design", {
//       ...BASE_CONFIG,
//       maxPagesPerKeyword: 2,
//     });

//     expect(axios.get).toHaveBeenCalledTimes(2);
//     expect(jobs).toHaveLength(1);
//   });

//   it("retorna lista vazia quando results não é array", async () => {
//     axios.get.mockResolvedValueOnce({
//       data: {
//         results: null,
//       },
//     });

//     const jobs = await theMuseAdapter.search("Design", BASE_CONFIG);

//     expect(axios.get).toHaveBeenCalledTimes(1);
//     expect(jobs).toEqual([]);
//   });

//   it("lança erro quando a requisição falha", async () => {
//     axios.get.mockRejectedValueOnce(new Error("falha themuse"));

//     await expect(theMuseAdapter.search("Design", BASE_CONFIG)).rejects.toThrow(
//       "falha themuse",
//     );
//   });
// });

import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { theMuseAdapter } from "../../../../src/adapters/theMuse.js";

vi.mock("axios");

const BASE_CONFIG = {
  searchLocation: "Brasil",
  pageTimeoutMs: 1000,
  waitBetweenSearchesMs: 0,
  maxPagesPerKeyword: 1,
};

describe("theMuseAdapter", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("faz parse das vagas retornadas pela API", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        results: [
          {
            name: "Product Designer",
            company: { name: "ACME" },
            locations: [{ name: "São Paulo" }, { name: "Remoto" }],
            refs: { landing_page: "https://themuse.com/job/1" },
            publication_date: "2026-03-24T10:00:00Z",
          },
        ],
      },
    });

    const jobs = await theMuseAdapter.search("Design", BASE_CONFIG);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "The Muse",
      keyword: "Design",
      titulo: "Product Designer",
      empresa: "ACME",
      local: "São Paulo, Remoto",
      link: "https://themuse.com/job/1",
      dataPublicacao: "2026-03-24T10:00:00Z",
    });
  });

  it("busca mais de uma página enquanto houver resultados", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              name: "Designer 1",
              company: { name: "ACME" },
              locations: [{ name: "SP" }],
              refs: { landing_page: "https://themuse.com/job/1" },
              publication_date: "2026-03-24T10:00:00Z",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              name: "Designer 2",
              company: { name: "Beta" },
              locations: [{ name: "RJ" }],
              refs: { landing_page: "https://themuse.com/job/2" },
              publication_date: "2026-03-24T11:00:00Z",
            },
          ],
        },
      });

    const jobs = await theMuseAdapter.search("Design", {
      ...BASE_CONFIG,
      maxPagesPerKeyword: 2,
    });

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(jobs).toHaveLength(2);
    expect(jobs[0].titulo).toBe("Designer 1");
    expect(jobs[1].titulo).toBe("Designer 2");
  });

  it("interrompe a paginação quando não há resultados", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              name: "Designer 1",
              company: { name: "ACME" },
              locations: [{ name: "SP" }],
              refs: { landing_page: "https://themuse.com/job/1" },
              publication_date: "2026-03-24T10:00:00Z",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          results: [],
        },
      });

    const jobs = await theMuseAdapter.search("Design", {
      ...BASE_CONFIG,
      maxPagesPerKeyword: 2,
    });

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(jobs).toHaveLength(1);
  });

  it("retorna lista vazia quando results não é array", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        results: null,
      },
    });

    const jobs = await theMuseAdapter.search("Design", BASE_CONFIG);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(jobs).toEqual([]);
  });

  it("retorna local vazio quando locations não é array", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        results: [
          {
            name: "Designer sem local",
            company: { name: "ACME" },
            locations: null,
            refs: { landing_page: "https://themuse.com/job/3" },
            publication_date: "2026-03-24T12:00:00Z",
          },
        ],
      },
    });

    const jobs = await theMuseAdapter.search("Design", BASE_CONFIG);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      titulo: "Designer sem local",
      empresa: "ACME",
      local: "",
      link: "https://themuse.com/job/3",
      dataPublicacao: "2026-03-24T12:00:00Z",
    });
  });

  it("retorna empresa e link vazios quando campos opcionais não existem", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        results: [
          {
            name: "Designer incompleto",
            locations: [{ name: "Remoto" }],
            refs: {},
            publication_date: "2026-03-24T13:00:00Z",
          },
        ],
      },
    });

    const jobs = await theMuseAdapter.search("Design", BASE_CONFIG);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      titulo: "Designer incompleto",
      empresa: "",
      local: "Remoto",
      link: "",
      dataPublicacao: "2026-03-24T13:00:00Z",
    });
  });

  it("aceita keyword vazia ao buscar", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        results: [
          {
            name: "Generalist",
            company: { name: "ACME" },
            locations: [{ name: "São Paulo" }],
            refs: { landing_page: "https://themuse.com/job/4" },
            publication_date: "2026-03-24T14:00:00Z",
          },
        ],
      },
    });

    const jobs = await theMuseAdapter.search("", BASE_CONFIG);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      keyword: "",
      titulo: "Generalist",
    });
  });

  it("monta a URL sem location quando searchLocation não é informado", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        results: [],
      },
    });

    await theMuseAdapter.search("Design", {
      ...BASE_CONFIG,
      searchLocation: "",
    });

    expect(axios.get).toHaveBeenCalledTimes(1);

    const calledUrl = axios.get.mock.calls[0][0];
    expect(calledUrl).toContain("page=1");
    expect(calledUrl).toContain("descending=true");
    expect(calledUrl).toContain("category=Design");
    expect(calledUrl).not.toContain("location=");
  });

  it("monta a URL sem category quando keyword está vazia", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        results: [],
      },
    });

    await theMuseAdapter.search("", BASE_CONFIG);

    expect(axios.get).toHaveBeenCalledTimes(1);

    const calledUrl = axios.get.mock.calls[0][0];
    expect(calledUrl).toContain("page=1");
    expect(calledUrl).toContain("descending=true");
    expect(calledUrl).toContain("location=Brasil");
    expect(calledUrl).not.toContain("category=");
  });

  it("lança erro quando a requisição falha", async () => {
    axios.get.mockRejectedValueOnce(new Error("falha themuse"));

    await expect(theMuseAdapter.search("Design", BASE_CONFIG)).rejects.toThrow(
      "falha themuse",
    );
  });
});
