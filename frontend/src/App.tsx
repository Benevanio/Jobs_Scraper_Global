import { JobsFiltersCard } from "@/components/JobsFiltersCard";
import { JobsHeaderCard } from "@/components/JobsHeaderCard";
import { JobsTableCard } from "@/components/JobsTableCard";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useJobsData } from "@/hooks/useJobsData";
import { useJobsFiltering } from "@/hooks/useJobsFiltering";
import { useJobsPagination } from "@/hooks/useJobsPagination";
import { useTheme } from "@/hooks/useTheme";
import type { JobsMeta } from "@/types/jobs";
import { useCallback, type SetStateAction } from "react";

function formatDate(timestamp: JobsMeta["modifiedAt"]): string {
  if (!timestamp) {
    return "-";
  }
  return new Date(timestamp).toLocaleString("pt-BR");
}

function App() {
  const { resolvedTheme, toggleTheme } = useTheme();

  const { files, selectedFile, setSelectedFile, jobs, meta, loading, error, loadJobs } = useJobsData();

  const { search, setSearch, keywordFilter, setKeywordFilter, keywords, filteredJobs } = useJobsFiltering(jobs);

  const { currentPage, setCurrentPage, pageSize, setPageSize, resetPagination, totalPages, paginatedJobs } =
    useJobsPagination({
      filteredJobs,
    });

  const handleSearchChange = useCallback(
    (value: SetStateAction<string>) => {
      setSearch((previous) => (typeof value === "function" ? value(previous) : value));
      resetPagination();
    },
    [setSearch, resetPagination],
  );

  const handleKeywordFilterChange = useCallback(
    (value: SetStateAction<string>) => {
      setKeywordFilter((previous) => (typeof value === "function" ? value(previous) : value));
      resetPagination();
    },
    [setKeywordFilter, resetPagination],
  );

  const handleSelectedFileChange = useCallback(
    (value: SetStateAction<string>) => {
      setSelectedFile((previous) => (typeof value === "function" ? value(previous) : value));
      resetPagination();
    },
    [setSelectedFile, resetPagination],
  );

  const handlePageSizeChange = useCallback(
    (value: number) => {
      setPageSize(value);
      resetPagination();
    },
    [setPageSize, resetPagination],
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8 transition-colors duration-300 md:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(236,195,117,0.35),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(92,151,191,0.28),transparent_35%),radial-gradient(circle_at_50%_95%,rgba(201,120,99,0.22),transparent_40%)] dark:bg-[radial-gradient(circle_at_20%_15%,rgba(240,180,95,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(92,151,191,0.18),transparent_35%),radial-gradient(circle_at_50%_95%,rgba(201,120,99,0.15),transparent_40%)]" />

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <JobsHeaderCard meta={meta} actions={<ThemeToggle theme={resolvedTheme} onToggle={toggleTheme} />} />

        <JobsFiltersCard
          search={search}
          setSearch={handleSearchChange}
          keywordFilter={keywordFilter}
          setKeywordFilter={handleKeywordFilterChange}
          keywords={keywords}
          selectedFile={selectedFile}
          setSelectedFile={handleSelectedFileChange}
          files={files}
          loading={loading}
          onRefresh={() => loadJobs(selectedFile)}
        />

        <JobsTableCard
          meta={meta}
          filteredJobs={filteredJobs}
          paginatedJobs={paginatedJobs}
          jobs={jobs}
          loading={loading}
          error={error}
          formatDate={formatDate}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </section>
    </main>
  );
}

export default App;
