import { existsSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, it } from "vitest";
import { exportToExcel, exportToPDF } from "../../../src/exporter.js";

describe("exporter", () => {
  const created = [];

  afterEach(() => {
    created.length = 0;
  });

  it("gera arquivo xlsx", () => {
    const dir = mkdtempSync(join(tmpdir(), "jobs-export-"));
    const file = join(dir, "out", "vagas.xlsx");
    created.push(file);

    exportToExcel([{ titulo: "Dev", empresa: "ACME" }], file);

    expect(existsSync(file)).toBe(true);
  });

  it("gera arquivo pdf", async () => {
    const dir = mkdtempSync(join(tmpdir(), "jobs-export-"));
    const file = join(dir, "out", "vagas.pdf");
    created.push(file);

    await exportToPDF([{ titulo: "Dev", empresa: "ACME", local: "BR", link: "" }], file);

    expect(existsSync(file)).toBe(true);
  });
});
