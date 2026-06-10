export interface M02IngestEnvelope {
    tenantId: string;
    callId: string;
    transcriptId?: string;
    sourcePlatform?: string;
    occurredAt?: string;
}
export declare class M02IngestClient {
    private readonly logger;
    private get baseUrl();
    notifyTranscriptionCompleted(payload: M02IngestEnvelope): Promise<void>;
}
