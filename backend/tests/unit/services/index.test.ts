import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  run: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("../../../src/app.js", () => ({
  run: mocks.run,
}));

vi.mock("../../../src/logger.js", () => ({
  logError: mocks.logError,
}));

describe("index entry", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.exitCode = 0;
  });

  it("chama run na inicializacao", async () => {
    mocks.run.mockResolvedValue(undefined);

    await import("../../../index.js");
    expect(mocks.run).toHaveBeenCalledTimes(1);
  });

  it("registra erro quando run falha", async () => {
    mocks.run.mockRejectedValue(new Error("boom"));

    await import("../../../index.js");
    await Promise.resolve();

    expect(mocks.logError).toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it("usa message quando stack nao existe", async () => {
    mocks.run.mockRejectedValue({ message: "falha-sem-stack" });

    await import("../../../index.js");
    await Promise.resolve();

    expect(mocks.logError).toHaveBeenCalledWith("falha-sem-stack");
    expect(process.exitCode).toBe(1);
  });

  it("usa fallback padrao quando erro e indefinido", async () => {
    mocks.run.mockRejectedValue(undefined);

    await import("../../../index.js");
    await Promise.resolve();

    expect(mocks.logError).toHaveBeenCalledWith("Falha inesperada na execucao");
    expect(process.exitCode).toBe(1);
  });
});
