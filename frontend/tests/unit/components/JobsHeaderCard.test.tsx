import { JobsHeaderCard } from "@/components/JobsHeaderCard";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({ resolvedTheme: "light", toggleTheme: vi.fn() }),
}));

describe("JobsHeaderCard", () => {
  it("renderiza logo acessivel e descricao", () => {
    render(<JobsHeaderCard />);

    expect(
      screen.getByAltText(/painel de vagas/i)
    ).toBeInTheDocument();

    // texto quebrado + acento corrigido
    expect(
      screen.getByText(/leitura automática dos arquivos/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/xlsx gerados em output/i)
    ).toBeInTheDocument();
  });

  it("renderiza o botao de alternar tema", () => {
    render(<JobsHeaderCard />);

    const buttons = screen.getAllByRole("button", {
      name: /ativar tema escuro/i,
    });

    expect(buttons.length).toBeGreaterThan(0);
  });
});