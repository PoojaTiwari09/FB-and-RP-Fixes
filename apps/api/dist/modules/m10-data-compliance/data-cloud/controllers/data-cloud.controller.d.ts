import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Request } from 'express';
import { DataCloudService } from '../services/data-cloud.service';
interface AuthenticatedRequest extends Request {
    tenantId: string;
    user: {
        userId: string;
        tenantId: string;
        email: string;
    };
}
export declare class DataCloudController {
    private readonly service;
    private readonly logger;
    constructor(service: DataCloudService);
    registerConnection(req: AuthenticatedRequest, body: unknown): Promise<any>;
    getConnections(req: AuthenticatedRequest): Promise<any[]>;
    testConnection(req: AuthenticatedRequest, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    triggerReplay(req: AuthenticatedRequest, body: unknown): Promise<{
        status: string;
        runId: string;
        message: string;
    } | {
        statusCode: HttpStatus;
        message: string;
        errors: import("node_modules/zod/index.cjs").typeToFlattenedError<{
            connectionId?: string;
            datasetName?: "deals" | "accounts" | "contacts" | "activities";
            windowStart?: string;
            windowEnd?: string;
        }, string>;
    }>;
    getExportRuns(req: AuthenticatedRequest, connectionId?: string): Promise<any[]>;
    downloadExport(req: AuthenticatedRequest, runId: string, dataset: string, format: 'csv' | 'parquet', res: Response): Promise<void>;
}
export {};
