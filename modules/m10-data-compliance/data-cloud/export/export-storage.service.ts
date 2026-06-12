import { Injectable } from "@nestjs/common";
import { join } from "path";
import { existsSync } from "fs";

@Injectable()
export class ExportStorageService {
  private readonly baseDir: string;

  constructor() {
    this.baseDir =
      process.env.M10_EXPORT_STORAGE_DIR ??
      join(process.cwd(), "uploads", "m10-exports");
  }

  runDirectory(tenantId: string, runId: string): string {
    return join(this.baseDir, tenantId, runId);
  }

  datasetPaths(tenantId: string, runId: string, dataset: string) {
    const dir = this.runDirectory(tenantId, runId);
    return {
      dir,
      csv: join(dir, `${dataset}.csv`),
      parquet: join(dir, `${dataset}.parquet`),
    };
  }

  downloadUrl(
    runId: string,
    dataset: string,
    format: "csv" | "parquet",
  ): string {
    const base = process.env.M10_API_PUBLIC_URL ?? "http://localhost:3001";
    return `${base}/api/v1/m10-data-compliance/exports/runs/${runId}/download?dataset=${dataset}&format=${format}`;
  }

  resolveDownloadPath(
    tenantId: string,
    runId: string,
    dataset: string,
    format: "csv" | "parquet",
  ): string | null {
    const paths = this.datasetPaths(tenantId, runId, dataset);
    if (format === "csv") {
      return existsSync(paths.csv) ? paths.csv : null;
    }
    if (existsSync(paths.parquet)) return paths.parquet;
    const jsonl = `${paths.parquet}.jsonl`;
    return existsSync(jsonl) ? jsonl : null;
  }
}
