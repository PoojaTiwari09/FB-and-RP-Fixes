import { Queue } from 'bullmq';
import { DataCloudRepository } from '../repositories/data-cloud.repository';
import type { RegisterConnectionDto, ReplayExportDto } from '../schemas/data-cloud.schema';
import { ExportStorageService } from '../export/export-storage.service';
import { WarehouseRegistry } from '../warehouse/warehouse-registry';
export declare class DataCloudService {
    private readonly repo;
    private readonly storage;
    private readonly warehouse;
    private readonly exportQueue;
    private readonly logger;
    private readonly redis;
    constructor(repo: DataCloudRepository, storage: ExportStorageService, warehouse: WarehouseRegistry, exportQueue: Queue);
    registerConnection(tenantId: string, dto: RegisterConnectionDto): Promise<any>;
    getConnections(tenantId: string): Promise<any[]>;
    testConnection(tenantId: string, connectionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getExportRuns(tenantId: string, connectionId?: string): Promise<any[]>;
    getExportDownloadStream(tenantId: string, runId: string, dataset: string, format: 'csv' | 'parquet'): Promise<{
        stream: import("fs").ReadStream;
        path: string;
        contentType: string;
    }>;
    triggerReplay(tenantId: string, dto: ReplayExportDto): Promise<{
        status: string;
        runId: string;
        message: string;
    }>;
    runScheduledExport(tenantId: string, connectionId: string, existingRunId?: string): Promise<void>;
    private exportDataset;
    private buildDownloadUrls;
}
