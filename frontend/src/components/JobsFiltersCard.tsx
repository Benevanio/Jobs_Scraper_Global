import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { JobFile } from "@/types/jobs";
import { RefreshCcw, Search } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

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
}: JobsFiltersCardProps) {
  return (
    <Card className="border-border/70 bg-card/85 backdrop-blur dark:bg-card/95">
      <CardContent className="grid gap-3 pt-6 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            placeholder="Buscar por titulo, empresa, local ou link"
          />
        </div>

        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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

        <div className="flex gap-2">
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={selectedFile}
            onChange={(event) => setSelectedFile(event.target.value)}
          >
            {files.map((file) => (
              <option key={file.file} value={file.file}>
                {file.file}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
