import { JobsTableCard } from "@/components/JobsTableCard";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const baseProps = {
  meta: { file: "vagas.xlsx", modifiedAt: 1, total: 1 },
  filteredJobs: [
    {
      titulo: "Dev",
      empresa: "ACME",
      local: "BR",
      palavra: "JavaScript, UX-UI",
      source: "LinkedIn",
      link: "https://x",
    },
  ],
  paginatedJobs: [
    {
      titulo: "Dev",
      empresa: "ACME",
      local: "BR",
      palavra: "JavaScript, UX-UI",
      source: "LinkedIn",
      link: "https://x",
    },
  ],
  jobs: [{ titulo: "Dev" }],
  loading: false,
  error: "",
  formatDate: () => "agora",
  currentPage: 1,
  totalPages: 2,
  pageSize: 25,
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
};

describe("JobsTableCard", () => {
  it("renderiza tabela com palavras-chave em tags e colunas de spam e lido", () => {
    render(<JobsTableCard {...baseProps} />);

    expect(screen.getByText("Vagas Encontradas")).toBeInTheDocument();
    expect(screen.getByText("Abrir vaga")).toBeInTheDocument();
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("UX-UI")).toBeInTheDocument();
    expect(screen.getByText(/spam/i)).toBeInTheDocument();
    expect(screen.getByText(/lido/i)).toBeInTheDocument();
  });

  it("aciona paginacao", () => {
    render(<JobsTableCard {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Proxima" }));
    expect(baseProps.onPageChange).toHaveBeenCalled();
  });

  it("permite marcar a vaga como spam e lida", () => {
    render(<JobsTableCard {...baseProps} />);

    const spamButton = screen.getByLabelText(/marcar vaga como spam/i);
    const readButton = screen.getByLabelText(/marcar vaga como lida/i);

    fireEvent.click(spamButton);
    fireEvent.click(readButton);

    expect(spamButton).toHaveAttribute("aria-pressed", "true");
    expect(readButton).toHaveAttribute("aria-pressed", "true");
  });

  it("exibe mensagem de erro quando error esta preenchido", () => {
    render(<JobsTableCard {...baseProps} error="falha ao carregar" />);
    expect(screen.getByText("falha ao carregar")).toBeInTheDocument();
  });

  it("mostra estado vazio quando nao ha vagas filtradas", () => {
    render(
      <JobsTableCard
        {...baseProps}
        filteredJobs={[]}
        paginatedJobs={[]}
        jobs={[]}
        currentPage={1}
        totalPages={1}
        loading={false}
      />,
    );

    expect(screen.getByText(/Nenhuma vaga encontrada/i)).toBeInTheDocument();
  });
});
