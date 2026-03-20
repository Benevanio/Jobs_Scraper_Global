import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Job, JobsMeta } from "@/types/jobs";

interface JobsTableCardProps {
  meta: JobsMeta;
  filteredJobs: Job[];
  paginatedJobs: Job[];
  jobs: Job[];
  loading: boolean;
  error: string;
  formatDate: (timestamp: JobsMeta["modifiedAt"]) => string;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [15, 25, 50, 100];

export function JobsTableCard({
  meta,
  filteredJobs,
  paginatedJobs,
  jobs,
  loading,
  error,
  formatDate,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: JobsTableCardProps) {
  return (
    <Card className="border-border/70 bg-card/90 backdrop-blur dark:bg-card/95">
      <CardHeader>
        <CardTitle className="text-lg">Vagas Encontradas</CardTitle>
        <CardDescription>
          Atualizado em {formatDate(meta.modifiedAt)}. Mostrando {filteredJobs.length} de {jobs.length} vagas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Pagina {currentPage} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground" htmlFor="page-size">
              Itens por pagina
            </label>
            <select
              id="page-size"
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
            >
              Proxima
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Palavra-chave</TableHead>
              <TableHead>Titulo</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedJobs.map((job, index) => (
              <TableRow key={`${job.link || `${job.titulo || "vaga"}-${index}`}-${index}`}>
                <TableCell>{job.palavra || "-"}</TableCell>
                <TableCell className="font-medium">{job.titulo || "-"}</TableCell>
                <TableCell>{job.empresa || "-"}</TableCell>
                <TableCell>{job.local || "-"}</TableCell>
                <TableCell>
                  {job.link ? (
                    <a
                      href={job.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Abrir vaga
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            ))}

            {!loading && filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Nenhuma vaga encontrada com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
