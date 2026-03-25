import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { JobFile } from "@/types/jobs";
import { Search } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { JobsMeta } from "@/types/jobs";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

import { BriefcaseBusiness, FileSpreadsheet } from "lucide-react";
interface JobsFiltersCardProps {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  keywordFilter: string;
  setKeywordFilter: Dispatch<SetStateAction<string>>;
  keywords: string[];
  selectedFile: string;
  setSelectedFile: Dispatch<SetStateAction<string>>;
  files: JobFile[];
  loading: boolean;
  onRefresh: () => void;
  meta: JobsMeta;
  actions?: ReactNode;
}

export function JobsFiltersCard({
  search,
  setSearch,
  keywordFilter,
  setKeywordFilter,
  keywords,
  selectedFile,
  setSelectedFile,
  files,
  loading,
  onRefresh,
  meta,
  actions,
}: JobsFiltersCardProps) {
  return (
    <Card className="border-border/70 bg-card/85 backdrop-blur dark:bg-card/95">
      <CardContent className="flex flex-col gap-3 pt-6">
        {/* Campo de busca */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9 w-full"
              placeholder="Buscar por titulo, empresa, local ou link"
            />
          </div>
          <div className="flex items-center gap-2">{actions}</div>
        </div>

        {/* Seção de filtros */}
        <div className="flex items-center gap-2 flex">
          <select
            className="h-10  rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            value={keywordFilter}
            onChange={(event) => setKeywordFilter(event.target.value)}
          >
            <option value="all">Todas as palavras-chave</option>
            {keywords.map((keyword) => (
              <option key={keyword} value={keyword}>
                {keyword}
              </option>
            ))}
          </select>

          <div>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              value={selectedFile}
              onChange={(event) => setSelectedFile(event.target.value)}
            >
              {files.map((file) => (
                <option key={file.file} value={file.file}>
                  {file.file}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 text-xs">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {meta.file || "Sem arquivo"}
            </Badge>
            <Badge className="gap-1 text-xs">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              {meta.total} vagas
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
