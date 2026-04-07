import path from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listen: vi.fn(),
  use: vi.fn(),
  set: vi.fn(),
  createJobsApiApp: vi.fn(),
  consoleLog: vi.fn(),
  existsSync: vi.fn(),
  staticMiddleware: vi.fn(),
  expressStatic: vi.fn(),
  swaggerServe: vi.fn(),
  swaggerSetup: vi.fn(() => vi.fn()),
}));

mocks.createJobsApiApp.mockReturnValue({
  listen: mocks.listen,
  use: mocks.use,
  set: mocks.set,
});

mocks.expressStatic.mockReturnValue(mocks.staticMiddleware);

vi.mock("dotenv/config", () => ({}));

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

vi.mock("swagger-ui-express", () => ({
  default: {
    serve: mocks.swaggerServe,
    setup: mocks.swaggerSetup,
  },
}));

vi.mock("../../../src/swagger.js", () => ({
  default: {},
}));

async function importServerEntry() {
  await import("../../../src/server.js");
  await vi.dynamicImportSettled();
  await Promise.resolve();
}

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
    await importServerEntry();

    expect(mocks.createJobsApiApp).toHaveBeenCalledTimes(1);
    expect(mocks.set).toHaveBeenCalledWith("trust proxy", 1);
    expect(mocks.listen).toHaveBeenCalled();    expect(mocks.listen.mock.calls[0][0]).toBe(3100);
    expect(typeof mocks.listen.mock.calls[0][1]).toBe("function");

    const onListen = mocks.listen.mock.calls[0][1];
    onListen();
    expect(mocks.consoleLog).toHaveBeenCalledWith("API de vagas rodando em http://localhost:3100");
  });

  it("usa porta padrao quando PORT nao definido", async () => {
    delete process.env.PORT;

    await importServerEntry();

    expect(mocks.listen).toHaveBeenCalled();
    expect(mocks.listen.mock.calls[0][0]).toBe(3001);
  });

  it("usa ELECTRON_OUTPUT_DIR quando definido", async () => {
    process.env.ELECTRON_OUTPUT_DIR = "/tmp/electron-output";

    await importServerEntry();

    expect(mocks.createJobsApiApp).toHaveBeenCalledWith({
      outputDir: "/tmp/electron-output",
    });
  });

  it("registra static e fallback SPA quando ELECTRON_STATIC_DIR existe", async () => {
    process.env.ELECTRON_STATIC_DIR = "/tmp/frontend-dist";
    mocks.existsSync.mockReturnValue(true);

    await importServerEntry();

    expect(mocks.expressStatic).toHaveBeenCalledWith("/tmp/frontend-dist");

    const calls = mocks.use.mock.calls;
    expect(calls.some(([arg1]) => arg1 === mocks.staticMiddleware)).toBe(true);
    expect(calls.some(([arg1]) => arg1 === "/docs")).toBe(true);

    const fallbackCall = calls.find(([arg1]) => typeof arg1 === "function" && arg1 !== mocks.staticMiddleware);
    expect(fallbackCall).toBeTruthy();

    const fallbackHandler = fallbackCall[0];

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
