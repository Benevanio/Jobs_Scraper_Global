import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { empregaCampinasAdapter } from "../../../../src/adapters/empregaCampinas.js";

vi.mock("axios");

describe("empregaCampinasAdapter", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("faz parse via RSS", async () => {
    axios.get.mockResolvedValueOnce({
      data: `
        <rss>
          <channel>
            <item>
              <title>Dev React Campinas</title>
              <link>https://www.empregacampinas.com.br/vaga-1</link>
              <description>Vaga remota híbrida</description>
              <pubDate>Tue, 25 Mar 2026 10:00:00 GMT</pubDate>
            </item>
          </channel>
        </rss>
      `,
    });

    const jobs = await empregaCampinasAdapter.search("React", {
      pageTimeoutMs: 1000,
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "Emprega Campinas",
      keyword: "React",
      titulo: "Dev React Campinas",
      link: "https://www.empregacampinas.com.br/vaga-1",
    });
  });

  it("faz fallback para HTML quando RSS falha", async () => {
    axios.get
      .mockRejectedValueOnce(new Error("rss error"))
      .mockResolvedValueOnce({
        data: `
          <article>
            <h2><a href="https://www.empregacampinas.com.br/vaga-2">Dev Node</a></h2>
          </article>
        `,
      });

    const jobs = await empregaCampinasAdapter.search("Node", {
      pageTimeoutMs: 1000,
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "Emprega Campinas",
      keyword: "Node",
      titulo: "Dev Node",
      link: "https://www.empregacampinas.com.br/vaga-2",
    });
  });
});
