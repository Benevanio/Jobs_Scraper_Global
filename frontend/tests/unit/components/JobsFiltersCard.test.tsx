import { JobsFiltersCard } from "@/components/JobsFiltersCard";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("JobsFiltersCard", () => {
  it("dispara callbacks de filtro e refresh", () => {
    const setSearch = vi.fn();
    const setKeywordFilter = vi.fn();
    const setSelectedFile = vi.fn();
    const onRefresh = vi.fn();

    render(
      <JobsFiltersCard
        search=""
        setSearch={setSearch}
        keywordFilter="all"
        setKeywordFilter={setKeywordFilter}
        keywords={["React"]}
        selectedFile="vagas.xlsx"
        setSelectedFile={setSelectedFile}
        files={[{ file: "vagas.xlsx" }]}
        loading={false}
        onRefresh={onRefresh}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/buscar/i), { target: { value: "node" } });
    fireEvent.click(screen.getByRole("button"));

    expect(setSearch).toHaveBeenCalled();
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("desabilita refresh e aplica spinner quando loading", () => {
    render(
      <JobsFiltersCard
        search=""
        setSearch={vi.fn()}
        keywordFilter="all"
        setKeywordFilter={vi.fn()}
        keywords={["React"]}
        selectedFile="vagas.xlsx"
        setSelectedFile={vi.fn()}
        files={[{ file: "vagas.xlsx" }]}
        loading
        onRefresh={vi.fn()}
      />,
    );

    const refreshButton = screen.getByRole("button");
    expect(refreshButton).toBeDisabled();

    const spinnerIcon = refreshButton.querySelector(".animate-spin");
    expect(spinnerIcon).not.toBeNull();
  });

  it("dispara mudancas nos filtros de keyword e arquivo", () => {
    const setKeywordFilter = vi.fn();
    const setSelectedFile = vi.fn();

    render(
      <JobsFiltersCard
        search=""
        setSearch={vi.fn()}
        keywordFilter="all"
        setKeywordFilter={setKeywordFilter}
        keywords={["React"]}
        selectedFile="vagas.xlsx"
        setSelectedFile={setSelectedFile}
        files={[{ file: "vagas.xlsx" }, { file: "historico.xlsx" }]}
        loading={false}
        onRefresh={vi.fn()}
      />,
    );

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "React" } });
    fireEvent.change(selects[1], { target: { value: "historico.xlsx" } });

    expect(setKeywordFilter).toHaveBeenCalled();
    expect(setSelectedFile).toHaveBeenCalled();
  });
});
