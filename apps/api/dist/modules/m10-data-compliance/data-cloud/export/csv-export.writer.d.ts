export declare function writeCsvExport(filePath: string, rows: Record<string, unknown>[]): Promise<{
    rowCount: number;
    columns: string[];
}>;
