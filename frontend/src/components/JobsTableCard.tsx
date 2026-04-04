import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Job, JobsMeta } from "@/types/jobs";
import { useState } from "react";
import { FiCheckSquare, FiSquare } from "react-icons/fi";

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

type StatusToggleButtonProps = {
  label: string;
  pressed: boolean;
  activeClassName: string;
  onClick: () => void;
};

const PAGE_SIZE_OPTIONS = [15, 25, 50, 100];

function getJobId(job: Job, index: number) {
  return job.link?.trim() || [job.titulo, job.empresa, job.local, String(index)].filter(Boolean).join("|");
}

function getKeywordTags(keywordValue?: string | null) {
  if (!keywordValue) {
    return [];
  }

  return keywordValue
    .split(/[,;|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function StatusToggleButton({ label, pressed, activeClassName, onClick }: StatusToggleButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
        pressed ? activeClassName : "text-slate-400 hover:text-[#0c6b35]",
      )}
    >
      {pressed ? <FiCheckSquare className="h-5 w-5" aria-hidden="true" /> : <FiSquare className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}

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
  const [spamMarks, setSpamMarks] = useState<Record<string, boolean>>({});
  const [readMarks, setReadMarks] = useState<Record<string, boolean>>({});

  return (
    <Card className="mb-4 border-border/70 bg-card/90 backdrop-blur dark:bg-card/95">
      <CardHeader>
        <CardTitle className="text-lg">Vagas Encontradas</CardTitle>
        <CardDescription>
          Atualizado em {formatDate(meta.modifiedAt)}. Mostrando {filteredJobs.length} de {jobs.length} vagas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
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
              <TableHead>Titulo</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Palavras chaves</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.16em]">Spam</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.16em]">Lido</TableHead>
              <TableHead>Fonte</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedJobs.map((job, index) => {
              const jobId = getJobId(job, index);
              const keywords = getKeywordTags(job.palavra);
              const isSpamMarked = Boolean(spamMarks[jobId]);
              const isReadMarked = Boolean(readMarks[jobId]);

              return (
                <TableRow key={jobId}>
                  <TableCell className="font-medium">{job.titulo || "-"}</TableCell>
                  <TableCell>{job.empresa || "-"}</TableCell>
                  <TableCell>{job.local || "-"}</TableCell>
                  <TableCell>
                    {job.link ? (
                      <a
                        href={job.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline-offset-4 hover:underline dark:text-[#14AE5C]"
                      >
                        Abrir vaga
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {keywords.length > 0 ? (
                      <div className="flex flex-wrap gap-1 text-sm text-foreground/85">
                        {keywords.map((keyword, keywordIndex) => (
                          <div key={`${jobId}-${keyword}`} className="flex items-center">
                            <span>{keyword}</span>
                            {keywordIndex < keywords.length - 1 ? <span aria-hidden="true">,&nbsp;</span> : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center align-middle">
                    <StatusToggleButton
                      label={`Marcar vaga como spam para ${job.titulo || "vaga"}`}
                      pressed={isSpamMarked}
                      activeClassName="text-[#0c6b35]"
                      onClick={() => setSpamMarks((current) => ({ ...current, [jobId]: !current[jobId] }))}
                    />
                  </TableCell>
                  <TableCell className="text-center align-middle">
                    <StatusToggleButton
                      label={`Marcar vaga como lida para ${job.titulo || "vaga"}`}
                      pressed={isReadMarked}
                      activeClassName="text-[#0c6b35]"
                      onClick={() => setReadMarks((current) => ({ ...current, [jobId]: !current[jobId] }))}
                    />
                  </TableCell>
                  <TableCell>
                    {job.source ? (
                      <Badge variant="secondary" className="border-border/60 bg-muted text-foreground">
                        {job.source}
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              );
            })}

            {!loading && filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
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
