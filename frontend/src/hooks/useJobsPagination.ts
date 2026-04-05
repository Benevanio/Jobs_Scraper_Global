import type { Job } from "@/types/jobs";
import { useMemo, useState } from "react";

interface UseJobsPaginationParams {
  filteredJobs: Job[];
  initialPageSize?: number;
}

function clampPageSize(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(10, Math.max(1, Math.trunc(value)));
}

export function useJobsPagination({
  filteredJobs,
  initialPageSize = 4,
}: UseJobsPaginationParams) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(clampPageSize(initialPageSize));

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  }, [filteredJobs.length, pageSize]);

  const currentPage = Math.min(page, totalPages);

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage, pageSize]);

  function setCurrentPage(value: number | ((previous: number) => number)) {
    setPage((previous) => {
      const next = typeof value === "function" ? value(previous) : value;
      return Math.max(1, next);
    });
  }

  function setPageSize(value: number | ((previous: number) => number)) {
    setPageSizeState((previous) => {
      const next = typeof value === "function" ? value(previous) : value;
      return clampPageSize(next);
    });
  }

  function resetPagination() {
    setPage(1);
  }

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    resetPagination,
    totalPages,
    paginatedJobs,
  };
}
