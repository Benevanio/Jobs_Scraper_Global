import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getConfigMock: vi.fn(() => ({
    searchLocation: "Brasil",
    keywords: ["React"],
    outputFile: "output/a.xlsx",
    pdfFile: "output/a.pdf",
  })),
  searchJobsWithCacheMock: vi.fn(async () => ({
    jobs: [{ titulo: "Dev", palavra: "React" }],
    total: 1,
    fromCache: false,
  })),
  exportToExcelMock: vi.fn(),
  exportToPDFMock: vi.fn(async () => {}),
  logInfoMock: vi.fn(),
  sourcesMock: [{ sourceName: "linkedin" }],
}));

vi.mock("../../../src/config.js", () => ({ getConfig: mocks.getConfigMock }));
vi.mock("../../../src/db/keywordsStore.js", () => ({
  loadKeywords: vi.fn(async (fallback = []) => fallback),
}));
vi.mock("../../../src/pipeline/searchJobsWithCache.js", () => ({
  searchJobsWithCache: mocks.searchJobsWithCacheMock,
}));
vi.mock("../../../src/sources/index.js", () => ({
  sources: mocks.sourcesMock,
}));
vi.mock("../../../src/exporter.js", () => ({
  exportToExcel: mocks.exportToExcelMock,
  exportToPDF: mocks.exportToPDFMock,
}));
vi.mock("../../../src/logger.js", () => ({ logInfo: mocks.logInfoMock }));

import { run } from "../../../src/app.js";

describe("run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("orquestra coleta e exportacao", async () => {
    await run();

    expect(mocks.getConfigMock).toHaveBeenCalledTimes(1);
    expect(mocks.searchJobsWithCacheMock).toHaveBeenCalledTimes(1);
    expect(mocks.exportToExcelMock).toHaveBeenCalledWith(
      [{ titulo: "Dev", palavra: "React" }],
      "output/a.xlsx",
    );
    expect(mocks.exportToPDFMock).toHaveBeenCalledWith(
      [{ titulo: "Dev", palavra: "React" }],
      "output/a.pdf",
    );
    expect(mocks.logInfoMock).toHaveBeenCalled();
    expect(mocks.logInfoMock).toHaveBeenCalledWith("Resultado do cache: MISS");
  });

  it("registra HIT quando o resultado vem do cache", async () => {
    mocks.searchJobsWithCacheMock.mockResolvedValueOnce({
      jobs: [{ titulo: "Dev", palavra: "React" }],
      total: 1,
      fromCache: true,
    });

    await run();

    expect(mocks.logInfoMock).toHaveBeenCalledWith("Resultado do cache: HIT");
  });
});
