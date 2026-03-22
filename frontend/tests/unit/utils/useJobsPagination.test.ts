import { useJobsPagination } from "@/hooks/useJobsPagination";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const JOBS = Array.from({ length: 5 }).map((_, index) => ({ titulo: `Job ${index}` }));

describe("useJobsPagination", () => {
  it("calcula paginas e lista paginada", () => {
    const { result } = renderHook(() => useJobsPagination({ filteredJobs: JOBS, initialPageSize: 2 }));
    expect(result.current.totalPages).toBe(3);
    expect(result.current.paginatedJobs).toHaveLength(2);
  });

  it("nao permite pagina menor que 1", () => {
    const { result } = renderHook(() => useJobsPagination({ filteredJobs: JOBS, initialPageSize: 2 }));
    result.current.setCurrentPage(0);
    expect(result.current.currentPage).toBe(1);
  });
});
