import { JobsHeaderCard } from "@/components/JobsHeaderCard";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("JobsHeaderCard", () => {
  it("exibe metadados e acoes", () => {
    render(
      <JobsHeaderCard
        meta={{ file: "vagas.xlsx", modifiedAt: Date.now(), total: 42 }}
        actions={<button type="button">acao</button>}
      />,
    );

    expect(screen.getByText("Painel de Vagas")).toBeInTheDocument();
    expect(screen.getByText("vagas.xlsx")).toBeInTheDocument();
    expect(screen.getByText("42 vagas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "acao" })).toBeInTheDocument();
  });

  it("usa fallback de arquivo quando meta.file esta vazio", () => {
    render(<JobsHeaderCard meta={{ file: "", modifiedAt: Date.now(), total: 0 }} />);

    expect(screen.getByText("Sem arquivo")).toBeInTheDocument();
    expect(screen.getByText("0 vagas")).toBeInTheDocument();
  });
});
