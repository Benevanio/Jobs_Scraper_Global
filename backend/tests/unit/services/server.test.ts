import path from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listen: vi.fn(),
  use: vi.fn(),
  createJobsApiApp: vi.fn(),
  consoleLog: vi.fn(),
  existsSync: vi.fn(),
  staticMiddleware: vi.fn(),
  expressStatic: vi.fn(),
}));

mocks.createJobsApiApp.mockReturnValue({
  listen: mocks.listen,
  use: mocks.use,
});

mocks.expressStatic.mockReturnValue(mocks.staticMiddleware);

vi.mock("../../../src/jobsApiApp.js", () => ({
  createJobsApiApp: mocks.createJobsApiApp,
}));

vi.mock("fs", () => ({
  existsSync: mocks.existsSync,
}));

vi.mock("express", () => ({
  default: {
    static: mocks.expressStatic,
  },
}));

describe("server entry", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.PORT = "3100";
    delete process.env.ELECTRON_STATIC_DIR;
    delete process.env.ELECTRON_OUTPUT_DIR;
    mocks.existsSync.mockReturnValue(false);
    vi.spyOn(console, "log").mockImplementation(mocks.consoleLog);
  });

  it("inicializa app e chama listen", async () => {
    await import("../../../src/server.js");

    expect(mocks.createJobsApiApp).toHaveBeenCalledTimes(1);
    expect(mocks.listen).toHaveBeenCalledTimes(1);
    expect(mocks.listen).toHaveBeenCalledWith(3100, expect.any(Function));

    const onListen = mocks.listen.mock.calls[0][1];
    onListen();
    expect(mocks.consoleLog).toHaveBeenCalledWith("API de vagas rodando em http://localhost:3100");
  });

  it("usa porta padrao quando PORT nao definido", async () => {
    delete process.env.PORT;

    await import("../../../src/server.js");

    expect(mocks.listen).toHaveBeenCalledWith(3001, expect.any(Function));
  });

  it("usa ELECTRON_OUTPUT_DIR quando definido", async () => {
    process.env.ELECTRON_OUTPUT_DIR = "/tmp/electron-output";

    await import("../../../src/server.js");

    expect(mocks.createJobsApiApp).toHaveBeenCalledWith({
      outputDir: "/tmp/electron-output",
    });
  });

  it("registra static e fallback SPA quando ELECTRON_STATIC_DIR existe", async () => {
    process.env.ELECTRON_STATIC_DIR = "/tmp/frontend-dist";
    mocks.existsSync.mockReturnValue(true);

    await import("../../../src/server.js");

    expect(mocks.expressStatic).toHaveBeenCalledWith("/tmp/frontend-dist");
    expect(mocks.use).toHaveBeenCalledTimes(2);
    expect(mocks.use).toHaveBeenNthCalledWith(1, mocks.staticMiddleware);

    const fallbackHandler = mocks.use.mock.calls[1][0];

    const apiRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      sendFile: vi.fn(),
    };
    fallbackHandler({ path: "/api/unknown" }, apiRes);
    expect(apiRes.status).toHaveBeenCalledWith(404);
    expect(apiRes.json).toHaveBeenCalledWith({ error: "Rota não encontrada." });
    expect(apiRes.sendFile).not.toHaveBeenCalled();

    const pageRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      sendFile: vi.fn(),
    };
    fallbackHandler({ path: "/dashboard" }, pageRes);
    expect(pageRes.sendFile).toHaveBeenCalledWith(path.join("/tmp/frontend-dist", "index.html"));
    expect(pageRes.status).not.toHaveBeenCalled();
  });
});
