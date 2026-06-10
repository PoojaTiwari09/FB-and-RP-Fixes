import { PrismaService } from '../database/prisma.service';
export declare class M05AccountIntelligenceRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, userId?: string, userRole?: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        externalId: string | null;
        ownerName: string | null;
        industry: string | null;
        assignedRepId: string | null;
        hubspotOwnerId: string | null;
        ownerUserId: string | null;
        healthScore: number | null;
        crmRecordId: string | null;
    }[]>;
    create(data: {
        tenantId: string;
        name: string;
        assignedRepId?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        externalId: string | null;
        ownerName: string | null;
        industry: string | null;
        assignedRepId: string | null;
        hubspotOwnerId: string | null;
        ownerUserId: string | null;
        healthScore: number | null;
        crmRecordId: string | null;
    }>;
}
