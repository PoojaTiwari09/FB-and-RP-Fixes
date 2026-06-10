export declare class ExportStorageService {
    private readonly baseDir;
    constructor();
    runDirectory(tenantId: string, runId: string): string;
    datasetPaths(tenantId: string, runId: string, dataset: string): {
        dir: string;
        csv: string;
        parquet: string;
    };
    downloadUrl(runId: string, dataset: string, format: 'csv' | 'parquet'): string;
    resolveDownloadPath(tenantId: string, runId: string, dataset: string, format: 'csv' | 'parquet'): string | null;
}
