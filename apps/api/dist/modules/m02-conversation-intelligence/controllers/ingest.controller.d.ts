import { ConversationIngestService, TranscriptionIngestPayload } from '../services/ingest.service';
export declare class ConversationIngestController {
    private readonly ingest;
    constructor(ingest: ConversationIngestService);
    fromTranscription(body: TranscriptionIngestPayload, serviceKey?: string): Promise<{
        accepted: boolean;
        callId: string;
        tenantId: string;
        conversation: import("../interfaces/search.interface").ConversationRecord;
        syncLog: import("../interfaces/search.interface").SearchSyncLog;
    }>;
}
