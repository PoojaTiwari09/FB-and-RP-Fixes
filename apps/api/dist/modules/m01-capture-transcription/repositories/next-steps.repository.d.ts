import { PrismaService } from '../database/prisma.service';
export interface UpsertNextStepsData {
    nextSteps: string[];
}
export declare class NextStepsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByCallId(callId: string, tenantId: string): Promise<string[]>;
    addNextStep(callId: string, tenantId: string, step: string): Promise<string[]>;
    updateNextStep(callId: string, tenantId: string, index: number, step: string): Promise<string[]>;
    deleteNextStep(callId: string, tenantId: string, index: number): Promise<string[]>;
    replaceAll(callId: string, tenantId: string, nextSteps: string[]): Promise<string[]>;
}
