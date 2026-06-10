import { AiExtractorService } from '../services/ai-extractor.service';
export declare class AiExtractorController {
    private readonly svc;
    constructor(svc: AiExtractorService);
    listFields(req: Record<string, string>): Promise<any>;
    createField(body: Record<string, unknown>, req: Record<string, string>): Promise<any>;
    updateField(id: string, body: Record<string, unknown>, req: Record<string, string>): Promise<any>;
    deleteField(id: string, req: Record<string, string>): Promise<{
        success: boolean;
    }>;
    toggleField(id: string, body: {
        isActive?: boolean;
    }, req: Record<string, string>): Promise<any>;
    testField(id: string, body: {
        callId: string;
    }, req: Record<string, string>): Promise<{
        fieldId: string;
        fieldName: any;
        extractedValue: any;
        rawEvidence: any;
        evidenceTimestampMs: any;
        confidenceScore: any;
    }>;
    getResults(callId: string, req: Record<string, string>): Promise<any>;
    runExtract(callId: string, req: Record<string, string>): Promise<any>;
}
