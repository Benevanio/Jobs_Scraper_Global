import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listen: vi.fn(),
  createJobsApiApp: vi.fn(),
  consoleLog: vi.fn(),
}));

mocks.createJobsApiApp.mockReturnValue({
  listen: mocks.listen,
});

vi.mock("../../../src/jobsApiApp.js", () => ({
  createJobsApiApp: mocks.createJobsApiApp,
}));

describe("server entry", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.PORT = "3100";
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
});
