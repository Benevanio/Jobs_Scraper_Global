import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  existsSync: vi.fn(),
  launch: vi.fn(async () => ({ pid: 1 })),
}));

vi.mock("node:fs", () => ({
  existsSync: mocks.existsSync,
}));

vi.mock("puppeteer-core", () => ({
  default: {
    launch: mocks.launch,
  },
}));

describe("browser", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.CHROME_PATH;
    delete process.env.PUPPETEER_EXECUTABLE_PATH;
  });

  it("retorna executavel encontrado", async () => {
    process.env.CHROME_PATH = "C:/chrome.exe";
    mocks.existsSync.mockImplementation((path) => path === "C:/chrome.exe");

    const { findBrowserExecutable } = await import("../../../src/browser.js");
    expect(findBrowserExecutable()).toBe("C:/chrome.exe");
  });

  it("abre navegador com o executavel encontrado", async () => {
    process.env.CHROME_PATH = "C:/chrome.exe";
    mocks.existsSync.mockImplementation((path) => path === "C:/chrome.exe");

    const { openBrowser } = await import("../../../src/browser.js");
    await openBrowser({ headless: true });

    expect(mocks.launch).toHaveBeenCalledWith({
      headless: true,
      executablePath: "C:/chrome.exe",
    });
  });

  it("lanca erro quando nao encontra navegador", async () => {
    mocks.existsSync.mockReturnValue(false);

    const { openBrowser } = await import("../../../src/browser.js");
    await expect(openBrowser({ headless: true })).rejects.toThrow("Nenhum Chrome/Edge foi encontrado");
  });
});
