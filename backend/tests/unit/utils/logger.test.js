import { describe, expect, it, vi } from "vitest";
import { logError, logInfo, logWarn } from "../../../src/logger.js";

describe("logger", () => {
  it("logInfo escreve no console", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logInfo("mensagem");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("mensagem"));
    spy.mockRestore();
  });

  it("logWarn escreve no console", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logWarn("atencao");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("atencao"));
    spy.mockRestore();
  });

  it("logError escreve no console", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logError("falha");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("falha"));
    spy.mockRestore();
  });
});
