import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({ resolvedTheme: "light", toggleTheme: vi.fn() }),
}));

vi.mock("@/hooks/useJobsData", () => ({
  useJobsData: () => ({
    files: [{ file: "vagas.xlsx" }],
    selectedFile: "vagas.xlsx",
    setSelectedFile: vi.fn(),
    jobs: [{ titulo: "Dev", empresa: "ACME", local: "BR", palavra: "React", link: "x" }],
    meta: { file: "vagas.xlsx", modifiedAt: 1, total: 1 },
    loading: false,
    error: "",
    loadJobs: vi.fn(),
  }),
}));

vi.mock("@/hooks/useJobsFiltering", () => ({
  useJobsFiltering: () => ({
    search: "",
    setSearch: vi.fn(),
    keywordFilter: "all",
    setKeywordFilter: vi.fn(),
    keywords: ["React"],
    filteredJobs: [{ titulo: "Dev", empresa: "ACME", local: "BR", palavra: "React", link: "x" }],
  }),
}));

vi.mock("@/hooks/useJobsPagination", () => ({
  useJobsPagination: () => ({
    currentPage: 1,
    setCurrentPage: vi.fn(),
    pageSize: 25,
    setPageSize: vi.fn(),
    resetPagination: vi.fn(),
    totalPages: 1,
    paginatedJobs: [{ titulo: "Dev", empresa: "ACME", local: "BR", palavra: "React", link: "x" }],
  }),
}));

import App from "@/App";

describe("App", () => {
  it("renderiza painel principal", () => {
    render(<App />);
    expect(screen.getByText("Painel de Vagas")).toBeInTheDocument();
  });
});
