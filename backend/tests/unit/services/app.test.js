import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getConfigMock: vi.fn(() => ({
    searchLocation: "Brasil",
    keywords: ["React"],
    outputFile: "output/a.xlsx",
    pdfFile: "output/a.pdf",
  })),
  scrapeLinkedinJobsMock: vi.fn(async () => [{ titulo: "Dev" }]),
  exportToExcelMock: vi.fn(),
  exportToPDFMock: vi.fn(async () => {}),
  logInfoMock: vi.fn(),
}));

vi.mock("../../../src/config.js", () => ({ getConfig: mocks.getConfigMock }));
vi.mock("../../../src/linkedinScraper.js", () => ({ scrapeLinkedinJobs: mocks.scrapeLinkedinJobsMock }));
vi.mock("../../../src/exporter.js", () => ({ exportToExcel: mocks.exportToExcelMock, exportToPDF: mocks.exportToPDFMock }));
vi.mock("../../../src/logger.js", () => ({ logInfo: mocks.logInfoMock }));

import { run } from "../../../src/app.js";

describe("run", () => {
  it("orquestra coleta e exportacao", async () => {
    await run();

    expect(mocks.getConfigMock).toHaveBeenCalledTimes(1);
    expect(mocks.scrapeLinkedinJobsMock).toHaveBeenCalledTimes(1);
    expect(mocks.exportToExcelMock).toHaveBeenCalledWith([{ titulo: "Dev" }], "output/a.xlsx");
    expect(mocks.exportToPDFMock).toHaveBeenCalledWith([{ titulo: "Dev" }], "output/a.pdf");
    expect(mocks.logInfoMock).toHaveBeenCalled();
  });
});
