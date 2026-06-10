import { HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { RevenueGraphService } from '../services/revenue-graph.service';
interface AuthenticatedRequest extends Request {
    tenantId: string;
    user: {
        userId: string;
        tenantId: string;
        email: string;
    };
}
export declare class RevenueGraphController {
    private readonly service;
    private readonly logger;
    constructor(service: RevenueGraphService);
    getAccounts(req: AuthenticatedRequest, page?: string, limit?: string, search?: string): Promise<import("../dto/response-revenue-graph.dto").PaginatedResponseDto<import("../dto/response-revenue-graph.dto").AccountResponseDto>>;
    getAccountById(req: AuthenticatedRequest, id: string): Promise<import("../dto/response-revenue-graph.dto").AccountResponseDto>;
    getDeals(req: AuthenticatedRequest, accountId?: string, isActive?: string, stage?: string, page?: string, limit?: string): Promise<import("../dto/response-revenue-graph.dto").PaginatedResponseDto<import("../dto/response-revenue-graph.dto").DealResponseDto>>;
    getDealById(req: AuthenticatedRequest, id: string): Promise<import("../dto/response-revenue-graph.dto").DealResponseDto>;
    getDealRelationship(req: AuthenticatedRequest, id: string): Promise<import("../dto/response-revenue-graph.dto").RelationshipGraphDto>;
    getContactById(req: AuthenticatedRequest, id: string): Promise<import("../dto/response-revenue-graph.dto").ContactResponseDto>;
    triggerCrmSync(req: AuthenticatedRequest, body: unknown): Promise<{
        message: string;
        jobIds: string[];
    } | {
        statusCode: HttpStatus;
        message: string;
        errors: import("node_modules/zod/index.cjs").typeToFlattenedError<{
            crmSource?: "salesforce" | "hubspot" | "dynamics365";
            entityTypes?: ("deals" | "accounts" | "contacts")[];
            fullSync?: boolean;
        }, string>;
    }>;
    getCrmSyncStatus(req: AuthenticatedRequest): Promise<import("../dto/response-revenue-graph.dto").CrmSyncStatusResponseDto>;
}
export {};
