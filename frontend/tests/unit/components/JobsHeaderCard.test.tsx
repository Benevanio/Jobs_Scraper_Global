import { JobsHeaderCard } from "@/components/JobsHeaderCard";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({ resolvedTheme: "light", toggleTheme: vi.fn() }),
}));

describe("JobsHeaderCard", () => {
  it("renderiza logo acessível e descrição", () => {
    render(<JobsHeaderCard />);

    expect(screen.getByAltText("Painel de Vagas")).toBeInTheDocument();

    expect(
      screen.getByText(/leitura automática dos arquivos.*xlsx gerados em output/i)
    ).toBeInTheDocument();
  });

  it("renderiza o botão de alternar tema", () => {
    render(<JobsHeaderCard />);

    const buttons = screen.getAllByRole("button", {
      name: /ativar tema escuro/i,
    });

    expect(buttons).toHaveLength(2);
  });
});