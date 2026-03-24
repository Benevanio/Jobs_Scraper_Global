export interface Job {
  palavra?: string | null;
  titulo?: string | null;
  empresa?: string | null;
  source?: string | null;
  local?: string | null;
  link?: string | null;
}

export interface JobFile {
  file: string;
}

export interface JobsMeta {
  file: string;
  modifiedAt: string | number | null;
  total: number;
}

export interface JobsResponse {
  jobs: Job[];
  file: string;
  modifiedAt: string | number | null;
  total: number;
}
