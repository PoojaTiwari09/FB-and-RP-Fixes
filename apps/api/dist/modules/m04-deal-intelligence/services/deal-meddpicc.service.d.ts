import { PrismaService } from '../database/prisma.service';
export interface MeddpiccAnalysisResult {
    score: number;
    matchedCategories: string[];
    contacts: number;
    aiNextStep: string;
    categoryAnswers: Record<string, string | null>;
}
export declare class DealMeddpiccService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findTranscriptsForDeal(dealExternalId: string): Promise<string[]>;
    findStoredMeddpicc(dealExternalId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        score: number;
        dealExternalId: string;
        metrics: string | null;
        economicBuyer: string | null;
        decisionCriteria: string | null;
        decisionProcess: string | null;
        identifyPain: string | null;
        champion: string | null;
        matchedCategories: string[];
        contactCount: number;
        aiNextStep: string | null;
    }>;
    upsertMeddpicc(dealExternalId: string, tenantId: string, result: MeddpiccAnalysisResult): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        score: number;
        dealExternalId: string;
        metrics: string | null;
        economicBuyer: string | null;
        decisionCriteria: string | null;
        decisionProcess: string | null;
        identifyPain: string | null;
        champion: string | null;
        matchedCategories: string[];
        contactCount: number;
        aiNextStep: string | null;
    }>;
}
