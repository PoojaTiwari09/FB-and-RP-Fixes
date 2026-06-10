import { PrismaService } from '../database/prisma.service';
import { TranscriptRepository } from '../repositories/transcript.repository';
export declare class AiExtractorService {
    private readonly prisma;
    private readonly transcripts;
    constructor(prisma: PrismaService, transcripts: TranscriptRepository);
    private fieldDelegate;
    private resultDelegate;
    listFields(tenantId: string): Promise<any>;
    createField(tenantId: string, body: Record<string, unknown>): Promise<any>;
    updateField(tenantId: string, id: string, body: Record<string, unknown>): Promise<any>;
    deleteField(tenantId: string, id: string): Promise<{
        success: boolean;
    }>;
    toggleField(tenantId: string, id: string, isActive: boolean): Promise<any>;
    getField(tenantId: string, id: string): Promise<any>;
    getCallResults(tenantId: string, callId: string): Promise<any>;
    runExtraction(tenantId: string, callId: string): Promise<any>;
    testField(tenantId: string, fieldId: string, callId: string): Promise<{
        fieldId: string;
        fieldName: any;
        extractedValue: any;
        rawEvidence: any;
        evidenceTimestampMs: any;
        confidenceScore: any;
    }>;
    private loadTranscript;
    private extractAndSave;
}
