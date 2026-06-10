export declare function writeParquetExport(filePath: string, rows: Record<string, unknown>[]): Promise<{
    rowCount: number;
    format: string;
}>;
