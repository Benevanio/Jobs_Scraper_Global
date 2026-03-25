import { beforeEach, describe, expect, it, vi } from "vitest";

describe("withRequestDedup", () => {
  let withRequestDedup;

  beforeEach(async () => {
    vi.resetModules();
    ({ withRequestDedup } =
      await import("../../../../src/pipeline/requestDedup.js"));
  });

  it("executa a função e retorna o resultado quando não há request em andamento", async () => {
    const fn = vi.fn().mockResolvedValue("ok");

    const result = await withRequestDedup("jobs:react", fn);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(result).toBe("ok");
  });

  it("reutiliza a request em andamento quando a mesma key já está em andamento", async () => {
    let resolvePromise;
    const fn = vi.fn(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
    );

    const promise1 = withRequestDedup("jobs:react", fn);
    const promise2 = withRequestDedup("jobs:react", fn);

    expect(fn).toHaveBeenCalledTimes(1);

    resolvePromise("resultado compartilhado");

    await expect(promise1).resolves.toBe("resultado compartilhado");
    await expect(promise2).resolves.toBe("resultado compartilhado");
  });

  it("remove a key do inflight após resolver, permitindo nova execução", async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce("primeira execução")
      .mockResolvedValueOnce("segunda execução");

    const result1 = await withRequestDedup("jobs:react", fn);
    const result2 = await withRequestDedup("jobs:react", fn);

    expect(result1).toBe("primeira execução");
    expect(result2).toBe("segunda execução");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("remove a key do inflight após rejeição, permitindo nova tentativa", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("falha"))
      .mockResolvedValueOnce("recuperado");

    await expect(withRequestDedup("jobs:react", fn)).rejects.toThrow("falha");

    const result = await withRequestDedup("jobs:react", fn);

    expect(result).toBe("recuperado");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
