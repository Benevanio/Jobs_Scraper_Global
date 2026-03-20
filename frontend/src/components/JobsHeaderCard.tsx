import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { JobsMeta } from "@/types/jobs";
import { BriefcaseBusiness, FileSpreadsheet } from "lucide-react";
import type { ReactNode } from "react";

interface JobsHeaderCardProps {
  meta: JobsMeta;
  actions?: ReactNode;
}

export function JobsHeaderCard({ meta, actions }: JobsHeaderCardProps) {
  return (
    <Card className="border-border/70 bg-card/85 backdrop-blur dark:bg-card/95">
      <CardHeader className="gap-4 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-3xl">Painel de Vagas</CardTitle>
          <CardDescription>Leitura automatica dos arquivos XLSX gerados em output.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <Badge variant="secondary" className="gap-1 text-xs">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {meta.file || "Sem arquivo"}
          </Badge>
          <Badge className="gap-1 text-xs">
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            {meta.total} vagas
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
}
