import { useJobsFiltering } from "@/hooks/useJobsFiltering";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const JOBS = [
  { palavra: "React", titulo: "Frontend", empresa: "ACME", local: "Remoto", link: "a" },
  { palavra: "Node", titulo: "Backend", empresa: "Globex", local: "SP", link: "b" },
];

describe("useJobsFiltering", () => {
  it("lista keywords ordenadas", () => {
    const { result } = renderHook(() => useJobsFiltering(JOBS));
    expect(result.current.keywords).toEqual(["Node", "React"]);
  });

  it("filtra por termo de busca", () => {
    const { result } = renderHook(() => useJobsFiltering(JOBS));
    act(() => {
      result.current.setSearch("backend");
    });
    expect(result.current.filteredJobs).toHaveLength(1);
    expect(result.current.filteredJobs[0].titulo).toBe("Backend");
  });

  it("permite selecionar varias palavras-chave ao mesmo tempo", () => {
    const { result } = renderHook(() => useJobsFiltering(JOBS));

    act(() => {
      result.current.setKeywordFilter(["React", "Node"]);
    });

    expect(result.current.filteredJobs).toHaveLength(2);

    act(() => {
      result.current.setKeywordFilter(["React"]);
    });

    expect(result.current.filteredJobs).toHaveLength(1);
    expect(result.current.filteredJobs[0].titulo).toBe("Frontend");
  });
});
